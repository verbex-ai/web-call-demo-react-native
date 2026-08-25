import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Language } from "../lib/session";
import { colors, radii, spacing } from "../theme";
import { ArrowRight } from "./icons";

export const LANGUAGES: { code: Language; native: string; label: string }[] = [
  { code: "en", native: "English", label: "English" },
  { code: "bn", native: "বাংলা", label: "Bangla" },
];

// One agent per language; the caller picks which one to dial before we mint a token.
export function LanguagePicker({ onSelect }: { onSelect: (language: Language) => void }) {
  return (
    <View style={styles.root}>
      <View>
        <Text style={styles.title}>Choose a language</Text>
        <Text style={styles.subtitle}>Which language would you like to talk in?</Text>
      </View>
      <View style={styles.options}>
        {LANGUAGES.map((l) => (
          <Pressable
            key={l.code}
            onPress={() => onSelect(l.code)}
            accessibilityRole="button"
            accessibilityLabel={`Start call in ${l.label}`}
            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
          >
            <View>
              <Text style={styles.optionNative}>{l.native}</Text>
              <Text style={styles.optionLabel}>{l.label}</Text>
            </View>
            <ArrowRight size={16} color={colors.brandLight} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(5),
    paddingHorizontal: spacing(8),
  },
  title: { fontSize: 16, fontWeight: "600", color: colors.white90, textAlign: "center" },
  subtitle: {
    marginTop: spacing(1.5),
    fontSize: 14,
    color: colors.white55,
    textAlign: "center",
  },
  options: { width: "100%", maxWidth: 320, gap: spacing(3) },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.white04,
    borderRadius: radii.lg,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
  },
  optionPressed: { borderColor: colors.brandBorder, backgroundColor: "rgba(255,255,255,0.07)" },
  optionNative: { fontSize: 14, fontWeight: "600", color: colors.white90 },
  optionLabel: { fontSize: 12, color: colors.white50 },
});
