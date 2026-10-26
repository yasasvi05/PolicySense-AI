from sqlalchemy import text
from app.db import engine

tables = [
    "users",
    "customers",
    "policies",
    "payments",
    "claims",
    "documents",
    "query_logs",
    "bank_customers",
    "bank_accounts",
    "bank_transactions",
    "bank_cards",
    "bank_loans",
    "bank_complaints",
]

with engine.connect() as connection:
    for table in tables:
        count = connection.execute(
            text(f"SELECT COUNT(*) FROM {table}")
        ).scalar_one()

        print(f"{table}: {count} records")