import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useVoiceAssistant } from "@livekit/react-native";
import { colors, radii, spacing } from "../theme";
import { AgentVisualizer } from "./AgentVisualizer";
import { PulseDot } from "./PulseDot";

// State pill + talking spike on one line, mirroring verbex-customer-console's
// ConnectionStatePill. The label follows the agent's live turn state, so it reads
// Listening / Thinking / Speaking as the conversation moves.
// Must be rendered inside a RoomContext.Provider (see CallPanel).
function pillFor(state: string): { label: string; dot: string; pulse: boolean } {
  switch (state) {
    case "connecting":
    case "initializing":
      return { label: "Connecting", dot: colors.amber400, pulse: true };
    case "thinking":
      return { label: "Thinking", dot: colors.amber400, pulse: true };
    case "speaking":
      return { label: "Speaking", dot: colors.brandLight, pulse: true };
    case "listening":
      return { label: "Listening", dot: colors.brand, pulse: false };
    default:
      return { label: "Connected", dot: colors.white40, pulse: false };
  }
}

export function LiveStatusBar({ connectionHealthy = true }: { connectionHealthy?: boolean }) {
  const { state } = useVoiceAssistant();
  // A dropped-and-reconnecting transport takes priority over the agent's turn state.
  const pill = connectionHealthy
    ? pillFor(state)
    : { label: "Reconnecting", dot: colors.amber400, pulse: true };

  return (
    <View style={styles.root}>
      <View style={styles.pill} accessibilityRole="text" accessibilityLiveRegion="polite">
        <PulseDot color={pill.dot} active={pill.pulse} />
        <Text style={styles.pillText}>{pill.label}</Text>
      </View>
      <AgentVisualizer />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing(3),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2.5),
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.white04,
    borderRadius: radii.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1),
  },
  pillText: { fontSize: 12, color: colors.white70 },
});
