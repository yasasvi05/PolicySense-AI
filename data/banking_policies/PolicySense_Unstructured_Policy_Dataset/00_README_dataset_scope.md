# PolicySense AI — Synthetic Banking Policy Corpus

**Dataset type:** Unstructured text documents for Retrieval-Augmented Generation (RAG)  
**Institution:** Northstar Community Bank (fictional)  
**Version:** 1.0  
**Status:** Synthetic demonstration data — not an actual bank's policy and not legal or financial advice.

## Purpose
This corpus is designed for the unstructured-document side of PolicySense AI. A RAG pipeline can load these Markdown (`.md`) files, split them into chunks, create embeddings, store the chunks in a vector database, and retrieve relevant passages to ground chatbot answers.

## Contents
The corpus contains fictional policy documents covering:
1. Savings and current accounts
2. KYC and customer verification
3. Digital payments and transaction disputes
4. UPI payments
5. Debit cards
6. Credit cards
7. Personal-loan repayment
8. Loan prepayment and foreclosure
9. Fixed deposits
10. Banking fees and service charges
11. Customer complaints and escalation
12. Account security and unauthorized transactions

## Important data-design notes
- These are **unstructured policy documents**, not customer records, SQL tables, JSON customer data, or a Q&A dataset.
- Every rule, amount, deadline, threshold, and service target in this corpus is invented for a fictional bank so the chatbot can be demonstrated consistently.
- Do not present these simulated terms as real banking rules. In a real deployment, replace them with approved, current bank policies and applicable regulatory sources.
- When a customer describes a problem, the bot should identify relevant policy passages, explain what the policy says may apply, ask for missing details if necessary, and avoid claiming a cause is confirmed unless the evidence supports it.
- The corpus intentionally includes scope, conditions, exceptions, steps, and escalation guidance to support contextual answers.

## Suggested RAG metadata
For each document, store:
- `document_id`: filename without `.md`
- `document_title`: first-level heading
- `policy_area`: e.g. `digital_payments`
- `source_type`: `synthetic_policy`
- `version`: `1.0`
- `fictional_institution`: `Northstar Community Bank`

## Suggested chunking
Start with chunks of approximately 400–700 tokens and an overlap of 60–100 tokens. Preserve headings with the relevant paragraphs when possible. These are starting values to evaluate, not fixed requirements.
