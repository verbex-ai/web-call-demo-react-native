import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { safeStringify } from "../lib/verbexEvents";
import { colors, mono, radii, spacing } from "../theme";

// A labelled, monospaced JSON block — the expanded body of a tool/http/raw row.
// Capped in height and independently scrollable so one huge payload can't push the
// rest of the transcript off screen.
export function PayloadBlock({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: unknown;
  tone?: "default" | "error";
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <ScrollView
        style={styles.pre}
        contentContainerStyle={styles.preContent}
        nestedScrollEnabled
      >
        <Text
          style={[styles.code, tone === "error" ? styles.codeError : null]}
          selectable
        >
          {safeStringify(value)}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.white35,
    marginBottom: spacing(1),
  },
  pre: {
    maxHeight: 224,
    backgroundColor: colors.codeBg,
    borderRadius: radii.md,
  },
  preContent: { padding: spacing(2) },
  code: {
    fontFamily: mono,
    fontSize: 11,
    lineHeight: 17,
    color: colors.white70,
  },
  codeError: { color: colors.red300 },
});
