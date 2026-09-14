@echo off
REM Script tự động export backup.sql từ container aijob-db đang chạy
REM Chạy lệnh này từ thư mục gốc dự án (d:\ai-job-portal)
REM Yêu cầu: Docker Desktop đang chạy và containers đã được khởi động bằng docker compose up

echo [1/3] Kiem tra container aijob-db dang chay...
docker compose ps aijob-db | findstr "running" > nul
if errorlevel 1 (
    echo [LO I] Container aijob-db khong chay. Chay lenh sau truoc:
    echo        docker compose up -d
    exit /b 1
)

echo [2/3] Export backup.sql tu aijob-db...
docker exec aijob-db sh -c "pg_dump -U postgres ai_job_portal" > backup.sql

if errorlevel 1 (
    echo [LOI] Export that bai. Kiem tra lai container.
    exit /b 1
)

echo [3/3] Kiem tra ket qua...
for %%F in (backup.sql) do (
    echo [OK] backup.sql da duoc tao: %%~zF bytes
)

echo.
echo Hoan thanh! De restore:
echo   docker exec -i aijob-db psql -U postgres -d ai_job_portal ^< backup.sql
