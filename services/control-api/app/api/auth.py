from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth.supabase import AuthenticatedUser, require_authenticated_user

router = APIRouter(prefix="/v1/auth", tags=["auth"])


@router.get("/me", response_model=AuthenticatedUser)
async def current_user(
    user: Annotated[AuthenticatedUser, Depends(require_authenticated_user)],
) -> AuthenticatedUser:
    return user
