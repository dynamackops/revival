import pytest

from revival_workers.local_adapter import LocalJobAdapter
from revival_workers.spike_contracts import IntegrationSpikeJobResult, IntegrationSpikeRequest


@pytest.mark.asyncio
async def test_local_adapter_preserves_serverless_job_contract() -> None:
    request = IntegrationSpikeRequest(
        model_alias="nvidia/test-nemotron",
        github_installation_id=123,
        sandbox_image="tag:ubuntu:latest",
    )

    async def handler(received: IntegrationSpikeRequest) -> IntegrationSpikeJobResult:
        assert received == request
        return IntegrationSpikeJobResult.completed(
            adapter="local",
            model={"model": received.model_alias},
            sandbox={"disposable": True, "check_passed": True},
            github={"repository_count": 1},
        )

    result = await LocalJobAdapter().run(request, handler)

    assert result.adapter == "local"
    assert result.sandbox["check_passed"] is True
