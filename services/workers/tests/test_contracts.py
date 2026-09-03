from revival_workers.contracts import WorkerKind


def test_worker_kinds_remain_explicit() -> None:
    assert WorkerKind.EVIDENCE_COLLECTOR == "evidence_collector"
    assert WorkerKind.SANDBOX_RUNNER == "sandbox_runner"
