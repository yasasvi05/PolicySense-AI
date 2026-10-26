
"""Domain-aware hybrid retrieval for banking and insurance."""
import logging
import re
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from . import vectorstore

log = logging.getLogger("policysense.retriever")

INSURANCE_INTENTS = [
    ("claim", ["claim", "reject", "settle"]),
    ("penalty", ["extra", "charged", "penalty", "late fee", "fee", "charge"]),
    ("renewal", ["renew", "expire", "lapse", "miss", "due"]),
    ("coverage", ["cover", "benefit", "include", "exclusion", "policy"]),
]

POLICY_QUERY_HINT = {
    "penalty": (
        "account maintenance fee service charges minimum balance "
        "fee schedule charges applicable disclosure waiver"
    ),
    "renewal": "renewal grace period lapse due date",
    "claim": "claim rejection exclusions waiting period documents",
    "coverage": "coverage benefits inclusions exclusions",
    "transaction": (
        "failed transaction failed payment reversal refund "
        "UPI transfer charges transaction dispute"
    ),
    "account": (
        "savings current account account status minimum balance "
        "maintenance charges service fee account plan"
    ),
    "card": (
        "debit credit card block activation expiry annual fee "
        "card charges replacement"
    ),
    "loan": (
        "loan interest rate EMI outstanding due date "
        "processing fee repayment charges"
    ),
    "dispute": "complaint dispute investigation resolution refund",
    "complaint": "complaint dispute investigation resolution refund",
    "general": "",
}

STOP = set(
    "the a an of to is was i my me what why when how do does and or "
    "for on in it be if".split()
)


def detect_intent(message: str, domain: str = "insurance") -> str:
    text = message.lower()

    if domain == "banking":
        if any(word in text for word in ["complaint", "dispute", "fraud"]):
            return "dispute"

        if any(word in text for word in [
            "fee", "fees", "charged", "charge", "charges",
            "penalty", "maintenance", "minimum balance"
        ]):
            return "penalty"

        if any(word in text for word in [
            "transfer", "upi", "transaction", "refund", "payment"
        ]):
            return "transaction"

        if any(word in text for word in ["loan", "emi", "installment"]):
            return "loan"

        if any(word in text for word in [
            "card", "blocked", "debit", "credit"
        ]):
            return "card"

        if any(word in text for word in ["balance", "account", "kyc"]):
            return "account"

        return "general"

    for intent, words in INSURANCE_INTENTS:
        if any(word in text for word in words):
            return intent

    return "general"


def fmt_date(d: date | None) -> str:
    return d.strftime("%d %B %Y") if d else "—"


def fmt_money(v: float | None) -> str:
    return f"₹{v:,.2f}" if v is not None else "—"


def customer_context(
    db: Session,
    customer_id: str | None,
    message: str,
    focus,
    domain: str = "insurance",
) -> dict:
    """Retrieve records only for the authenticated customer's domain."""
    if domain == "banking":
        if not customer_id:
            return {
                "intent": detect_intent(message, domain),
                "record": {},
                "highlights": [],
            }
        return banking_customer_context(db, customer_id, message)

    intent = detect_intent(message, domain)

    if focus:
        intent = {
            "payment": "penalty",
            "claim": "claim",
            "renewal": "renewal",
            "policy": "coverage",
        }[focus.type]

    record, highlights = {}, []

    if not customer_id:
        return {"intent": intent, "record": record, "highlights": highlights}

    if intent == "penalty":
        q = (
            select(models.Payment, models.Policy)
            .join(models.Policy, models.Payment.policy_id == models.Policy.policy_id)
            .where(models.Payment.customer_id == customer_id)
        )
        q = (
            q.where(models.Payment.transaction_id == focus.id)
            if focus
            else q.where(models.Payment.late_fee > 0)
        )
        row = db.execute(q.order_by(models.Payment.due_date.desc())).first()

        if row:
            payment, policy = row
            late = (
                (payment.payment_date - payment.due_date).days
                if payment.payment_date else None
            )
            record = {
                "transaction_id": payment.transaction_id,
                "policy_number": policy.policy_number,
                "policy_name": policy.policy_name,
                "due_date": payment.due_date.isoformat(),
                "payment_date": payment.payment_date.isoformat() if payment.payment_date else None,
                "days_late": late,
                "late_fee": payment.late_fee,
                "amount_paid": payment.amount_paid,
                "payment_status": payment.payment_status,
            }
            highlights = [
                ("Payment Date", fmt_date(payment.payment_date)),
                ("Due Date", fmt_date(payment.due_date)),
                ("Days Late", str(late) if late is not None else "—"),
                ("Penalty", fmt_money(payment.late_fee)),
            ]

    elif intent == "renewal":
        q = (
            select(models.Renewal, models.Policy)
            .join(models.Policy, models.Renewal.policy_id == models.Policy.policy_id)
            .where(
                models.Renewal.customer_id == customer_id,
                models.Renewal.renewal_status != "Renewed",
            )
        )
        if focus:
            q = q.where(models.Policy.policy_number == focus.id)

        row = db.execute(q.order_by(models.Renewal.renewal_due_date)).first()
        if row:
            renewal, policy = row
            days = (renewal.renewal_due_date - date.today()).days
            record = {
                "policy_number": policy.policy_number,
                "policy_name": policy.policy_name,
                "renewal_due_date": renewal.renewal_due_date.isoformat(),
                "days_remaining": days,
                "renewal_status": renewal.renewal_status,
                "premium_amount": policy.premium_amount,
            }
            highlights = [
                ("Policy", policy.policy_name),
                ("Renewal Due", fmt_date(renewal.renewal_due_date)),
                ("Days Remaining", str(days)),
                ("Status", renewal.renewal_status),
                ("Premium", fmt_money(policy.premium_amount)),
            ]

    elif intent == "claim":
        q = (
            select(models.Claim, models.Policy)
            .join(models.Policy, models.Claim.policy_id == models.Policy.policy_id)
            .where(models.Claim.customer_id == customer_id)
        )
        if focus:
            q = q.where(models.Claim.claim_id == focus.id)
        else:
            q = q.where(models.Claim.claim_status == "Rejected")

        row = db.execute(q.order_by(models.Claim.claim_date.desc())).first()
        if row:
            claim, policy = row
            record = {
                "claim_id": claim.claim_id,
                "policy_number": policy.policy_number,
                "policy_name": policy.policy_name,
                "claim_date": claim.claim_date.isoformat(),
                "claim_amount": claim.claim_amount,
                "claim_status": claim.claim_status,
                "rejection_reason": claim.rejection_reason,
                "settlement_amount": claim.settlement_amount,
            }
            highlights = [
                ("Claim ID", claim.claim_id),
                ("Policy", policy.policy_name),
                ("Claim Amount", fmt_money(claim.claim_amount)),
                ("Status", claim.claim_status),
            ]
            if claim.rejection_reason:
                highlights.append(("Rejection Reason", claim.rejection_reason))

    else:
        q = select(models.Policy).where(models.Policy.customer_id == customer_id)
        if focus:
            q = q.where(models.Policy.policy_number == focus.id)

        policy = db.execute(q.order_by(models.Policy.expiry_date)).scalars().first()
        if policy:
            record = {
                "policy_number": policy.policy_number,
                "policy_name": policy.policy_name,
                "policy_type": policy.policy_type,
                "coverage_amount": policy.coverage_amount,
                "premium_amount": policy.premium_amount,
                "expiry_date": policy.expiry_date.isoformat(),
            }
            highlights = [
                ("Policy", policy.policy_name),
                ("Coverage", fmt_money(policy.coverage_amount)),
                ("Premium", fmt_money(policy.premium_amount)),
                ("Expiry", fmt_date(policy.expiry_date)),
            ]

    return {
        "intent": intent,
        "record": record,
        "highlights": [
            {"label": label, "value": value}
            for label, value in highlights
        ],
    }


def banking_customer_context(
    db: Session,
    customer_id: str,
    message: str,
) -> dict:
    """Retrieve banking records for one authenticated banking customer."""
    customer = db.get(models.BankCustomer, customer_id)
    intent = detect_intent(message, "banking")

    if not customer:
        return {"intent": intent, "record": {}, "highlights": []}

    record = {
        "customer_id": customer.customer_id,
        "full_name": customer.full_name,
        "kyc_status": customer.kyc_status,
    }
    highlights = [
        ("Customer", customer.full_name),
        ("KYC Status", customer.kyc_status),
    ]

    accounts = db.execute(
        select(models.BankAccount).where(
            models.BankAccount.customer_id == customer_id
        )
    ).scalars().all()

    account_ids = [account.account_id for account in accounts]

    # Use the account matching the requested account number, if supplied;
    # otherwise use the first account belonging to this customer.
    account = accounts[0] if accounts else None
    if account:
        record.update({
            "account_number": f"****{account.account_number[-4:]}",
            "account_type": account.account_type,
            "balance": account.balance,
            "account_status": account.account_status,
        })
        highlights.extend([
            ("Account Type", account.account_type),
            ("Account Status", account.account_status),
        ])

    if account_ids and intent in {"transaction", "penalty", "dispute", "general"}:
        transactions = db.execute(
            select(models.BankTransaction)
            .where(models.BankTransaction.account_id.in_(account_ids))
            .order_by(models.BankTransaction.transaction_date.desc())
            .limit(5)
        ).scalars().all()

        record["recent_transactions"] = [
            {
                "transaction_id": transaction.transaction_id,
                "date": transaction.transaction_date.isoformat(),
                "amount": transaction.amount,
                "type": transaction.transaction_type,
                "status": transaction.transaction_status,
                "description": transaction.description,
                "fee": transaction.fee,
            }
            for transaction in transactions
        ]

        # Expose one recent transaction at the top level for concise answers.
        if transactions:
            transaction = transactions[0]
            record.update({
                "transaction_id": transaction.transaction_id,
                "transaction_status": transaction.transaction_status,
                "amount": transaction.amount,
                "description": transaction.description,
                "fee": transaction.fee,
            })

    if intent in {"loan", "general"}:
        loans = db.execute(
            select(models.BankLoan).where(
                models.BankLoan.customer_id == customer_id
            )
        ).scalars().all()

        record["loans"] = [
            {
                "loan_id": loan.loan_id,
                "loan_type": loan.loan_type,
                "outstanding_amount": loan.outstanding_amount,
                "interest_rate": loan.interest_rate,
                "loan_status": loan.loan_status,
                "next_due_date": (
                    loan.next_due_date.isoformat()
                    if loan.next_due_date else None
                ),
            }
            for loan in loans
        ]

        if loans:
            loan = loans[0]
            record.update({
                "loan_id": loan.loan_id,
                "outstanding_amount": loan.outstanding_amount,
                "loan_status": loan.loan_status,
                "next_due_date": (
                    loan.next_due_date.isoformat()
                    if loan.next_due_date else None
                ),
            })

    if intent in {"card", "general"} and account_ids:
        cards = db.execute(
            select(models.BankCard).where(
                models.BankCard.account_id.in_(account_ids)
            )
        ).scalars().all()

        record["cards"] = [
            {
                "card_id": card.card_id,
                "type": card.card_type,
                "last_four_digits": card.last_four_digits,
                "status": card.card_status,
                "expiry_date": card.expiry_date.isoformat(),
            }
            for card in cards
        ]

        if cards:
            card = cards[0]
            record.update({
                "last_four_digits": card.last_four_digits,
                "card_status": card.card_status,
            })

    if intent in {"dispute", "general"}:
        complaints = db.execute(
            select(models.BankComplaint)
            .where(models.BankComplaint.customer_id == customer_id)
            .order_by(models.BankComplaint.complaint_date.desc())
            .limit(5)
        ).scalars().all()

        record["complaints"] = [
            {
                "complaint_id": complaint.complaint_id,
                "category": complaint.category,
                "complaint_status": complaint.complaint_status,
                "resolution": complaint.resolution,
            }
            for complaint in complaints
        ]

        if complaints:
            complaint = complaints[0]
            record.update({
                "complaint_id": complaint.complaint_id,
                "complaint_status": complaint.complaint_status,
                "resolution": complaint.resolution,
            })

    return {
        "intent": intent,
        "record": record,
        "highlights": [
            {"label": label, "value": value}
            for label, value in highlights
        ],
    }



def _keyword_search(
    db: Session,
    query: str,
    k: int,
    domain: str = "insurance",
) -> list[dict]:
    """Retrieve policy chunks using weighted keyword relevance."""
    words = [
        word for word in re.findall(r"[a-z]{3,}", query.lower())
        if word not in STOP
    ]

    rows = db.execute(
        select(models.DocumentChunk, models.Document)
        .join(
            models.Document,
            models.DocumentChunk.document_id == models.Document.id,
        )
        .where(models.Document.domain == domain)
    ).all()

    if not words or not rows:
        return []

    # Give important policy concepts more weight than generic words.
    concept_groups = {
        "maintenance_fee": [
            "maintenance fee", "service charge", "account plan",
            "minimum balance", "fee schedule",
        ],
        "account": [
            "savings account", "current account", "account status",
            "dormant account",
        ],
        "transaction": [
            "failed transaction", "transaction reversal", "refund",
            "failed payment",
        ],
    }

    query_lower = query.lower()
    scored = []

    for chunk, document in rows:
        haystack = chunk.text.lower()
        title = (chunk.title or "").lower()
        section = (chunk.section or "").lower()

        score = sum(
            haystack.count(word) + 3 * title.count(word)
            for word in words
        )

        # Boost clauses that match complete policy concepts.
        for phrases in concept_groups.values():
            for phrase in phrases:
                if phrase in query_lower:
                    if phrase in haystack:
                        score += 8
                    if phrase in title or phrase in section:
                        score += 4

        if score > 0:
            scored.append((score, chunk, document))

    scored.sort(key=lambda item: item[0], reverse=True)
    top_score = scored[0][0] if scored else 1

    return [
        {
            "title": chunk.title or document.filename,
            "section": chunk.section or "Policy details",
            "document": document.filename,
            "domain": document.domain,
            "excerpt": chunk.text,
            "score": round(score / top_score, 3),
        }
        for score, chunk, document in scored[:k]
    ]



def policy_chunks(
    db: Session,
    message: str,
    intent: str,
    k: int = 3,
    domain: str = "insurance",
) -> tuple[list[dict], str]:
    query = f"{message} {POLICY_QUERY_HINT.get(intent, '')}".strip()

    if vectorstore.available():
        try:
            hits = vectorstore.search(query, k, domain=domain)
            if hits:
                return hits, "chromadb"
        except Exception as exc:
            log.warning(
                "ChromaDB search failed; using keyword fallback: %s", exc
            )

    return _keyword_search(db, query, k, domain=domain), "keyword-fallback"
