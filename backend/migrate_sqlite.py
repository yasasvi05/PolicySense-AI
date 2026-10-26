
"""Safely add PolicySense banking schema to the existing SQLite database."""

from sqlalchemy import inspect, text

from app.db import Base, engine
from app import models  # Ensures all models are registered


def migrate():
    if engine.url.get_backend_name() != "sqlite":
        raise RuntimeError(
            "This migration is only for SQLite. "
            "Check DATABASE_URL before continuing."
        )

    additions = {
        "users": {
            "domain": "VARCHAR(20) NOT NULL DEFAULT 'insurance'",
            "bank_customer_id": (
                "VARCHAR(20) REFERENCES bank_customers(customer_id)"
            ),
        },
        "query_logs": {
            "user_id": "INTEGER REFERENCES users(id)",
            "domain": "VARCHAR(20) NOT NULL DEFAULT 'insurance'",
        },
        "documents": {
            "domain": "VARCHAR(20) NOT NULL DEFAULT 'insurance'",
        },
    }

    with engine.begin() as connection:
        inspector = inspect(connection)
        existing_tables = set(inspector.get_table_names())

        required_tables = {"users", "query_logs", "documents"}
        missing = required_tables - existing_tables

        if missing:
            raise RuntimeError(
                f"Expected existing tables are missing: {sorted(missing)}"
            )

        for table, columns in additions.items():
            existing_columns = {
                column["name"]
                for column in inspect(connection).get_columns(table)
            }

            for column, definition in columns.items():
                if column not in existing_columns:
                    connection.execute(
                        text(
                            f'ALTER TABLE "{table}" '
                            f'ADD COLUMN "{column}" {definition}'
                        )
                    )
                    print(f"Added {table}.{column}")
                else:
                    print(f"Already exists: {table}.{column}")

    # Create missing tables and indexes after adding columns.
    # Existing tables and their records are not dropped.
    Base.metadata.create_all(engine)

    print("\nMigration finished. Verifying schema...")

    inspector = inspect(engine)
    for table in (
        "users",
        "query_logs",
        "documents",
        "bank_customers",
        "bank_accounts",
        "bank_transactions",
        "bank_cards",
        "bank_loans",
        "bank_complaints",
    ):
        if inspector.has_table(table):
            columns = [
                column["name"]
                for column in inspector.get_columns(table)
            ]
            print(f"{table}: {', '.join(columns)}")
        else:
            print(f"WARNING: Missing table {table}")

    print("\nNo existing tables were intentionally deleted.")


if __name__ == "__main__":
    migrate()
