#!/usr/bin/env python3
import argparse
import asyncio
import sys
from typing import NoReturn

from app.integrations.github_app import GitHubAppClient
from app.integrations.sandbox import ContreeSandboxClient
from app.integrations.token_factory import TokenFactoryClient
from app.settings import Settings
from revival_workers.local_adapter import LocalJobAdapter
from revival_workers.spike_contracts import IntegrationSpikeJobResult, IntegrationSpikeRequest


def fail(message: str) -> NoReturn:
    print(f"integration spike: {message}", file=sys.stderr)
    raise SystemExit(2)


def required(value: str | int | None, name: str) -> str:
    if value is None or str(value).strip() == "":
        fail(f"{name} is required")
    return str(value)


async def main() -> None:
    parser = argparse.ArgumentParser(
        description="Verify Revival's live Token Factory, Sandbox, and GitHub App path."
    )
    parser.add_argument("--pretty", action="store_true")
    args = parser.parse_args()
    settings = Settings()

    token = settings.nebius_token_factory_api_key
    private_key = settings.github_app_private_key
    request = IntegrationSpikeRequest(
        model_alias=required(settings.nemotron_reasoning_model, "NEMOTRON_REASONING_MODEL"),
        github_installation_id=int(
            required(settings.github_installation_id, "GITHUB_INSTALLATION_ID")
        ),
        sandbox_image=settings.contree_image,
    )
    if token is None:
        fail("NEBIUS_TOKEN_FACTORY_API_KEY is required")
    if private_key is None:
        fail("GITHUB_APP_PRIVATE_KEY is required")
    app_id = required(settings.github_app_id, "GITHUB_APP_ID")

    async def handler(job: IntegrationSpikeRequest) -> IntegrationSpikeJobResult:
        model_client = TokenFactoryClient(
            api_key=token.get_secret_value(),
            base_url=settings.nebius_token_factory_base_url,
        )
        github_client = GitHubAppClient(
            app_id=app_id,
            private_key=private_key.get_secret_value(),
        )
        model_result, github_result = await asyncio.gather(
            model_client.probe(job.model_alias),
            github_client.probe_repositories(job.github_installation_id),
        )
        sandbox_result = await asyncio.to_thread(
            ContreeSandboxClient(image=job.sandbox_image).probe
        )
        return IntegrationSpikeJobResult.completed(
            adapter=LocalJobAdapter.name,
            model=model_result.model_dump(),
            sandbox=sandbox_result.model_dump(),
            github=github_result.model_dump(),
        )

    result = await LocalJobAdapter().run(request, handler)
    print(result.model_dump_json(indent=2 if args.pretty else None))


if __name__ == "__main__":
    asyncio.run(main())
