# Building the release APK

Everything below is done. The build is blocked on **one setting you have to change in
the Vercel dashboard** — see "Blocker" at the bottom.

## What a release build does differently

`src/config.ts` reads the API key behind `__DEV__`:

```ts
export const VERBEX_API_KEY = __DEV__ ? (process.env.EXPO_PUBLIC_VERBEX_API_KEY ?? "") : "";
```

`__DEV__` compiles to `false` in release, so the minifier folds that to `""` and drops the
inlined key string from the bundle entirely. Verified by grepping the compiled Hermes
bytecode: the key is present in the dev bundle and absent from the release bundle.

The consequence: **a release build has no key and therefore must have a token endpoint.**
`src/lib/session.ts` refuses to start a call without one rather than failing obscurely:

```
App is not configured — This build has no token endpoint configured. A distributed
build must mint session tokens on a server ...
```

## The endpoint

`EXPO_PUBLIC_TOKEN_ENDPOINT` in `.env`, pointing at the deployed `web-call-demo-ui`:

```
https://<your-web-call-demo-ui-deployment>/api/verbex-session
```

That is `web-call-demo-ui`'s own `/api/verbex-session` route — the app POSTs
`{ language }` and expects `{ sessionToken }`, which is exactly what that route returns.
No app code changes were needed; `mintViaEndpoint()` already speaks this contract.

The API key lives in Vercel's environment variables, server-side, and never reaches the
APK. Take the exact hostname from the Vercel dashboard and keep it in `.env`, which is
gitignored — it is deliberately not recorded here.

### The route needed one fix

`isSameOrigin()` returns `true` when `Origin` is absent, and React Native's fetch does not
send `Origin`. That is what lets the mobile client through — but it also meant anyone who
pulled the endpoint URL out of the APK could mint tokens freely, because the rate limiter
the comment defers to ("A missing Origin ... is left to the rate limiter") was commented
out. It is now enabled (`web-call-demo-ui` commit `a9d81bb`).

Caveat: `rateHits` is per-instance memory. On serverless each cold start resets it and
concurrent instances count separately, so it is a speed bump, not a quota. A shared store
(Vercel KV / Upstash) is the real fix if abuse appears.

## Signing

Release builds are signed with a real keystore, not the Android debug key:

- `credentials/verbex-release.keystore` — RSA 2048, valid to 2054
- `credentials/keystore.properties` — alias and passwords

Both are **gitignored**. Back them up somewhere durable. Losing them means Android will
not accept an update as the same app, and you would have to ship under a new package id.

Wiring lives in `plugins/withReleaseSigning.js` rather than in `android/app/build.gradle`,
because `expo prebuild` deletes and regenerates `android/` on every run — a hand edit
there is silently reverted, possibly right before a release build. The plugin throws if the
Expo template changes shape rather than quietly falling back to the debug key.

## Build it

```sh
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

Takes ~5 min with a warm Gradle cache. Verify afterwards:

```sh
# the key must NOT appear
KEY=$(grep -E '^EXPO_PUBLIC_VERBEX_API_KEY=' ../.env | cut -d= -f2-)
unzip -p app/build/outputs/apk/release/app-release.apk assets/index.android.bundle | grep -c "$KEY"   # expect 0
# the endpoint must appear
unzip -p app/build/outputs/apk/release/app-release.apk assets/index.android.bundle | grep -c "verbex-session"  # expect >=1
# signed by our cert, not the debug key
$JAVA_HOME/bin/keytool -printcert -jarfile app/build/outputs/apk/release/app-release.apk | grep Owner
```

## Blocker — needs you

Every URL for the Vercel project returns HTTP 401:

```json
{"error":{"code":"401","message":"Protected deployment"},
 "protection":{"vercel_auth_enabled":true}}
```

Deployment Protection is set to cover **all** deployments, including production. A mobile
app cannot authenticate through Vercel SSO, so the endpoint is unreachable from the APK and
every call will fail.

Fix, in the Vercel dashboard → the project → **Settings → Deployment Protection**, either:

1. Set **Vercel Authentication** to *Only Preview Deployments* (production becomes public,
   the app works, and the rate limiter above is what protects it), or
2. Leave protection on and enable **Protection Bypass for Automation**, then give me the
   secret so the app can send it as `x-vercel-protection-bypass`. Note that secret would
   then live inside the APK, so it is only as private as the endpoint URL itself.

Option 1 is the normal arrangement for a public app endpoint. After either change, confirm:

```sh
curl -s -X POST https://<your-production-domain>/api/verbex-session \
  -H 'Content-Type: application/json' -d '{"language":"en"}'
```

A `{"sessionToken":"..."}` response means the APK will work. Then rebuild.

## iOS

Not possible on this machine: no Xcode (Command Line Tools only), no CocoaPods, and
`security find-identity` reports **0 valid signing identities**. An iPhone will not install
an unsigned IPA, so an Apple Developer Program membership ($99/yr) with a distribution
certificate and provisioning profile is required before any installable iOS artifact can
exist. With the account, `eas build -p ios` builds in Expo's cloud and needs no local
Xcode; distribution to the client is then TestFlight or ad-hoc with their device UDIDs.
