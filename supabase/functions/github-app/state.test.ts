// Run with: deno test supabase/functions/github-app/state.test.ts
import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";

import { signState, StateError, verifyState } from "./state.ts";

const SECRET = "test-state-secret";
const UID = "11111111-1111-4111-8111-111111111111";
const OTHER_UID = "22222222-2222-4222-8222-222222222222";

Deno.test("signState and verifyState round-trip for the signing user", async () => {
  const state = await signState(UID, SECRET);
  const payload = await verifyState(state, SECRET, UID);
  assertEquals(payload.uid, UID);
});

Deno.test("verifyState rejects a tampered signature", async () => {
  const state = await signState(UID, SECRET);
  const [body] = state.split(".");
  const tampered = `${body}.not-a-real-signature`;

  await assertRejects(() => verifyState(tampered, SECRET, UID), StateError);
});

Deno.test("verifyState rejects a state signed with a different secret", async () => {
  const state = await signState(UID, "a-different-secret");
  await assertRejects(() => verifyState(state, SECRET, UID), StateError);
});

Deno.test("verifyState rejects an expired state", async () => {
  const now = Math.floor(Date.now() / 1000);
  const state = await signState(UID, SECRET, { now: now - 3600, ttlSeconds: 600 });
  await assertRejects(() => verifyState(state, SECRET, UID, { now }), StateError);
});

Deno.test("verifyState rejects a state bound to a different user", async () => {
  const state = await signState(UID, SECRET);
  await assertRejects(() => verifyState(state, SECRET, OTHER_UID), StateError);
});

Deno.test("verifyState rejects a malformed token", async () => {
  await assertRejects(() => verifyState("not-a-token", SECRET, UID), StateError);
  await assertRejects(() => verifyState("", SECRET, UID), StateError);
});

Deno.test("signState requires a user id and a configured secret", async () => {
  await assertRejects(() => signState("", SECRET), StateError);
  await assertRejects(() => signState(UID, ""), StateError);
});
