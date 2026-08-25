import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import { LoaderCircle } from "./icons";
import { colors } from "../theme";

// Stand-in for the web app's `animate-spin` on lucide's Loader2. Uses the built-in
// Animated driver (native-driven, no Reanimated worklet setup needed).
export function Spinner({ size = 24, color = colors.white60 }: { size?: number; color?: string }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <LoaderCircle size={size} color={color} />
    </Animated.View>
  );
}
