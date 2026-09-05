import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

import { handleRequest } from "./index.ts";

const ENV = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-test-key",
  GITHUB_APP_ID: "1234",
  GITHUB_APP_PRIVATE_KEY: "not-used-by-these-tests",
};

async function withEnv<T>(overrides: Record<string, string | undefined>, run: () => Promise<T>) {
  const previous: Record<string, string | undefined> = {};
  for (const [name, value] of Object.entries({ ...ENV, ...overrides })) {
    previous[name] = Deno.env.get(name);
    if (value === undefined) Deno.env.delete(name);
    else Deno.env.set(name, value);
  }
  try {
    return await run();
  } finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) Deno.env.delete(name);
      else Deno.env.set(name, value);
    }
  }
}

Deno.test("OPTIONS returns CORS headers", async () => {
  const response = await handleRequest(new Request("https://example.test", { method: "OPTIONS" }));
  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("malformed JSON is rejected before configuration or authentication", async () => {
  const response = await handleRequest(new Request("https://example.test", {
    method: "POST",
    body: "{bad-json",
  }));
  assertEquals(response.status, 400);
  assertEquals((await response.json()).error, "invalid_json");
});

Deno.test("missing server configuration returns a safe response", async () => {
  await withEnv({ GITHUB_APP_PRIVATE_KEY: undefined }, async () => {
    const response = await handleRequest(new Request("https://example.test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    }));
    const body = await response.json();
    assertEquals(response.status, 500);
    assertEquals(body.error, "server_misconfigured");
    assertEquals(JSON.stringify(body).includes("PRIVATE_KEY"), false);
  });
});

Deno.test("a request without a session is rejected", async () => {
  await withEnv({}, async () => {
    const response = await handleRequest(new Request("https://example.test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    }));
    assertEquals(response.status, 401);
    assertEquals((await response.json()).error, "unauthenticated");
  });
});
