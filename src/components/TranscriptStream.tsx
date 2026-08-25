import React, { useMemo, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { buildRows, type ChatMessage } from "../lib/rows";
import type { VerbexEvent } from "../lib/verbexEvents";
import { colors, radii, spacing } from "../theme";
import { EventRow } from "./DebugEventRow";

interface Props {
  messages: ChatMessage[];
  events: VerbexEvent[];
}

export function TranscriptStream({ messages, events }: Props) {
  const rows = useMemo(() => buildRows(messages, events), [messages, events]);
  const scrollRef = useRef<ScrollView>(null);

  if (rows.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Say something to get started.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      // Rows have variable height (a tool row grows when expanded), so pinning to the
      // bottom on content growth is more reliable than measuring each row.
      onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      accessibilityLabel="Live transcript"
    >
      {rows.map((row) => (
        <View key={row.id}>
          {row.kind === "message" ? (
            <MessageBubble role={row.role} text={row.text} />
          ) : (
            <EventRow event={row.event} />
          )}
        </View>
      ))}
    </ScrollView>
  );
}

function MessageBubble({ role, text }: { role: "agent" | "user"; text: string }) {
  const isSelf = role === "user";
  return (
    <View style={[styles.bubble, isSelf ? styles.bubbleSelf : styles.bubbleAgent]}>
      <Text style={[styles.bubbleText, isSelf ? styles.bubbleTextSelf : null]} selectable>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, minHeight: 0 },
  listContent: { padding: spacing(4), gap: spacing(3) },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing(6),
  },
  emptyText: { fontSize: 14, color: colors.white55, textAlign: "center" },
  bubble: {
    maxWidth: "85%",
    borderRadius: radii.xl,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(2),
  },
  bubbleSelf: { alignSelf: "flex-end", backgroundColor: colors.brandTint },
  bubbleAgent: { alignSelf: "flex-start", backgroundColor: colors.white06 },
  bubbleText: { fontSize: 14, lineHeight: 21, color: colors.white90 },
  bubbleTextSelf: { color: colors.foreground },
});
