# ============================================================
# AI Job Portal — Backend Dockerfile
# Multi-stage build: install deps + bake ML model, then slim runtime
# ============================================================

# ---------- Stage 1: Builder ----------
FROM python:3.13-slim AS builder

WORKDIR /build

# System deps needed to compile some Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps into a virtual env for clean copy
COPY requirements.txt .
RUN python -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir --upgrade pip \
    && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# Pre-download the sentence-transformers model into cache
# This avoids a ~130MB download on first container start
ENV HF_HOME=/opt/hf_cache
RUN /opt/venv/bin/python -c \
    "from sentence_transformers import SentenceTransformer; \
     SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')"

# ---------- Stage 2: Runtime ----------
FROM python:3.13-slim AS runtime

WORKDIR /app

# Copy virtual env and HuggingFace model cache from builder
COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /opt/hf_cache /opt/hf_cache

# Make sure we use the venv Python
ENV PATH="/opt/venv/bin:$PATH"
ENV HF_HOME=/opt/hf_cache
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Install runtime-only system deps (pg_isready for health checks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

# Make entrypoint executable
RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
