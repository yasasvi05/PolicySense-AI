
"""Index synthetic banking policy documents into PolicySense AI."""

from pathlib import Path
from app import models

from app.db import SessionLocal
from app.rag.ingestion import ingest_file

POLICY_DIR = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "banking_policies"
    / "PolicySense_Unstructured_Policy_Dataset"
)


def main():
    if not POLICY_DIR.is_dir():
        raise FileNotFoundError(
            f"Banking policy directory not found: {POLICY_DIR}"
        )

    files = sorted(
        path
        for path in POLICY_DIR.glob("*.md")
        if path.name != "00_README_dataset_scope.md"
    )

    if not files:
        raise RuntimeError(
            f"No Markdown policy files found in {POLICY_DIR}"
        )

    db = SessionLocal()

    try:
        for path in files:
            existing = (
                db.query(__import__("app.models", fromlist=["Document"]).Document)
                .filter_by(filename=path.name, domain="banking")
                .first()
            )

            if existing:
                print(f"SKIPPED: {path.name} (already registered)")
                continue

            document = ingest_file(
                db=db,
                path=path,
                filename=path.name,
                policy_type="Banking",
                domain="banking",
            )

            print(
                f"{document.status}: {path.name} "
                f"({document.chunk_count} chunks) - "
                f"{document.detail or ''}"
            )

    finally:
        db.close()


if __name__ == "__main__":
    main()
