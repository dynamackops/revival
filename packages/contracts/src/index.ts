export const PRODUCT_NAME = "Revival";
export const PRODUCT_TAGLINE = "Bring this project back to life.";
export const API_VERSION = "v1";

export const repositoryStatuses = [
  "unexamined_artifact",
  "revival_in_progress",
  "rescoped",
  "preserved",
  "revived",
] as const;
export type RepositoryStatus = (typeof repositoryStatuses)[number];

export const operationStates = [
  "queued",
  "running",
  "waiting_for_review",
  "completed",
  "failed",
  "cancelled",
] as const;
export type OperationState = (typeof operationStates)[number];

export const confidenceLabels = [
  "recovered_fact",
  "strong_inference",
  "unknown",
] as const;
export type ConfidenceLabel = (typeof confidenceLabels)[number];

export interface OperationSnapshot {
  id: string;
  state: OperationState;
  progressStage: string;
  progressPercent: number | null;
  retryable: boolean;
  updatedAt: string;
}

export interface HealthResponse {
  service: "revival-control-api";
  status: "ok";
  version: string;
}
