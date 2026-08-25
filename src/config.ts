// The Verbex JS SDK connects every web call to this LiveKit deployment — the URL is
// a hardcoded constant inside `@verbex-ai/verbex-js-sdk@1.0.0`, not something the
// session token carries. We mirror that default here but keep it overridable so a
// different Verbex environment doesn't require a code change.
export const LIVEKIT_URL =
  process.env.EXPO_PUBLIC_LIVEKIT_URL;

export const VERBEX_API_BASE = process.env.EXPO_PUBLIC_VERBEX_API_BASE;

// SECURITY: every EXPO_PUBLIC_* value is inlined into the JS bundle and ships inside
// the APK/IPA, where `unzip` recovers it. Expo's own docs say never to put secrets
// behind that prefix.
//
// The `__DEV__ &&` here is load-bearing, not decorative. __DEV__ compiles to a literal
// `false` in release bundles, so the minifier folds this whole expression to "" and
// drops the inlined key string entirely — meaning a release build cannot carry the key
// even if it is still sitting in .env at build time. Removing this guard would
// silently re-introduce the leak.
//
// Release builds must therefore mint tokens through EXPO_PUBLIC_TOKEN_ENDPOINT;
// mintSessionToken() refuses to start a call otherwise.
export const VERBEX_API_KEY = __DEV__ ? (process.env.EXPO_PUBLIC_VERBEX_API_KEY ?? "") : "";

export const AGENT_IDS = {
  en: process.env.EXPO_PUBLIC_VERBEX_AGENT_ID_EN ?? "",
  bn: process.env.EXPO_PUBLIC_VERBEX_AGENT_ID_BN ?? "",
} as const;

// When set, the app POSTs { language } here instead of calling Verbex directly, and
// the API key never enters the bundle. This is the one switch that turns the demo
// into a shippable setup.
export const TOKEN_ENDPOINT = process.env.EXPO_PUBLIC_TOKEN_ENDPOINT ?? "";

// Diagnostic logging — on in dev only. Payloads include live conversation content,
// so this must never run in a release build.
export const DEBUG = __DEV__;
