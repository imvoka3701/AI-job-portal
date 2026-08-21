@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ============================================================
echo   AI Job Portal — Clean Temporary Files for Transfer
echo   (Xóa các thư mục rác / build / dependencies nặng)
echo ============================================================

set /p CONFIRM="Ban co chac chan muon xoa cac thu muc rac (node_modules, venv, pycache, dist) truoc khi nen zip? (Y/N): "
if /i not "!CONFIRM!"=="Y" (
    echo Huy thao tac.
    exit /b 0
)

echo.
echo [*] Dang xoa cac thu muc node_modules, venv, dist ...

if exist "frontend\node_modules" (
    echo - Xoa frontend\node_modules ...
    rmdir /s /q "frontend\node_modules" 2>nul
)

if exist "node_modules" (
    echo - Xoa node_modules ...
    rmdir /s /q "node_modules" 2>nul
)

if exist ".venv" (
    echo - Xoa .venv ...
    rmdir /s /q ".venv" 2>nul
)

if exist "venv" (
    echo - Xoa venv ...
    rmdir /s /q "venv" 2>nul
)

if exist "backend\venv" (
    echo - Xoa backend\venv ...
    rmdir /s /q "backend\venv" 2>nul
)

if exist "frontend\dist" (
    echo - Xoa frontend\dist ...
    rmdir /s /q "frontend\dist" 2>nul
)

if exist "dist" (
    echo - Xoa dist ...
    rmdir /s /q "dist" 2>nul
)

if exist "backend\.pytest_cache" (
    rmdir /s /q "backend\.pytest_cache" 2>nul
)

if exist "frontend\.pytest_cache" (
    rmdir /s /q "frontend\.pytest_cache" 2>nul
)

if exist "backend\.ruff_cache" (
    rmdir /s /q "backend\.ruff_cache" 2>nul
)

if exist "test-results" (
    rmdir /s /q "test-results" 2>nul
)

if exist "frontend\test-results" (
    rmdir /s /q "frontend\test-results" 2>nul
)

if exist "backend\test-results" (
    rmdir /s /q "backend\test-results" 2>nul
)

if exist "playwright-report" (
    rmdir /s /q "playwright-report" 2>nul
)

echo [*] Dang xoa cac thu muc __pycache__ va .pyc ...
for /d /r . %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d" 2>nul
del /s /q *.pyc *.pyo 2>nul
del /s /q frontend\debug.log backend\debug.log debug.log 2>nul

echo.
echo ============================================================
echo [SUCCESS] Da don dep xong! Du an da san sang de nen zip va chuyen giao.
echo Luu y: Giu lai file 'backup.sql' va '.env.example' de may dich co the su dung ngay.
echo ============================================================
pause
