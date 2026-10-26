"""Relational schema. Mirrors the logical tables from the project brief."""
from datetime import date, datetime
from typing import Optional

from sqlalchemy import JSON, Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class Customer(Base):
    __tablename__ = "customers"
    customer_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    phone: Mapped[str] = mapped_column(String(30))
    date_of_birth: Mapped[date] = mapped_column(Date)
    address: Mapped[str] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(80))
    state: Mapped[str] = mapped_column(String(80))
    pincode: Mapped[str] = mapped_column(String(10))
    kyc_status: Mapped[str] = mapped_column(String(20), default="Verified")
    customer_since: Mapped[date] = mapped_column(Date)


class Policy(Base):
    __tablename__ = "policies"
    policy_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    customer_id: Mapped[str] = mapped_column(ForeignKey("customers.customer_id"), index=True)
    policy_number: Mapped[str] = mapped_column(String(20), unique=True)
    policy_type: Mapped[str] = mapped_column(String(40))
    policy_name: Mapped[str] = mapped_column(String(120))
    issue_date: Mapped[date] = mapped_column(Date)
    expiry_date: Mapped[date] = mapped_column(Date)
    renewal_due_date: Mapped[date] = mapped_column(Date)
    premium_amount: Mapped[float] = mapped_column(Float)
    coverage_amount: Mapped[float] = mapped_column(Float)
    policy_status: Mapped[str] = mapped_column(String(20), default="Active")


class Payment(Base):
    __tablename__ = "payments"
    payment_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    customer_id: Mapped[str] = mapped_column(ForeignKey("customers.customer_id"), index=True)
    policy_id: Mapped[int] = mapped_column(ForeignKey("policies.policy_id"))
    due_date: Mapped[date] = mapped_column(Date)
    payment_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    amount_paid: Mapped[float] = mapped_column(Float, default=0)
    payment_status: Mapped[str] = mapped_column(String(20))
    payment_mode: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    late_fee: Mapped[float] = mapped_column(Float, default=0)
    transaction_id: Mapped[str] = mapped_column(String(20), unique=True)


class Claim(Base):
    __tablename__ = "claims"
    claim_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    customer_id: Mapped[str] = mapped_column(ForeignKey("customers.customer_id"), index=True)
    policy_id: Mapped[int] = mapped_column(ForeignKey("policies.policy_id"))
    claim_date: Mapped[date] = mapped_column(Date)
    claim_amount: Mapped[float] = mapped_column(Float)
    claim_status: Mapped[str] = mapped_column(String(20))
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    settlement_amount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)


class Renewal(Base):
    __tablename__ = "renewals"
    renewal_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    customer_id: Mapped[str] = mapped_column(ForeignKey("customers.customer_id"), index=True)
    policy_id: Mapped[int] = mapped_column(ForeignKey("policies.policy_id"))
    renewal_due_date: Mapped[date] = mapped_column(Date)
    renewal_status: Mapped[str] = mapped_column(String(20))
    reminder_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    renewal_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)



class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True
    )
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20))
    full_name: Mapped[str] = mapped_column(
        String(120), default=""
    )
    customer_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("customers.customer_id"), nullable=True
    )
    domain: Mapped[str] = mapped_column(
        String(20), default="insurance"
    )
    bank_customer_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("bank_customers.customer_id"),
        nullable=True,
        index=True,
    )


class Document(Base):
    __tablename__ = "documents"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    filename: Mapped[str] = mapped_column(String(255))
    policy_type: Mapped[str] = mapped_column(String(40))
    domain: Mapped[str] = mapped_column(String(20), default="insurance", index=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[str] = mapped_column(String(30), default="Processing")  # Processing | Indexed | Chunked | Failed
    chunk_count: Mapped[int] = mapped_column(Integer, default=0)
    detail: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    stored_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)


class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"), index=True)
    chunk_index: Mapped[int] = mapped_column(Integer)
    section: Mapped[str] = mapped_column(String(20), default="")
    title: Mapped[str] = mapped_column(String(200), default="")
    text: Mapped[str] = mapped_column(Text)



class QueryLog(Base):
    __tablename__ = "query_logs"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"), nullable=True, index=True
    )
    domain: Mapped[str] = mapped_column(
        String(20), default="insurance", index=True
    )
    customer_id: Mapped[Optional[str]] = mapped_column(
        String(20), index=True, nullable=True
    )
    query: Mapped[str] = mapped_column(Text)
    intent: Mapped[str] = mapped_column(String(30))
    answer: Mapped[str] = mapped_column(Text, default="")
    sources: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    generation: Mapped[str] = mapped_column(String(30), default="")
    feedback: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )


class BankCustomer(Base):
    __tablename__ = "bank_customers"

    customer_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    phone: Mapped[str] = mapped_column(String(30), default="")
    kyc_status: Mapped[str] = mapped_column(String(20), default="Verified")
    customer_since: Mapped[date] = mapped_column(Date)


class BankAccount(Base):
    __tablename__ = "bank_accounts"

    account_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    customer_id: Mapped[str] = mapped_column(
        ForeignKey("bank_customers.customer_id"), index=True
    )
    account_number: Mapped[str] = mapped_column(String(30), unique=True)
    account_type: Mapped[str] = mapped_column(String(30))
    balance: Mapped[float] = mapped_column(Float, default=0)
    account_status: Mapped[str] = mapped_column(String(30), default="Active")
    opened_date: Mapped[date] = mapped_column(Date)


class BankTransaction(Base):
    __tablename__ = "bank_transactions"

    transaction_id: Mapped[str] = mapped_column(String(40), primary_key=True)
    account_id: Mapped[int] = mapped_column(
        ForeignKey("bank_accounts.account_id"), index=True
    )
    transaction_date: Mapped[datetime] = mapped_column(DateTime)
    amount: Mapped[float] = mapped_column(Float)
    transaction_type: Mapped[str] = mapped_column(String(30))
    transaction_status: Mapped[str] = mapped_column(String(30))
    description: Mapped[str] = mapped_column(Text, default="")
    fee: Mapped[float] = mapped_column(Float, default=0)


class BankCard(Base):
    __tablename__ = "bank_cards"

    card_id: Mapped[str] = mapped_column(String(30), primary_key=True)
    account_id: Mapped[int] = mapped_column(
        ForeignKey("bank_accounts.account_id"), index=True
    )
    card_type: Mapped[str] = mapped_column(String(30))
    last_four_digits: Mapped[str] = mapped_column(String(4))
    card_status: Mapped[str] = mapped_column(String(30), default="Active")
    expiry_date: Mapped[date] = mapped_column(Date)


class BankLoan(Base):
    __tablename__ = "bank_loans"

    loan_id: Mapped[str] = mapped_column(String(30), primary_key=True)
    customer_id: Mapped[str] = mapped_column(
        ForeignKey("bank_customers.customer_id"), index=True
    )
    loan_type: Mapped[str] = mapped_column(String(40))
    principal_amount: Mapped[float] = mapped_column(Float)
    outstanding_amount: Mapped[float] = mapped_column(Float)
    interest_rate: Mapped[float] = mapped_column(Float)
    loan_status: Mapped[str] = mapped_column(String(30))
    next_due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)


class BankComplaint(Base):
    __tablename__ = "bank_complaints"

    complaint_id: Mapped[str] = mapped_column(String(30), primary_key=True)
    customer_id: Mapped[str] = mapped_column(
        ForeignKey("bank_customers.customer_id"), index=True
    )
    transaction_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("bank_transactions.transaction_id"), nullable=True
    )
    complaint_date: Mapped[date] = mapped_column(Date)
    category: Mapped[str] = mapped_column(String(50))
    description: Mapped[str] = mapped_column(Text)
    complaint_status: Mapped[str] = mapped_column(String(30))
    resolution: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

