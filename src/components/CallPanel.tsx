import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { RoomContext } from "@livekit/react-native";
import { useVerbexClient } from "../hooks/useVerbexClient";
import type { Language } from "../lib/session";
import { buildExportEntries, shareTranscriptFile } from "../lib/transcriptExport";
import { colors, radii, spacing } from "../theme";
import { CallControls } from "./CallControls";
import { ErrorState } from "./ErrorState";
import { LANGUAGES, LanguagePicker } from "./LanguagePicker";
import { LiveStatusBar } from "./LiveStatusBar";
import { Spinner } from "./Spinner";
import { TranscriptStream } from "./TranscriptStream";
import { BanglalinkLogo } from "./BanglalinkLogo";
import { Phone, X } from "./icons";

interface Props {
  onClose: () => void;
}

// The call surface, shown in place of the hero's "Test Call" button. It first asks
// which language to talk in, then connects to the matching agent. Unmounting tears
// the session down; the ✕ is the only closer.
export function CallPanel({ onClose }: Props) {
  const {
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
  } = useVerbexClient();

  const [language, setLanguage] = useState<Language | null>(null);
  const [exporting, setExporting] = useState(false);
  const startedAtRef = useRef(0);

  // Dialling is done imperatively from the picker, NOT from an effect keyed on
  // `language`. It used to be an effect, which meant any remount that preserved state
  // re-ran it and silently placed a brand-new call. Fast Refresh does exactly that: it
  // keeps hook state and re-runs effects, so during development every file save while
  // the panel was open started another billable session. Connecting from the tap
  // instead makes a call impossible to start without a deliberate user action.
  const disconnectRef = useRef(disconnect);
  disconnectRef.current = disconnect;
  useEffect(() => () => disconnectRef.current(), []);

  const pickLanguage = useCallback(
    (choice: Language) => {
      setLanguage(choice);
      void connect(choice);
    },
    [connect],
  );

  // Record when the call actually connected, for the export's startedAt.
  useEffect(() => {
    if (status === "connected" && !startedAtRef.current) startedAtRef.current = Date.now();
    if (status === "idle" || status === "requesting") startedAtRef.current = 0;
  }, [status]);

  const handleClose = () => {
    disconnect();
    onClose();
  };

  const canExport = messages.length > 0 || events.length > 0;

  const handleExport = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const sessionId = room?.name || room?.localParticipant?.identity || "session";
      await shareTranscriptFile({
        sessionId,
        roomName: room?.name ?? "",
        // Epoch ms, matching each entry's `ts`.
        startedAt: startedAtRef.current || Date.now(),
        endedAt: Date.now(),
        entries: buildExportEntries(messages, events),
      });
    } catch (err) {
      Alert.alert(
        "Export failed",
        err instanceof Error ? err.message : "The transcript could not be exported.",
      );
    } finally {
      setExporting(false);
    }
  }, [events, exporting, messages, room]);

  const activeLang = LANGUAGES.find((l) => l.code === language);

  return (
    <View style={styles.panel} accessibilityLabel="Test call">
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Phone size={16} color={colors.brandLight} />
          <Text style={styles.headerTitle}>Test call</Text>
          {!!activeLang && (
            <View style={styles.langBadge}>
              <Text style={styles.langBadgeText}>{activeLang.native}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          <BanglalinkLogo width={84} color={colors.white70} />
          <Pressable
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Close test call"
            hitSlop={8}
            style={({ pressed }) => [styles.closeButton, pressed && styles.closePressed]}
          >
            <X size={16} color={colors.white50} />
          </Pressable>
        </View>
      </View>

      {status === "connected" && room && (
        <RoomContext.Provider value={room}>
          <LiveStatusBar connectionHealthy={connectionHealthy} />
        </RoomContext.Provider>
      )}

      {status === "ended" && (
        <View style={styles.endedBar} accessibilityRole="text">
          <Text style={styles.endedBarText}>Call ended</Text>
        </View>
      )}

      {language === null ? (
        <LanguagePicker onSelect={pickLanguage} />
      ) : status === "error" ? (
        <ErrorState
          title={errorTitle}
          message={errorMessage}
          onRetry={() => void connect(language)}
        />
      ) : status === "connected" || status === "ended" ? (
        <>
          <TranscriptStream messages={messages} events={events} />
          <CallControls
            isMuted={isMuted}
            running={status === "connected"}
            ended={status === "ended"}
            canExport={canExport}
            exporting={exporting}
            onToggleMute={toggleMute}
            onDisconnect={endCall}
            onExport={() => void handleExport()}
          />
        </>
      ) : (
        // idle (just after picking a language), requesting or connecting — show the
        // loader directly, never a flash of the call controls.
        <View style={styles.connecting} accessibilityLiveRegion="polite">
          <Spinner size={24} />
          <Text style={styles.connectingText}>Establishing call…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: "100%",
    maxWidth: 448,
    flex: 1,
    maxHeight: 560,
    flexDirection: "column",
    overflow: "hidden",
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    // Android needs elevation; iOS reads the shadow* props.
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: spacing(2) },
  headerRight: { flexDirection: "row", alignItems: "center", gap: spacing(3) },
  headerTitle: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  langBadge: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.white04,
    borderRadius: radii.pill,
    paddingHorizontal: spacing(2),
    paddingVertical: 2,
  },
  langBadgeText: { fontSize: 11, color: colors.white60 },
  closeButton: { borderRadius: radii.sm, padding: spacing(1) },
  closePressed: { backgroundColor: colors.white10 },
  endedBar: {
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
    paddingVertical: spacing(2.5),
  },
  endedBarText: { fontSize: 12, color: colors.white55 },
  connecting: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(3),
  },
  connectingText: { fontSize: 14, color: colors.white60 },
});
