import { describe, expect, it } from "vitest";

import { humanizeDormantDuration } from "./dormant";

describe("humanizeDormantDuration", () => {
  it("reports no commits recorded when there is no timestamp", () => {
    expect(humanizeDormantDuration(null)).toBe("No commits recorded yet");
    expect(humanizeDormantDuration(undefined)).toBe("No commits recorded yet");
  });

  it("reports active today for a commit within the last day", () => {
    expect(humanizeDormantDuration(new Date().toISOString())).toBe("Active today");
  });

  it("reports whole days for recent dormancy", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString();
    expect(humanizeDormantDuration(threeDaysAgo)).toBe("Dormant 3 days");
  });

  it("reports months once dormancy exceeds thirty days", () => {
    const twoMonthsAgo = new Date(Date.now() - 65 * 86_400_000).toISOString();
    expect(humanizeDormantDuration(twoMonthsAgo)).toBe("Dormant 2 months");
  });

  it("reports years and remaining months for long dormancy", () => {
    const longAgo = new Date(Date.now() - 400 * 86_400_000).toISOString();
    expect(humanizeDormantDuration(longAgo)).toBe("Dormant 1y 1m");
  });

  it("reports unknown for an unparsable timestamp", () => {
    expect(humanizeDormantDuration("not-a-date")).toBe("Unknown");
  });
});
