import { useCallback, useEffect, useRef, useState } from "react";
import { AudioSession, AndroidAudioTypePresets } from "@livekit/react-native";
import { permissions } from "@livekit/react-native-webrtc";
import {
  Room,
  RoomEvent,
  type Participant,
  type RemoteParticipant,
  type TranscriptionSegment,
} from "livekit-client";
import { DEBUG, LIVEKIT_URL } from "../config";
import { mintSessionToken, SessionError, type Language } from "../lib/session";
import {
  decodeDebugEvent,
  decodeMetadata,
  decodeToolEvent,
  mergeEvents,
  type VerbexEvent,
} from "../lib/verbexEvents";
import type { ChatMessage } from "../lib/rows";

// Diagnostic console logging — dev only. Payloads carry live conversation content,
// so this must never run in a release build.
function log(...args: unknown[]) {
  if (DEBUG) console.log("[verbex]", ...args);
}

export type ConnectionStatus =
  | "idle"
  | "requesting"
  | "connecting"
  | "connected"
  | "ended"
  | "error";

export type { Language };

export interface UseVerbexClient {
  status: ConnectionStatus;
  isMuted: boolean;
  connectionHealthy: boolean;
  room: Room | null;
  messages: ChatMessage[];
  events: VerbexEvent[];
  errorTitle: string | null;
  errorMessage: string | null;
  connect: (language: Language) => Promise<void>;
  disconnect: () => void;
  endCall: () => void;
  toggleMute: () => void;
}

function roleFor(identity: string | undefined): "agent" | "user" {
  if (identity === "server" || (identity && identity.includes("agent"))) return "agent";
  return "user";
}

/**
 * Drives one voice call against a Verbex agent.
 *
 * The web app uses `@verbex-ai/verbex-js-sdk`, but that package is browser-only — it
 * reaches for `navigator.mediaDevices`, `AudioContext`, `requestAnimationFrame` and
 * DOM `track.attach()`. This hook does what the SDK does, directly on
 * `livekit-client` + the React Native WebRTC bindings:
 *
 *   connect to the SDK's LiveKit URL with the session token → publish the mic →
 *   read native transcriptions → decode the agent's data-channel packets.
 *
 * That is also strictly more capable than the SDK path. The SDK only re-emits data
 * messages whose `type === "metadata"`, so tool and debug events never surface
 * through it — which is why the web app already bypasses the SDK and reads
 * `client.room` directly. Owning the Room here removes that workaround.
 */
export function useVerbexClient(): UseVerbexClient {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [connectionHealthy, setConnectionHealthy] = useState(true);
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [events, setEvents] = useState<VerbexEvent[]>([]);
  const [errorTitle, setErrorTitle] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const roomRef = useRef<Room | null>(null);
  // Transcript segments accumulated by LiveKit segment id (partials update in place).
  const segmentsRef = useRef<Map<string, ChatMessage>>(new Map());
  // Bumped on every teardown so an in-flight connect() can detect it was superseded
  // (closed or retried mid-connect) and abandon itself cleanly.
  const genRef = useRef(0);
  // Aborts the in-flight token request when the user closes or retries.
  const abortRef = useRef<AbortController | null>(null);
  // Detaches the listeners we attached in connect(). We must never call
  // room.removeAllListeners(): livekit-client registers its own internal
  // `once(RoomEvent.Disconnected)` / `once(RoomEvent.Reconnected)` cleanup handlers on
  // the Room, and dropping those would leave disconnect() half-done.
  const unbindRef = useRef<(() => void) | null>(null);

  const fail = useCallback((title: string, message: string) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setStatus("error");
  }, []);

  /**
   * Releases the current attempt: supersedes any in-flight connect, aborts the
   * pending token request, disconnects the room (which stops the microphone) and
   * ends the native audio session. Idempotent — safe to call repeatedly.
   */
  const teardown = useCallback(() => {
    genRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;

    // Detach ours first, so the disconnect we are about to trigger doesn't re-enter them.
    if (unbindRef.current) {
      try {
        unbindRef.current();
      } catch {
        /* listeners already gone */
      }
      unbindRef.current = null;
    }

    const active = roomRef.current;
    roomRef.current = null;
    if (active) {
      active.disconnect().catch(() => {
        /* already gone */
      });
      // Hand the audio route back to the OS. Failures here are not actionable.
      AudioSession.stopAudioSession().catch(() => {
        /* session already stopped */
      });
    }
  }, []);

  const disconnect = useCallback(() => {
    teardown();
    setStatus("idle");
    setRoom(null);
  }, [teardown]);

  // Ends the live call but keeps the panel in an "ended" state — transcript stays on
  // screen, controls freeze. Used by the Disconnect button.
  const endCall = useCallback(() => {
    teardown();
    setStatus((s) =>
      s === "connected" || s === "connecting" || s === "requesting" ? "ended" : s,
    );
  }, [teardown]);

  const connect = useCallback(
    async (language: Language) => {
      // Release any prior attempt first — this also bumps genRef, superseding it.
      teardown();
      const myGen = genRef.current;
      const superseded = () => genRef.current !== myGen;

      setErrorTitle(null);
      setErrorMessage(null);
      setMessages([]);
      setEvents([]);
      segmentsRef.current = new Map();
      setIsMuted(false);
      setConnectionHealthy(true);
      setRoom(null);
      setStatus("requesting");

      // 1. Microphone. Asking up front means a denied permission surfaces as a clear
      //    message instead of a connected-but-silent call.
      try {
        const granted = await permissions.request({ name: "microphone" });
        if (superseded()) return;
        if (!granted) {
          fail(
            "Microphone blocked",
            "Microphone permission was denied. Allow mic access for this app in your device settings and try again.",
          );
          return;
        }
      } catch (err) {
        if (superseded()) return;
        log("permission request threw", err);
        fail(
          "Microphone unavailable",
          "The microphone could not be accessed on this device.",
        );
        return;
      }

      // 2. Session token.
      const controller = new AbortController();
      abortRef.current = controller;
      let sessionToken: string;
      try {
        sessionToken = await mintSessionToken(language, controller.signal);
        if (superseded()) return;
      } catch (err) {
        if (superseded()) return;
        if (err instanceof SessionError) {
          fail(err.title, err.message);
        } else if ((err as { name?: string })?.name === "AbortError") {
          return;
        } else {
          log("token mint failed", err);
          fail("Could not start the call", "Failed to create the call session. Please try again.");
        }
        return;
      }

      // 3. Native audio session, configured for a voice call before the room connects.
      try {
        await AudioSession.configureAudio({
          android: {
            audioTypeOptions: AndroidAudioTypePresets.communication,
            preferredOutputList: ["bluetooth", "headset", "speaker", "earpiece"],
          },
          ios: { defaultOutput: "speaker" },
        });
        await AudioSession.startAudioSession();
        if (superseded()) {
          AudioSession.stopAudioSession().catch(() => {});
          return;
        }
      } catch (err) {
        if (superseded()) return;
        log("audio session failed", err);
        fail("Audio unavailable", "The device audio session could not be started.");
        return;
      }

      // 4. Room. Audio-only, so adaptive stream and dynacast (video features) are off.
      const activeRoom = new Room({ adaptiveStream: false, dynacast: false });
      roomRef.current = activeRoom;

      // Named so they can be detached individually — see unbindRef.
      const onDisconnected = (reason?: unknown) => {
        log("disconnected", reason);
        if (superseded()) return;
        // The agent hung up or the transport dropped for good: keep the transcript on
        // screen in an "ended" state rather than resetting to idle.
        setStatus((s) => (s === "error" ? s : s === "connected" ? "ended" : "idle"));
      };

      const onReconnecting = () => {
        log("reconnecting");
        if (!superseded()) setConnectionHealthy(false);
      };

      const onReconnected = () => {
        log("reconnected");
        if (!superseded()) setConnectionHealthy(true);
      };

      const onParticipantDisconnected = (p: RemoteParticipant) => {
        // "server" is the agent's identity — if it leaves, the call is over.
        if (p.identity === "server" && !superseded()) {
          log("agent left");
          endCall();
        }
      };

      const onTranscription = (
        segments: TranscriptionSegment[],
        participant?: Participant,
      ) => {
        if (superseded()) return;
        log("transcription", { from: participant?.identity, segments });
        const role = roleFor(participant?.identity);
        const now = Date.now();
        for (const seg of segments) {
          const existing = segmentsRef.current.get(seg.id);
          segmentsRef.current.set(seg.id, {
            id: seg.id,
            role,
            text: seg.text,
            ts: existing?.ts ?? now,
          });
        }
        setMessages(Array.from(segmentsRef.current.values()));
      };

      const onData = (
        payload: Uint8Array,
        participant?: RemoteParticipant,
        _kind?: unknown,
        topic?: string,
      ) => {
        if (superseded()) return;
        let parsed: Record<string, unknown>;
        try {
          parsed = JSON.parse(new TextDecoder().decode(payload));
        } catch {
          log("data (non-JSON)", { topic });
          return;
        }
        log("data", { topic, from: participant?.identity, parsed });

        // Two topics carry structured events, matching verbex-customer-console:
        // "tool_event" (simple agents) and "debug_event" (flow agents). Anything else
        // falls through to the generic metadata decoder.
        let decoded: VerbexEvent[] = [];
        if (topic === "tool_event") {
          const e = decodeToolEvent(parsed);
          if (e) decoded = [e];
        } else if (topic === "debug_event") {
          const e = decodeDebugEvent(parsed);
          if (e) decoded = [e];
        } else {
          decoded = decodeMetadata(parsed);
        }
        if (decoded.length) setEvents((prev) => mergeEvents(prev, decoded));
      };

      activeRoom.on(RoomEvent.Disconnected, onDisconnected);
      activeRoom.on(RoomEvent.Reconnecting, onReconnecting);
      activeRoom.on(RoomEvent.Reconnected, onReconnected);
      activeRoom.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
      activeRoom.on(RoomEvent.TranscriptionReceived, onTranscription);
      activeRoom.on(RoomEvent.DataReceived, onData);

      // Detaches exactly what we attached, leaving livekit-client's own internal
      // handlers in place so disconnect() can still clean itself up.
      const unbind = () => {
        activeRoom.off(RoomEvent.Disconnected, onDisconnected);
        activeRoom.off(RoomEvent.Reconnecting, onReconnecting);
        activeRoom.off(RoomEvent.Reconnected, onReconnected);
        activeRoom.off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
        activeRoom.off(RoomEvent.TranscriptionReceived, onTranscription);
        activeRoom.off(RoomEvent.DataReceived, onData);
      };
      unbindRef.current = unbind;

      // Releases a room orphaned by a close/retry that landed mid-connect.
      const releaseOrphan = async () => {
        unbind();
        if (unbindRef.current === unbind) unbindRef.current = null;
        await activeRoom.disconnect().catch(() => {});
        AudioSession.stopAudioSession().catch(() => {});
      };

      // 5. Connect and publish the microphone.
      try {
        setStatus("connecting");
        await activeRoom.connect(LIVEKIT_URL, sessionToken);
        if (superseded()) {
          // Orphaned by a close/retry mid-connect — release what we just acquired.
          await releaseOrphan();
          return;
        }
        await activeRoom.localParticipant.setMicrophoneEnabled(true);
        if (superseded()) {
          await releaseOrphan();
          return;
        }
        log("connected", { name: activeRoom.name, state: activeRoom.state });
        setRoom(activeRoom);
        setStatus("connected");
      } catch (err) {
        if (superseded()) return;
        log("connect failed", err);
        fail("Could not start the call", errText(err) ?? "Failed to connect the call session.");
        teardown();
      }
    },
    [endCall, fail, teardown],
  );

  const toggleMute = useCallback(() => {
    const active = roomRef.current;
    if (!active) return;
    const next = !isMuted;
    // Reflect the intent immediately; roll back if the native call rejects.
    setIsMuted(next);
    active.localParticipant.setMicrophoneEnabled(!next).catch((err: unknown) => {
      log("setMicrophoneEnabled failed", err);
      setIsMuted(!next);
    });
  }, [isMuted]);

  // Release the mic and audio session if the screen goes away mid-call.
  useEffect(() => () => teardown(), [teardown]);

  return {
    status,
    isMuted,
    connectionHealthy,
    room,
    messages,
    events,
    errorTitle,
    errorMessage,
    connect,
    disconnect,
    endCall,
    toggleMute,
  };
}

function errText(err: unknown): string | null {
  if (!err) return null;
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
