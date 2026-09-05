from datetime import UTC, datetime, timedelta

import httpx
import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa

from app.integrations.github_app import GitHubAppClient, GitHubAppProbeError


@pytest.fixture
def private_key() -> str:
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    return key.private_bytes_raw().decode() if hasattr(key, "private_bytes_raw") else _pem(key)


def _pem(key: rsa.RSAPrivateKey) -> str:
    from cryptography.hazmat.primitives import serialization

    return key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()


@pytest.mark.asyncio
async def test_github_app_lists_only_installation_repositories(private_key: str) -> None:
    calls: list[str] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        calls.append(str(request.url))
        assert "private-key" not in request.headers["Authorization"]
        if request.method == "POST":
            return httpx.Response(201, json={"token": "short-lived-installation-token"})
        assert request.headers["Authorization"] == "Bearer short-lived-installation-token"
        return httpx.Response(
            200,
            json={
                "total_count": 1,
                "repositories": [
                    {
                        "id": 42,
                        "full_name": "creator/paused-project",
                        "private": True,
                        "default_branch": "main",
                    }
                ],
            },
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        github = GitHubAppClient(app_id="123", private_key=private_key, client=client)
        encoded = github.create_app_jwt()
        claims = jwt.decode(encoded, options={"verify_signature": False})
        result = await github.probe_repositories(987)

    assert claims["iss"] == "123"
    assert datetime.fromtimestamp(claims["exp"], UTC) < datetime.now(UTC) + timedelta(minutes=10)
    assert result.repository_count == 1
    assert result.repositories[0].private is True
    assert calls == [
        "https://api.github.com/app/installations/987/access_tokens",
        "https://api.github.com/installation/repositories?per_page=100",
    ]


@pytest.mark.asyncio
async def test_github_app_rejects_empty_selected_repository_set(private_key: str) -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        if request.method == "POST":
            return httpx.Response(201, json={"token": "installation-token"})
        return httpx.Response(200, json={"total_count": 0, "repositories": []})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        with pytest.raises(GitHubAppProbeError, match="no selected repositories"):
            await GitHubAppClient(
                app_id="123", private_key=private_key, client=client
            ).probe_repositories(987)
