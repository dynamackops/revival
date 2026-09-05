export const EXCAVATION_STAGES = [
  { label: "Recovering documentation", percent: 20 },
  { label: "Examining project structure", percent: 45 },
  { label: "Tracing project history", percent: 70 },
  { label: "Reconstructing intent", percent: 90 },
] as const;

export interface EvidenceInspectors {
  documentation(): Promise<void>;
  structure(): Promise<void>;
  history(): Promise<void>;
  prepareReconstruction(): Promise<void>;
}

export interface ProgressUpdate {
  label: string;
  percent: number;
}

export async function runEvidencePipeline(
  inspectors: EvidenceInspectors,
  report: (update: ProgressUpdate) => Promise<void>,
  delay: (milliseconds: number) => Promise<void>,
  stageDelayMs: number,
): Promise<void> {
  const work = [
    inspectors.documentation,
    inspectors.structure,
    inspectors.history,
    inspectors.prepareReconstruction,
  ];

  for (let index = 0; index < EXCAVATION_STAGES.length; index += 1) {
    await report(EXCAVATION_STAGES[index]);
    await work[index]();
    if (stageDelayMs > 0) await delay(stageDelayMs);
  }
}
