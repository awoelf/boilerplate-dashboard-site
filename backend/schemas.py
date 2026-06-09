"""
Pydantic response schemas.
One schema per model, plus shared paginated response wrapper.
"""
from __future__ import annotations
from datetime import datetime
from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, ConfigDict


# ── Generic paginated wrapper ─────────────────────────────────────────────────
T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    total: int
    page: int
    page_size: int
    pages: int
    items: List[T]


# ── Category ──────────────────────────────────────────────────────────────────
class CategorySchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: Optional[str] = None
    parent_id: Optional[int] = None
    created_at: Optional[datetime] = None


# ── Customer ──────────────────────────────────────────────────────────────────
class CustomerSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    country_code: Optional[str] = None
    created_at: Optional[datetime] = None


# ── Product ───────────────────────────────────────────────────────────────────
class ProductSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str] = None
    sku: Optional[str] = None
    category_id: Optional[int] = None
    price: float
    stock_qty: int
    active: bool
    created_at: Optional[datetime] = None


# ── Order ─────────────────────────────────────────────────────────────────────
class OrderSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: Optional[int] = None
    status: str
    total_amount: float
    currency: str
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ── Order Item ────────────────────────────────────────────────────────────────
class OrderItemSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int
    product_id: Optional[int] = None
    quantity: int
    unit_price: float
    subtotal: float
    created_at: Optional[datetime] = None


# ── Table meta (returned by /api/tables) ─────────────────────────────────────
class TableMeta(BaseModel):
    name: str
    db: str
    row_count: int
    columns: List[str]
    searchable_columns: List[str]
