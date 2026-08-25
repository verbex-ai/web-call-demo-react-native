import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { safeStringify, type VerbexEvent } from "../lib/verbexEvents";
import { colors, mono, radii, spacing } from "../theme";
import { ChevronDown, ChevronRight, MoveRight, Variable } from "./icons";
import { PayloadBlock } from "./PayloadBlock";
import { HttpCallRow } from "./HttpCallRow";
import { ToolCallRow } from "./ToolCallRow";
import { eventRowStyles } from "./eventRowStyles";

// Dispatches a decoded agent event to the row that knows how to draw it. Same
// vocabulary as verbex-customer-console and the web demo.
export function EventRow({ event }: { event: VerbexEvent }) {
  switch (event.kind) {
    case "tool_call":
      return <ToolCallRow event={event} />;
    case "http_call":
      return <HttpCallRow event={event} />;
    case "var_set":
      return <VarSetRow event={event} />;
    case "node_transition":
      return <NodeTransitionRow event={event} />;
    case "raw":
      return <RawRow event={event} />;
    default:
      return null;
  }
}

function VarSetRow({ event }: { event: Extract<VerbexEvent, { kind: "var_set" }> }) {
  return (
    <View style={[eventRowStyles.card, eventRowStyles.header]}>
      <Variable size={14} color={colors.violet300} />
      <Text style={eventRowStyles.kind}>var</Text>
      <Text style={styles.varName}>{event.name}</Text>
      <Text style={styles.varValue} numberOfLines={1}>
        = {safeStringify(event.value)}
      </Text>
      {!!event.source && (
        <View style={styles.sourceBadge}>
          <Text style={styles.sourceText}>{event.source}</Text>
        </View>
      )}
    </View>
  );
}

function NodeTransitionRow({
  event,
}: {
  event: Extract<VerbexEvent, { kind: "node_transition" }>;
}) {
  return (
    <View style={styles.transition}>
      <MoveRight size={14} color={colors.sky300} />
      <Text style={styles.transitionText}>Moved to {event.label}</Text>
    </View>
  );
}

function RawRow({ event }: { event: Extract<VerbexEvent, { kind: "raw" }> }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={eventRowStyles.card}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityLabel="Raw metadata"
        accessibilityState={{ expanded: open }}
        style={eventRowStyles.header}
      >
        <Text style={eventRowStyles.kind}>metadata</Text>
        <View style={eventRowStyles.chevron}>
          {open ? (
            <ChevronDown size={14} color={colors.white30} />
          ) : (
            <ChevronRight size={14} color={colors.white30} />
          )}
        </View>
      </Pressable>
      {open && (
        <View style={eventRowStyles.body}>
          <PayloadBlock label="payload" value={event.data} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  varName: { fontFamily: mono, fontSize: 12, color: colors.white90 },
  varValue: { flexShrink: 1, fontFamily: mono, fontSize: 12, color: colors.white50 },
  sourceBadge: {
    marginLeft: "auto",
    backgroundColor: colors.white10,
    borderRadius: radii.sm,
    paddingHorizontal: spacing(1.5),
    paddingVertical: 2,
  },
  sourceText: { fontFamily: mono, fontSize: 10, color: colors.white50 },
  transition: {
    alignSelf: "flex-start",
    maxWidth: "92%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
  transitionText: { fontFamily: mono, fontSize: 12, color: colors.white50 },
});
