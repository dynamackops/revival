from datetime import UTC, datetime, timedelta
from time import monotonic

import httpx
import jwt
from pydantic import BaseModel, Field, ValidationError

GITHUB_API_VERSION = "2022-11-28"


class GitHubAppProbeError(RuntimeError):
    """Raised when selected-repository access cannot be verified."""


class AuthorizedRepository(BaseModel):
    github_repository_id: int
    full_name: str
    private: bool
    default_branch: str


class GitHubRepositoryProbeResult(BaseModel):
    installation_id: int
    repository_count: int = Field(ge=1)
    repositories: list[AuthorizedRepository] = Field(min_length=1)
    latency_ms: int = Field(ge=0)


class _Repository(BaseModel):
    id: int
    full_name: str
    private: bool
    default_branch: str


class _RepositoryList(BaseModel):
    total_count: int
    repositories: list[_Repository]


class GitHubAppClient:
    def __init__(
        self,
        *,
        app_id: str,
        private_key: str,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self._app_id = app_id
        self._private_key = private_key.replace("\\n", "\n")
        self._client = client

    def create_app_jwt(self) -> str:
        now = datetime.now(UTC)
        return jwt.encode(
            {
                "iat": int((now - timedelta(seconds=30)).timestamp()),
                "exp": int((now + timedelta(minutes=9)).timestamp()),
                "iss": self._app_id,
            },
            self._private_key,
            algorithm="RS256",
        )

    async def probe_repositories(self, installation_id: int) -> GitHubRepositoryProbeResult:
        started = monotonic()
        app_headers = self._headers(self.create_app_jwt())

        try:
            if self._client is not None:
                token_response = await self._client.post(
                    f"https://api.github.com/app/installations/{installation_id}/access_tokens",
                    headers=app_headers,
                )
                token_response.raise_for_status()
                installation_token = str(token_response.json()["token"])
                repository_response = await self._client.get(
                    "https://api.github.com/installation/repositories?per_page=100",
                    headers=self._headers(installation_token),
                )
            else:
                async with httpx.AsyncClient(timeout=30) as client:
                    token_response = await client.post(
                        f"https://api.github.com/app/installations/{installation_id}/access_tokens",
                        headers=app_headers,
                    )
                    token_response.raise_for_status()
                    installation_token = str(token_response.json()["token"])
                    repository_response = await client.get(
                        "https://api.github.com/installation/repositories?per_page=100",
                        headers=self._headers(installation_token),
                    )
            repository_response.raise_for_status()
            payload = _RepositoryList.model_validate(repository_response.json())
        except (httpx.HTTPError, ValidationError, ValueError, KeyError) as error:
            raise GitHubAppProbeError("GitHub App repository probe failed") from error

        repositories = [
            AuthorizedRepository(
                github_repository_id=repository.id,
                full_name=repository.full_name,
                private=repository.private,
                default_branch=repository.default_branch,
            )
            for repository in payload.repositories
        ]
        if not repositories:
            raise GitHubAppProbeError("The GitHub App installation has no selected repositories")

        return GitHubRepositoryProbeResult(
            installation_id=installation_id,
            repository_count=len(repositories),
            repositories=repositories,
            latency_ms=round((monotonic() - started) * 1000),
        )

    @staticmethod
    def _headers(token: str) -> dict[str, str]:
        return {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": GITHUB_API_VERSION,
        }
