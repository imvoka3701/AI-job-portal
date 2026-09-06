# ==============================================================================
# JobPortal B2B SaaS - One-Touch CI/CD Local Verification Script
# Chạy toàn bộ các bước kiểm tra tương tự GitHub Actions trước khi push
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 JOBPORTAL - LOCAL CI/CD SANITY CHECK" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$root = Resolve-Path "$PSScriptRoot\.."
$hasError = $false

# 1. Frontend Lint
Write-Host "`n[1/3] 📦 Kiểm tra ESLint Frontend..." -ForegroundColor Yellow
Push-Location "$root\frontend"
try {
    npm run lint
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Frontend ESLint thất bại!" -ForegroundColor Red
        $hasError = $true
    } else {
        Write-Host "✅ Frontend ESLint thành công (0 lỗi)." -ForegroundColor Green
    }
} finally {
    Pop-Location
}

# 2. Backend Ruff Check
Write-Host "`n[2/3] 🐍 Kiểm tra Ruff Linter Backend..." -ForegroundColor Yellow
$ruff = "$root\backend\venv\Scripts\ruff.exe"
if (-not (Test-Path $ruff)) {
    $ruff = "ruff"
}
Push-Location "$root\backend"
try {
    & $ruff check app tests
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Backend Ruff thất bại! Gợi ý: chạy '$ruff check --fix app tests'" -ForegroundColor Red
        $hasError = $true
    } else {
        Write-Host "✅ Backend Ruff thành công (0 lỗi)." -ForegroundColor Green
    }
} finally {
    Pop-Location
}

# 3. Backend Pytest
Write-Host "`n[3/3] 🧪 Chạy kiểm thử Backend (Pytest with Coverage)..." -ForegroundColor Yellow
$pytest = "$root\backend\venv\Scripts\pytest.exe"
if (-not (Test-Path $pytest)) {
    $pytest = "pytest"
}
Push-Location "$root\backend"
try {
    $env:DATABASE_URL = "sqlite:///:memory:"
    $env:SECRET_KEY = "test-secret"
    & $pytest --cov=app --cov-report=term-missing --cov-fail-under=80 -q
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Backend Pytest thất bại!" -ForegroundColor Red
        $hasError = $true
    } else {
        Write-Host "✅ Backend Pytest thành công (100% passed, đạt chuẩn coverage)." -ForegroundColor Green
    }
} finally {
    Pop-Location
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
if ($hasError) {
    Write-Host "🛑 KIỂM TRA THẤT BẠI: Vui lòng sửa lỗi trước khi push lên GitHub!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "🎉 CHÚC MỪNG: Toàn bộ kiểm tra đều XANH! Sẵn sàng push lên GitHub." -ForegroundColor Green
    exit 0
}