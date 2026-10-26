
"""Document ingestion: extract text -> chunk -> store chunks in SQL -> embed + index in ChromaDB."""

import logging
from pathlib import Path

from sqlalchemy.orm import Session

from .. import models
from . import vectorstore
from .chunking import chunk_text

log = logging.getLogger("policysense.ingestion")


def extract_text(path: Path) -> str:
    if path.suffix.lower() == ".pdf":
        import fitz  # PyMuPDF

        with fitz.open(path) as pdf:
            return "\n".join(page.get_text() for page in pdf)

    return path.read_text(encoding="utf-8", errors="ignore")


def ingest_file(
    db: Session,
    path: Path,
    filename: str,
    policy_type: str,
    domain: str = "insurance",
) -> models.Document:
    if domain not in {"banking", "insurance"}:
        raise ValueError("domain must be 'banking' or 'insurance'")

    doc = models.Document(
        filename=filename,
        policy_type=policy_type,
        domain=domain,
        status="Processing",
        stored_path=str(path),
    )

    db.add(doc)
    db.commit()

    try:
        chunks = chunk_text(extract_text(path))

        if not chunks:
            raise ValueError(
                "No extractable text found (scanned PDFs need OCR)."
            )

        for i, c in enumerate(chunks):
            db.add(
                models.DocumentChunk(
                    document_id=doc.id,
                    chunk_index=i,
                    section=c["section"],
                    title=c["title"],
                    text=c["text"],
                )
            )

        doc.chunk_count = len(chunks)
        doc.status = "Chunked"
        doc.detail = "Chunks stored in SQL. Vector index not built."
        db.commit()

        if vectorstore.available():
            try:
                vectorstore.index_chunks(
                    doc.id,
                    filename,
                    policy_type,
                    chunks,
                    domain=domain,
                )
                doc.status = "Indexed"
                doc.detail = (
                    "Embedded with Sentence Transformers and stored in ChromaDB."
                )
            except Exception as exc:
                doc.detail = (
                    f"Chunked, but embedding/indexing failed: {exc}"
                )
        else:
            doc.detail = (
                "Chunked. Install requirements-ai.txt to enable "
                "embeddings + ChromaDB."
            )

    except ImportError as exc:
        doc.status = "Failed"
        doc.detail = (
            f"Missing dependency: {exc.name}. "
            "Run: pip install -r requirements-ai.txt"
        )

    except Exception as exc:
        log.exception("Ingestion failed")
        doc.status = "Failed"
        doc.detail = str(exc)

    db.commit()
    return doc
