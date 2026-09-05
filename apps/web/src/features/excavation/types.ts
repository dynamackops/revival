export type ExcavationOperationState =
  | "queued"
  | "running"
  | "waiting_for_review"
  | "completed"
  | "failed"
  | "cancelled";

export type ExcavationOperation = {
  id: string;
  excavationId: string;
  repositoryId: string;
  state: ExcavationOperationState;
  progressStage: string;
  progressPercent: number;
  errorCode: string | null;
  retryable: boolean;
  presentationSeen: boolean;
  updatedAt: string;
};
