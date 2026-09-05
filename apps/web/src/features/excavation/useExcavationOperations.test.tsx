import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useExcavationOperations } from "./useExcavationOperations";

const operationRow = {
  id: "22222222-2222-4222-8222-222222222222",
  excavation_id: "33333333-3333-4333-8333-333333333333",
  repository_id: "11111111-1111-4111-8111-111111111111",
  kind: "excavation",
  state: "running",
  progress_stage: "Examining project structure",
  progress_percent: 45,
  error_code: null,
  retryable: false,
  updated_at: "2026-09-05T00:00:00.000Z",
};

const removeChannel = vi.fn();
const subscribe = vi.fn();
const on = vi.fn();
const channel = vi.fn();
const from = vi.fn();

vi.mock("../../lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ from, channel, removeChannel }),
}));

describe("useExcavationOperations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const realtimeChannel = { on, subscribe };
    channel.mockReturnValue(realtimeChannel);
    on.mockReturnValue(realtimeChannel);
    subscribe.mockReturnValue(realtimeChannel);
    from.mockImplementation((table: string) => {
      if (table === "operations") {
        return {
          select: () => ({
            eq: () => ({
              in: () => ({ order: () => Promise.resolve({ data: [operationRow], error: null }) }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          in: () => Promise.resolve({
            data: [{ id: operationRow.excavation_id, presentation_seen: true }],
            error: null,
          }),
        }),
      };
    });
  });

  it("restores an in-flight scan and its presentation state after reopening", async () => {
    const { result } = renderHook(() => useExcavationOperations(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      [operationRow.repository_id],
    ));

    await waitFor(() => expect(result.current.operations[operationRow.repository_id]).toBeDefined());
    expect(result.current.operations[operationRow.repository_id]).toMatchObject({
      state: "running",
      progressStage: "Examining project structure",
      progressPercent: 45,
      presentationSeen: true,
    });
    expect(channel).toHaveBeenCalledWith("excavations:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  });
});
