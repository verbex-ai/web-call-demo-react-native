import React, { useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Backdrop } from "../src/components/Backdrop";
import { BanglalinkLogo } from "../src/components/BanglalinkLogo";
import { CallPanel } from "../src/components/CallPanel";
import { Phone, Sparkles } from "../src/components/icons";
import { colors, radii, spacing } from "../src/theme";

/**
 * The hero: a full-screen pitch with one prominent "Test Call" button. Tapping it
 * fades the copy back and brings the call panel forward — the phone equivalent of the
 * web app's expand-in-place, where a 520px panel would leave no room for the copy.
 */
export default function HeroScreen() {
  const [open, setOpen] = useState(false);
  // Keeps the panel mounted through its closing animation before it unmounts (which
  // is also what tears the session down).
  const [renderPanel, setRenderPanel] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const openCall = () => {
    setRenderPanel(true);
    setOpen(true);
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeCall = () => {
    setOpen(false);
    Animated.timing(anim, {
      toValue: 0,
      duration: 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setRenderPanel(false);
    });
  };

  const heroStyle = {
    opacity: anim.interpolate({ inputRange: [0, 0.7], outputRange: [1, 0] }),
    transform: [
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -24] }) },
    ],
  };

  const panelStyle = {
    opacity: anim.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 0, 1] }),
    transform: [
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) },
    ],
  };

  return (
    <View style={styles.root}>
      <Backdrop />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <Animated.View
          style={[styles.hero, heroStyle]}
          pointerEvents={open ? "none" : "auto"}
        >
          <View style={styles.logo}>
            <BanglalinkLogo width={176} />
          </View>

          <View style={styles.eyebrow}>
            <Sparkles size={14} color={colors.brandLight} />
            <Text style={styles.eyebrowText}>Powered by the Verbex</Text>
          </View>

          <Text style={styles.headline}>
            Talk to your{"\n"}
            <Text style={styles.headlineAccent}>Verbex agent</Text>
          </Text>

          <Text style={styles.subtext}>
            Start a live voice test call on your phone. Watch the transcript, tool calls
            and API responses stream in real time — the same test-call flow as the console.
          </Text>

          <Pressable
            onPress={openCall}
            accessibilityRole="button"
            accessibilityLabel="Start test call"
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          >
            <View style={styles.ctaIcon}>
              <Phone size={16} color="#fff" />
            </View>
            <Text style={styles.ctaText}>Test Call</Text>
          </Pressable>

          <Text style={styles.caption}>Uses your microphone.</Text>
        </Animated.View>

        {renderPanel && (
          <Animated.View style={[styles.panelWrap, panelStyle]}>
            <CallPanel onClose={closeCall} />
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing(6),
  },
  logo: { marginBottom: spacing(7) },
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.white04,
    borderRadius: radii.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
    marginBottom: spacing(6),
  },
  eyebrowText: { fontSize: 12, color: colors.white60 },
  headline: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: "600",
    letterSpacing: -0.8,
    color: colors.foreground,
    textAlign: "center",
  },
  // The web headline uses a gradient clip on this phrase; React Native has no
  // gradient text, so it takes a single accent. --color-primary-light (#faa282) is the
  // literal token for "lighter primary", but at headline size on this warm ground it
  // goes dusty pink; the brighter orange holds the brand and stays legible.
  headlineAccent: { color: colors.brandLight },
  subtext: {
    marginTop: spacing(5),
    maxWidth: 420,
    fontSize: 15,
    lineHeight: 23,
    color: colors.white55,
    textAlign: "center",
  },
  cta: {
    marginTop: spacing(10),
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    backgroundColor: "#fff",
    borderRadius: radii.pill,
    paddingLeft: spacing(2),
    paddingRight: spacing(6),
    paddingVertical: spacing(2),
    // Stands in for the web button's accent glow — Banglalink orange here.
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 22,
    elevation: 10,
  },
  ctaPressed: { opacity: 0.9 },
  ctaIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.brand,
  },
  ctaText: { fontSize: 16, fontWeight: "600", color: "#000" },
  caption: { marginTop: spacing(6), fontSize: 12, color: colors.white55 },
  panelWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(4),
  },
});
