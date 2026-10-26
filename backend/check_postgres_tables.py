
import getpass
import psycopg2

password = getpass.getpass("PostgreSQL password: ")

conn = psycopg2.connect(
    host="localhost",
    port=5432,
    dbname="policysense",
    user="postgres",
    password=password,
)

try:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT tablename FROM pg_tables "
            "WHERE schemaname = %s ORDER BY tablename",
            ("public",),
        )
        tables = cur.fetchall()

        if tables:
            print("\nExisting PostgreSQL tables:")
            for (table,) in tables:
                print("-", table)
        else:
            print("No tables found in the public schema.")
finally:
    conn.close()
