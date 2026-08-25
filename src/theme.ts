// Design tokens. Layout and type still follow the web app's Tailwind palette — warm
// near-black ground, one saturated accent — but the accent is Banglalink's, because this
// is a Banglalink demo build.
//
// Every colour in `brand` is lifted from Banglalink's own production stylesheet
// (banglalink.net), including their variable names where they name them, so the demo
// matches their site rather than an eyeballed orange:
//
//   --color-primary       #f16522
//   --color-primary-light #faa282
//
// The two ribbon oranges come from the official logo vector, not the site CSS.
export const brand = {
  /** --color-primary. The accent: buttons, active state, glows, links. */
  orange: "#f16522",
  /** Pressed/hover step down from primary, as used on their site. */
  orangeDark: "#e16124",
  /** A step lighter than primary — secondary accents, icons on dark. */
  orangeLight: "#f67a3e",
  /** --color-primary-light. Softest on-brand tint that still reads as orange. */
  orangePale: "#faa282",
  /** The logo ribbon's deep orange. */
  orangeDeep: "#f26e21",
  /** The logo ribbon's amber fold — the warm end of the brand gradient. */
  amber: "#f9a11b",
  /** Banglalink's green. Kept for genuine success states so they don't collide
   *  with the orange accent. */
  green: "#00ae5b",
  /** Banglalink's red, for errors. */
  red: "#ff4646",
  /** Their near-black, used for text on light/orange fills. */
  ink: "#212121",
} as const;

export const colors = {
  background: "#0a0908",
  panel: "#0b0a09",
  foreground: "#f2f2f2",

  // --- accent (Banglalink orange) ---------------------------------------
  brand: brand.orange,
  brandLight: brand.orangeLight,
  brandPale: brand.orangePale,
  brandAmber: brand.amber,

  // --- semantic status --------------------------------------------------
  // Deliberately not orange: a 2xx badge and a brand accent must not look alike.
  success: brand.green,

  red300: "#fca5a5",
  red400: "#f87171",
  red500: "#ef4444",

  amber300: "#fcd34d",
  amber400: "#fbbf24",
  sky300: "#7dd3fc",
  violet300: "#c4b5fd",

  // Tailwind's white/N opacities, pre-resolved to rgba for React Native.
  white04: "rgba(255,255,255,0.04)",
  white06: "rgba(255,255,255,0.06)",
  white08: "rgba(255,255,255,0.08)",
  white10: "rgba(255,255,255,0.10)",
  white15: "rgba(255,255,255,0.15)",
  white30: "rgba(255,255,255,0.30)",
  white35: "rgba(255,255,255,0.35)",
  white40: "rgba(255,255,255,0.40)",
  white50: "rgba(255,255,255,0.50)",
  white55: "rgba(255,255,255,0.55)",
  white60: "rgba(255,255,255,0.60)",
  white70: "rgba(255,255,255,0.70)",
  white90: "rgba(255,255,255,0.90)",

  border: "rgba(255,255,255,0.10)",
  borderSubtle: "rgba(255,255,255,0.05)",
  // #f16522 at the same opacities the web app used for its accent tint/border.
  brandTint: "rgba(241,101,34,0.20)",
  brandBorder: "rgba(241,101,34,0.40)",
  redTint: "rgba(239,68,68,0.10)",
  redBadge: "rgba(239,68,68,0.15)",
  codeBg: "rgba(0,0,0,0.40)",
} as const;

export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 9999,
} as const;

export const spacing = (n: number) => n * 4;

// React Native has no `font-mono` keyword — the family has to be named per platform.
import { Platform } from "react-native";

export const mono = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
}) as string;
