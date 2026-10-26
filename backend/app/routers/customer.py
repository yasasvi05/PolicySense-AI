
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..catalog import CATALOG
from ..db import get_db
from ..security import require_customer

router = APIRouter(prefix="/api/customer", tags=["customer"])


def row(obj) -> dict:
    if obj is None:
        return {}

    result = {}
    for column in obj.__table__.columns:
        value = getattr(obj, column.name)
        result[column.name] = (
            value.isoformat()
            if hasattr(value, "isoformat")
            else value
        )
    return result


def require_domain(user: models.User, expected: str) -> None:
    if (user.domain or "insurance") != expected:
        raise HTTPException(
            status_code=403,
            detail=f"This endpoint is available to {expected} customers only.",
        )


def policy_out(policy: models.Policy) -> dict:
    return {
        **row(policy),
        **CATALOG.get(
            policy.policy_type,
            {"benefits": [], "exclusions": [], "documents": []},
        ),
    }


def load_customer_data(db: Session, customer_id: str) -> dict:
    policies = db.execute(
        select(models.Policy)
        .where(models.Policy.customer_id == customer_id)
        .order_by(models.Policy.policy_id)
    ).scalars().all()

    policies_by_id = {p.policy_id: p for p in policies}

    payments = db.execute(
        select(models.Payment)
        .where(models.Payment.customer_id == customer_id)
        .order_by(models.Payment.due_date.desc())
    ).scalars().all()

    claims = db.execute(
        select(models.Claim)
        .where(models.Claim.customer_id == customer_id)
        .order_by(models.Claim.claim_date.desc())
    ).scalars().all()

    renewals = db.execute(
        select(models.Renewal)
        .where(models.Renewal.customer_id == customer_id)
        .order_by(models.Renewal.renewal_due_date)
    ).scalars().all()

    def policy_meta(policy_id):
        policy = policies_by_id.get(policy_id)
        if not policy:
            return {}
        return {
            "policy_number": policy.policy_number,
            "policy_name": policy.policy_name,
        }

    payment_rows = []
    for payment in payments:
        policy = policies_by_id.get(payment.policy_id)
        payment_rows.append({
            **row(payment),
            **policy_meta(payment.policy_id),
            "amount": (
                payment.amount_paid
                if payment.payment_status == "Paid"
                else policy.premium_amount if policy else 0
            ),
        })

    claim_rows = [
        {**row(claim), **policy_meta(claim.policy_id)}
        for claim in claims
    ]

    renewal_rows = []
    for renewal in renewals:
        policy = policies_by_id.get(renewal.policy_id)
        renewal_rows.append({
            **row(renewal),
            **policy_meta(renewal.policy_id),
            "premium_amount": policy.premium_amount if policy else 0,
        })

    return {
        "policies": [policy_out(p) for p in policies],
        "payments": payment_rows,
        "claims": claim_rows,
        "renewals": renewal_rows,
    }


def build_notifications(data: dict) -> list[dict]:
    today = date.today()
    notifications = []

    for renewal in data["renewals"]:
        days = (
            date.fromisoformat(renewal["renewal_due_date"]) - today
        ).days
        if renewal["renewal_status"] != "Renewed" and days <= 30:
            notifications.append({
                "id": f"ren-{renewal['renewal_id']}",
                "type": "renewal",
                "title": "Upcoming renewal",
                "date": today.isoformat(),
                "message": (
                    f"Your {renewal.get('policy_name', 'policy')} "
                    f"renewal is due in {max(days, 0)} days."
                ),
            })

    for payment in data["payments"]:
        if payment["payment_status"] == "Pending":
            notifications.append({
                "id": f"due-{payment['payment_id']}",
                "type": "payment_due",
                "title": "Payment due",
                "date": today.isoformat(),
                "message": (
                    f"Premium of ₹{payment['amount']:,.0f} for "
                    f"{payment.get('policy_name', 'policy')} is due on "
                    f"{payment['due_date']}."
                ),
            })
        elif (
            payment.get("payment_date")
            and date.fromisoformat(payment["payment_date"])
            > today - timedelta(days=120)
        ):
            notifications.append({
                "id": f"rcv-{payment['payment_id']}",
                "type": "payment_received",
                "title": "Payment received",
                "date": payment["payment_date"],
                "message": (
                    f"Payment of ₹{payment['amount']:,.0f} received "
                    f"for {payment.get('policy_name', 'policy')}."
                ),
            })

        if payment.get("late_fee"):
            notifications.append({
                "id": f"pen-{payment['payment_id']}",
                "type": "penalty",
                "title": "Penalty applied",
                "date": payment.get("payment_date") or payment["due_date"],
                "message": (
                    f"A late fee of ₹{payment['late_fee']:,.0f} "
                    "was applied."
                ),
            })

    for claim in data["claims"]:
        notifications.append({
            "id": f"clm-{claim['claim_id']}",
            "type": "claim",
            "title": "Claim status update",
            "date": claim["claim_date"],
            "message": (
                f"Claim {claim['claim_id']} for "
                f"{claim.get('policy_name', 'policy')} is "
                f"{claim['claim_status']}."
            ),
        })

    for policy in data["policies"]:
        days = (
            date.fromisoformat(policy["expiry_date"]) - today
        ).days
        if 0 <= days <= 30:
            notifications.append({
                "id": f"exp-{policy['policy_id']}",
                "type": "expiry",
                "title": "Policy expiry",
                "date": today.isoformat(),
                "message": (
                    f"{policy['policy_name']} expires on "
                    f"{policy['expiry_date']}."
                ),
            })

    return sorted(
        notifications,
        key=lambda notification: notification["date"],
        reverse=True,
    )


def banking_customer_data(db: Session, customer_id: str) -> dict:
    customer = db.get(models.BankCustomer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Banking customer not found.")

    accounts = db.execute(
        select(models.BankAccount)
        .where(models.BankAccount.customer_id == customer_id)
        .order_by(models.BankAccount.account_id)
    ).scalars().all()

    account_ids = [account.account_id for account in accounts]

    transactions = []
    cards = []

    if account_ids:
        transactions = db.execute(
            select(models.BankTransaction)
            .where(models.BankTransaction.account_id.in_(account_ids))
            .order_by(models.BankTransaction.transaction_date.desc())
        ).scalars().all()

        cards = db.execute(
            select(models.BankCard)
            .where(models.BankCard.account_id.in_(account_ids))
        ).scalars().all()

    loans = db.execute(
        select(models.BankLoan)
        .where(models.BankLoan.customer_id == customer_id)
    ).scalars().all()

    complaints = db.execute(
        select(models.BankComplaint)
        .where(models.BankComplaint.customer_id == customer_id)
        .order_by(models.BankComplaint.complaint_date.desc())
    ).scalars().all()

    return {
        "customer": row(customer),
        "accounts": [row(account) for account in accounts],
        "transactions": [row(transaction) for transaction in transactions],
        "cards": [row(card) for card in cards],
        "loans": [row(loan) for loan in loans],
        "complaints": [row(complaint) for complaint in complaints],
    }

@router.get("/banking/overview")
def banking_overview(
    user: models.User = Depends(require_customer),
    db: Session = Depends(get_db),
):
    require_domain(user, "banking")

    if not user.bank_customer_id:
        raise HTTPException(
            status_code=404,
            detail="Banking customer ID not found.",
        )

    return banking_customer_data(db, user.bank_customer_id)



@router.get("/profile")
def profile(
    user: models.User = Depends(require_customer),
    db: Session = Depends(get_db),
):
    if user.domain == "banking":
        data = banking_customer_data(db, user.bank_customer_id)
        return data["customer"]

    customer = db.get(models.Customer, user.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")
    return row(customer)


@router.patch("/profile")
def update_profile(
    body: schemas.ProfileUpdate,
    user: models.User = Depends(require_customer),
    db: Session = Depends(get_db),
):
    require_domain(user, "insurance")

    customer = db.get(models.Customer, user.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    changes = body.model_dump(exclude_none=True)
    if not changes:
        raise HTTPException(status_code=400, detail="No editable fields supplied.")

    for key, value in changes.items():
        setattr(customer, key, value)

    db.commit()
    return row(customer)


@router.get("/policies")
def policies(
    user: models.User = Depends(require_customer),
    db: Session = Depends(get_db),
):
    require_domain(user, "insurance")
    return load_customer_data(db, user.customer_id)["policies"]


@router.get("/payments")
def payments(
    user: models.User = Depends(require_customer),
    db: Session = Depends(get_db),
):
    require_domain(user, "insurance")
    return load_customer_data(db, user.customer_id)["payments"]


@router.get("/renewals")
def renewals(
    user: models.User = Depends(require_customer),
    db: Session = Depends(get_db),
):
    require_domain(user, "insurance")
    return load_customer_data(db, user.customer_id)["renewals"]


@router.get("/claims")
def claims(
    user: models.User = Depends(require_customer),
    db: Session = Depends(get_db),
):
    require_domain(user, "insurance")
    return load_customer_data(db, user.customer_id)["claims"]


@router.get("/notifications")
def notifications(
    user: models.User = Depends(require_customer),
    db: Session = Depends(get_db),
):
    if user.domain == "banking":
        data = banking_customer_data(db, user.bank_customer_id)
        items = []

        for transaction in data["transactions"]:
            if transaction["transaction_status"] in {"Pending", "Failed"}:
                items.append({
                    "id": f"txn-{transaction['transaction_id']}",
                    "type": "transaction",
                    "title": f"Transaction {transaction['transaction_status'].lower()}",
                    "date": transaction["transaction_date"],
                    "message": (
                        f"{transaction['description']} — "
                        f"₹{transaction['amount']:,.2f}"
                    ),
                })

        for complaint in data["complaints"]:
            items.append({
                "id": f"complaint-{complaint['complaint_id']}",
                "type": "complaint",
                "title": "Complaint update",
                "date": complaint["complaint_date"],
                "message": (
                    f"Complaint {complaint['complaint_id']} is "
                    f"{complaint['complaint_status']}."
                ),
            })

        return sorted(
            items,
            key=lambda item: item["date"],
            reverse=True,
        )

    return build_notifications(load_customer_data(db, user.customer_id))
