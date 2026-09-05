// Short-lived, user-bound, HMAC-signed state values for the GitHub App
// installation flow. The state travels through GitHub's redirect, so it must
// be tamper-evident without needing a database round trip to validate.

export interface StatePayload {
  uid: string;
  nonce: string;
  iat: number;
  exp: number;
}

export class StateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StateError";
  }
}

const DEFAULT_TTL_SECONDS = 600;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const withPadding = padded + "=".repeat((4 - (padded.length % 4)) % 4);
  const binary = atob(withPadding);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function hmacSign(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return toBase64Url(new Uint8Array(signature));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function signState(
  uid: string,
  secret: string,
  options: { ttlSeconds?: number; nonce?: string; now?: number } = {},
): Promise<string> {
  if (!uid) throw new StateError("A user id is required to sign state");
  if (!secret) throw new StateError("GITHUB_APP_STATE_SECRET is not configured");

  const now = options.now ?? Math.floor(Date.now() / 1000);
  const payload: StatePayload = {
    uid,
    nonce: options.nonce ?? crypto.randomUUID(),
    iat: now,
    exp: now + (options.ttlSeconds ?? DEFAULT_TTL_SECONDS),
  };

  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await hmacSign(body, secret);
  return `${body}.${signature}`;
}

export async function verifyState(
  token: string,
  secret: string,
  expectedUid: string,
  options: { now?: number } = {},
): Promise<StatePayload> {
  if (!secret) throw new StateError("GITHUB_APP_STATE_SECRET is not configured");
  if (!token || typeof token !== "string" || !token.includes(".")) {
    throw new StateError("Malformed installation state");
  }

  const [body, signature] = token.split(".");
  if (!body || !signature) {
    throw new StateError("Malformed installation state");
  }

  const expectedSignature = await hmacSign(body, secret);
  if (!timingSafeEqual(signature, expectedSignature)) {
    throw new StateError("Installation state signature is invalid");
  }

  let payload: StatePayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as StatePayload;
  } catch {
    throw new StateError("Installation state could not be decoded");
  }

  if (
    typeof payload.uid !== "string" ||
    typeof payload.exp !== "number" ||
    typeof payload.iat !== "number"
  ) {
    throw new StateError("Installation state is missing required fields");
  }

  const now = options.now ?? Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    throw new StateError("Installation state has expired");
  }

  if (payload.uid !== expectedUid) {
    throw new StateError("Installation state does not belong to the current user");
  }

  return payload;
}
