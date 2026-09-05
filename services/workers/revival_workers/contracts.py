from enum import StrEnum


class WorkerKind(StrEnum):
    EVIDENCE_COLLECTOR = "evidence_collector"
    RECONSTRUCTION_AGENT = "reconstruction_agent"
    PATH_AGENT = "path_agent"
    SANDBOX_RUNNER = "sandbox_runner"
    PULL_REQUEST_PUBLISHER = "pull_request_publisher"
