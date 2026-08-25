# Verbex Test Call — React Native

A React Native port of `web-call-demo-ui`: a hero screen with a **Test Call** button that
runs a live voice call against a Verbex agent, streaming the transcript, tool calls and
API responses in real time — the same test-call flow as verbex-customer-console.

Runs on iOS and Android from one codebase.

## Stack

| | |
|---|---|
| Expo SDK | 57.0.16 |
| React Native | 0.86.2 (React 19.2.3) |
| Routing | expo-router 57 |
| Realtime | `livekit-client` 2.22 + `@livekit/react-native` 2.12 + `@livekit/react-native-webrtc` 144.1 |
| Icons | Lucide paths drawn with `react-native-svg` 15.15 |

## Why this doesn't use `@verbex-ai/verbex-js-sdk`

The SDK is browser-only. It reaches for `navigator.mediaDevices`, `AudioContext`,
`requestAnimationFrame` and DOM `track.attach()`, none of which exist in React Native.

That turns out to cost nothing, because the SDK is a thin wrapper: it connects a LiveKit
room to a hardcoded URL with your session token, publishes the mic, and re-emits LiveKit
events under Verbex names. `src/hooks/useVerbexClient.ts` does exactly that against
`livekit-client` directly.

It is also *strictly more capable* than the SDK path. The SDK only re-emits data messages
whose `type === "metadata"`, so tool and debug events never surface through it — which is
why the web app already bypasses the SDK and reaches into `client.room`. Owning the Room
here removes that workaround.

One consequence worth knowing: the LiveKit URL is a constant compiled into the SDK, not
something the session token carries. Set it via `EXPO_PUBLIC_LIVEKIT_URL` — `src/config.ts`
reads it from there and nowhere else.

Building an APK to hand to someone? See **[RELEASE.md](RELEASE.md)** — key
stripping, the token endpoint, release signing, and the one Vercel setting that is
currently blocking it.

## Setup

```bash
npm install
cp .env.example .env      # then fill in your key + agent ids
```

## Where the API key lives

Two modes, decided by whether `EXPO_PUBLIC_TOKEN_ENDPOINT` is set.

**Local development (no endpoint):** a dev build mints tokens straight from the device
using `EXPO_PUBLIC_VERBEX_API_KEY`. Convenient, and safe enough because that key never
reaches a release bundle — see below.

**Any build you distribute (endpoint set):** the app POSTs `{ language }` to your server
and gets `{ sessionToken }` back. The API key stays server-side; the app only ever holds
a short-lived, room-scoped LiveKit JWT.

### Why a distributed APK cannot leak the key

Three layers, each verified rather than assumed:

1. `src/config.ts` reads the key behind `__DEV__`. That compiles to a literal `false` in
   release, so the minifier folds the expression to `""` and drops the inlined string.
   **Confirmed by grepping the compiled Hermes bytecode: the key is absent from a
   release bundle even while it is still present in `.env`.** The agent ids and API base
   do remain — those are resource identifiers, not credentials.
2. `mintSessionToken()` refuses to start a call in a release build with no endpoint
   configured, so a misconfigured APK fails visibly instead of silently.
3. `.env` is gitignored.

Do not remove the `__DEV__` guard in `src/config.ts` — it is the layer that actually
keeps the key out of the binary.

### Requirements for the endpoint

- **Public HTTPS.** A LAN IP only works for devices on your network, which an APK
  recipient will not be on.
- **Rate limited.** It mints real, billable, concurrency-limited Verbex calls, so an
  unprotected public endpoint lets anyone drain your org balance. Note the rate limiter
  in `web-call-demo-ui/src/app/api/verbex-session/route.ts` is currently **commented
  out** — re-enable it before pointing distributed builds at that route.
- The contract is identical to the web app's route, so a deployed `web-call-demo-ui`
  works with no new server code.

Only `src/lib/session.ts` is involved in either mode.

### Worth doing regardless

Use a key on a **separate low-balance Verbex org** for this app, so any leak is bounded
and can be rotated without touching production.

## Running

LiveKit needs native WebRTC, so **Expo Go cannot run this app**. You need a dev client
build. Pick whichever applies:

**You have Android Studio / Xcode locally:**

```bash
npx expo prebuild --clean   # generates ios/ and android/
npm run android             # or: npm run ios
```

**You don't** (neither is installed on this machine — checked). Build in the cloud with EAS;
no local Android SDK or Xcode required:

```bash
npm install -g eas-cli
eas login
eas build --profile development --platform android   # or ios
```

Install the resulting build on a device, then `npm start` to attach the bundler.

Note that `ios/` and `android/` are gitignored — they are generated output, regenerate them
with `npx expo prebuild` any time.

After editing `.env`, restart with `npm start -- --clear`. `EXPO_PUBLIC_*` values are
inlined at build time, not read at runtime, so a plain reload will not pick them up.

## How a call flows

```
tap Test Call
  └─ pick language (English / বাংলা)
       └─ request microphone permission
            └─ mint session token   (device → Verbex, or → your endpoint)
                 └─ configure + start the native audio session
                      └─ room.connect(LIVEKIT_URL, token)
                           └─ publish microphone
                                ├─ RoomEvent.TranscriptionReceived → transcript bubbles
                                └─ RoomEvent.DataReceived
                                     ├─ topic "tool_event"  → tool call rows
                                     ├─ topic "debug_event" → http / var / node rows
                                     └─ otherwise           → raw metadata rows
```

## Layout

```
index.ts                      registerGlobals() must run before anything else
app/
  _layout.tsx                 stack, dark theme, safe area
  index.tsx                   hero screen + open/close animation
src/
  config.ts                   env + LiveKit URL
  theme.ts                    colours, radii, spacing (the web app's palette)
  setup/livekitSetup.ts       WebRTC global registration
  hooks/useVerbexClient.ts    the call: permissions → token → room → events
  lib/
    session.ts                token minting (direct or via endpoint) + error taxonomy
    verbexEvents.ts           decodes agent packets into a typed event union
    rows.ts                   interleaves transcript + events into one sorted stream
    transcriptExport.ts       writes JSON, opens the share sheet
  components/                 CallPanel, TranscriptStream, CallControls, rows, icons…
```

`verbexEvents.ts` and `rows.ts` are ported from the web app unchanged apart from the
fix noted below — they are pure TypeScript with no DOM dependency.

## Differences from the web app

These are deliberate; everything else matches.

- **Transcript export** opens the OS share sheet (`expo-sharing`) instead of triggering a
  browser download. A phone has no downloads folder.
- **Layout**: the web app expands a 520px panel inline beneath the hero copy. On a phone
  there is no room for both, so the copy fades back and the panel comes forward.
- **Gradient headline text** has no React Native equivalent, so "Verbex agent" takes the
  accent colour the web gradient resolves toward.
- **Backdrop glows** are real SVG radial gradients rather than CSS `blur-3xl`, which React
  Native has no equivalent for.
- **Rate limiting and the same-origin guard** from the web route do not apply — they were
  server-side protections for a public HTTP endpoint. In endpoint mode your server keeps
  them; in direct mode there is no endpoint to protect.
- **Camera permission**: the `react-native-webrtc` config plugin declares `CAMERA` and
  `SYSTEM_ALERT_WINDOW` unconditionally. This app is audio-only, so both are stripped via
  `android.blockedPermissions` in `app.json`.

## Bug found while porting

`decodeToolEvent` defaulted a missing `name` to the literal `"tool"`. A `tool_output`
packet carries no `name`, and `mergeEvents` only prunes `undefined` — so that placeholder
overwrote the real name from the matching `tool_call`, and a transcript row would rename
itself from `get_weather` to `tool` the moment its result arrived.

Fixed here by typing `name` as optional and leaving it `undefined` when a packet has none,
so the merge preserves the real name; renderers fall back to `"tool"`.

**The same bug exists in `web-call-demo-ui/src/lib/verbexEvents.ts` and is not fixed
there** — that is a separate project and was left untouched.

## Checks

```bash
npm run typecheck   # tsc --noEmit
npm run doctor      # expo-doctor
```
