from functools import lru_cache

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: str = Field(default="development", alias="REVIVAL_ENV")
    allowed_origins: str = Field(
        default="http://localhost:5173",
        alias="REVIVAL_ALLOWED_ORIGINS",
    )
    supabase_url: str | None = Field(default=None, alias="SUPABASE_URL")
    supabase_expected_audience: str = Field(
        default="authenticated",
        alias="SUPABASE_EXPECTED_AUDIENCE",
    )
    nebius_token_factory_api_key: SecretStr | None = Field(
        default=None,
        alias="NEBIUS_TOKEN_FACTORY_API_KEY",
    )
    nebius_token_factory_base_url: str = Field(
        default="https://api.tokenfactory.nebius.com/v1",
        alias="NEBIUS_TOKEN_FACTORY_BASE_URL",
    )
    nemotron_reasoning_model: str | None = Field(
        default=None,
        alias="NEMOTRON_REASONING_MODEL",
    )
    nemotron_fast_model: str | None = Field(
        default=None,
        alias="NEMOTRON_FAST_MODEL",
    )
    contree_image: str = Field(default="tag:ubuntu:latest", alias="CONTREE_IMAGE")
    github_app_id: str | None = Field(default=None, alias="GITHUB_APP_ID")
    github_app_slug: str | None = Field(default=None, alias="GITHUB_APP_SLUG")
    github_installation_id: int | None = Field(default=None, alias="GITHUB_INSTALLATION_ID")
    github_app_private_key: SecretStr | None = Field(
        default=None,
        alias="GITHUB_APP_PRIVATE_KEY",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
