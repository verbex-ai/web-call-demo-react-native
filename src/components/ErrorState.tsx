import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../theme";
import { CircleAlert } from "./icons";

export function ErrorState({
  title,
  message,
  onRetry,
}: {
  title: string | null;
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <View style={styles.root} accessibilityRole="alert">
      <View style={styles.badge}>
        <CircleAlert size={24} color={colors.red400} />
      </View>
      <View>
        <Text style={styles.title}>{title ?? "Could not start the call"}</Text>
        <Text style={styles.message}>{message ?? "Something went wrong. Please try again."}</Text>
      </View>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Try again"
        style={({ pressed }) => [styles.retry, pressed && styles.retryPressed]}
      >
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(4),
    paddingHorizontal: spacing(8),
  },
  badge: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.redTint,
  },
  title: { fontSize: 16, fontWeight: "600", color: colors.white90, textAlign: "center" },
  message: {
    marginTop: spacing(1.5),
    maxWidth: 320,
    fontSize: 14,
    lineHeight: 21,
    color: colors.white55,
    textAlign: "center",
  },
  retry: {
    backgroundColor: colors.brand,
    borderRadius: radii.md,
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(2.5),
  },
  retryPressed: { backgroundColor: colors.brandLight },
  retryText: { fontSize: 14, fontWeight: "600", color: "#000" },
});
