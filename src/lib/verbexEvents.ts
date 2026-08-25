// Decoders for the data the Verbex agent publishes over the LiveKit data channel.
// The customer-console reads two topics:
//   - "tool_event"  : simple agents, snake_case tool_call/tool_output packets keyed by call_id
//   - "debug_event" : flow agents, an already-merged camelCase event union
// The SDK itself only re-emits data messages whose type === "metadata", so tool
// events never reach `session_metadata`. We therefore decode the raw topics
// ourselves (see useVerbexClient) using the helpers below.

export type VerbexEvent =
  | {
      kind: "tool_call";
      id: string;
      /**
       * Absent on a bare `tool_output` packet — those carry only a call_id and a
       * result. Renderers fall back to "tool"; see the note in decodeToolEvent.
       */
      name?: string;
      args?: unknown;
      output?: string;
      isError?: boolean;
      ts: number;
    }
  | {
      kind: "http_call";
      id: string;
      method: string;
      url: string;
      status: number | null;
      error: string | null;
      durationMs?: number;
      response?: unknown;
      ts: number;
    }
  | { kind: "var_set"; id: string; name: string; value: unknown; source?: string; ts: number }
  | { kind: "node_transition"; id: string; label: string; ts: number }
  | { kind: "raw"; id: string; data: unknown; ts: number };

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

function normalizeTs(raw: unknown): number {
  if (typeof raw === "number") {
    // Agents send seconds; normalize to epoch ms.
    return raw < 1e12 ? raw * 1000 : raw;
  }
  return Date.now();
}

function safeParse(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

// ---- topic: "tool_event" (simple agents) --------------------------------
// Packets: { type: "tool_call" | "tool_output", call_id, name?, arguments?, output?, is_error? }
export function decodeToolEvent(raw: Record<string, unknown>): VerbexEvent | null {
  const callId = (raw.call_id ?? raw.callId) as string | undefined;
  if (!callId) return null;
  const ts = normalizeTs(raw.ts);
  const isOutput = raw.type === "tool_output";
  return {
    kind: "tool_call",
    id: callId,
    // Left undefined when the packet has no name, which is the normal case for
    // tool_output. Defaulting to a placeholder here would be worse than useless:
    // mergeEvents only prunes undefined, so a placeholder would overwrite the real
    // name carried by the matching tool_call and the row would rename itself to
    // "tool" as soon as the result landed.
    name: typeof raw.name === "string" ? raw.name : undefined,
    args: isOutput ? undefined : safeParse(raw.arguments),
    output:
      typeof raw.output === "string"
        ? raw.output
        : raw.output !== undefined
          ? safeStringify(raw.output)
          : undefined,
    isError: Boolean(raw.is_error ?? raw.isError),
    ts,
  };
}

// ---- topic: "debug_event" (flow agents) ---------------------------------
export function decodeDebugEvent(raw: Record<string, unknown>): VerbexEvent | null {
  const type = typeof raw.type === "string" ? raw.type : undefined;
  const ts = normalizeTs(raw.ts);

  switch (type) {
    case "tool_call":
      return {
        kind: "tool_call",
        id: (raw.callId as string) ?? (raw.call_id as string) ?? nextId("tool"),
        name: typeof raw.name === "string" ? raw.name : undefined,
        args: safeParse(raw.args ?? raw.arguments),
        output: typeof raw.output === "string" ? raw.output : undefined,
        isError: Boolean(raw.isError ?? raw.is_error),
        ts,
      };
    case "http_call":
      return {
        kind: "http_call",
        id: nextId("http"),
        method: typeof raw.method === "string" ? raw.method : "GET",
        url: typeof raw.url === "string" ? raw.url : "",
        status: typeof raw.status === "number" ? raw.status : null,
        error: typeof raw.error === "string" ? raw.error : null,
        durationMs: typeof raw.durationMs === "number" ? raw.durationMs : undefined,
        response: raw.response,
        ts,
      };
    case "var_set":
      return {
        kind: "var_set",
        id: nextId("var"),
        name: typeof raw.name === "string" ? raw.name : "variable",
        value: raw.value,
        source: typeof raw.source === "string" ? raw.source : undefined,
        ts,
      };
    case "node_transition":
      return {
        kind: "node_transition",
        id: nextId("node"),
        label:
          (typeof raw.label === "string" && raw.label) ||
          (typeof raw.nodeType === "string" && raw.nodeType) ||
          (typeof raw.nodeId === "string" && raw.nodeId) ||
          "node",
        ts,
      };
    default:
      // logic_branch, collection_*, or anything else — surface as raw.
      return { kind: "raw", id: nextId("dbg"), data: raw, ts };
  }
}

// ---- generic session_metadata (SDK "metadata" event) --------------------
export function decodeMetadata(payload: Record<string, unknown>): VerbexEvent[] {
  if (!payload || typeof payload !== "object") return [];
  // Some agents nest the real event; try the debug/tool decoders first.
  const t = payload.type ?? payload.event_type;
  if (t === "tool_call" || t === "tool_output") {
    const e = decodeToolEvent(payload) ?? decodeDebugEvent(payload);
    return e ? [e] : [];
  }
  if (typeof t === "string") {
    const e = decodeDebugEvent(payload);
    return e ? [e] : [];
  }
  return [{ kind: "raw", id: nextId("meta"), data: payload, ts: normalizeTs(payload.ts) }];
}

// Merge incoming events into the running list. tool_call / http_call events
// sharing an id collapse (a later tool_output fills output/error) — this is how
// the console pairs a tool call with its result.
export function mergeEvents(prev: VerbexEvent[], incoming: VerbexEvent[]): VerbexEvent[] {
  const next = [...prev];
  for (const evt of incoming) {
    if (evt.kind === "tool_call" || evt.kind === "http_call") {
      const idx = next.findIndex((e) => e.kind === evt.kind && e.id === evt.id);
      if (idx !== -1) {
        const existing = next[idx];
        next[idx] = { ...existing, ...pruneUndefined(evt), ts: existing.ts } as VerbexEvent;
        continue;
      }
    }
    next.push(evt);
  }
  return next;
}

function pruneUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

export function safeStringify(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
