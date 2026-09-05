from collections.abc import Awaitable, Callable

from revival_workers.spike_contracts import IntegrationSpikeJobResult, IntegrationSpikeRequest

SpikeHandler = Callable[[IntegrationSpikeRequest], Awaitable[IntegrationSpikeJobResult]]


class LocalJobAdapter:
    """Runs the same typed job contract locally that Serverless Jobs will invoke."""

    name = "local"

    async def run(
        self,
        request: IntegrationSpikeRequest,
        handler: SpikeHandler,
    ) -> IntegrationSpikeJobResult:
        return await handler(request)
