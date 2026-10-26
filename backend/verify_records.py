
import sqlite3

connection = sqlite3.connect("policysense.db")

tables = [
    "customers", "policies", "payments", "claims", "renewals",
    "bank_customers", "bank_accounts", "bank_transactions",
    "bank_cards", "bank_loans", "bank_complaints", "users",
    "documents", "document_chunks", "query_logs",
]

for table in tables:
    count = connection.execute(
        f'SELECT COUNT(*) FROM "{table}"'
    ).fetchone()[0]
    print(f"{table}: {count}")

connection.close()
