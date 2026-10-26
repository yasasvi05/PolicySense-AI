
"""Section-aware chunking for policy documents."""

import re

from . import vectorstore  # Not required for chunking; kept out of processing logic.


# Supports headings such as:
# ## 3. Minimum balance
# 3.1 Minimum balance
# Section 6.2 - Account closure
# 4. Inactive and dormant accounts
HEADER = re.compile(
    r"^\s{0,3}(?:#{1,6}\s*)?"
    r"(?:Section\s+)?"
    r"(\d+(?:\.\d+)*)"
    r"\s*[-–—:.]?\s+"
    r"([^\n]{2,100}?)\s*$",
    re.IGNORECASE,
)


def _split_long(text: str, size: int, overlap: int) -> list[str]:
    """Split oversized sections into smaller, overlapping chunks."""
    if len(text) <= size:
        return [text]

    try:
        from langchain_text_splitters import RecursiveCharacterTextSplitter

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=size,
            chunk_overlap=overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
        )
        return splitter.split_text(text)

    except ImportError:
        words = text.split()
        output = []
        current = []
        current_length = 0

        for word in words:
            extra_length = len(word) + (1 if current else 0)

            if current and current_length + extra_length > size:
                output.append(" ".join(current))

                overlap_words = []
                overlap_length = 0

                for old_word in reversed(current):
                    added = len(old_word) + (1 if overlap_words else 0)
                    if overlap_length + added > overlap:
                        break
                    overlap_words.insert(0, old_word)
                    overlap_length += added

                current = overlap_words
                current_length = len(" ".join(current))

            current_length += len(word) + (1 if current else 0)
            current.append(word)

        if current:
            output.append(" ".join(current))

        return output


def chunk_text(
    text: str,
    size: int = 900,
    overlap: int = 120,
) -> list[dict]:
    """Split text by numbered headings and preserve section metadata."""
    sections = []
    current = {
        "section": "",
        "title": "General",
        "lines": [],
    }

    for line in text.splitlines():
        stripped = line.strip()
        match = HEADER.match(stripped)

        if match:
            title = match.group(2).strip().strip("*# ").rstrip(" .:-")

            # Avoid treating ordinary numbered list items as headings.
            if len(title) >= 3 and not title.isdigit():
                if any(item.strip() for item in current["lines"]):
                    sections.append(current)

                current = {
                    "section": match.group(1).strip(),
                    "title": title,
                    "lines": [],
                }
                continue

        current["lines"].append(line)

    if any(item.strip() for item in current["lines"]):
        sections.append(current)

    chunks = []

    for section in sections:
        body = "\n".join(
            line.strip()
            for line in section["lines"]
            if line.strip()
        ).strip()

        if not body:
            continue

        for piece in _split_long(body, size, overlap):
            piece = piece.strip()
            if not piece:
                continue

            chunks.append({
                "section": section["section"],
                "title": section["title"],
                "text": piece,
            })

    return chunks
