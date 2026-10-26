
import uuid
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from .. import models
from ..config import settings
from ..db import get_db
from ..rag import vectorstore
from ..rag.ingestion import ingest_file
from ..security import require_admin
from .customer import load_customer_data, row

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin)],
)

INSURANCE_POLICY_TYPES = {"Health", "Motor", "Life", "General"}
BANKING_POLICY_TYPES = {
    "Accounts", "Payments", "Cards", "Loans", "Disputes"
}
ALLOWED_EXT = {".pdf", ".txt"}


def doc_out(d: models.Document) -> dict:
    return {
        "id": d.id,
        "filename": d.filename,
        "policy_type": d.policy_type,
        "domain": d.domain,
        "uploaded_at": d.uploaded_at.isoformat(),
        "chunk_count": d.chunk_count,
        "status": d.status,
        "detail": d.detail,
    }


@router.get("/documents")
def list_documents(db: Session = Depends(get_db)):
    documents = db.execute(
        select(models.Document).order_by(models.Document.uploaded_at.desc())
    ).scalars()

    return [doc_out(d) for d in documents]


@router.post("/documents/upload")
def upload_document(
    file: UploadFile = File(...),
    policy_type: str = Form("General"),
    domain: str = Form("insurance"),
    db: Session = Depends(get_db),
):
    if domain not in {"banking", "insurance"}:
        raise HTTPException(
            status_code=400,
            detail="domain must be 'banking' or 'insurance'",
        )

    allowed_types = (
        BANKING_POLICY_TYPES
        if domain == "banking"
        else INSURANCE_POLICY_TYPES
    )

    if policy_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid {domain} document category. "
                f"Allowed categories: {sorted(allowed_types)}"
            ),
        )

    name = Path(file.filename or "").name

    if Path(name).suffix.lower() not in ALLOWED_EXT:
        raise HTTPException(
            status_code=400,
            detail="Only PDF or TXT files are supported",
        )

    data = file.file.read(settings.max_upload_mb * 1024 * 1024 + 1)

    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds {settings.max_upload_mb} MB",
        )

    if not data:
        raise HTTPException(status_code=400, detail="File is empty")

    folder = Path(settings.upload_dir)
    folder.mkdir(parents=True, exist_ok=True)

    stored = folder / f"{uuid.uuid4().hex}_{name}"
    stored.write_bytes(data)

    try:
        doc = ingest_file(
            db,
            stored,
            name,
            policy_type,
            domain=domain,
        )
    except Exception:
        stored.unlink(missing_ok=True)
        raise

    indexed = doc.status == "Indexed"
    ok = doc.status in {"Indexed", "Chunked"}

    steps = [
        ("Upload document", True),
        ("Extract text", ok),
        ("Chunk document", ok),
        ("Generate embeddings", indexed),
        ("Store in ChromaDB", indexed),
        ("Ready for retrieval", ok),
    ]

    return {
        **doc_out(doc),
        "steps": [
            {"name": step_name, "done": done}
            for step_name, done in steps
        ],
    }


@router.delete("/documents/{doc_id}", status_code=204)
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.get(models.Document, doc_id)

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    vectorstore.delete_document(doc_id)

    db.execute(
        delete(models.DocumentChunk).where(
            models.DocumentChunk.document_id == doc_id
        )
    )

    if doc.stored_path and Path(doc.stored_path).parent == Path(settings.upload_dir):
        Path(doc.stored_path).unlink(missing_ok=True)

    db.delete(doc)
    db.commit()


@router.get("/customers")
def list_customers(db: Session = Depends(get_db)):
    out = []

    customers = db.execute(
        select(models.Customer).order_by(models.Customer.customer_id)
    ).scalars()

    for customer in customers:
        policies = db.execute(
            select(models.Policy).where(
                models.Policy.customer_id == customer.customer_id
            )
        ).scalars().all()

        statuses = {
            status
            for (status,) in db.execute(
                select(models.Renewal.renewal_status).where(
                    models.Renewal.customer_id == customer.customer_id
                )
            )
        }

        renewal = (
            "Pending"
            if "Pending" in statuses
            else "Overdue"
            if "Overdue" in statuses
            else "Up to date"
        )

        out.append({
            "customer_id": customer.customer_id,
            "full_name": customer.full_name,
            "email": customer.email,
            "city": customer.city,
            "kyc_status": customer.kyc_status,
            "active_policies": sum(
                policy.policy_status == "Active"
                for policy in policies
            ),
            "renewal_status": renewal,
            "domain": "insurance",
        })

    return out


@router.get("/customers/{customer_id}")
def customer_detail(customer_id: str, db: Session = Depends(get_db)):
    customer = db.get(models.Customer, customer_id)

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    return {
        "customer": row(customer),
        **load_customer_data(db, customer_id),
    }


@router.get("/analytics")
def analytics(db: Session = Depends(get_db)):
    def count_by(column):
        return [
            {"name": name, "value": count}
            for name, count in db.execute(
                select(column, func.count()).group_by(column)
            ).all()
        ]

    today = datetime.utcnow().replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )

    logs = db.execute(select(models.QueryLog)).scalars().all()
    intents = Counter(log.intent for log in logs)
    total = sum(intents.values()) or 1

    labels = {
        "penalty": "Penalty Queries",
        "renewal": "Renewal Queries",
        "claim": "Claim Queries",
        "coverage": "Policy Information",
        "general": "Other",
    }

    days = [
        today - timedelta(days=i)
        for i in range(6, -1, -1)
    ]

    return {
        "cards": {
            "total_customers": db.scalar(
                select(func.count()).select_from(models.Customer)
            ),
            "active_policies": db.scalar(
                select(func.count()).select_from(models.Policy).where(
                    models.Policy.policy_status == "Active"
                )
            ),
            "pending_renewals": db.scalar(
                select(func.count()).select_from(models.Renewal).where(
                    models.Renewal.renewal_status == "Pending"
                )
            ),
            "total_claims": db.scalar(
                select(func.count()).select_from(models.Claim)
            ),
            "documents_indexed": db.scalar(
                select(func.count()).select_from(models.Document).where(
                    models.Document.status == "Indexed"
                )
            ),
            "ai_queries_today": sum(
                log.created_at >= today for log in logs
            ),
        },
        "policy_distribution": count_by(models.Policy.policy_type),
        "renewal_status": count_by(models.Renewal.renewal_status),
        "claims_status": count_by(models.Claim.claim_status),
        "customer_queries": [
            {
                "day": day.strftime("%a"),
                "queries": sum(
                    day <= log.created_at < day + timedelta(days=1)
                    for log in logs
                ),
            }
            for day in days
        ],
        "query_insights": [
            {
                "name": labels.get(intent, intent.title()),
                "value": round(count * 100 / total),
            }
            for intent, count in intents.most_common()
        ],
        "top_queries": [
            {"name": query, "value": count}
            for query, count in Counter(
                log.query for log in logs
            ).most_common(5)
        ],
        "ai_usage": [
            {"name": mode or "n/a", "value": count}
            for mode, count in Counter(
                log.generation for log in logs
            ).items()
        ],
        # Demo values only; replace with real historical aggregation later.
        "renewal_trends": [
            {"month": month, "renewed": renewed, "lapsed": lapsed}
            for month, renewed, lapsed in [
                ("May", 62, 8),
                ("Jun", 70, 6),
                ("Jul", 74, 9),
                ("Aug", 81, 5),
                ("Sep", 88, 7),
                ("Oct", 93, 4),
            ]
        ],
    }
