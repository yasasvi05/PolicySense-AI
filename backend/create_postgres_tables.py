
from sqlalchemy import inspect
from app.db import engine, Base
from app import models

try:
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    tables = inspector.get_table_names()

    print("PostgreSQL connection successful!")
    print(f"Tables created or already present: {len(tables)}")

    for table in tables:
        print("-", table)

except Exception as exc:
    print("Could not create PostgreSQL tables.")
    print(f"Error: {exc}")
    raise
