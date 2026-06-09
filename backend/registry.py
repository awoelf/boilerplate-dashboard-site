"""
Table registry.

This is the single source of truth for every table exposed by the API.

Adding a new table
──────────────────
1. Create (or import) the SQLAlchemy model.
2. Create a Pydantic schema for it.
3. Add an entry to TABLE_REGISTRY below.
4. That's it – routes, filtering, search, and pagination are automatic.

Adding a table from a different database
─────────────────────────────────────────
Set "db" to the key you registered in database.DB_REGISTRY.
"""
from typing import Any, Dict, List, Type

import models
import schemas
from database import DB_REGISTRY


# ── Column helpers ────────────────────────────────────────────────────────────

def _col_names(model) -> List[str]:
    return [c.key for c in model.__table__.columns]


# ── Registry ──────────────────────────────────────────────────────────────────
# Each entry:
#   model            – SQLAlchemy ORM class
#   schema           – Pydantic response schema
#   db               – key in DB_REGISTRY
#   searchable_cols  – columns to include in full-text ?search= queries
#   filterable_cols  – columns exposed as ?col=value query params
#   default_sort     – column name for default ORDER BY (ascending)

TABLE_REGISTRY: Dict[str, Dict[str, Any]] = {
    "categories": {
        "model": models.Category,
        "schema": schemas.CategorySchema,
        "db": "default",
        "searchable_cols": ["name", "slug", "description"],
        "filterable_cols": ["id", "name", "slug", "parent_id"],
        "default_sort": "id",
    },
    "customers": {
        "model": models.Customer,
        "schema": schemas.CustomerSchema,
        "db": "default",
        "searchable_cols": ["name", "email", "city", "country"],
        "filterable_cols": ["id", "name", "email", "city", "country", "country_code"],
        "default_sort": "id",
    },
    "products": {
        "model": models.Product,
        "schema": schemas.ProductSchema,
        "db": "default",
        "searchable_cols": ["name", "description", "sku"],
        "filterable_cols": ["id", "name", "sku", "category_id", "active"],
        "default_sort": "id",
    },
    "orders": {
        "model": models.Order,
        "schema": schemas.OrderSchema,
        "db": "default",
        "searchable_cols": ["status", "currency", "notes"],
        "filterable_cols": ["id", "customer_id", "status", "currency"],
        "default_sort": "id",
    },
    "order_items": {
        "model": models.OrderItem,
        "schema": schemas.OrderItemSchema,
        "db": "default",
        "searchable_cols": [],
        "filterable_cols": ["id", "order_id", "product_id"],
        "default_sort": "id",
    },
}


def get_table_entry(table_name: str) -> Dict[str, Any]:
    """Return registry entry or raise KeyError."""
    if table_name not in TABLE_REGISTRY:
        raise KeyError(f"Unknown table: '{table_name}'")
    return TABLE_REGISTRY[table_name]


def get_db_dependency(table_name: str):
    """Return the FastAPI dependency function for the table's database."""
    entry = get_table_entry(table_name)
    db_key = entry.get("db", "default")
    return DB_REGISTRY[db_key]["dependency"]
