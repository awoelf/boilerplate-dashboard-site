"""
Entry point – run with:
  python main.py          (uses ENV from .env, default: dev)
  ENV=prod python main.py

Or via uvicorn directly:
  uvicorn main:app --host 0.0.0.0 --port 5000 --reload   (dev)
  uvicorn main:app --host 0.0.0.0 --port 5000            (prod)
"""
import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from database import Base, DB_REGISTRY
from routers import router

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if settings.is_dev else logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s – %(message)s",
)
log = logging.getLogger(__name__)


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables in every registered database on startup
    for db_key, db_info in DB_REGISTRY.items():
        Base.metadata.create_all(bind=db_info["engine"])
        log.info("DB '%s' ready – tables created / verified.", db_key)
    yield
    log.info("Shutting down.")


# ── App factory ───────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    docs_url = "/docs" if settings.SHOW_DOCS else None
    redoc_url = "/redoc" if settings.SHOW_DOCS else None

    app = FastAPI(
        title=settings.API_TITLE,
        description=settings.API_DESCRIPTION,
        version=settings.API_VERSION,
        docs_url=docs_url,
        redoc_url=redoc_url,
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "OPTIONS"],
        allow_headers=["*"],
    )

    # ── Global exception handler ──────────────────────────────────────────────
    @app.exception_handler(Exception)
    async def unhandled_exception(request: Request, exc: Exception):
        log.exception("Unhandled error: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error."},
        )

    # ── Health check (no auth) ────────────────────────────────────────────────
    @app.get("/health", tags=["system"], summary="Health check")
    def health():
        return {"status": "ok", "env": settings.ENV, "version": settings.API_VERSION}

    # ── Data routes ───────────────────────────────────────────────────────────
    app.include_router(router, prefix=settings.API_PREFIX)

    log.info(
        "Starting %s v%s [%s] on %s:%s  docs=%s",
        settings.API_TITLE,
        settings.API_VERSION,
        settings.ENV,
        settings.HOST,
        settings.PORT,
        settings.SHOW_DOCS,
    )
    return app


app = create_app()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.is_dev,
        log_level="debug" if settings.is_dev else "info",
    )
