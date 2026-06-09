"""
ORM models.

Adding a new table
──────────────────
1. Define the model class below (inherit from Base).
2. Register it in registry.py.
3. Run seed.py or let the app auto-create it on first start.
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean,
    DateTime, ForeignKey, Text, func,
)
from database import Base


# ── 1. Categories ─────────────────────────────────────────────────────────────
class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False, index=True)
    slug = Column(String(120), nullable=False, unique=True)
    description = Column(Text)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())


# ── 2. Customers ──────────────────────────────────────────────────────────────
class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    email = Column(String(254), unique=True, index=True)
    phone = Column(String(30))
    city = Column(String(100))
    country = Column(String(100))
    country_code = Column(String(3))
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())


# ── 3. Products ───────────────────────────────────────────────────────────────
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    sku = Column(String(60), unique=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    price = Column(Float, nullable=False, default=0.0)
    stock_qty = Column(Integer, default=0)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())


# ── 4. Orders ─────────────────────────────────────────────────────────────────
class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    status = Column(String(40), default="pending", index=True)  # pending/confirmed/shipped/delivered/cancelled
    total_amount = Column(Float, default=0.0)
    currency = Column(String(3), default="USD")
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ── 5. Order Items ────────────────────────────────────────────────────────────
class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())
