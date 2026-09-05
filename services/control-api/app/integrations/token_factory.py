from time import monotonic
from typing import Any

import httpx
from pydantic import BaseModel, Field, ValidationError


class TokenFactoryProbeError(RuntimeError):
    """Raised when Token Factory cannot return a validated completion."""


class TokenFactoryProbeResult(BaseModel):
    provider: str = "Nebius Token Factory"
    model: str
    response_id: str
    content: str = Field(min_length=1)
    latency_ms: int = Field(ge=0)
    prompt_tokens: int | None = Field(default=None, ge=0)
    completion_tokens: int | None = Field(default=None, ge=0)


class _Message(BaseModel):
    content: str = Field(min_length=1)


class _Choice(BaseModel):
    message: _Message


class _Usage(BaseModel):
    prompt_tokens: int | None = None
    completion_tokens: int | None = None


class _ChatCompletion(BaseModel):
    id: str
    model: str | None = None
    choices: list[_Choice] = Field(min_length=1)
    usage: _Usage | None = None


class TokenFactoryClient:
    def __init__(
        self,
        *,
        api_key: str,
        base_url: str,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
        self._client = client

    async def probe(self, model: str) -> TokenFactoryProbeResult:
        started = monotonic()
        payload: dict[str, Any] = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are the model-verification probe for Revival, a digital archaeology "
                        "lab for paused software projects. Reply with one short sentence "
                        "confirming that you can distinguish repository evidence from inference."
                    ),
                },
                {"role": "user", "content": "Confirm the evidence boundary."},
            ],
            "temperature": 0,
            "max_tokens": 80,
        }
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        try:
            if self._client is not None:
                response = await self._client.post(
                    f"{self._base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                )
            else:
                async with httpx.AsyncClient(timeout=60) as client:
                    response = await client.post(
                        f"{self._base_url}/chat/completions",
                        headers=headers,
                        json=payload,
                    )
            response.raise_for_status()
            completion = _ChatCompletion.model_validate(response.json())
        except (httpx.HTTPError, ValidationError, ValueError, KeyError) as error:
            raise TokenFactoryProbeError("Token Factory probe failed validation") from error

        usage = completion.usage
        return TokenFactoryProbeResult(
            model=model,
            response_id=completion.id,
            content=completion.choices[0].message.content,
            latency_ms=round((monotonic() - started) * 1000),
            prompt_tokens=usage.prompt_tokens if usage else None,
            completion_tokens=usage.completion_tokens if usage else None,
        )
