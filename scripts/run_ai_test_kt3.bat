@echo off
chcp 65001 >nul
cls
echo ==============================================================================
echo       AI-POWERED JOB PORTAL — BỘ KIỂM THỬ ĐÁNH GIÁ NGHIỆM THU KT3 / B2B
echo ==============================================================================
echo.
echo [1/3] Đang chuyển hướng vào thư mục backend...
cd /d "%~dp0..\backend"

echo [2/3] Kiểm tra môi trường Python virtualenv...
if not exist "venv\Scripts\pytest.exe" (
    echo [LỖI] Không tìm thấy venv\Scripts\pytest.exe. Vui lòng kiểm tra môi trường venv!
    pause
    exit /b 1
)

echo [3/3] Đang thực thi bộ test KT3 (Cache, Retry, Circuit Breaker, RBAC, Prompt Armor)...
echo.
.\venv\Scripts\pytest.exe -v --no-cov tests/test_ai_kt3_suite.py
set TEST_EXIT_CODE=%ERRORLEVEL%

echo.
echo ==============================================================================
if %TEST_EXIT_CODE% equ 0 (
    echo [THÀNH CÔNG] 100%% TEST CASES ĐẠT CHUẨN ĐÁNH GIÁ KT3!
) else (
    echo [CẢNH BÁO] Có test case thất bại. Mã lỗi: %TEST_EXIT_CODE%
)
echo ==============================================================================
echo.
pause
