
import random
from datetime import date, datetime, timedelta
from pathlib import Path

from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker

from app.db import Base
from app import models

# Always use the existing SQLite database in this backend folder.
DB_PATH = Path(__file__).resolve().parent / "policysense.db"
engine = create_engine(
    f"sqlite:///{DB_PATH.as_posix()}",
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

random.seed(42)

FIRST_NAMES = [
    "Aarav", "Ananya", "Arjun", "Diya", "Ishaan", "Kavya",
    "Lakshmi", "Meera", "Rahul", "Priya", "Rohan", "Sneha",
    "Varun", "Aadhya", "Kiran", "Nisha", "Vikram", "Pooja",
]
LAST_NAMES = [
    "Sharma", "Reddy", "Rao", "Patel", "Kumar", "Verma",
    "Singh", "Gupta", "Iyer", "Nair", "Das", "Mehta",
]
CITIES = [
    ("Hyderabad", "Telangana", "500001"),
    ("Bengaluru", "Karnataka", "560001"),
    ("Chennai", "Tamil Nadu", "600001"),
    ("Mumbai", "Maharashtra", "400001"),
    ("Pune", "Maharashtra", "411001"),
    ("Delhi", "Delhi", "110001"),
]
TODAY = date.today()


def count_rows(db, model):
    return db.scalar(select(func.count()).select_from(model)) or 0


def new_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


def make_date(days_ago=2000):
    return TODAY - timedelta(days=random.randint(0, days_ago))


def expand_insurance(db):
    # Preserve existing customers and add only until each target is reached.
    while count_rows(db, models.Customer) < 200:
        n = count_rows(db, models.Customer) + 1
        city, state, pin = random.choice(CITIES)
        db.add(models.Customer(
            customer_id=f"SYN-C{n:05d}",
            full_name=new_name(),
            email=f"synthetic.customer.{n}@example.com",
            phone=f"9{n % 10}{n % 10}{n % 10}{n % 10}{n % 10}{n % 10}{n % 10}{n % 10}{n % 10}",
            date_of_birth=date(
                random.randint(1960, 2002),
                random.randint(1, 12),
                random.randint(1, 28),
            ),
            address=f"{random.randint(1, 999)} Demo Street",
            city=city,
            state=state,
            pincode=pin,
            kyc_status=random.choice(["Verified", "Pending"]),
            customer_since=make_date(2500),
        ))
    db.flush()

    customers = list(db.scalars(select(models.Customer)).all())

    # Create policies linked to real customer IDs.
    while count_rows(db, models.Policy) < 400:
        n = count_rows(db, models.Policy) + 1
        customer = random.choice(customers)
        issue = make_date(1800)
        expiry = issue + timedelta(days=365)
        policy_type = random.choice(["Health", "Life", "Motor", "Travel"])
        db.add(models.Policy(
            customer_id=customer.customer_id,
            policy_number=f"SYN-P{n:06d}",
            policy_type=policy_type,
            policy_name=f"Synthetic {policy_type} Policy",
            issue_date=issue,
            expiry_date=expiry,
            renewal_due_date=expiry,
            premium_amount=round(random.uniform(3000, 30000), 2),
            coverage_amount=round(random.uniform(100000, 2000000), 2),
            policy_status=random.choice(["Active", "Active", "Expired"]),
        ))
        db.flush()

    policies = list(db.scalars(select(models.Policy)).all())

    # Build a policy-to-customer mapping so foreign keys stay consistent.
    policy_customer = {p.policy_id: p.customer_id for p in policies}

    while count_rows(db, models.Payment) < 2000:
        n = count_rows(db, models.Payment) + 1
        policy = random.choice(policies)
        status = random.choice(["Paid", "Paid", "Pending", "Overdue"])
        due = make_date(700)
        paid_date = (
            due + timedelta(days=random.randint(-5, 15))
            if status == "Paid" else None
        )
        db.add(models.Payment(
            customer_id=policy_customer[policy.policy_id],
            policy_id=policy.policy_id,
            due_date=due,
            payment_date=paid_date,
            amount_paid=(
                round(policy.premium_amount, 2) if status == "Paid" else 0
            ),
            payment_status=status,
            payment_mode=random.choice(["UPI", "Card", "Net Banking", "Auto Debit"])
            if status == "Paid" else None,
            late_fee=round(random.uniform(0, 500), 2)
            if status == "Overdue" else 0,
            transaction_id=f"SYN-TXN{n:07d}",
        ))
        if n % 200 == 0:
            db.flush()

    while count_rows(db, models.Claim) < 200:
        n = count_rows(db, models.Claim) + 1
        policy = random.choice(policies)
        status = random.choice(["Submitted", "Under Review", "Approved", "Rejected", "Settled"])
        db.add(models.Claim(
            claim_id=f"SYN-CL{n:06d}",
            customer_id=policy_customer[policy.policy_id],
            policy_id=policy.policy_id,
            claim_date=make_date(600),
            claim_amount=round(random.uniform(5000, 250000), 2),
            claim_status=status,
            rejection_reason="Synthetic demo rejection reason"
            if status == "Rejected" else None,
            settlement_amount=round(random.uniform(3000, 200000), 2)
            if status == "Settled" else None,
        ))
        if n % 100 == 0:
            db.flush()

    while count_rows(db, models.Renewal) < 200:
        n = count_rows(db, models.Renewal) + 1
        policy = random.choice(policies)
        status = random.choice(["Pending", "Renewed", "Overdue"])
        db.add(models.Renewal(
            customer_id=policy_customer[policy.policy_id],
            policy_id=policy.policy_id,
            renewal_due_date=policy.renewal_due_date,
            renewal_status=status,
            reminder_sent=random.choice([True, False]),
            renewal_date=TODAY if status == "Renewed" else None,
        ))
        if n % 100 == 0:
            db.flush()


def expand_banking(db):
    while count_rows(db, models.BankCustomer) < 200:
        n = count_rows(db, models.BankCustomer) + 1
        db.add(models.BankCustomer(
            customer_id=f"SYN-B{n:05d}",
            full_name=new_name(),
            email=f"synthetic.bank.customer.{n}@example.com",
            phone=f"8{n % 10}{n % 10}{n % 10}{n % 10}{n % 10}{n % 10}{n % 10}{n % 10}{n % 10}",
            kyc_status=random.choice(["Verified", "Pending"]),
            customer_since=make_date(2500),
        ))
    db.flush()

    bank_customers = list(db.scalars(select(models.BankCustomer)).all())

    while count_rows(db, models.BankAccount) < 300:
        n = count_rows(db, models.BankAccount) + 1
        customer = random.choice(bank_customers)
        db.add(models.BankAccount(
            customer_id=customer.customer_id,
            account_number=f"9{n:011d}",
            account_type=random.choice(["Savings", "Current", "Salary"]),
            balance=round(random.uniform(500, 500000), 2),
            account_status=random.choice(["Active", "Active", "Dormant"]),
            opened_date=make_date(2500),
        ))
    db.flush()

    accounts = list(db.scalars(select(models.BankAccount)).all())
    account_ids = [a.account_id for a in accounts]
    account_owner = {a.account_id: a.customer_id for a in accounts}

    while count_rows(db, models.BankTransaction) < 3000:
        n = count_rows(db, models.BankTransaction) + 1
        account_id = random.choice(account_ids)
        db.add(models.BankTransaction(
            transaction_id=f"SYN-BTX{n:07d}",
            account_id=account_id,
            transaction_date=datetime.now() - timedelta(
                days=random.randint(0, 900),
                minutes=random.randint(0, 1440),
            ),
            amount=round(random.uniform(100, 50000), 2),
            transaction_type=random.choice(["Debit", "Credit", "Transfer", "Payment"]),
            transaction_status=random.choice(["Successful", "Successful", "Failed", "Pending"]),
            description="Synthetic demo banking transaction",
            fee=round(random.uniform(0, 100), 2),
        ))
        if n % 300 == 0:
            db.flush()

    transactions = list(db.scalars(select(models.BankTransaction)).all())
    transaction_ids = [t.transaction_id for t in transactions]

    while count_rows(db, models.BankCard) < 200:
        n = count_rows(db, models.BankCard) + 1
        account = random.choice(accounts)
        db.add(models.BankCard(
            card_id=f"SYN-BC{n:06d}",
            account_id=account.account_id,
            card_type=random.choice(["Debit", "Credit"]),
            last_four_digits=f"{n % 10000:04d}",
            card_status=random.choice(["Active", "Blocked", "Expired"]),
            expiry_date=TODAY + timedelta(days=random.randint(30, 1800)),
        ))

    while count_rows(db, models.BankLoan) < 150:
        n = count_rows(db, models.BankLoan) + 1
        customer = random.choice(bank_customers)
        principal = round(random.uniform(50000, 2000000), 2)
        db.add(models.BankLoan(
            loan_id=f"SYN-BL{n:06d}",
            customer_id=customer.customer_id,
            loan_type=random.choice(["Personal", "Home", "Vehicle", "Education"]),
            principal_amount=principal,
            outstanding_amount=round(random.uniform(0, principal), 2),
            interest_rate=round(random.uniform(6, 18), 2),
            loan_status=random.choice(["Active", "Closed", "Overdue"]),
            next_due_date=TODAY + timedelta(days=random.randint(1, 60)),
        ))

    while count_rows(db, models.BankComplaint) < 200:
        n = count_rows(db, models.BankComplaint) + 1
        customer = random.choice(bank_customers)
        transaction_id = random.choice(transaction_ids) if transaction_ids else None
        db.add(models.BankComplaint(
            complaint_id=f"SYN-BCC{n:06d}",
            customer_id=customer.customer_id,
            transaction_id=transaction_id,
            complaint_date=make_date(500),
            category=random.choice([
                "Failed Transaction", "Card Issue", "Account Charges",
                "Loan Query", "Unauthorized Transaction",
            ]),
            description="Synthetic demo banking complaint",
            complaint_status=random.choice(["Open", "In Progress", "Resolved"]),
            resolution="Synthetic demo resolution"
            if random.choice([True, False]) else None,
        ))
        if n % 100 == 0:
            db.flush()


def main():
    print(f"Target SQLite database: {DB_PATH}")
    if not DB_PATH.exists():
        raise FileNotFoundError(
            f"SQLite database not found at {DB_PATH}. No data was changed."
        )

    # Do not create tables or change the schema here.
    with SessionLocal() as db:
        try:
            print("Expanding insurance records...")
            expand_insurance(db)
            db.flush()

            print("Expanding banking records...")
            expand_banking(db)
            db.commit()

            print("\nFinal record counts:")
            for name in [
                "Customer", "Policy", "Payment", "Claim", "Renewal",
                "BankCustomer", "BankAccount", "BankTransaction",
                "BankCard", "BankLoan", "BankComplaint",
                "User", "Document", "DocumentChunk", "QueryLog",
            ]:
                model = getattr(models, name, None)
                if model is not None:
                    print(f"{model.__tablename__}: {count_rows(db, model)}")

            print("\nSynthetic data expansion completed successfully.")
        except Exception:
            db.rollback()
            raise


if __name__ == "__main__":
    main()
