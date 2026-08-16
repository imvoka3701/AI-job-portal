#!/bin/bash
set -e

echo "========================================"
echo "  AI Job Portal — Backend Entrypoint"
echo "========================================"

# --- 0. Print environment info (masked) for debugging ---
echo "[0/6] Environment verification..."
echo "  DATABASE_URL = ${DATABASE_URL:0:25}...***"
echo "  FRONTEND_URL = ${FRONTEND_URL:-<not set>}"
echo "  CORS_ORIGINS = ${CORS_ORIGINS:-<not set>}"
echo "  DEEPSEEK_BASE_URL = ${DEEPSEEK_BASE_URL:-<not set>}"
echo "  LLM_MODEL = ${LLM_MODEL:-<not set>}"
echo "  LOG_LEVEL = ${LOG_LEVEL:-INFO}"
if [ -n "$AI_AUDIT_LOG_FILE" ]; then
    echo "  AI_AUDIT_LOG_FILE = $AI_AUDIT_LOG_FILE (file mode)"
else
    echo "  AI_AUDIT_LOG_FILE = <not set> → stdout mode"
fi
if [ -n "$DEEPSEEK_API_KEY" ]; then
    echo "  DEEPSEEK_API_KEY = ${DEEPSEEK_API_KEY:0:8}...*** (set)"
else
    echo "  DEEPSEEK_API_KEY = <NOT SET> ⚠️  AI features will not work!"
fi
if [ -n "$GOOGLE_CLIENT_ID" ]; then
    echo "  GOOGLE_CLIENT_ID = ${GOOGLE_CLIENT_ID:0:12}... (set)"
else
    echo "  GOOGLE_CLIENT_ID = <not set> (Google OAuth disabled)"
fi
echo "  ✅ Environment verified"

# --- 1. Wait for PostgreSQL to be ready ---
echo "[1/6] Waiting for PostgreSQL..."

# Extract host and port from DATABASE_URL
# Format: postgresql://user:pass@host:port/dbname
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')

if [ -z "$DB_HOST" ]; then
    DB_HOST="db"
fi
if [ -z "$DB_PORT" ]; then
    DB_PORT="5432"
fi

MAX_RETRIES=30
RETRY_COUNT=0
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -q; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "ERROR: PostgreSQL not ready after $MAX_RETRIES attempts. Exiting."
        exit 1
    fi
    echo "  PostgreSQL not ready yet... (attempt $RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done
echo "  ✅ PostgreSQL is ready!"

# --- 2. Install pgvector extension ---
echo "[2/6] Ensuring pgvector extension..."
DB_USER=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
PGPASSWORD=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')

export PGPASSWORD
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null || \
    echo "  ⚠️  Could not create pgvector extension (may already exist or need superuser)"
unset PGPASSWORD
echo "  ✅ pgvector extension ready"

# --- 3. Run Alembic migrations ---
echo "[3/6] Running database migrations..."
alembic upgrade head
echo "  ✅ Migrations complete"

# --- 4. Seed admin account ---
echo "[4/6] Seeding admin account..."
python seed_admin.py
echo "  ✅ Seed complete"

# --- 5. Seed demo data (only if DB is empty) ---
echo "[5/6] Checking for demo data..."
if [ -f "seed_demo_data.py" ]; then
    python seed_demo_data.py
    echo "  ✅ Demo data check complete"
else
    echo "  ⏭️  seed_demo_data.py not found, skipping"
fi

echo ""
echo "========================================"
echo "  Starting uvicorn on 0.0.0.0:8000"
echo "========================================"

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
