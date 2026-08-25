import type { VerbexEvent } from "./verbexEvents";

export type ChatMessage = {
  id: string;
  role: "agent" | "user";
  text: string;
  ts: number;
};

export type Row =
  | { kind: "message"; id: string; role: "agent" | "user"; text: string; ts: number }
  | { kind: "event"; id: string; event: VerbexEvent; ts: number };

// Build a single, time-sorted stream of transcript bubbles + decoded events,
// mirroring the customer-console's interleaved transcript/debug view. Both
// messages and events carry epoch-ms timestamps so they interleave correctly.
export function buildRows(messages: ChatMessage[], events: VerbexEvent[]): Row[] {
  const rows: Row[] = [];

  for (const m of messages) {
    if (!m.text?.trim()) continue;
    rows.push({ kind: "message", id: m.id, role: m.role, text: m.text, ts: m.ts });
  }

  for (const event of events) {
    rows.push({ kind: "event", id: event.id, event, ts: event.ts });
  }

  // Stable sort preserves insertion order for equal timestamps.
  return rows.sort((a, b) => a.ts - b.ts);
}
