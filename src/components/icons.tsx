import React from "react";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";
import { colors } from "../theme";

// The web app uses lucide-react. There is no conflict-free React Native build of it
// for this Expo/RN pairing, so the handful of glyphs we need are inlined here as the
// same Lucide path data (lucide-static v1.33.0, ISC) drawn with react-native-svg.
// Same shapes as the web client, no extra dependency.

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

function Base({
  size = 16,
  color = colors.foreground,
  strokeWidth = 2,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

export const Phone = (p: IconProps) => (
  <Base {...p}>
    <Path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
  </Base>
);

export const PhoneOff = (p: IconProps) => (
  <Base {...p}>
    <Path d="M10.1 13.9a14 14 0 0 0 3.732 2.668 1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2 18 18 0 0 1-12.728-5.272" />
    <Path d="M22 2 2 22" />
    <Path d="M4.76 13.582A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 .244.473" />
  </Base>
);

export const Mic = (p: IconProps) => (
  <Base {...p}>
    <Path d="M12 19v3" />
    <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <Rect x="9" y="2" width="6" height="13" rx="3" />
  </Base>
);

export const MicOff = (p: IconProps) => (
  <Base {...p}>
    <Path d="M12 19v3" />
    <Path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
    <Path d="M16.95 16.95A7 7 0 0 1 5 12v-2" />
    <Path d="M18.89 13.23A7 7 0 0 0 19 12v-2" />
    <Path d="m2 2 20 20" />
    <Path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
  </Base>
);

export const Wrench = (p: IconProps) => (
  <Base {...p}>
    <Path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z" />
  </Base>
);

export const Globe = (p: IconProps) => (
  <Base {...p}>
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <Path d="M2 12h20" />
  </Base>
);

export const Variable = (p: IconProps) => (
  <Base {...p}>
    <Path d="M8 21s-4-3-4-9 4-9 4-9" />
    <Path d="M16 3s4 3 4 9-4 9-4 9" />
    <Line x1="15" x2="9" y1="9" y2="15" />
    <Line x1="9" x2="15" y1="9" y2="15" />
  </Base>
);

export const MoveRight = (p: IconProps) => (
  <Base {...p}>
    <Path d="M18 8L22 12L18 16" />
    <Path d="M2 12H22" />
  </Base>
);

export const X = (p: IconProps) => (
  <Base {...p}>
    <Path d="M18 6 6 18" />
    <Path d="m6 6 12 12" />
  </Base>
);

export const LoaderCircle = (p: IconProps) => (
  <Base {...p}>
    <Path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </Base>
);

export const Sparkles = (p: IconProps) => (
  <Base {...p}>
    <Path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
    <Path d="M20 2v4" />
    <Path d="M22 4h-4" />
    <Circle cx="4" cy="20" r="2" />
  </Base>
);

export const Download = (p: IconProps) => (
  <Base {...p}>
    <Path d="M12 15V3" />
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <Path d="m7 10 5 5 5-5" />
  </Base>
);

export const CircleAlert = (p: IconProps) => (
  <Base {...p}>
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" x2="12" y1="8" y2="12" />
    <Line x1="12" x2="12.01" y1="16" y2="16" />
  </Base>
);

export const ChevronDown = (p: IconProps) => (
  <Base {...p}>
    <Path d="m6 9 6 6 6-6" />
  </Base>
);

export const ChevronRight = (p: IconProps) => (
  <Base {...p}>
    <Path d="m9 18 6-6-6-6" />
  </Base>
);

export const ArrowRight = (p: IconProps) => (
  <Base {...p}>
    <Path d="M5 12h14" />
    <Path d="m12 5 7 7-7 7" />
  </Base>
);
