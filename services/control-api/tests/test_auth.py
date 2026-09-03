from collections.abc import Iterator
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from app.auth.supabase import (
    AuthenticatedUser,
    JwtVerificationError,
    get_jwt_verifier,
)
from app.main import app


class FakeVerifier:
    def verify(self, token: str) -> AuthenticatedUser:
        if token != "valid-test-token":
            raise JwtVerificationError("test rejection")
        return AuthenticatedUser(
            id=UUID("11111111-1111-4111-8111-111111111111"),
            role="authenticated",
            email="creator@example.test",
        )


@pytest.fixture
def client() -> Iterator[TestClient]:
    app.dependency_overrides[get_jwt_verifier] = FakeVerifier
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_me_requires_a_bearer_token(client: TestClient) -> None:
    response = client.get("/v1/auth/me")

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_me_rejects_an_invalid_token(client: TestClient) -> None:
    response = client.get(
        "/v1/auth/me",
        headers={"Authorization": "Bearer invalid-test-token"},
    )

    assert response.status_code == 401


def test_me_returns_the_verified_supabase_identity(client: TestClient) -> None:
    response = client.get(
        "/v1/auth/me",
        headers={"Authorization": "Bearer valid-test-token"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "id": "11111111-1111-4111-8111-111111111111",
        "role": "authenticated",
        "email": "creator@example.test",
    }
