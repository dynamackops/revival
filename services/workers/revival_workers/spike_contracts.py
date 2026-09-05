from datetime import UTC, datetime

from pydantic import BaseModel, Field


class IntegrationSpikeRequest(BaseModel):
    model_alias: str = Field(min_length=1)
    github_installation_id: int = Field(gt=0)
    sandbox_image: str = Field(min_length=1)


class IntegrationSpikeJobResult(BaseModel):
    adapter: str
    completed_at: datetime
    model: dict[str, object]
    sandbox: dict[str, object]
    github: dict[str, object]

    @classmethod
    def completed(
        cls,
        *,
        adapter: str,
        model: dict[str, object],
        sandbox: dict[str, object],
        github: dict[str, object],
    ) -> "IntegrationSpikeJobResult":
        return cls(
            adapter=adapter,
            completed_at=datetime.now(UTC),
            model=model,
            sandbox=sandbox,
            github=github,
        )
