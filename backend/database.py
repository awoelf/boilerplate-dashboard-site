"""
Database layer.

Adding a new database
─────────────────────
1. Add its DATABASE_URL_<NAME> env var in config.py and .env.
2. Create a new engine + session factory below (follow the pattern).
3. Register it in DB_REGISTRY.
4. Reference it in the table registry (registry.py).
"""
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from config import settings


# ── Helpers ──────────────────────────────────────────────────────────────────

def _make_engine(url: str):
    kwargs = {}
    if url.startswith("sqlite"):
        kwargs["connect_args"] = {"check_same_thread": False}
    return create_engine(url, **kwargs)


def _make_session(engine):
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ── Base ─────────────────────────────────────────────────────────────────────

class Base(DeclarativeBase):
    pass


# ── Default / primary database ───────────────────────────────────────────────
default_engine = _make_engine(settings.DATABASE_URL)
DefaultSession = _make_session(default_engine)


def get_default_db() -> Generator:
    db = DefaultSession()
    try:
        yield db
    finally:
        db.close()


# ── Database registry ────────────────────────────────────────────────────────
# Maps a logical db name → (engine, session_factory, dependency_fn)
# Add new databases here.

DB_REGISTRY: dict = {
    "default": {
        "engine": default_engine,
        "session": DefaultSession,
        "dependency": get_default_db,
    },
    # Example – uncomment and fill in to add a second database:
    # "analytics": {
    #     "engine": _make_engine("sqlite:///./analytics.db"),
    #     "session": _make_session(_make_engine("sqlite:///./analytics.db")),
    #     "dependency": lambda: _yield_session(_make_session(...)),
    # },
}
