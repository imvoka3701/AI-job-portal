#!/bin/bash
# ============================================================
# AI Job Portal — Automated Database Backup Script (K1.4)
#
# Chức năng:
#   - Tạo backup PostgreSQL dạng custom format (.dump)
#   - Giữ lại tối đa N bản backup gần nhất (rotation)
#   - Ghi log kết quả backup
#
# Sử dụng:
#   1. Chạy thủ công:
#      ./scripts/backup_database.sh
#
#   2. Cron job tự động (mỗi ngày lúc 2:00 AM):
#      crontab -e
#      0 2 * * * /path/to/ai-job-portal/scripts/backup_database.sh >> /var/log/aijob_backup.log 2>&1
#
#   3. Chạy trong Docker:
#      docker exec aijob-backend /app/scripts/backup_database.sh
#
# Cấu hình qua biến môi trường:
#   BACKUP_DIR       — Thư mục lưu backup (mặc định: ./backups)
#   BACKUP_RETENTION — Số bản backup giữ lại (mặc định: 7)
#   DATABASE_URL     — Connection string PostgreSQL
# ============================================================

set -euo pipefail

# --- Configuration ---
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_RETENTION="${BACKUP_RETENTION:-7}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/aijob_backup_${TIMESTAMP}.dump"
LOG_PREFIX="[BACKUP $(date '+%Y-%m-%d %H:%M:%S')]"

# --- Parse DATABASE_URL ---
if [ -z "${DATABASE_URL:-}" ]; then
    echo "${LOG_PREFIX} ❌ ERROR: DATABASE_URL not set. Aborting."
    exit 1
fi

DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_USER=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
PGPASSWORD=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')

export PGPASSWORD

# --- Ensure backup directory exists ---
mkdir -p "${BACKUP_DIR}"

echo "${LOG_PREFIX} 🔄 Starting database backup..."
echo "${LOG_PREFIX}   Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}"
echo "${LOG_PREFIX}   Output: ${BACKUP_FILE}"

# --- Execute pg_dump ---
if pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    -Fc \
    --no-owner \
    --no-privileges \
    -f "${BACKUP_FILE}"; then

    BACKUP_SIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)
    echo "${LOG_PREFIX} ✅ Backup completed successfully!"
    echo "${LOG_PREFIX}   File: ${BACKUP_FILE}"
    echo "${LOG_PREFIX}   Size: ${BACKUP_SIZE}"
else
    echo "${LOG_PREFIX} ❌ ERROR: pg_dump failed with exit code $?"
    unset PGPASSWORD
    exit 1
fi

# --- Rotation: Delete old backups beyond retention limit ---
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "aijob_backup_*.dump" -type f | wc -l)
if [ "${BACKUP_COUNT}" -gt "${BACKUP_RETENTION}" ]; then
    DELETE_COUNT=$((BACKUP_COUNT - BACKUP_RETENTION))
    echo "${LOG_PREFIX} 🗑️  Rotating: Removing ${DELETE_COUNT} old backup(s) (keeping latest ${BACKUP_RETENTION})..."
    find "${BACKUP_DIR}" -name "aijob_backup_*.dump" -type f \
        | sort \
        | head -n "${DELETE_COUNT}" \
        | xargs rm -f
    echo "${LOG_PREFIX}   ✅ Rotation complete."
else
    echo "${LOG_PREFIX}   📦 Backup count: ${BACKUP_COUNT}/${BACKUP_RETENTION} (no rotation needed)"
fi

# --- Cleanup ---
unset PGPASSWORD

echo "${LOG_PREFIX} 🎉 Backup process finished."
echo ""
