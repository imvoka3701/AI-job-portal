#!/bin/bash

# ============================================================
# AI Job Portal — Clean Temporary Files for Transfer
# ============================================================

echo "============================================================"
echo "  AI Job Portal — Clean Temporary Files for Transfer"
echo "  (Xóa các thư mục rác / build / dependencies nặng)"
echo "============================================================"

read -p "Bạn có chắc chắn muốn xóa node_modules, venv, pycache, dist? (y/N): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Hủy thao tác."
    exit 0
fi

echo "⏳ [*] Đang dọn dẹp các thư mục rác..."

rm -rf frontend/node_modules node_modules
rm -rf .venv venv backend/venv
rm -rf frontend/dist dist frontend/dist-ssr
rm -rf .pytest_cache backend/.pytest_cache frontend/.pytest_cache
rm -rf .ruff_cache backend/.ruff_cache
rm -rf test-results frontend/test-results backend/test-results
rm -rf playwright-report blob-report
rm -rf .coverage htmlcov coverage.xml

# Xóa toàn bộ __pycache__ và .pyc
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true
find . -type f -name "*.pyo" -delete 2>/dev/null || true
rm -f debug.log frontend/debug.log backend/debug.log

echo ""
echo "✅ [SUCCESS] Dọn dẹp hoàn tất! Dự án đã sẵn sàng để nén zip chuyển giao."
echo "💡 Lưu ý: Hãy giữ lại file 'backup.sql' và '.env.example'."
echo "============================================================"
