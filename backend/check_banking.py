
from sqlalchemy import text
from app.db import engine

with engine.connect() as connection:
    documents = connection.execute(
        text("SELECT COUNT(*) FROM documents WHERE domain = 'banking'")
    ).scalar_one()

    chunks = connection.execute(
        text(
            "SELECT COUNT(*) FROM document_chunks d "
            "JOIN documents f ON d.document_id = f.id "
            "WHERE f.domain = 'banking'"
        )
    ).scalar_one()

    print("Banking documents:", documents)
    print("Banking chunks:", chunks)
