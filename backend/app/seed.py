"""Synthetic demo data. Safe to delete once real data is loaded (set SEED_DEMO_DATA=false)."""
from datetime import date, datetime, timedelta
from pathlib import Path

from sqlalchemy.orm import Session

from . import models
from .rag.ingestion import ingest_file
from .security import hash_password

SAMPLE_DIR = Path(__file__).resolve().parents[1] / "sample_docs"
QUERY_SAMPLES = {
    "penalty": ["Why was I charged ₹500 extra?", "What is the late fee on my premium?"],
    "renewal": ["When is my renewal due?", "What happens if I miss my renewal?"],
    "claim": ["Why was my claim rejected?", "How long does claim settlement take?"],
    "coverage": ["What does my policy cover?", "Is dental treatment covered?"],
}


def _policy(db, cid, num, ptype, name, issue, due, premium, cover, status="Active"):
    p = models.Policy(customer_id=cid, policy_number=num, policy_type=ptype, policy_name=name, issue_date=issue,
                      expiry_date=due - timedelta(days=1), renewal_due_date=due, premium_amount=premium,
                      coverage_amount=cover, policy_status=status)
    db.add(p)
    db.flush()
    return p


def seed(db: Session) -> None:
    if db.query(models.User).count():
        return
    today = date.today()
    soon = today + timedelta(days=12)

    db.add(models.Customer(customer_id="CUST1001", full_name="Rahul Sharma", email="rahul.sharma@example.com",
                           phone="+91 98765 43210", date_of_birth=date(1994, 3, 18), address="Plot 42, Road No. 7, Jubilee Hills",
                           city="Hyderabad", state="Telangana", pincode="500033", kyc_status="Verified", customer_since=date(2021, 4, 12)))
    db.flush()
    health = _policy(db, "CUST1001", "POL10245", "Health", "Health Secure Plus", date(2026, 7, 2), date(2027, 7, 2), 12500, 500000)
    motor = _policy(db, "CUST1001", "POL20871", "Motor", "Motor Shield Comprehensive", soon - timedelta(days=365), soon, 8200, 650000)
    life = _policy(db, "CUST1001", "POL30412", "Life", "Term Life Assure", date(2026, 3, 15), date(2027, 3, 15), 18400, 5000000)

    pay = lambda **k: db.add(models.Payment(customer_id="CUST1001", **k))
    pay(policy_id=health.policy_id, due_date=date(2026, 7, 2), payment_date=date(2026, 7, 5), amount_paid=12500, late_fee=500, payment_status="Paid", payment_mode="UPI", transaction_id="TXN1001")
    pay(policy_id=life.policy_id, due_date=date(2026, 3, 15), payment_date=date(2026, 3, 14), amount_paid=18400, late_fee=0, payment_status="Paid", payment_mode="Net Banking", transaction_id="TXN1002")
    pay(policy_id=motor.policy_id, due_date=soon - timedelta(days=365), payment_date=soon - timedelta(days=366), amount_paid=8200, late_fee=0, payment_status="Paid", payment_mode="Card", transaction_id="TXN1003")
    pay(policy_id=motor.policy_id, due_date=soon, payment_date=None, amount_paid=0, late_fee=0, payment_status="Pending", payment_mode=None, transaction_id="TXN1004")

    claim = lambda **k: db.add(models.Claim(customer_id="CUST1001", **k))
    claim(claim_id="CLM7001", policy_id=health.policy_id, claim_date=date(2026, 8, 12), claim_amount=85000, claim_status="Approved", settlement_amount=78000)
    claim(claim_id="CLM7002", policy_id=motor.policy_id, claim_date=today - timedelta(days=20), claim_amount=42000, claim_status="Pending")
    claim(claim_id="CLM7003", policy_id=health.policy_id, claim_date=date(2026, 9, 2), claim_amount=60000, claim_status="Rejected",
          rejection_reason="The procedure is classified as cosmetic surgery, which is excluded under Section 8.1.")

    ren = lambda **k: db.add(models.Renewal(customer_id="CUST1001", **k))
    ren(policy_id=health.policy_id, renewal_due_date=date(2026, 7, 2), renewal_status="Renewed", reminder_sent=True, renewal_date=date(2026, 7, 5))
    ren(policy_id=health.policy_id, renewal_due_date=date(2027, 7, 2), renewal_status="Upcoming", reminder_sent=False)
    ren(policy_id=motor.policy_id, renewal_due_date=soon, renewal_status="Pending", reminder_sent=True)
    ren(policy_id=life.policy_id, renewal_due_date=date(2027, 3, 15), renewal_status="Upcoming", reminder_sent=False)

    others = [("CUST1002", "Priya Nair", "Kochi", "Kerala", "682001", "Verified", "Health", 9800, 12, "Pending"),
              ("CUST1003", "Arjun Mehta", "Mumbai", "Maharashtra", "400001", "Verified", "Motor", 7600, 40, "Upcoming"),
              ("CUST1004", "Sneha Iyer", "Chennai", "Tamil Nadu", "600001", "Pending", "Life", 21000, 90, "Upcoming"),
              ("CUST1005", "Vikram Rao", "Bengaluru", "Karnataka", "560001", "Verified", "Health", 14200, 5, "Pending"),
              ("CUST1006", "Ananya Das", "Kolkata", "West Bengal", "700001", "Rejected", "Motor", 6400, 200, "Upcoming")]
    names = {"Health": "Health Secure Plus", "Motor": "Motor Shield Comprehensive", "Life": "Term Life Assure"}
    for i, (cid, name, city, state, pin, kyc, ptype, prem, days, rstat) in enumerate(others):
        db.add(models.Customer(customer_id=cid, full_name=name, email=f"{name.split()[0].lower()}@example.com", phone=f"+91 90000 0{i}000",
                               date_of_birth=date(1988 + i, 5, 10), address=f"{10 + i}, MG Road", city=city, state=state, pincode=pin,
                               kyc_status=kyc, customer_since=date(2020 + i % 4, 6, 1)))
        db.flush()
        due = today + timedelta(days=days)
        pol = _policy(db, cid, f"POL4{i}{100 + i}", ptype, names[ptype], due - timedelta(days=365), due, prem, prem * 40)
        db.add(models.Renewal(customer_id=cid, policy_id=pol.policy_id, renewal_due_date=due, renewal_status=rstat, reminder_sent=rstat == "Pending"))
        if i % 2 == 0:
            db.add(models.Claim(claim_id=f"CLM80{i}", customer_id=cid, policy_id=pol.policy_id, claim_date=today - timedelta(days=30), claim_amount=prem * 5,
                                claim_status=["Approved", "Pending", "Rejected"][i // 2 % 3], settlement_amount=None))

    db.add(models.User(email="rahul.sharma@example.com", password_hash=hash_password("Customer@123"), role="customer", full_name="Rahul Sharma", customer_id="CUST1001"))
    db.add(models.User(email="admin@policysense.ai", password_hash=hash_password("Admin@123"), role="admin", full_name="Admin User"))

    plan = ["penalty"] * 35 + ["renewal"] * 28 + ["claim"] * 22 + ["coverage"] * 15
    for i, intent in enumerate(plan):
        qs = QUERY_SAMPLES[intent]
        db.add(models.QueryLog(customer_id="CUST1001", query=qs[i % len(qs)], intent=intent, generation="gemini" if i % 5 else "template-fallback",
                               created_at=datetime.utcnow() - timedelta(days=i % 7, hours=i % 11)))
    db.commit()

    if SAMPLE_DIR.exists() and db.query(models.Document).count() == 0:
        for f, t in [("Health_Secure_Plus_Terms.txt", "Health"), ("Motor_Shield_Terms.txt", "Motor")]:
            if (SAMPLE_DIR / f).exists():
                ingest_file(db, SAMPLE_DIR / f, f, t)
