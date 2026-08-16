"""Embedding Service — local sentence-transformers for generating resume embeddings.

Uses paraphrase-multilingual-MiniLM-L12-v2 (384-dim vectors, supports Vietnamese).
The model is loaded once at import time and reused for all requests.
"""

import logging
from collections.abc import Sequence

from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

# Model identifier — multilingual, lightweight, CPU-friendly
MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"

# Embedding dimension must match models/resume.py:EMBEDDING_DIM
EMBEDDING_DIM = 384

# Load model once at module import (i.e. at app startup)
logger.info("Loading embedding model '%s' ...", MODEL_NAME)
_model = SentenceTransformer(MODEL_NAME)
logger.info("Embedding model loaded. Dimension: %d", _model.get_sentence_embedding_dimension())


def generate_embedding(text: str) -> list[float]:
    """Generate a 384-dimensional embedding vector for the given text.

    Args:
        text: The resume text to embed.

    Returns:
        A list of 384 float values representing the embedding.

    Raises:
        ValueError: If the input text is empty or only whitespace.
    """
    stripped = text.strip()
    if not stripped:
        raise ValueError("Cannot generate embedding from empty text")

    # encode returns a numpy array; convert to plain Python list[float]
    embedding: Sequence[float] = _model.encode(stripped, normalize_embeddings=True).tolist()
    return list(embedding)
