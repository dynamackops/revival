import httpx
import pytest

from app.integrations.token_factory import TokenFactoryClient, TokenFactoryProbeError


@pytest.mark.asyncio
async def test_token_factory_probe_validates_completion_and_never_returns_token() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.url == "https://api.tokenfactory.nebius.com/v1/chat/completions"
        assert request.headers["Authorization"] == "Bearer server-secret"
        return httpx.Response(
            200,
            json={
                "id": "completion-1",
                "model": "nvidia/test-nemotron",
                "choices": [{"message": {"content": "Evidence and inference stay distinct."}}],
                "usage": {"prompt_tokens": 12, "completion_tokens": 6},
            },
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        result = await TokenFactoryClient(
            api_key="server-secret",
            base_url="https://api.tokenfactory.nebius.com/v1/",
            client=client,
        ).probe("nvidia/test-nemotron")

    assert result.model == "nvidia/test-nemotron"
    assert result.content == "Evidence and inference stay distinct."
    assert "server-secret" not in result.model_dump_json()


@pytest.mark.asyncio
async def test_token_factory_probe_rejects_malformed_response() -> None:
    async def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"id": "completion-1", "choices": []})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        with pytest.raises(TokenFactoryProbeError):
            await TokenFactoryClient(
                api_key="server-secret",
                base_url="https://api.tokenfactory.nebius.com/v1",
                client=client,
            ).probe("nvidia/test-nemotron")
