from functools import lru_cache

from pydantic import Field
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
    nemotron_reasoning_model: str | None = Field(
        default=None,
        alias="NEMOTRON_REASONING_MODEL",
    )
    nemotron_fast_model: str | None = Field(
        default=None,
        alias="NEMOTRON_FAST_MODEL",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
