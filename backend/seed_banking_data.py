
from datetime import date, datetime, timedelta

from app.db import SessionLocal
from app import models


def seed_banking_data():
    db = SessionLocal()

    try:
        # Avoid inserting duplicate demo data.
        if db.query(models.BankCustomer).first():
            print("Banking data already exists. No changes made.")
            return

        customers = [
            models.BankCustomer(
                customer_id="BANK1001",
                full_name="Aarav Sharma",
                email="aarav.sharma@example.com",
                phone="9000000001",
                kyc_status="Verified",
                customer_since=date(2023, 4, 12),
            ),
            models.BankCustomer(
                customer_id="BANK1002",
                full_name="Diya Reddy",
                email="diya.reddy@example.com",
                phone="9000000002",
                kyc_status="Verified",
                customer_since=date(2024, 1, 20),
            ),
            models.BankCustomer(
                customer_id="BANK1003",
                full_name="Kabir Rao",
                email="kabir.rao@example.com",
                phone="9000000003",
                kyc_status="Pending",
                customer_since=date(2025, 6, 15),
            ),
        ]
        db.add_all(customers)
        db.flush()

        accounts = [
            models.BankAccount(
                customer_id="BANK1001",
                account_number="900100000001",
                account_type="Savings",
                balance=42500.00,
                account_status="Active",
                opened_date=date(2023, 4, 12),
            ),
            models.BankAccount(
                customer_id="BANK1001",
                account_number="900100000002",
                account_type="Current",
                balance=120000.00,
                account_status="Active",
                opened_date=date(2024, 2, 10),
            ),
            models.BankAccount(
                customer_id="BANK1002",
                account_number="900100000003",
                account_type="Savings",
                balance=18750.50,
                account_status="Active",
                opened_date=date(2024, 1, 20),
            ),
            models.BankAccount(
                customer_id="BANK1003",
                account_number="900100000004",
                account_type="Savings",
                balance=9800.00,
                account_status="Active",
                opened_date=date(2025, 6, 15),
            ),
        ]
        db.add_all(accounts)
        db.flush()

        transactions = [
            models.BankTransaction(
                transaction_id="BTX1001",
                account_id=accounts[0].account_id,
                transaction_date=datetime.now() - timedelta(days=1),
                amount=2500.00,
                transaction_type="Debit",
                transaction_status="Successful",
                description="UPI payment to demo merchant",
                fee=0.00,
            ),
            models.BankTransaction(
                transaction_id="BTX1002",
                account_id=accounts[0].account_id,
                transaction_date=datetime.now() - timedelta(days=3),
                amount=7500.00,
                transaction_type="Credit",
                transaction_status="Successful",
                description="Demo salary credit",
                fee=0.00,
            ),
            models.BankTransaction(
                transaction_id="BTX1003",
                account_id=accounts[2].account_id,
                transaction_date=datetime.now() - timedelta(days=2),
                amount=1200.00,
                transaction_type="Debit",
                transaction_status="Pending",
                description="Demo online purchase",
                fee=0.00,
            ),
            models.BankTransaction(
                transaction_id="BTX1004",
                account_id=accounts[3].account_id,
                transaction_date=datetime.now() - timedelta(days=5),
                amount=850.00,
                transaction_type="Debit",
                transaction_status="Failed",
                description="Demo bill payment",
                fee=0.00,
            ),
        ]
        db.add_all(transactions)
        db.flush()

        cards = [
            models.BankCard(
                card_id="BCARD1001",
                account_id=accounts[0].account_id,
                card_type="Debit",
                last_four_digits="1234",
                card_status="Active",
                expiry_date=date(2029, 12, 31),
            ),
            models.BankCard(
                card_id="BCARD1002",
                account_id=accounts[2].account_id,
                card_type="Debit",
                last_four_digits="5678",
                card_status="Blocked",
                expiry_date=date(2028, 10, 31),
            ),
        ]
        db.add_all(cards)

        loans = [
            models.BankLoan(
                loan_id="BLOAN1001",
                customer_id="BANK1001",
                loan_type="Personal",
                principal_amount=200000.00,
                outstanding_amount=145000.00,
                interest_rate=11.5,
                loan_status="Active",
                next_due_date=date.today() + timedelta(days=10),
            ),
            models.BankLoan(
                loan_id="BLOAN1002",
                customer_id="BANK1002",
                loan_type="Personal",
                principal_amount=100000.00,
                outstanding_amount=0.00,
                interest_rate=10.5,
                loan_status="Closed",
                next_due_date=None,
            ),
        ]
        db.add_all(loans)

        complaints = [
            models.BankComplaint(
                complaint_id="BCOMP1001",
                customer_id="BANK1002",
                transaction_id="BTX1003",
                complaint_date=date.today() - timedelta(days=1),
                category="Transaction Dispute",
                description="Demo complaint about a pending transaction.",
                complaint_status="Open",
                resolution=None,
            ),
            models.BankComplaint(
                complaint_id="BCOMP1002",
                customer_id="BANK1003",
                transaction_id="BTX1004",
                complaint_date=date.today() - timedelta(days=3),
                category="Failed Payment",
                description="Demo complaint about a failed bill payment.",
                complaint_status="Resolved",
                resolution="Demo resolution recorded for testing.",
            ),
        ]
        db.add_all(complaints)

        db.commit()
        print("Synthetic banking demo data inserted successfully.")

        for model, label in [
            (models.BankCustomer, "Customers"),
            (models.BankAccount, "Accounts"),
            (models.BankTransaction, "Transactions"),
            (models.BankCard, "Cards"),
            (models.BankLoan, "Loans"),
            (models.BankComplaint, "Complaints"),
        ]:
            print(f"{label}: {db.query(model).count()}")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_banking_data()
