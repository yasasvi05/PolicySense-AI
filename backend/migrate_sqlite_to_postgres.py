
from pathlib import Path

from sqlalchemy import create_engine, select, func, text

from app.config import settings
from app.db import Base
from app import models  # Registers all models with Base.metadata


SQLITE_PATH = Path(__file__).resolve().parent / "policysense.db"
SQLITE_URL = f"sqlite:///{SQLITE_PATH.as_posix()}"


def main():
    if not SQLITE_PATH.exists():
        raise FileNotFoundError(f"SQLite database not found: {SQLITE_PATH}")

    if not settings.database_url.startswith(
        ("postgresql://", "postgresql+psycopg2://")
    ):
        raise RuntimeError(
            "DATABASE_URL in backend/.env must point to PostgreSQL."
        )

    source_engine = create_engine(
        SQLITE_URL,
        connect_args={"check_same_thread": False},
    )
    target_engine = create_engine(settings.database_url, pool_pre_ping=True)

    try:
        # Ensure the destination has the expected schema.
        missing = set(Base.metadata.tables) - set(
            __import__("sqlalchemy").inspect(target_engine).get_table_names()
        )
        if missing:
            raise RuntimeError(
                f"PostgreSQL is missing tables: {sorted(missing)}. "
                "Do not continue until the schema is created."
            )

        tables = list(Base.metadata.sorted_tables)

        # Safety check: never merge into a non-empty PostgreSQL database.
        with target_engine.connect() as target:
            nonempty = []
            for table in tables:
                count = target.execute(
                    select(func.count()).select_from(table)
                ).scalar_one()
                if count:
                    nonempty.append(f"{table.name}={count}")

        if nonempty:
            raise RuntimeError(
                "Migration stopped because PostgreSQL already contains data: "
                + ", ".join(nonempty)
                + ". No records were copied."
            )

        copied_counts = {}

        # Copy parent tables before child tables to preserve foreign keys.
        with source_engine.connect() as source, target_engine.begin() as target:
            for table in tables:
                rows = source.execute(select(table)).mappings().all()

                if rows:
                    for start in range(0, len(rows), 500):
                        batch = [dict(row) for row in rows[start:start + 500]]
                        target.execute(table.insert(), batch)

                copied_counts[table.name] = len(rows)
                print(f"Copied {table.name}: {len(rows)} records")

        # Reset PostgreSQL sequences after inserting explicit primary keys.
        with target_engine.begin() as target:
            for table in tables:
                for column in table.primary_key.columns:
                    if column.autoincrement is False:
                        continue
                    if not str(column.type).upper().startswith("INTEGER"):
                        continue

                    max_id = target.execute(
                        select(func.max(column))
                    ).scalar_one_or_none()

                    if max_id is None:
                        continue

                    sequence = target.execute(
                        text(
                            "SELECT pg_get_serial_sequence(:table_name, :column_name)"
                        ),
                        {
                            "table_name": f"public.{table.name}",
                            "column_name": column.name,
                        },
                    ).scalar_one_or_none()

                    if sequence:
                        target.execute(
                            text(
                                "SELECT setval("
                                "CAST(:sequence AS regclass), :max_id, true)"
                            ),
                            {"sequence": sequence, "max_id": max_id},
                        )

        # Verify every copied table against PostgreSQL.
        print("\nVerification:")
        with source_engine.connect() as source, target_engine.connect() as target:
            all_match = True
            for table in tables:
                source_count = source.execute(
                    select(func.count()).select_from(table)
                ).scalar_one()
                target_count = target.execute(
                    select(func.count()).select_from(table)
                ).scalar_one()

                status = "OK" if source_count == target_count else "MISMATCH"
                print(
                    f"{table.name}: SQLite={source_count}, "
                    f"PostgreSQL={target_count} [{status}]"
                )
                if source_count != target_count:
                    all_match = False

        if not all_match:
            raise RuntimeError(
                "Some record counts do not match. Review the output."
            )

        print("\nMigration completed. All table counts match.")

    finally:
        source_engine.dispose()
        target_engine.dispose()


if __name__ == "__main__":
    main()
