@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ============================================================
echo   AI Job Portal — Backup Database (PostgreSQL)
echo ============================================================

REM Check if docker container is running
docker ps --filter "name=aijob-db" --format "{{.Names}}" | findstr /i "aijob-db" > nul
if errorlevel 1 (
    echo [ERROR] Container 'aijob-db' khong chay!
    echo Vui long khoi dong Docker Compose truoc: docker compose up -d db
    pause
    exit /b 1
)

set BACKUP_FILE=backup.sql
if not "%~1"=="" set BACKUP_FILE=%~1

echo [*] Dang xuat du lieu tu container aijob-db ra file %BACKUP_FILE% ...
docker exec -i aijob-db pg_dump -U postgres -d ai_job_portal --clean --if-exists --exclude-table-data=oauth_accounts > "%BACKUP_FILE%"

if errorlevel 1 (
    echo [ERROR] Xuat du lieu that bai!
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Da sao luu CSDL thanh cong vao file: %BACKUP_FILE%
echo Dung luong file:
for %%I in ("%BACKUP_FILE%") do echo   %%~zI bytes
echo ============================================================
