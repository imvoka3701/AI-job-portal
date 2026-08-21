#!/bin/bash
set -e

# ============================================================
# AI Job Portal — Backup Database (PostgreSQL)
# ============================================================

BACKUP_FILE="${1:-backup.sql}"

echo "============================================================"
echo "  AI Job Portal — Backup Database (PostgreSQL)"
echo "============================================================"

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -w "aijob-db" > /dev/null; then
    echo "❌ [ERROR] Container 'aijob-db' is not running!"
    echo "Please start the database container first: docker compose up -d db"
    exit 1
fi

echo "⏳ [*] Exporting database from 'aijob-db' to '${BACKUP_FILE}'..."
docker exec -i aijob-db pg_dump -U postgres -d ai_job_portal --clean --if-exists --exclude-table-data=oauth_accounts > "${BACKUP_FILE}"

echo ""
echo "✅ [SUCCESS] Database backup completed successfully: ${BACKUP_FILE}"
if [ -f "${BACKUP_FILE}" ]; then
    ls -lh "${BACKUP_FILE}"
fi
echo "============================================================"
