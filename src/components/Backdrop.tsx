import React from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Defs, Ellipse, Path, Pattern, RadialGradient, Rect, Stop } from "react-native-svg";
import { brand, colors } from "../theme";

// The web app paints two blurred accent glows over a faint 64px grid. React Native has
// no CSS blur, so the glows are real SVG radial gradients here — a closer match to the
// intent than any blur emulation — and the grid is an SVG pattern.
//
// The glows carry the Banglalink gradient: their primary orange overhead falling to the
// logo's amber in the bottom corner, so the ground echoes the ribbon mark.
export function Backdrop() {
  const { width, height } = useWindowDimensions();

  // Top glow is centred above the fold; bottom-right glow bleeds off the corner,
  // mirroring the web layout's offsets.
  const topR = Math.max(width, height) * 0.55;
  const bottomR = Math.max(width, height) * 0.42;

  return (
    <View style={styles.root} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id="glowTop" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={brand.orange} stopOpacity={0.28} />
            <Stop offset="0.55" stopColor={brand.orange} stopOpacity={0.09} />
            <Stop offset="1" stopColor={brand.orange} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="glowBottom" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={brand.amber} stopOpacity={0.16} />
            <Stop offset="1" stopColor={brand.amber} stopOpacity={0} />
          </RadialGradient>
          <Pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
            <Path
              d="M64 0 H0 V64"
              stroke="#ffffff"
              strokeOpacity={0.04}
              strokeWidth={1}
              fill="none"
            />
          </Pattern>
        </Defs>

        <Rect x={0} y={0} width={width} height={height} fill={colors.background} />
        <Rect x={0} y={0} width={width} height={height} fill="url(#grid)" />
        <Ellipse cx={width / 2} cy={height * 0.06} rx={topR} ry={topR * 0.8} fill="url(#glowTop)" />
        <Ellipse
          cx={width * 1.02}
          cy={height * 0.92}
          rx={bottomR}
          ry={bottomR}
          fill="url(#glowBottom)"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
});
