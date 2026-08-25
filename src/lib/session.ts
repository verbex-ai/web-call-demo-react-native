import { AGENT_IDS, DEBUG, TOKEN_ENDPOINT, VERBEX_API_BASE, VERBEX_API_KEY } from "../config";

export type Language = "en" | "bn";

/** A failure we can describe to the caller in plain language. */
export class SessionError extends Error {
  readonly title: string;
  readonly code?: string;
  constructor(title: string, message: string, code?: string) {
    super(message);
    this.name = "SessionError";
    this.title = title;
    this.code = code;
  }
}

/**
 * Mints the short-lived LiveKit JWT the room connection needs.
 *
 * Two modes, chosen by whether EXPO_PUBLIC_TOKEN_ENDPOINT is set:
 *
 *  - endpoint mode (recommended for anything you distribute): POST { language } to
 *    your own server, which holds the API key and returns { sessionToken }. This is
 *    the same contract as the web app's /api/verbex-session route, so that route
 *    works as-is.
 *
 *  - direct mode (local demo only): call Verbex from the device using the API key
 *    baked into the bundle. Convenient, but see the warning in src/config.ts — the
 *    key is extractable from any build.
 *
 * Switching between them is this one env var; no other file needs to change.
 */
export async function mintSessionToken(
  language: Language,
  signal?: AbortSignal,
): Promise<string> {
  if (TOKEN_ENDPOINT) return mintViaEndpoint(language, signal);

  // Hard stop for release builds. Direct mode needs the API key inlined into the
  // bundle, and a distributed APK can be unzipped — so a release build must never
  // silently fall back to it. Failing here turns a security hole into a visible,
  // fixable configuration error. __DEV__ is compiled to `false` in release bundles,
  // so this branch is unreachable-and-stripped in dev and live in production.
  if (!__DEV__) {
    throw new SessionError(
      "App is not configured",
      "This build has no token endpoint configured. A distributed build must mint " +
        "session tokens on a server — set EXPO_PUBLIC_TOKEN_ENDPOINT and rebuild.",
    );
  }

  return mintDirect(language, signal);
}

async function mintViaEndpoint(language: Language, signal?: AbortSignal): Promise<string> {
  let res: Response;
  try {
    res = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language }),
      signal,
    });
  } catch (err) {
    if (isAbort(err)) throw err;
    throw new SessionError(
      "Could not reach the server",
      "The session endpoint was unreachable. Check that it is running and that the device can see it, then try again.",
    );
  }

  const body = (await res.json().catch(() => ({}))) as {
    sessionToken?: string;
    error?: string;
    message?: string;
    code?: string;
  };

  if (!res.ok || !body.sessionToken) {
    if (DEBUG) console.log("[verbex] token endpoint error", res.status, body);
    throw new SessionError(
      body.error ?? "Could not start the call",
      body.message ?? "We couldn't start the call. Please try again.",
      body.code,
    );
  }
  return body.sessionToken;
}

async function mintDirect(language: Language, signal?: AbortSignal): Promise<string> {
  const agentId = AGENT_IDS[language];
  if (!VERBEX_API_KEY || !agentId) {
    throw new SessionError(
      "App is not configured",
      `Missing EXPO_PUBLIC_VERBEX_API_KEY or EXPO_PUBLIC_VERBEX_AGENT_ID_${language.toUpperCase()}. Copy .env.example to .env, fill it in, and restart the bundler with --clear.`,
    );
  }

  let res: Response;
  try {
    res = await fetch(`${VERBEX_API_BASE}/v1/calls/create-web-call`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VERBEX_API_KEY}`,
      },
      body: JSON.stringify({ ai_agent_id: agentId }),
      signal,
    });
  } catch (err) {
    if (isAbort(err)) throw err;
    throw new SessionError(
      "Could not reach Verbex",
      "The Verbex API could not be reached. Check your connection and try again.",
    );
  }

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    if (DEBUG) console.log("[verbex] create-web-call failed", res.status, raw.slice(0, 500));
    throw explainError(res.status, raw);
  }

  const data = (await res.json().catch(() => ({}))) as { access_token?: string };
  if (!data.access_token) {
    throw new SessionError(
      "Unexpected response",
      "Verbex did not return an access_token for this call.",
    );
  }
  return data.access_token;
}

function isAbort(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { name?: string }).name === "AbortError"
  );
}

// Turns a raw Verbex error response into a title + human message, mirroring the
// taxonomy in the web app's route handler so both clients explain failures the same way.
function explainError(status: number, raw: string): SessionError {
  let code: string | undefined;
  try {
    const body = JSON.parse(raw) as { message?: string; error?: string };
    code = body.message ?? body.error;
  } catch {
    /* non-JSON body */
  }

  if (status === 429 || code === "TOO_MANY_CONCURRENT_REQUESTS") {
    return new SessionError(
      "Call limit reached",
      "Your organization's concurrent-call limit is in use. End any other active call and try again in a moment.",
      code ?? "TOO_MANY_CONCURRENT_REQUESTS",
    );
  }
  if (status === 402 || /insufficient balance|sufficient balance/i.test(raw)) {
    return new SessionError(
      "Out of balance",
      "This Verbex organization doesn't have enough balance to start a call. Top up the account and try again.",
      code ?? "INSUFFICIENT_BALANCE",
    );
  }
  if (status === 401 || status === 403) {
    return new SessionError(
      "Authentication failed",
      "Verbex rejected the API key. Check EXPO_PUBLIC_VERBEX_API_KEY (and the agent id) in .env.",
      code,
    );
  }
  if (status === 404) {
    return new SessionError(
      "Agent not found",
      "Verbex could not find this agent. Check the agent id in .env.",
      code,
    );
  }
  if (status >= 500) {
    return new SessionError(
      "Verbex is having trouble",
      "The Verbex service returned a server error. Please try again shortly.",
      code,
    );
  }
  return new SessionError(
    "Could not start the call",
    "Verbex rejected the session request. Please try again.",
    code,
  );
}
