import { StyleSheet } from "react-native";
import { colors, mono, radii, spacing } from "../theme";

// Shared chrome for every debug row (tool / http / var / raw) so they line up as one
// visual family, the way the web app's shared Tailwind classes do.
export const eventRowStyles = StyleSheet.create({
  card: {
    alignSelf: "flex-start",
    maxWidth: "92%",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: radii.md,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
  },
  kind: {
    fontFamily: mono,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.white40,
  },
  chevron: { marginLeft: "auto" },
  body: { marginTop: spacing(2), gap: spacing(2) },
});
