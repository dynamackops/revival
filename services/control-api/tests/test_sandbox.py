import json
import subprocess

import pytest

from app.integrations.sandbox import ContreeSandboxClient, SandboxProbeError


def test_sandbox_probe_requires_disposable_checked_diff(monkeypatch: pytest.MonkeyPatch) -> None:
    output = {
        "uuid": "sandbox-operation-1",
        "exit_code": 0,
        "stdout": (
            "diff --git a/artifact.before b/artifact.txt\n"
            "-status=dormant\n"
            "+status=revived\n"
        ),
    }

    def fake_run(command: list[str], **_kwargs: object) -> subprocess.CompletedProcess[str]:
        assert "--disposable" in command
        assert "--file" in command
        assert "grep -qx 'status=revived' artifact.txt" in command[-1]
        return subprocess.CompletedProcess(command, 0, stdout=json.dumps(output), stderr="")

    monkeypatch.setattr(subprocess, "run", fake_run)
    result = ContreeSandboxClient(image="tag:ubuntu:latest").probe()

    assert result.operation_id == "sandbox-operation-1"
    assert result.disposable is True
    assert result.check_passed is True
    assert "+status=revived" in result.diff


def test_sandbox_probe_rejects_failed_check(monkeypatch: pytest.MonkeyPatch) -> None:
    output = {
        "uuid": "sandbox-operation-2",
        "exit_code": 1,
        "stdout": "status=dormant",
    }

    def fake_run(command: list[str], **_kwargs: object) -> subprocess.CompletedProcess[str]:
        return subprocess.CompletedProcess(command, 0, stdout=json.dumps(output), stderr="")

    monkeypatch.setattr(subprocess, "run", fake_run)
    with pytest.raises(SandboxProbeError, match="edit check"):
        ContreeSandboxClient(image="tag:ubuntu:latest").probe()
