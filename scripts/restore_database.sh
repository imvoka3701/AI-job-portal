#!/bin/bash
# ============================================================
# AI Job Portal — Database Restore Script (K1.5)
#
# Chức năng:
#   - Phục hồi database từ bản backup (.dump) tạo bởi backup_database.sh
#   - Hiển thị danh sách backup có sẵn nếu không chỉ định file
#
# Sử dụng:
#   ./scripts/restore_database.sh backups/aijob_backup_20260919_020000.dump
#
# ⚠️ CẢNH BÁO: Script này sẽ XÓA TOÀN BỘ dữ liệu hiện tại và thay thế
#    bằng dữ liệu từ bản backup. Hãy chắc chắn trước khi chạy!
# ============================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
LOG_PREFIX="[RESTORE $(date '+%Y-%m-%d %H:%M:%S')]"

# --- Check argument ---
if [ -z "${1:-}" ]; then
    echo "${LOG_PREFIX} ❌ Thiếu tham số: đường dẫn file backup."
    echo ""
    echo "📝 Cách dùng:"
    echo "   ./scripts/restore_database.sh <path-to-backup.dump>"
    echo ""

    # List available backups
    if [ -d "${BACKUP_DIR}" ]; then
        echo "📦 Các bản backup có sẵn trong ${BACKUP_DIR}:"
        find "${BACKUP_DIR}" -name "aijob_backup_*.dump" -type f -exec ls -lh {} \; | sort -k9
    else
        echo "⚠️  Thư mục backup '${BACKUP_DIR}' không tồn tại."
    fi
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "${LOG_PREFIX} ❌ ERROR: File không tồn tại: ${BACKUP_FILE}"
    exit 1
fi

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

BACKUP_SIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)

echo "${LOG_PREFIX} ⚠️  =========================================="
echo "${LOG_PREFIX} ⚠️  CẢNH BÁO: TOÀN BỘ DỮ LIỆU HIỆN TẠI SẼ BỊ XÓA!"
echo "${LOG_PREFIX} ⚠️  Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}"
echo "${LOG_PREFIX} ⚠️  Backup file: ${BACKUP_FILE} (${BACKUP_SIZE})"
echo "${LOG_PREFIX} ⚠️  =========================================="
echo ""
read -p "Nhập 'YES' để xác nhận phục hồi: " CONFIRM

if [ "${CONFIRM}" != "YES" ]; then
    echo "${LOG_PREFIX} ❌ Đã hủy. Không có thay đổi nào được thực hiện."
    unset PGPASSWORD
    exit 0
fi

echo "${LOG_PREFIX} 🔄 Starting database restore..."

# --- Restore ---
if pg_restore \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    "${BACKUP_FILE}"; then

    echo "${LOG_PREFIX} ✅ Database restored successfully from: ${BACKUP_FILE}"
else
    EXIT_CODE=$?
    # pg_restore returns non-zero for warnings (e.g., "relation does not exist")
    # which are generally safe to ignore with --clean --if-exists
    if [ ${EXIT_CODE} -eq 1 ]; then
        echo "${LOG_PREFIX} ⚠️  Restore completed with warnings (exit code 1). This is usually safe."
    else
        echo "${LOG_PREFIX} ❌ ERROR: pg_restore failed with exit code ${EXIT_CODE}"
        unset PGPASSWORD
        exit 1
    fi
fi

# --- Cleanup ---
unset PGPASSWORD

echo "${LOG_PREFIX} 🎉 Restore process finished."
echo "${LOG_PREFIX} 💡 Khuyến nghị: Chạy lại 'alembic upgrade head' để đảm bảo schema migration."
echo ""
