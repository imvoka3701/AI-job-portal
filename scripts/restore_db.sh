#!/bin/bash
set -e

# ============================================================
# AI Job Portal — Restore Database (PostgreSQL)
# ============================================================

BACKUP_FILE="${1:-backup.sql}"

echo "============================================================"
echo "  AI Job Portal — Restore Database (PostgreSQL)"
echo "============================================================"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "❌ [ERROR] Backup file '${BACKUP_FILE}' not found!"
    exit 1
fi

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -w "aijob-db" > /dev/null; then
    echo "❌ [ERROR] Container 'aijob-db' is not running!"
    echo "Please start the database container first: docker compose up -d db"
    exit 1
fi

echo "⏳ [*] Restoring database from '${BACKUP_FILE}' to 'aijob-db'..."
docker exec -i aijob-db psql -U postgres -d ai_job_portal < "${BACKUP_FILE}"

echo ""
echo "✅ [SUCCESS] Database restored successfully!"
echo "============================================================"
