
"""ChromaDB + Sentence Transformers.

Imports are lazy so the API can start without the AI extras installed.
"""

import logging
import re

from ..config import settings

log = logging.getLogger("policysense.vectorstore")

_model = None
_collection = None


def available() -> bool:
    """Check whether the vector-store dependencies are installed."""
    try:
        import chromadb  # noqa: F401
        import sentence_transformers  # noqa: F401
        return True
    except ImportError:
        return False


def _embed(texts: list[str]) -> list[list[float]]:
    """Convert text into normalized embedding vectors."""
    global _model

    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(settings.embedding_model)

    return _model.encode(
        texts,
        normalize_embeddings=True,
    ).tolist()


def _col():
    """Get or create the persistent ChromaDB collection."""
    global _collection

    if _collection is None:
        import chromadb

        client = chromadb.PersistentClient(
            path=settings.chroma_dir,
        )
        _collection = client.get_or_create_collection(
            name=settings.chroma_collection,
            metadata={"hnsw:space": "cosine"},
        )

    return _collection


def _clean_text(text: str) -> str:
    """Normalize whitespace in a retrieved policy chunk."""
    text = re.sub(r"\s+", " ", text or "")
    return text.strip()


def _infer_section_title(text: str) -> tuple[str, str]:
    """Infer a useful section number and title from chunk text."""
    text = text or ""

    patterns = [
        r"(?m)^\s{0,3}#{1,6}\s*(\d+(?:\.\d+)*)[.)]?\s+([^\n#]+)",
        r"(?m)^\s*(\d+(?:\.\d+)*)[.)]\s+([^\n]+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            section = match.group(1).strip()
            title = match.group(2).strip().strip("*# ")
            return section, title

    # Also support headings embedded in text after chunking.
    match = re.search(
        r"(?:^|\s)(\d+(?:\.\d+)*)[.)]?\s+"
        r"(Minimum balance|Account opening|Inactive and dormant accounts|"
        r"Account restrictions|Account closure|Exceptions and escalation)"
        r"(?=\s|$)",
        text,
        flags=re.IGNORECASE,
    )

    if match:
        return match.group(1), match.group(2).strip()

    return "", ""


def _excerpt(text: str, max_chars: int = 1200) -> str:
    """Return a readable excerpt without cutting mid-word when possible."""
    text = _clean_text(text)

    if len(text) <= max_chars:
        return text

    shortened = text[:max_chars]
    last_space = shortened.rfind(" ")

    if last_space > max_chars * 0.75:
        shortened = shortened[:last_space]

    return shortened.rstrip(" ,;:-") + "..."


def index_chunks(
    document_id: int,
    filename: str,
    policy_type: str,
    chunks: list[dict],
    domain: str = "insurance",
) -> int:
    """Embed and index document chunks with domain metadata."""
    if domain not in {"banking", "insurance"}:
        raise ValueError("domain must be 'banking' or 'insurance'")

    if not chunks:
        return 0

    col = _col()
    texts = [chunk["text"] for chunk in chunks]
    ids = [f"doc{document_id}-{i}" for i in range(len(chunks))]

    metadatas = []

    for chunk in chunks:
        text = chunk.get("text", "")
        inferred_section, inferred_title = _infer_section_title(text)

        section = str(chunk.get("section") or inferred_section).strip()
        title = str(chunk.get("title") or inferred_title).strip()

        if not title or title.lower() == "general":
            title = inferred_title or title or "Policy terms"

        metadatas.append({
            "document_id": document_id,
            "document": filename,
            "policy_type": policy_type,
            "domain": domain,
            "section": section,
            "title": title,
        })

    col.upsert(
        ids=ids,
        documents=texts,
        embeddings=_embed(texts),
        metadatas=metadatas,
    )

    return len(ids)


def delete_document(document_id: int) -> None:
    """Delete all indexed chunks belonging to a document."""
    if not available():
        return

    try:
        _col().delete(where={"document_id": document_id})
    except Exception as exc:
        log.warning("Chroma delete failed: %s", exc)


def count() -> int:
    """Return the total number of indexed chunks."""
    if not available():
        return 0

    return _col().count()


def search(
    query: str,
    k: int = 4,
    domain: str | None = None,
) -> list[dict]:
    """Search indexed chunks, optionally restricted to a domain."""
    if domain is not None and domain not in {"banking", "insurance"}:
        raise ValueError("domain must be 'banking' or 'insurance'")

    if not available() or k <= 0:
        return []

    col = _col()
    total = col.count()

    if total == 0:
        return []

    where = {"domain": domain} if domain else None
    available_count = total

    if where:
        try:
            matching = col.get(
                where=where,
                include=["metadatas"],
            )
            available_count = len(matching.get("ids", []))
        except Exception:
            log.exception("ChromaDB domain count failed")
            return []

        if available_count == 0:
            return []

    results = col.query(
        query_embeddings=_embed([query]),
        n_results=min(k, available_count),
        where=where,
        include=["documents", "metadatas", "distances"],
    )

    documents = results.get("documents") or [[]]
    metadatas = results.get("metadatas") or [[]]
    distances = results.get("distances") or [[]]

    if not documents[0]:
        return []

    output = []

    for document, metadata, distance in zip(
        documents[0],
        metadatas[0],
        distances[0],
    ):
        metadata = metadata or {}
        section = str(metadata.get("section") or "").strip()
        title = str(metadata.get("title") or "").strip()

        inferred_section, inferred_title = _infer_section_title(document)

        if not section:
            section = inferred_section

        if not title or title.lower() == "general":
            title = inferred_title or title or "Policy terms"

        output.append({
            "title": title,
            "section": section,
            "document": metadata.get("document", ""),
            "domain": metadata.get("domain", "insurance"),
            "excerpt": _excerpt(document),
            "score": round(1 - distance, 3),
        })

    return output
