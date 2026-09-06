#!/usr/bin/env bash
# ==============================================================================
# JobPortal B2B SaaS - One-Touch CI/CD Local Verification Script (Linux/Mac)
# ==============================================================================

set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=========================================================="
echo "?? JOBPORTAL - LOCAL CI/CD SANITY CHECK"
echo "=========================================================="

echo -e "\n[1/3] ?? Ki?m tra ESLint Frontend..."
(cd "$ROOT_DIR/frontend" && npm run lint)

echo -e "\n[2/3] ?? Ki?m tra Ruff Linter Backend..."
RUFF_CMD="ruff"
if [ -f "$ROOT_DIR/backend/venv/bin/ruff" ]; then
    RUFF_CMD="$ROOT_DIR/backend/venv/bin/ruff"
elif [ -f "$ROOT_DIR/backend/venv/Scripts/ruff.exe" ]; then
    RUFF_CMD="$ROOT_DIR/backend/venv/Scripts/ruff.exe"
fi
(cd "$ROOT_DIR/backend" && $RUFF_CMD check app tests)

echo -e "\n[3/3] ?? Ch?y ki?m th? Backend (Pytest with Coverage)..."
PYTEST_CMD="pytest"
if [ -f "$ROOT_DIR/backend/venv/bin/pytest" ]; then
    PYTEST_CMD="$ROOT_DIR/backend/venv/bin/pytest"
elif [ -f "$ROOT_DIR/backend/venv/Scripts/pytest.exe" ]; then
    PYTEST_CMD="$ROOT_DIR/backend/venv/Scripts/pytest.exe"
fi
(cd "$ROOT_DIR/backend" && DATABASE_URL="sqlite:///:memory:" SECRET_KEY="test-secret" $PYTEST_CMD --cov=app --cov-report=term-missing --cov-fail-under=80 -q)

echo "=========================================================="
echo "?? CH?C M?NG: To?n b? ki?m tra ??u XANH! S?n s?ng push l?n GitHub."
echo "=========================================================="