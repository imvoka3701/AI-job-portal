#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR/../backend"

echo "=============================================================================="
echo "      AI-POWERED JOB PORTAL — BỘ KIỂM THỬ ĐÁNH GIÁ NGHIỆM THU KT3 / B2B"
echo "=============================================================================="
echo ""

if [ -f "venv/bin/pytest" ]; then
    PYTEST_BIN="venv/bin/pytest"
elif [ -f "venv/Scripts/pytest.exe" ]; then
    PYTEST_BIN="venv/Scripts/pytest.exe"
else
    PYTEST_BIN="pytest"
fi

echo "Đang thực thi bộ test KT3 (Cache, Retry, Circuit Breaker, RBAC, Prompt Armor)..."
"$PYTEST_BIN" -v --no-cov tests/test_ai_kt3_suite.py

echo ""
echo "=============================================================================="
echo "[THÀNH CÔNG] 100% TEST CASES ĐẠT CHUẨN ĐÁNH GIÁ KT3!"
echo "=============================================================================="
