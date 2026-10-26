
"""Generate grounded answers for banking and insurance queries."""

import json
import logging

from ..config import settings

log = logging.getLogger("policysense.generator")


SYSTEM_TEMPLATES = {
    "insurance": (
        "You are PolicySense AI, a customer support assistant for an insurance company. "
        "Answer only from the CUSTOMER DATA and POLICY CLAUSES provided. "
        "Use actual dates and amounts when available. Never invent missing facts. "
        "If information is missing, say so and suggest contacting support. "
        "Be concise, plain-spoken, and cite the relevant section when available."
    ),
    "banking": (
        "You are PolicySense AI, a customer support assistant for a bank. "
        "Answer only from the CUSTOMER DATA and POLICY CLAUSES provided. "
        "Use actual account, transaction, card, loan, and complaint details when available. "
        "Never invent balances, fees, transaction outcomes, or bank policies. "
        "Do not reveal information that is not present in the supplied customer data. "
        "If information is missing, say so and suggest contacting the bank's support team. "
        "Be concise, plain-spoken, and cite the relevant section when available."
    ),
}

HUMAN = (
    "CUSTOMER QUESTION:\n{question}\n\n"
    "CUSTOMER DATA (from PostgreSQL):\n{customer}\n\n"
    "POLICY CLAUSES (from ChromaDB):\n{clauses}"
)


def _text(content) -> str:
    if isinstance(content, list):
        return "".join(
            part.get("text", "") if isinstance(part, dict) else str(part)
            for part in content
        ).strip()
    return str(content).strip()


def _gemini(
    question: str,
    record: dict,
    chunks: list[dict],
    domain: str = "insurance",
) -> str:
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_google_genai import ChatGoogleGenerativeAI

    system = SYSTEM_TEMPLATES.get(domain, SYSTEM_TEMPLATES["insurance"])

    llm = ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.gemini_api_key,
        temperature=0.2,
    )

    chain = ChatPromptTemplate.from_messages(
        [("system", system), ("human", HUMAN)]
    ) | llm

    clauses = "\n\n".join(
        f"[Section {chunk.get('section', 'N/A')} - "
        f"{chunk.get('title', 'Untitled')}] {chunk.get('excerpt', '')}"
        for chunk in chunks
    ) or "None retrieved"

    content = chain.invoke({
        "question": question,
        "customer": json.dumps(record, indent=2, default=str)
        if record else "None retrieved",
        "clauses": clauses,
    }).content

    return _text(content)


def _template(
    intent: str,
    record: dict,
    chunks: list[dict],
    domain: str = "insurance",
    question: str = "",
) -> str:
    from .retriever import fmt_date, fmt_money

    c = chunks[0] if chunks else None

    cite = (
        f" (Section {c['section']} – {c.get('title', 'Policy terms')})"
        if c and c.get("section")
        else ""
    )

    if domain == "banking":
        if not record:
            if c:
                return (
                    "Based on the available banking document, "
                    f"{c.get('excerpt', '')}{cite}. "
                    "Customer-specific information was not found. "
                    "Please contact your bank for account-specific assistance."
                )

            return (
                "I couldn't find matching banking records or policy documents. "
                "Please contact your bank's support team for help."
            )

        question_lower = question.lower()

        asks_about_balance = (
            "balance" in question_lower
            or "how much money" in question_lower
            or "available funds" in question_lower
        )

        is_minimum_balance_question = any(
            phrase in question_lower
            for phrase in (
                "minimum balance",
                "maintain the required",
                "what happens if",
                "service charge",
                "maintenance fee",
                "minimum average balance",
                "balance requirement",
            )
        )

        is_combined_question = (
            asks_about_balance and is_minimum_balance_question
        )

        # Hybrid answer: customer data from PostgreSQL plus policy from ChromaDB.
        if is_combined_question:
            parts = []

            if record.get("balance") is not None:
                parts.append(
                    "Your available account record shows a balance of "
                    f"{fmt_money(record['balance'])} for account "
                    f"{record.get('account_number', 'not specified')}."
                )
            else:
                parts.append(
                    "I couldn't find your current balance in the available "
                    "customer record."
                )

            policy_chunk = next(
                (
                    chunk for chunk in chunks
                    if (
                        "minimum average balance"
                        in chunk.get("excerpt", "").lower()
                        or "service charge may apply"
                        in chunk.get("excerpt", "").lower()
                    )
                ),
                None,
            )

            if policy_chunk:
                policy_cite = (
                    f" (Section {policy_chunk['section']} – "
                    f"{policy_chunk.get('title', 'Policy terms')})"
                    if policy_chunk.get("section")
                    else ""
                )

                parts.append(
                    "Regarding the minimum-balance policy, some account "
                    "plans may require a minimum average balance, while "
                    "others may not. If the required balance is not "
                    "maintained, a service charge may apply only where "
                    "the account plan permits it and the customer has "
                    "been informed of the applicable fee. Check your "
                    "account-plan schedule to confirm the exact "
                    f"requirement and charge.{policy_cite}"
                )
            else:
                parts.append(
                    "I couldn't find a relevant minimum-balance policy "
                    "clause. Please check your account-plan schedule or "
                    "contact your bank's support team."
                )

            return "\n\n".join(parts)

        # Answer a simple balance question using PostgreSQL data.
        is_balance_lookup = (
            asks_about_balance
            and not is_minimum_balance_question
            and not any(
                phrase in question_lower
                for phrase in (
                    "service charge",
                    "maintenance fee",
                    "penalty",
                    "charges",
                    "fee",
                    "fees",
                )
            )
        )

        if is_balance_lookup and record.get("balance") is not None:
            return (
                "Your available account record shows a balance of "
                f"{fmt_money(record['balance'])} for account "
                f"{record.get('account_number', 'not specified')}."
            )

        # Answer minimum-balance questions from the relevant policy clause.
        if is_minimum_balance_question:
            policy_chunk = next(
                (
                    chunk for chunk in chunks
                    if (
                        "minimum average balance"
                        in chunk.get("excerpt", "").lower()
                        or "service charge may apply"
                        in chunk.get("excerpt", "").lower()
                    )
                ),
                None,
            )

            if policy_chunk:
                policy_cite = (
                    f" (Section {policy_chunk['section']} – "
                    f"{policy_chunk.get('title', 'Policy terms')})"
                    if policy_chunk.get("section")
                    else ""
                )

                excerpt = policy_chunk.get("excerpt", "").lower()

                if (
                    "minimum average balance" in excerpt
                    or "service charge may apply" in excerpt
                ):
                    return (
                        "If your savings account has a minimum average "
                        "balance requirement and you do not maintain it, "
                        "a service charge may apply only if your account "
                        "plan permits the charge and you have been informed "
                        "of the applicable fee. Check your account-plan "
                        "schedule to confirm the requirement and charge."
                        f"{policy_cite}"
                    )

                return (
                    "The retrieved banking policy states: "
                    f"{policy_chunk.get('excerpt', '')}{policy_cite}"
                )

            return (
                "I couldn't find a relevant policy clause about minimum "
                "balance requirements or associated charges. Please contact "
                "your bank's support team to confirm the applicable rules."
            )

        # Transaction answers use the transaction record.
        # Do not attach the first retrieved policy automatically.
        if intent == "transaction":
            transaction_id = record.get(
                "transaction_id", "the transaction"
            )
            status = record.get(
                "transaction_status", "not available"
            )
            amount = record.get("amount")

            amount_text = (
                fmt_money(amount)
                if amount is not None
                else "an unspecified amount"
            )

            result = (
                f"Transaction {transaction_id} for {amount_text} "
                f"is recorded as {status}."
            )

            if record.get("description"):
                result += f" Details: {record['description']}."

            # Only include policy guidance for a relevant failed or pending
            # transaction. A successful transaction gets no unrelated citation.
            status_lower = str(status).lower()

            if status_lower in {"failed", "pending"}:
                relevant_chunk = None

                for chunk in chunks:
                    policy_text = (
                        f"{chunk.get('title', '')} "
                        f"{chunk.get('excerpt', '')}"
                    ).lower()

                    if status_lower == "failed" and any(
                        term in policy_text
                        for term in ("failed", "reversal", "debited")
                    ):
                        relevant_chunk = chunk
                        break

                    if status_lower == "pending" and any(
                        term in policy_text
                        for term in ("pending", "delayed", "status")
                    ):
                        relevant_chunk = chunk
                        break

                if relevant_chunk:
                    section = relevant_chunk.get("section")
                    title = relevant_chunk.get("title", "Policy terms")

                    policy_cite = (
                        f" (Section {section} – {title})"
                        if section
                        else ""
                    )

                    result += (
                        " Please refer to the relevant payment guidance: "
                        f"{relevant_chunk.get('excerpt', '')}"
                        f"{policy_cite}"
                    )

            return result

        if intent == "card":
            card_status = record.get("card_status")

            if card_status:
                return (
                    "Your card ending in "
                    f"{record.get('last_four_digits', '****')} "
                    f"is recorded as {card_status}."
                )

        if intent == "loan":
            outstanding = record.get("outstanding_amount")

            if outstanding is not None:
                result = (
                    f"Loan {record.get('loan_id', '')} has an outstanding "
                    f"amount of {fmt_money(outstanding)} and is recorded as "
                    f"{record.get('loan_status', 'status unavailable')}."
                )

                if record.get("next_due_date"):
                    result += (
                        f" The next due date is "
                        f"{record['next_due_date']}."
                    )

                return result

        if intent == "complaint":
            result = (
                f"Complaint {record.get('complaint_id', '')} is recorded as "
                f"{record.get('complaint_status', 'status unavailable')}."
            )

            if record.get("resolution"):
                result += f" Recorded resolution: {record['resolution']}."

            return result

        if c:
            return (
                "Your available banking record contains relevant information. "
                f"The applicable document states: {c.get('excerpt', '')}{cite}."
            )

        return (
            "I found a banking record, but it does not contain enough "
            "information to answer this question accurately. "
            "Please contact your bank's support team."
        )

    # Existing insurance fallback behavior.
    if intent == "penalty" and record:
        if not record.get("late_fee"):
            return (
                "No late fee was applied to transaction "
                f"{record.get('transaction_id', 'the payment')}. "
                "Please check the payment record for details."
            )

        due_value = record.get("due_date")
        paid_value = record.get("payment_date")

        if due_value and paid_value:
            from datetime import date

            due = date.fromisoformat(due_value)
            paid = date.fromisoformat(paid_value)

            return (
                f"Your premium for {record.get('policy_name', 'your policy')} "
                f"was due on {fmt_date(due)}, but payment was received on "
                f"{fmt_date(paid)}. A late fee of "
                f"{fmt_money(record['late_fee'])} was recorded{cite}."
            )

    if intent == "renewal" and record:
        due_value = record.get("renewal_due_date")
        premium = record.get("premium_amount")

        if due_value:
            from datetime import date

            due = date.fromisoformat(due_value)

            result = (
                f"Your {record.get('policy_name', 'policy')} renewal "
                f"is due on {fmt_date(due)}."
            )

            if record.get("days_remaining") is not None:
                result += f" That is {record['days_remaining']} days away."

            if premium is not None:
                result += f" The premium is {fmt_money(premium)}."

            return result + (
                f" See{cite} for renewal terms." if cite else ""
            )

    if intent == "claim" and record:
        amount = record.get("claim_amount")

        result = (
            f"Claim {record.get('claim_id', '')} "
            f"{'for ' + fmt_money(amount) + ' ' if amount is not None else ''}"
            f"on {record.get('policy_name', 'your policy')} is recorded as "
            f"{record.get('claim_status', 'status unavailable')}."
        )

        if record.get("rejection_reason"):
            result += f" Recorded reason: {record['rejection_reason']}."

        return result + (
            f" See{cite} for relevant terms." if cite else ""
        )

    if record:
        policy_name = record.get("policy_name", "your policy")
        coverage = record.get("coverage_amount")
        premium = record.get("premium_amount")

        result = f"Your record relates to {policy_name}."

        if coverage is not None:
            result += f" Coverage is {fmt_money(coverage)}."

        if premium is not None:
            result += f" The premium is {fmt_money(premium)}."

        return result + (f" See{cite} for details." if cite else "")

    if c:
        return (
            "Based on the available policy document, "
            f"{c.get('excerpt', '')}{cite}. "
            "I couldn't find matching customer-specific records."
        )

    return (
        "I couldn't find matching records for that question. "
        "Please contact customer support for help."
    )


def generate(
    question: str,
    intent: str,
    record: dict,
    chunks: list[dict],
    domain: str = "insurance",
) -> tuple[str, str]:
    """Return (answer, generation_mode)."""
    if domain not in {"banking", "insurance"}:
        domain = "insurance"

    if settings.gemini_api_key:
        try:
            answer = _gemini(
                question, record, chunks, domain=domain
            )
            return answer, "gemini"
        except Exception as exc:
            log.warning(
                "Gemini generation failed; using template fallback: %s",
                exc,
            )

    return (
        _template(
            intent,
            record,
            chunks,
            domain=domain,
            question=question,
        ),
        "template-fallback",
    )
