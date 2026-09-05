import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";

import { EXCAVATION_STAGES, runEvidencePipeline } from "./pipeline.ts";

Deno.test("the evidence pipeline reports the four focused scan stages in order", async () => {
  const calls: string[] = [];
  await runEvidencePipeline(
    {
      documentation: async () => { calls.push("documentation"); },
      structure: async () => { calls.push("structure"); },
      history: async () => { calls.push("history"); },
      prepareReconstruction: async () => { calls.push("reconstruction"); },
    },
    async ({ label }) => { calls.push(label); },
    async () => {},
    0,
  );

  assertEquals(calls, [
    EXCAVATION_STAGES[0].label, "documentation",
    EXCAVATION_STAGES[1].label, "structure",
    EXCAVATION_STAGES[2].label, "history",
    EXCAVATION_STAGES[3].label, "reconstruction",
  ]);
});

Deno.test("the pipeline stops instead of presenting later stages after evidence fails", async () => {
  const labels: string[] = [];
  await assertRejects(
    () => runEvidencePipeline(
      {
        documentation: async () => {},
        structure: async () => { throw new Error("tree unavailable"); },
        history: async () => {},
        prepareReconstruction: async () => {},
      },
      async ({ label }) => { labels.push(label); },
      async () => {},
      0,
    ),
    Error,
    "tree unavailable",
  );
  assertEquals(labels, ["Recovering documentation", "Examining project structure"]);
});
