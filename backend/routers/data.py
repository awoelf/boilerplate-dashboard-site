"""
Data router – read-only endpoints for every registered table.

Endpoints
─────────
GET  /api/tables                    → list all tables + metadata
GET  /api/{table}                   → paginated rows (all data)
GET  /api/{table}/search            → full-text search across searchable columns
GET  /api/{table}/{id}              → single row by primary key
"""
from __future__ import annotations

import math
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import String, cast, or_, func
from sqlalchemy.orm import Session

from auth import require_api_key
from config import settings
from database import DB_REGISTRY
from registry import TABLE_REGISTRY, get_table_entry
from schemas import Page, TableMeta

router = APIRouter(
    prefix="",
    tags=["data"],
    dependencies=[Depends(require_api_key)],
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_session(table_name: str) -> Session:
    """Not used directly – sessions are injected per-request."""
    ...


def _paginate(query, page: int, page_size: int):
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    pages = math.ceil(total / page_size) if page_size else 1
    return total, pages, items


def _build_filter_query(db: Session, entry: dict, filters: Dict[str, Any]):
    """Apply exact-match filters for filterable_cols."""
    model = entry["model"]
    q = db.query(model)
    for col_name, value in filters.items():
        if col_name in entry["filterable_cols"] and value is not None:
            col = getattr(model, col_name, None)
            if col is not None:
                q = q.filter(col == value)
    sort_col = getattr(model, entry.get("default_sort", "id"), model.__table__.columns[0])
    return q.order_by(sort_col)


def _build_search_query(db: Session, entry: dict, search: str):
    """Case-insensitive LIKE search across searchable_cols."""
    model = entry["model"]
    q = db.query(model)
    searchable = entry.get("searchable_cols", [])
    if search and searchable:
        term = f"%{search.lower()}%"
        conditions = [
            func.lower(cast(getattr(model, col), String)).like(term)
            for col in searchable
            if hasattr(model, col)
        ]
        if conditions:
            q = q.filter(or_(*conditions))
    sort_col = getattr(model, entry.get("default_sort", "id"), model.__table__.columns[0])
    return q.order_by(sort_col)


# ── /api/tables ───────────────────────────────────────────────────────────────

@router.get(
    "/tables",
    response_model=List[TableMeta],
    summary="List available tables",
    description="Returns metadata for every registered table including column names and row count.",
)
def list_tables():
    result: List[TableMeta] = []
    for name, entry in TABLE_REGISTRY.items():
        db_key = entry.get("db", "default")
        engine = DB_REGISTRY[db_key]["engine"]
        SessionFactory = DB_REGISTRY[db_key]["session"]
        with SessionFactory() as db:
            count = db.query(func.count()).select_from(entry["model"]).scalar()
        result.append(
            TableMeta(
                name=name,
                db=db_key,
                row_count=count or 0,
                columns=[c.key for c in entry["model"].__table__.columns],
                searchable_columns=entry.get("searchable_cols", []),
            )
        )
    return result


# ── /api/{table} ──────────────────────────────────────────────────────────────

@router.get(
    "/{table}",
    summary="Get all rows from a table",
    description=(
        "Returns paginated rows. Optional exact-match filters can be appended as query params "
        "matching the table's `filterable_cols` (e.g. `?status=pending&currency=USD`)."
    ),
)
def get_table(
    table: str,
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(
        settings.DEFAULT_PAGE_SIZE,
        ge=1,
        le=settings.MAX_PAGE_SIZE,
        description="Rows per page",
    ),
    request: Request = None,
):
    try:
        entry = get_table_entry(table)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Table '{table}' not found.")

    db_key = entry.get("db", "default")
    SessionFactory = DB_REGISTRY[db_key]["session"]

    # Collect filterable params from the request query string
    filters: Dict[str, Any] = {}
    if request:
        for k, v in request.query_params.items():
            if k in entry.get("filterable_cols", []):
                filters[k] = v

    with SessionFactory() as db:
        q = _build_filter_query(db, entry, filters)
        total, pages, items = _paginate(q, page, page_size)
        schema = entry["schema"]
        serialized = [schema.model_validate(row).model_dump() for row in items]

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
        "items": serialized,
    }


# ── /api/{table}/search ───────────────────────────────────────────────────────

@router.get(
    "/{table}/search",
    summary="Search / filter a table",
    description=(
        "Full-text search across the table's `searchable_cols` using `?q=<term>`. "
        "Combine with exact-match column filters (e.g. `?q=london&country=GB`)."
    ),
)
def search_table(
    table: str,
    q: Optional[str] = Query(None, description="Free-text search term"),
    page: int = Query(1, ge=1),
    page_size: int = Query(
        settings.DEFAULT_PAGE_SIZE,
        ge=1,
        le=settings.MAX_PAGE_SIZE,
    ),
    request: Request = None,
):
    try:
        entry = get_table_entry(table)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Table '{table}' not found.")

    db_key = entry.get("db", "default")
    SessionFactory = DB_REGISTRY[db_key]["session"]

    filters: Dict[str, Any] = {}
    if request:
        for k, v in request.query_params.items():
            if k in entry.get("filterable_cols", []) and k != "q":
                filters[k] = v

    with SessionFactory() as db:
        query = _build_search_query(db, entry, q or "")
        # Apply additional exact-match filters on top of search
        if filters:
            model = entry["model"]
            for col_name, value in filters.items():
                col = getattr(model, col_name, None)
                if col is not None:
                    query = query.filter(col == value)
        total, pages, items = _paginate(query, page, page_size)
        schema = entry["schema"]
        serialized = [schema.model_validate(row).model_dump() for row in items]

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
        "items": serialized,
    }


# ── /api/{table}/{id} ─────────────────────────────────────────────────────────

@router.get(
    "/{table}/{id}",
    summary="Get a single row by ID",
)
def get_row(table: str, id: int):
    try:
        entry = get_table_entry(table)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Table '{table}' not found.")

    db_key = entry.get("db", "default")
    SessionFactory = DB_REGISTRY[db_key]["session"]
    model = entry["model"]
    schema = entry["schema"]

    with SessionFactory() as db:
        row = db.get(model, id)

    if row is None:
        raise HTTPException(status_code=404, detail=f"Row {id} not found in '{table}'.")

    return schema.model_validate(row).model_dump()
