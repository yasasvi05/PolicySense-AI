
from sqlalchemy import inspect, text
from app.config import settings
from app.db import Base
from app import models
from sqlalchemy import create_engine

sqlite_url = "sqlite:///./policysense.db"
sqlite_engine = create_engine(
    sqlite_url,
    connect_args={"check_same_thread": False},
)

try:
    inspector = inspect(sqlite_engine)
    print("SQLite record counts:")

    with sqlite_engine.connect() as connection:
        for table in inspector.get_table_names():
            count = connection.execute(
                text(f'SELECT COUNT(*) FROM "{table}"')
            ).scalar_one()
            print(f"{table}: {count}")
finally:
    sqlite_engine.dispose()
