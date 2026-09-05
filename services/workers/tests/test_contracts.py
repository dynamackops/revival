from revival_workers.contracts import WorkerKind


def test_worker_kinds_remain_explicit() -> None:
    assert WorkerKind.EVIDENCE_COLLECTOR.value == "evidence_collector"
    assert WorkerKind.SANDBOX_RUNNER.value == "sandbox_runner"
