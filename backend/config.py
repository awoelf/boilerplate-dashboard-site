"""
Application configuration via environment variables.
Supports dev and prod environments.
"""
from typing import List
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    # ── Environment ──────────────────────────────────────────────────────────
    ENV: str = "dev"                         # "dev" | "prod"

    # ── API identity ─────────────────────────────────────────────────────────
    API_TITLE: str = "Data API"
    API_DESCRIPTION: str = "Read-only data API with filtering and search capabilities."
    API_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # ── Security ─────────────────────────────────────────────────────────────
    API_PASSWORD: str = "changeme"           # single shared secret / API key

    # ── Database ─────────────────────────────────────────────────────────────
    # Default: local SQLite file.
    # On AWS set this to the absolute path of your SQLite file
    # e.g. DATABASE_URL=sqlite:////mnt/efs/data/app.db
    DATABASE_URL: str = "sqlite:///./app.db"

    # ── Server ───────────────────────────────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 5000

    # ── CORS ─────────────────────────────────────────────────────────────────
    # Comma-separated list of allowed origins, or "*" for dev
    CORS_ORIGINS: List[str] = ["*"]

    # ── Docs ─────────────────────────────────────────────────────────────────
    # Swagger / ReDoc are always enabled; set to False to hide in prod
    SHOW_DOCS: bool = True

    # ── Pagination ───────────────────────────────────────────────────────────
    DEFAULT_PAGE_SIZE: int = 100
    MAX_PAGE_SIZE: int = 1000

    @field_validator("ENV")
    @classmethod
    def validate_env(cls, v: str) -> str:
        if v not in ("dev", "prod"):
            raise ValueError("ENV must be 'dev' or 'prod'")
        return v

    @property
    def is_dev(self) -> bool:
        return self.ENV == "dev"

    @property
    def is_prod(self) -> bool:
        return self.ENV == "prod"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
