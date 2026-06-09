"""
Seed the database with realistic sample data.

Usage:
  python seed.py           # populates all tables
  python seed.py --clear   # drops and re-creates everything first
"""
import argparse
import random
from datetime import datetime, timedelta

from database import Base, DB_REGISTRY, default_engine
from models import Category, Customer, Order, OrderItem, Product

# ── Sample data ───────────────────────────────────────────────────────────────

CATEGORIES = [
    ("Electronics", "electronics", "Gadgets and devices"),
    ("Clothing", "clothing", "Apparel and accessories"),
    ("Books", "books", "Print and digital books"),
    ("Home & Garden", "home-garden", "Furniture, decor, tools"),
    ("Sports", "sports", "Sporting goods and fitness"),
]

CUSTOMERS = [
    ("Alice Johnson", "alice@example.com", "+1-555-0101", "New York", "United States", "US"),
    ("Bob Smith", "bob@example.com", "+1-555-0102", "Los Angeles", "United States", "US"),
    ("Clara Müller", "clara@example.de", "+49-30-1234", "Berlin", "Germany", "DE"),
    ("David Okafor", "david@example.ng", "+234-1-000", "Lagos", "Nigeria", "NG"),
    ("Emilia Rossi", "emilia@example.it", "+39-06-5678", "Rome", "Italy", "IT"),
    ("Frank Tanaka", "frank@example.jp", "+81-3-1111", "Tokyo", "Japan", "JP"),
    ("Grace Kim", "grace@example.kr", "+82-2-2222", "Seoul", "South Korea", "KR"),
    ("Hector Garcia", "hector@example.mx", "+52-55-3333", "Mexico City", "Mexico", "MX"),
    ("Iris Dupont", "iris@example.fr", "+33-1-4444", "Paris", "France", "FR"),
    ("James Chen", "james@example.cn", "+86-10-5555", "Shanghai", "China", "CN"),
]

PRODUCTS = [
    # name, sku, cat_index, price, stock
    ("Wireless Earbuds Pro", "SKU-ELEC-001", 0, 89.99, 150),
    ("4K Smart TV 55\"", "SKU-ELEC-002", 0, 649.00, 40),
    ("USB-C Charging Hub", "SKU-ELEC-003", 0, 34.99, 300),
    ("Running Shoes – M", "SKU-CLTH-001", 1, 79.95, 200),
    ("Yoga Mat", "SKU-SPRT-001", 4, 29.99, 180),
    ("Python for Beginners", "SKU-BOOK-001", 2, 24.99, 500),
    ("The Art of Design", "SKU-BOOK-002", 2, 39.99, 220),
    ("Garden Hose 50ft", "SKU-HOME-001", 3, 44.50, 90),
    ("Standing Desk Converter", "SKU-HOME-002", 3, 149.00, 60),
    ("Resistance Bands Set", "SKU-SPRT-002", 4, 19.99, 400),
]

STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"]


def seed(clear: bool = False):
    engine = DB_REGISTRY["default"]["engine"]
    SessionFactory = DB_REGISTRY["default"]["session"]

    if clear:
        Base.metadata.drop_all(bind=engine)
        print("Dropped all tables.")

    Base.metadata.create_all(bind=engine)
    print("Tables created / verified.")

    with SessionFactory() as db:
        # Skip if already seeded
        if not clear and db.query(Category).count() > 0:
            print("Database already seeded. Use --clear to reseed.")
            return

        # Categories
        cats = []
        for name, slug, desc in CATEGORIES:
            c = Category(name=name, slug=slug, description=desc)
            db.add(c)
            cats.append(c)
        db.flush()

        # Customers
        customers = []
        for name, email, phone, city, country, cc in CUSTOMERS:
            c = Customer(name=name, email=email, phone=phone,
                         city=city, country=country, country_code=cc)
            db.add(c)
            customers.append(c)
        db.flush()

        # Products
        products = []
        for name, sku, cat_idx, price, stock in PRODUCTS:
            p = Product(
                name=name, sku=sku, price=price, stock_qty=stock,
                category_id=cats[cat_idx].id, active=True,
            )
            db.add(p)
            products.append(p)
        db.flush()

        # Orders + OrderItems
        base_date = datetime.utcnow() - timedelta(days=90)
        for i in range(50):
            customer = random.choice(customers)
            status = random.choice(STATUSES)
            created = base_date + timedelta(days=random.randint(0, 90))
            order = Order(
                customer_id=customer.id,
                status=status,
                currency="USD",
                created_at=created,
                updated_at=created,
            )
            db.add(order)
            db.flush()

            total = 0.0
            for _ in range(random.randint(1, 4)):
                product = random.choice(products)
                qty = random.randint(1, 5)
                subtotal = round(product.price * qty, 2)
                total += subtotal
                item = OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    quantity=qty,
                    unit_price=product.price,
                    subtotal=subtotal,
                    created_at=created,
                )
                db.add(item)

            order.total_amount = round(total, 2)

        db.commit()
        print("Seeded: categories, customers, products, orders, order_items.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--clear", action="store_true", help="Drop all tables before seeding")
    args = parser.parse_args()
    seed(clear=args.clear)
