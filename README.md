# PolicySense AI – Hybrid RAG-Based Intelligent Customer Support

> PostgreSQL tells us **what happened** to the customer.
> ChromaDB tells us **what the policy says**.
> The LLM explains **why the policy applies** to that customer.

React + Tailwind frontend, FastAPI backend, LangChain + Gemini + ChromaDB + Sentence Transformers for the RAG layer.

## Quick start (frontend only, ~1 minute)

Needs Node.js 18+.

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

It starts in **mock mode** (`VITE_USE_MOCK=true`): all data comes from `src/mock/`. The UI shows a "Mock data mode" label, and every AI answer is labelled as a mock service. Nothing is pretending to be connected.

Demo logins (also shown on the login page):

| Role     | Email                       | Password       |
|----------|-----------------------------|----------------|
| Customer | rahul.sharma@example.com    | Customer@123   |
| Admin    | admin@policysense.ai        | Admin@123      |

## Run the full stack (real backend)

Needs Python 3.10+.

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate      macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt            # core API: runs immediately, SQLite by default
uvicorn app.main:app --reload --port 8000  # docs at http://localhost:8000/docs
```

Then in `frontend/.env` set `VITE_USE_MOCK=false` and restart `npm run dev`.

On first start the backend creates the tables and seeds the same synthetic data (Rahul's ₹500 late fee included).

### Turn on the real RAG pipeline

```bash
pip install -r requirements-ai.txt     # LangChain, ChromaDB, Sentence Transformers, PyMuPDF
cp .env.example .env                   # then edit .env
```

In `backend/.env`:

- `GEMINI_API_KEY=...` (get one from Google AI Studio). Without it, answers use a clearly-labelled template fallback.
- `DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/policysense` to use PostgreSQL (create the empty database first). SQLite is the default so it runs with zero setup.

Delete `backend/policysense.db` and `backend/chroma_store/` after installing the AI extras so the sample policy documents get embedded on the next start (the first run downloads the embedding model, ~90 MB).

Every assistant answer reports what actually ran (`retrieval`: chromadb or keyword-fallback, `generation`: gemini or template-fallback). The UI shows this under "Hybrid RAG Response" and in "How this was built".

## Account activation (register)

Customers don't self-create policies: they **activate** an account that already exists. On `/register` they enter their Customer ID + the email on file + a new password. Try `CUST1002` / `priya@example.com` (CUST1003-1006 use `firstname@example.com`). `CUST1001` (Rahul) already has a login. All mismatches return one generic error so IDs can't be probed. TODO: email OTP verification and rate limiting before production.

## The demo flow

1. Login as **Demo Customer**.
2. Dashboard shows the ₹500 late-fee banner on `TXN1001` → click **Ask why**
   (or open **AI Policy Assistant** and ask *"Why was I charged ₹500 extra?"*).
3. The answer streams in, followed by **Retrieved Customer Data** (PostgreSQL: due date 02 Jul, payment date 05 Jul, ₹500) and **Retrieved Policy Information** (ChromaDB: Late Payment Clause, Section 6.2), plus a grounding indicator and source viewers.

## Project layout

```
backend/
  app/
    main.py            FastAPI app, CORS, startup seeding
    config.py          env-based settings (no secrets in code)
    models.py          customers, policies, payments, claims, renewals (+ users, documents, chunks, query logs)
    security.py        JWT + role guards (customer / admin)
    routers/           auth, customer, assistant, admin
    rag/
      chunking.py      section-aware chunking
      vectorstore.py   ChromaDB + Sentence Transformers
      retriever.py     hybrid retrieval: SQL facts + policy clauses
      generator.py     LangChain + Gemini (template fallback)
      pipeline.py      orchestrates one query, returns an honest trace
      ingestion.py     PDF -> text -> chunks -> embeddings -> Chroma
  sample_docs/         synthetic policy terms used for the demo
frontend/
  src/
    services/          realApi.js (FastAPI client) · index.js picks mock or real
    mock/              data.js + mockApi.js  (the ONLY place fake data lives)
    components/        ui kit, charts, layout, assistant (HybridAnswer)
    pages/             Landing, Login, customer/*, admin/*
```

## API (all under `/api`)

`POST /auth/login` · `GET /customer/profile` · `PATCH /customer/profile` · `GET /customer/policies|payments|renewals|claims|notifications` ·
`POST /assistant/query` · `GET /assistant/sources?query_id=` · `POST /assistant/feedback` ·
`POST /admin/documents/upload` · `GET /admin/documents` · `DELETE /admin/documents/{id}` · `GET /admin/customers` · `GET /admin/customers/{id}` · `GET /admin/analytics`

## Security notes

- Customer endpoints take the customer ID from the **JWT**, never from the request, so a customer can only read their own rows.
- Admin routes require the admin role. Uploads are limited to PDF/TXT, 15 MB.
- Gemini key and DB credentials live only in `backend/.env`. CORS is limited to `CORS_ORIGINS`.
- **Before any real deployment:** set a strong `JWT_SECRET`, set `SEED_DEMO_DATA=false`, serve over HTTPS, and add rate limiting.

## Known TODOs (marked in code)

- **Renew Now** has no payment gateway yet (shows an info toast).
- **Forgot password** is not implemented (needs reset-token + email).
- `renewal_trends` analytics are static sample data in the backend.
- Policy benefits/exclusions come from `backend/app/catalog.py`; move them into PostgreSQL tables.
- The assistant's SQL step uses keyword-based intent detection. For production, replace with an LLM/tool-based router.
