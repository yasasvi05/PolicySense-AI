
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db
from ..rag.pipeline import answer_query
from ..security import require_customer

router = APIRouter(prefix="/api/assistant", tags=["assistant"])


def _customer_log_id(user: models.User) -> str | None:
    """Return the customer ID associated with the authenticated user's domain."""
    if user.domain == "banking":
        return user.bank_customer_id
    return user.customer_id



def _owns_query(user: models.User, log: models.QueryLog) -> bool:
    """Only allow users to access their own query logs."""
    return log.user_id == user.id and log.domain == user.domain


@router.post("/query")
def query(
    body: schemas.AssistantQuery,
    user: models.User = Depends(require_customer),
    db: Session = Depends(get_db),
):
    return answer_query(
        db,
        user,
        body.message.strip(),
        body.context,
        domain=user.domain,
    )


@router.get("/sources")
def sources(
    query_id: int,
    user: models.User = Depends(require_customer),
    db: Session = Depends(get_db),
):
    log = db.get(models.QueryLog, query_id)

    if not log or not _owns_query(user, log):
        raise HTTPException(status_code=404, detail="Query not found")

    return log.sources or {}


@router.post("/feedback")
def feedback(
    body: schemas.FeedbackRequest,
    user: models.User = Depends(require_customer),
    db: Session = Depends(get_db),
):
    log = db.get(models.QueryLog, body.query_id)

    if not log or not _owns_query(user, log):
        raise HTTPException(status_code=404, detail="Query not found")

    log.feedback = body.value
    db.commit()

    return {"ok": True}
