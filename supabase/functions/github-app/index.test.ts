// Run with: deno test --allow-env --allow-net supabase/functions/github-app/index.test.ts
//
// These tests exercise request handling that does not require live GitHub
// credentials: method guards, missing configuration, unauthenticated
// requests, malformed JSON, and unknown actions. The Supabase admin client
// is only constructed here (no network call happens until auth.getUser or
// an rpc call is made), so these paths run without a live Supabase project.
// The four action bodies additionally need a live Supabase project and a
// live GitHub App installation to exercise end-to-end; see
// docs/github-app-setup.md for how to provide those in CI.
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

import { handleRequest } from "./index.ts";

const REQUIRED_ENV: Record<string, string> = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-test-key",
  GITHUB_APP_ID: "123456",
  GITHUB_APP_SLUG: "revival-test-app",
  // Not a real key: these tests never reach code that parses it.
  GITHUB_APP_PRIVATE_KEY: "test-private-key-placeholder",
  GITHUB_APP_STATE_SECRET: "test-state-secret",
};

async function withEnv<T>(
  overrides: Record<string, string | undefined>,
  run: () => Promise<T>,
): Promise<T> {
  const previous: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries({ ...REQUIRED_ENV, ...overrides })) {
    previous[key] = Deno.env.get(key);
    if (value === undefined) Deno.env.delete(key);
    else Deno.env.set(key, value);
  }

  try {
    return await run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) Deno.env.delete(key);
      else Deno.env.set(key, value);
    }
  }
}

function request(body?: unknown, init: RequestInit = {}) {
  return new Request("https://example.functions.supabase.co/github-app", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...init.headers },
    body: body === undefined ? undefined : JSON.stringify(body),
    ...init,
  });
}

Deno.test("OPTIONS requests receive CORS headers and no body", async () => {
  const response = await handleRequest(new Request("https://example.com", { method: "OPTIONS" }));
  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("non-POST methods are rejected", async () => {
  const response = await handleRequest(new Request("https://example.com", { method: "GET" }));
  assertEquals(response.status, 405);
});

Deno.test("missing server configuration returns a safe 500 without leaking secret names to the client", async () => {
  await withEnv({ GITHUB_APP_PRIVATE_KEY: undefined }, async () => {
    const response = await handleRequest(request({ action: "create-install-url" }));
    const body = await response.json();
    assertEquals(response.status, 500);
    assertEquals(body.error, "server_misconfigured");
    assertEquals(JSON.stringify(body).includes("PRIVATE_KEY"), false);
  });
});

Deno.test("a request without an Authorization header is unauthenticated", async () => {
  await withEnv({}, async () => {
    const response = await handleRequest(request({ action: "create-install-url" }));
    const body = await response.json();
    assertEquals(response.status, 401);
    assertEquals(body.error, "unauthenticated");
  });
});

Deno.test("malformed JSON bodies are rejected before authentication runs", async () => {
  await withEnv({}, async () => {
    const response = await handleRequest(
      request(undefined, {
        body: "{not-json",
        headers: { Authorization: "Bearer whatever-token" },
      }),
    );
    assertEquals(response.status, 400);
    const body = await response.json();
    assertEquals(body.error, "invalid_json");
  });
});
