import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { VerbexEvent } from "../lib/verbexEvents";
import { colors, mono, radii, spacing } from "../theme";
import { ChevronDown, ChevronRight, Wrench } from "./icons";
import { PayloadBlock } from "./PayloadBlock";
import { eventRowStyles } from "./eventRowStyles";

type ToolCall = Extract<VerbexEvent, { kind: "tool_call" }>;

export function ToolCallRow({ event }: { event: ToolCall }) {
  const [open, setOpen] = useState(false);
  const hasDetail = event.args !== undefined || !!event.output?.length;

  return (
    <View style={eventRowStyles.card}>
      <Pressable
        onPress={() => hasDetail && setOpen((o) => !o)}
        disabled={!hasDetail}
        accessibilityRole="button"
        accessibilityLabel={`Tool call ${event.name ?? "tool"}`}
        accessibilityState={{ expanded: open }}
        style={eventRowStyles.header}
      >
        <Wrench size={14} color={event.isError ? colors.red400 : colors.amber300} />
        <Text style={eventRowStyles.kind}>tool</Text>
        <Text style={styles.name} numberOfLines={1}>
          {/* Undefined until the matching tool_call packet arrives. */}
          {event.name ?? "tool"}
        </Text>
        {event.isError && (
          <View style={styles.errorBadge}>
            <Text style={styles.errorBadgeText}>error</Text>
          </View>
        )}
        {hasDetail && (
          <View style={eventRowStyles.chevron}>
            {open ? (
              <ChevronDown size={14} color={colors.white30} />
            ) : (
              <ChevronRight size={14} color={colors.white30} />
            )}
          </View>
        )}
      </Pressable>

      {open && hasDetail && (
        <View style={eventRowStyles.body}>
          {event.args !== undefined && <PayloadBlock label="args" value={event.args} />}
          {event.output !== undefined && (
            <PayloadBlock
              label={event.isError ? "error" : "output"}
              value={event.output}
              tone={event.isError ? "error" : "default"}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  name: {
    flexShrink: 1,
    fontFamily: mono,
    fontSize: 12,
    color: colors.white90,
  },
  errorBadge: {
    backgroundColor: colors.redBadge,
    borderRadius: radii.sm,
    paddingHorizontal: spacing(1.5),
    paddingVertical: 2,
  },
  errorBadgeText: { fontSize: 10, color: colors.red300, fontFamily: mono },
});
