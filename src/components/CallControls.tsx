import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, mono, radii, spacing } from "../theme";
import { Download, Mic, MicOff, PhoneOff } from "./icons";

interface Props {
  isMuted: boolean;
  running: boolean;
  ended: boolean;
  canExport: boolean;
  exporting: boolean;
  onToggleMute: () => void;
  onDisconnect: () => void;
  onExport: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function CallControls({
  isMuted,
  running,
  ended,
  canExport,
  exporting,
  onToggleMute,
  onDisconnect,
  onExport,
}: Props) {
  const [elapsed, setElapsed] = useState(0);

  // The timer freezes where it stopped once the call ends, so the final duration
  // stays readable next to the transcript.
  useEffect(() => {
    if (!running) return;
    setElapsed(0);
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const muteLabel = isMuted ? "Unmute" : "Mute";

  return (
    <View style={styles.root}>
      <Pressable
        onPress={onExport}
        disabled={!canExport || exporting}
        accessibilityRole="button"
        accessibilityLabel="Export transcript"
        style={({ pressed }) => [
          styles.iconButton,
          (!canExport || exporting) && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <Download size={16} color={colors.white90} />
      </Pressable>

      <Pressable
        onPress={onToggleMute}
        disabled={ended}
        accessibilityRole="button"
        accessibilityLabel={muteLabel}
        accessibilityState={{ selected: isMuted }}
        style={({ pressed }) => [
          styles.muteButton,
          ended && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        {isMuted ? (
          <MicOff size={16} color={colors.white90} />
        ) : (
          <Mic size={16} color={colors.white90} />
        )}
        <Text style={styles.muteText}>{muteLabel}</Text>
      </Pressable>

      {ended ? (
        <View style={styles.endedPill}>
          <PhoneOff size={16} color={colors.white55} />
          <Text style={styles.endedText} numberOfLines={1}>
            Disconnected
          </Text>
          <Text style={styles.endedTimer}>{formatTime(elapsed)}</Text>
        </View>
      ) : (
        <Pressable
          onPress={onDisconnect}
          accessibilityRole="button"
          accessibilityLabel="Disconnect call"
          style={({ pressed }) => [styles.hangUp, pressed && styles.hangUpPressed]}
        >
          <PhoneOff size={16} color="#fff" />
          <Text style={styles.hangUpText} numberOfLines={1}>
            Disconnect
          </Text>
          <Text style={styles.hangUpTimer}>{formatTime(elapsed)}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    padding: spacing(3),
  },
  iconButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.white15,
    backgroundColor: colors.white04,
    borderRadius: radii.md,
    padding: spacing(2.5),
  },
  muteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.white15,
    backgroundColor: colors.white04,
    borderRadius: radii.md,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2.5),
  },
  muteText: { fontSize: 14, fontWeight: "500", color: colors.white90 },
  disabled: { opacity: 0.4 },
  pressed: { backgroundColor: colors.white08 },
  hangUp: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(2),
    backgroundColor: "rgba(239,68,68,0.9)",
    borderRadius: radii.md,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2.5),
  },
  hangUpPressed: { backgroundColor: colors.red500 },
  hangUpText: { flexShrink: 1, fontSize: 14, fontWeight: "600", color: "#fff" },
  hangUpTimer: { fontFamily: mono, fontSize: 13, color: "rgba(255,255,255,0.8)" },
  endedPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(2),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.white04,
    borderRadius: radii.md,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2.5),
  },
  endedText: { flexShrink: 1, fontSize: 14, fontWeight: "600", color: colors.white55 },
  endedTimer: { fontFamily: mono, fontSize: 13, color: colors.white55 },
});
