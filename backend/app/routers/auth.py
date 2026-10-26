
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db
from ..security import create_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", status_code=201)
def register(body: schemas.RegisterRequest, db: Session = Depends(get_db)):
    """Register an existing banking or insurance customer."""

    generic = HTTPException(
        status.HTTP_400_BAD_REQUEST,
        "We couldn't match those details to an eligible customer record.",
    )

    domain = getattr(body, "domain", "insurance").lower()
    if domain not in {"insurance", "banking"}:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid customer domain.")

    email = body.email.lower().strip()
    customer_id = body.customer_id.upper().strip()

    if domain == "insurance":
        customer = db.get(models.Customer, customer_id)

        if not customer or customer.email.lower().strip() != email:
            raise generic

        existing = db.execute(
            select(models.User).where(
                or_(
                    models.User.customer_id == customer.customer_id,
                    models.User.email == email,
                )
            )
        ).scalar_one_or_none()

        if existing:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "An account already exists. Please sign in instead.",
            )

        user = models.User(
            email=email,
            password_hash=hash_password(body.password),
            role="customer",
            full_name=customer.full_name,
            customer_id=customer.customer_id,
            bank_customer_id=None,
            domain="insurance",
        )

    else:
        customer = db.get(models.BankCustomer, customer_id)

        if not customer or customer.email.lower().strip() != email:
            raise generic

        existing = db.execute(
            select(models.User).where(
                or_(
                    models.User.bank_customer_id == customer.customer_id,
                    models.User.email == email,
                )
            )
        ).scalar_one_or_none()

        if existing:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "An account already exists. Please sign in instead.",
            )

        user = models.User(
            email=email,
            password_hash=hash_password(body.password),
            role="customer",
            full_name=customer.full_name,
            customer_id=None,
            bank_customer_id=customer.customer_id,
            domain="banking",
        )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "access_token": create_token(user),
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "name": user.full_name,
            "customer_id": user.customer_id or user.bank_customer_id,
            "domain": user.domain,
        },
    }


@router.post("/login")
def login(body: schemas.LoginRequest, db: Session = Depends(get_db)):
    email = body.email.lower().strip()

    user = db.execute(
        select(models.User).where(models.User.email == email)
    ).scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Incorrect email or password",
        )

    return {
        "access_token": create_token(user),
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "name": user.full_name,
            "customer_id": user.customer_id or user.bank_customer_id,
            "domain": user.domain,
        },
    }
