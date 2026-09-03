import { describe, expect, it } from "vitest";

import { hasSupabaseBrowserConfiguration } from "./client";

describe("Supabase browser configuration", () => {
  it("requires a project URL and publishable key", () => {
    expect(hasSupabaseBrowserConfiguration({})).toBe(false);
    expect(
      hasSupabaseBrowserConfiguration({
        url: "https://example.supabase.co",
        publishableKey: "sb_publishable_example",
      }),
    ).toBe(true);
  });

  it("does not accept a service-role-shaped substitute", () => {
    expect(
      hasSupabaseBrowserConfiguration({
        url: "https://example.supabase.co",
        publishableKey: "",
      }),
    ).toBe(false);
  });
});
