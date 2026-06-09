"""
API key authentication.

Clients must supply the key in one of:
  - Header:  X-API-Key: <key>
  - Query:   ?api_key=<key>
"""
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader, APIKeyQuery

from config import settings

_header_scheme = APIKeyHeader(name="X-API-Key", auto_error=False)
_query_scheme = APIKeyQuery(name="api_key", auto_error=False)


async def require_api_key(
    header_key: str = Security(_header_scheme),
    query_key: str = Security(_query_scheme),
) -> str:
    """
    FastAPI dependency that validates the API key.
    Attach to any router or individual route with:

        router = APIRouter(dependencies=[Depends(require_api_key)])
    """
    key = header_key or query_key
    if not key or key != settings.API_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key.",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    return key
