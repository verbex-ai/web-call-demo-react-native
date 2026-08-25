import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { ChatMessage } from "./rows";
import type { VerbexEvent } from "./verbexEvents";

// Same export shape as the web app (and verbex-customer-console): session metadata
// plus a time-sorted transcript + debug stream. A phone has no download folder, so
// instead of triggering a file download we write to the cache directory and hand the
// file to the OS share sheet.
export interface TranscriptExportEntry {
  kind: "agent-transcript" | "user-transcript" | "debug";
  ts: number;
  text?: string;
  event?: VerbexEvent;
}

export interface TranscriptExportFile {
  sessionId: string;
  roomName: string;
  /** Epoch milliseconds — same unit as every entry's `ts`, so offsets are directly comparable. */
  startedAt: number;
  /** Epoch milliseconds. */
  endedAt: number;
  entries: TranscriptExportEntry[];
}

export function buildExportEntries(
  messages: ChatMessage[],
  events: VerbexEvent[],
): TranscriptExportEntry[] {
  const out: TranscriptExportEntry[] = [];
  for (const m of messages) {
    if (!m.text?.trim()) continue;
    out.push({
      kind: m.role === "agent" ? "agent-transcript" : "user-transcript",
      ts: m.ts,
      text: m.text,
    });
  }
  for (const event of events) {
    out.push({ kind: "debug", ts: event.ts, event });
  }
  out.sort((a, b) => a.ts - b.ts);
  return out;
}

/**
 * Writes the transcript to a cache file and opens the share sheet so the user can
 * save it to Files, mail it, or drop it in a chat. Resolves once the sheet is
 * dismissed. Throws if sharing is unavailable on the device.
 */
export async function shareTranscriptFile(file: TranscriptExportFile): Promise<void> {
  const iso = new Date().toISOString().replace(/[:.]/g, "-");
  // Slashes and colons from a room name would be read as path segments.
  const safeId = file.sessionId.replace(/[^a-zA-Z0-9_-]/g, "") || "session";
  const target = new File(Paths.cache, `verbex-transcript-${safeId}-${iso}.json`);

  target.create({ overwrite: true, intermediates: true });
  target.write(JSON.stringify(file, null, 2));

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing is not available on this device.");
  }

  await Sharing.shareAsync(target.uri, {
    mimeType: "application/json",
    UTI: "public.json",
    dialogTitle: "Export transcript",
  });
}
