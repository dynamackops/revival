from datetime import datetime
from enum import StrEnum
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class RepositoryStatus(StrEnum):
    UNEXAMINED_ARTIFACT = "unexamined_artifact"
    REVIVAL_IN_PROGRESS = "revival_in_progress"
    RESCOPED = "rescoped"
    PRESERVED = "preserved"
    REVIVED = "revived"


class OperationState(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    WAITING_FOR_REVIEW = "waiting_for_review"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ConfidenceLabel(StrEnum):
    RECOVERED_FACT = "recovered_fact"
    STRONG_INFERENCE = "strong_inference"
    UNKNOWN = "unknown"


class OperationSnapshot(BaseModel):
    id: UUID
    state: OperationState
    progress_stage: str
    progress_percent: int | None = Field(default=None, ge=0, le=100)
    retryable: bool = False
    updated_at: datetime


class HealthResponse(BaseModel):
    service: Literal["revival-control-api"]
    status: Literal["ok"]
    version: str
