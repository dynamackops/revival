from functools import lru_cache
from typing import Annotated, Any, cast
from uuid import UUID

import jwt
from fastapi import Depends, Header, HTTPException, status
from jwt import PyJWKClient
from pydantic import BaseModel

from app.settings import settings

ALLOWED_SIGNING_ALGORITHMS = frozenset({"RS256", "ES256"})


class AuthenticatedUser(BaseModel):
    id: UUID
    role: str
    email: str | None = None


class JwtVerificationError(ValueError):
    """Raised when a bearer token cannot establish a Supabase user."""


class SupabaseJwtVerifier:
    def __init__(self, supabase_url: str, audience: str) -> None:
        normalized_url = supabase_url.rstrip("/")
        self.issuer = f"{normalized_url}/auth/v1"
        self.audience = audience
        self.jwks_client = PyJWKClient(
            f"{self.issuer}/.well-known/jwks.json",
            cache_jwk_set=True,
            cache_keys=True,
            lifespan=300,
        )

    def verify(self, token: str) -> AuthenticatedUser:
        try:
            header = jwt.get_unverified_header(token)
            algorithm = header.get("alg")
            if algorithm not in ALLOWED_SIGNING_ALGORITHMS:
                raise JwtVerificationError("Unsupported JWT signing algorithm")

            signing_key = self.jwks_client.get_signing_key_from_jwt(token)
            payload = cast(
                dict[str, Any],
                jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=[algorithm],
                    audience=self.audience,
                    issuer=self.issuer,
                    options={"require": ["exp", "iat", "sub", "role"]},
                ),
            )
        except JwtVerificationError:
            raise
        except jwt.PyJWTError as error:
            raise JwtVerificationError("Supabase JWT verification failed") from error

        if payload.get("role") != "authenticated":
            raise JwtVerificationError("JWT does not represent an authenticated user")

        try:
            user_id = UUID(str(payload["sub"]))
        except (KeyError, TypeError, ValueError) as error:
            raise JwtVerificationError("JWT subject is not a user UUID") from error

        email_value = payload.get("email")
        email = email_value if isinstance(email_value, str) else None
        return AuthenticatedUser(id=user_id, role="authenticated", email=email)


@lru_cache
def get_jwt_verifier() -> SupabaseJwtVerifier:
    if not settings.supabase_url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase authentication is not configured.",
        )
    return SupabaseJwtVerifier(settings.supabase_url, settings.supabase_expected_audience)


async def require_authenticated_user(
    verifier: Annotated[SupabaseJwtVerifier, Depends(get_jwt_verifier)],
    authorization: Annotated[str | None, Header()] = None,
) -> AuthenticatedUser:
    if not authorization:
        raise _unauthorized("Bearer token required")

    scheme, separator, token = authorization.partition(" ")
    if not separator or scheme.lower() != "bearer" or not token.strip():
        raise _unauthorized("Malformed bearer token")

    try:
        return verifier.verify(token.strip())
    except JwtVerificationError as error:
        raise _unauthorized("Invalid or expired bearer token") from error


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )
