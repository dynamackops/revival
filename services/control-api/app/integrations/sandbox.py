import json
import subprocess
import tempfile
from pathlib import Path

from pydantic import BaseModel, Field, ValidationError


class SandboxProbeError(RuntimeError):
    """Raised when a disposable ConTree run cannot be validated."""


class SandboxProbeResult(BaseModel):
    provider: str = "Nebius Token Factory Sandboxes"
    disposable: bool
    image: str
    operation_id: str = Field(min_length=1)
    exit_code: int
    check_passed: bool
    diff: str = Field(min_length=1)


class ContreeSandboxClient:
    def __init__(self, *, image: str, executable: str = "contree") -> None:
        self._image = image
        self._executable = executable

    def probe(self) -> SandboxProbeResult:
        with tempfile.TemporaryDirectory(prefix="revival-spike-") as directory:
            fixture = Path(directory) / "artifact.txt"
            fixture.write_text("status=dormant\n", encoding="utf-8")
            command = [
                self._executable,
                "-o",
                "json",
                "run",
                "--use",
                self._image,
                "--disposable",
                "--file",
                f"{fixture}:/workspace/artifact.txt",
                "-C",
                "/workspace",
                "--",
                "sh",
                "-lc",
                (
                    "cp artifact.txt artifact.before && "
                    "printf 'status=revived\\n' > artifact.txt && "
                    "grep -qx 'status=revived' artifact.txt && "
                    "git diff --no-index -- artifact.before artifact.txt || true"
                ),
            ]
            try:
                completed = subprocess.run(
                    command,
                    check=False,
                    capture_output=True,
                    text=True,
                    timeout=180,
                )
            except (OSError, subprocess.TimeoutExpired) as error:
                raise SandboxProbeError("ConTree sandbox command could not run") from error

        if completed.returncode != 0:
            raise SandboxProbeError("ConTree sandbox returned a non-zero exit code")

        try:
            payload = json.loads(completed.stdout)
            operation_id = str(
                payload.get("uuid") or payload.get("operation_id") or payload.get("id") or ""
            )
            stdout = str(payload.get("stdout") or payload.get("output") or "")
            exit_code = int(payload.get("exit_code", 0))
            result = SandboxProbeResult(
                disposable=True,
                image=self._image,
                operation_id=operation_id,
                exit_code=exit_code,
                check_passed=exit_code == 0 and "status=revived" in stdout,
                diff=stdout,
            )
        except (json.JSONDecodeError, TypeError, ValueError, ValidationError) as error:
            raise SandboxProbeError("ConTree output did not match the spike contract") from error

        if not result.check_passed:
            raise SandboxProbeError("Sandbox edit check did not pass")
        return result
