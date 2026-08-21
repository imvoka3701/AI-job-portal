@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ============================================================
echo   AI Job Portal — Restore Database (PostgreSQL)
echo ============================================================

set BACKUP_FILE=backup.sql
if not "%~1"=="" set BACKUP_FILE=%~1

if not exist "%BACKUP_FILE%" (
    echo [ERROR] Khong tim thay file %BACKUP_FILE%!
    echo Vui long dat file %BACKUP_FILE% vao thu muc goc hoac truyen duong dan.
    pause
    exit /b 1
)

REM Check if container is running
docker ps --filter "name=aijob-db" --format "{{.Names}}" | findstr /i "aijob-db" > nul
if errorlevel 1 (
    echo [ERROR] Container 'aijob-db' khong chay!
    echo Vui long khoi dong Docker Compose: docker compose up -d db
    pause
    exit /b 1
)

echo [*] Dang khoi phuc CSDL tu file %BACKUP_FILE% vao container aijob-db ...
docker exec -i aijob-db psql -U postgres -d ai_job_portal < "%BACKUP_FILE%"

if errorlevel 1 (
    echo [ERROR] Khoi phuc that bai!
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Khoi phuc CSDL thanh cong!
echo ============================================================
