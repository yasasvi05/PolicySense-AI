import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  (register tables)
from .config import settings
from .db import Base, SessionLocal, engine
from .rag import vectorstore
from .routers import admin, assistant, auth, customer
from .seed import seed

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    if settings.seed_demo_data:
        with SessionLocal() as db:
            seed(db)
    yield


app = FastAPI(title="PolicySense AI API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_list, allow_credentials=True,
                   allow_methods=["GET", "POST", "PATCH", "DELETE"], allow_headers=["Authorization", "Content-Type"])

for r in (auth.router, customer.router, assistant.router, admin.router):
    app.include_router(r)


@app.get("/api/health")
def health():
    """Tells the frontend which parts of the hybrid pipeline are really available."""
    return {"status": "ok", "gemini_configured": bool(settings.gemini_api_key), "vector_store_available": vectorstore.available(),
            "database": engine.url.get_backend_name()}
