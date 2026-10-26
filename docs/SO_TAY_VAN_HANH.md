# 🔧 SỔ TAY VẬN HÀNH — AI Job Portal

> **Vai trò:** DevOps / Tech Lead  
> **Cập nhật:** 19/09/2026  
> **Phạm vi:** Các quy trình vận hành production: Backup, Rollback, Retention, Troubleshooting

---

## 1. SAO LƯU CƠ SỞ DỮ LIỆU (K1.4)

### 1.1 Backup thủ công (Chạy từ máy host)

```bash
# Backup trực tiếp từ Docker container
docker exec aijob-db pg_dump -U postgres -Fc ai_job_portal > backups/manual_$(date +%Y%m%d).dump

# Kiểm tra dung lượng
ls -lh backups/
```

### 1.2 Backup tự động (Script có sẵn)

```bash
# Chạy 1 lần
./scripts/backup_database.sh

# Cài cron job (mỗi ngày 2:00 AM)
crontab -e
# Thêm dòng:
0 2 * * * cd /path/to/ai-job-portal && ./scripts/backup_database.sh >> /var/log/aijob_backup.log 2>&1
```

**Cấu hình:**
| Biến | Mặc định | Mô tả |
|------|----------|-------|
| `BACKUP_DIR` | `./backups` | Thư mục lưu backup |
| `BACKUP_RETENTION` | `7` | Số bản backup giữ lại |
| `DATABASE_URL` | từ `.env` | Connection string PostgreSQL |

### 1.3 Phục hồi từ backup (K1.5)

```bash
# Xem danh sách backup
./scripts/restore_database.sh

# Phục hồi từ file cụ thể
./scripts/restore_database.sh backups/aijob_backup_20260919_020000.dump

# ⚠️ Script yêu cầu nhập 'YES' để xác nhận (chống xóa nhầm)
# Sau khi restore, chạy migration:
docker exec aijob-backend alembic upgrade head
```

---

## 2. QUY TRÌNH ROLLBACK (I2.4)

### 2.1 Rollback phiên bản code

```bash
# Bước 1: Dừng services
docker compose down

# Bước 2: Quay về version trước
git log --oneline -5          # Xem lịch sử
git checkout <commit-hash>    # Hoặc: git checkout <tag-name>

# Bước 3: Rebuild và khởi động lại
docker compose up --build -d

# Bước 4: Xác minh
docker compose ps             # Tất cả containers healthy?
curl http://localhost:8000/healthz    # Backend OK?
curl http://localhost:3000/api/healthz  # Nginx proxy OK?
```

### 2.2 Rollback database migration

```bash
# Xem migration history
docker exec aijob-backend alembic history

# Rollback 1 migration
docker exec aijob-backend alembic downgrade -1

# Rollback về revision cụ thể
docker exec aijob-backend alembic downgrade <revision-id>
```

### 2.3 Rollback khẩn cấp (Emergency)

```bash
# Kịch bản: Production bị lỗi nghiêm trọng sau deploy

# 1. Dừng ngay lập tức
docker compose down

# 2. Restore DB từ backup gần nhất
export DATABASE_URL="postgresql://postgres:password@localhost:5433/ai_job_portal"
./scripts/restore_database.sh backups/aijob_backup_YYYYMMDD_HHMMSS.dump

# 3. Checkout code version ổn định cuối cùng
git stash                     # Lưu changes hiện tại (nếu có)
git checkout <last-stable-tag>

# 4. Rebuild và khởi động
docker compose up --build -d

# 5. Smoke test
curl http://localhost:8000/healthz
curl http://localhost:8000/readyz
```

---

## 3. CHÍNH SÁCH LƯU GIỮ DỮ LIỆU (J1.4 — Data Retention)

### 3.1 Bảng chính sách

| Loại dữ liệu | Thời gian lưu | Hành động khi hết hạn | Ghi chú |
|---------------|---------------|----------------------|---------|
| **AI Audit Logs** (JSONL) | 90 ngày | Xóa tự động (cron) | File rotation 50MB × 10 |
| **Rate Limiter entries** | 5 phút (auto) | Tự cleanup | Xem `rate_limiter.py` |
| **Database backups** | 7 bản gần nhất | Rotation tự động | Cấu hình `BACKUP_RETENTION` |
| **User data (PII)** | Vĩnh viễn | Xóa theo yêu cầu | Cần endpoint xóa tài khoản |
| **Upload files (CV/Avatar)** | Vĩnh viễn | Xóa khi user xóa tài khoản | Volume mounted |
| **WebSocket sessions** | Phiên đăng nhập | Auto cleanup disconnect | In-memory |

### 3.2 Script dọn dẹp AI Audit Logs

```bash
# Xóa audit logs cũ hơn 90 ngày (chạy trong container)
docker exec aijob-backend find /var/log -name "ai_audit*.jsonl*" -mtime +90 -delete

# Cron job tự động (mỗi tuần Chủ nhật 3:00 AM)
crontab -e
# Thêm dòng:
0 3 * * 0 docker exec aijob-backend find /var/log -name "ai_audit*.jsonl*" -mtime +90 -delete 2>&1 | logger -t aijob-cleanup
```

---

## 4. TROUBLESHOOTING

### 4.1 Container không khởi động

```bash
# Xem logs
docker compose logs backend --tail=50
docker compose logs db --tail=50

# Kiểm tra health
docker inspect aijob-backend --format='{{json .State.Health}}'

# Restart cụ thể
docker compose restart backend
```

### 4.2 Database connection refused

```bash
# Kiểm tra DB container
docker exec aijob-db pg_isready -U postgres

# Kiểm tra connection từ backend
docker exec aijob-backend python -c "
from app.database import SessionLocal
from sqlalchemy import text
db = SessionLocal()
result = db.execute(text('SELECT 1'))
print('DB OK:', result.scalar())
db.close()
"
```

### 4.3 AI features không hoạt động

```bash
# Kiểm tra API key
docker exec aijob-backend python -c "
from app.config import settings
print('API Key set:', bool(settings.DEEPSEEK_API_KEY))
print('Base URL:', settings.DEEPSEEK_BASE_URL)
print('Model:', settings.LLM_MODEL)
"

# Xem AI audit logs
docker exec aijob-backend tail -20 /var/log/ai_audit.jsonl 2>/dev/null || \
docker compose logs backend | grep "ai_audit" | tail -20
```

### 4.4 Memory/CPU quá tải

```bash
# Xem resource usage realtime
docker stats

# Kiểm tra container limits
docker inspect aijob-backend --format='{{.HostConfig.Memory}}'
docker inspect aijob-backend --format='{{.HostConfig.NanoCpus}}'
```

---

## 5. CHECKLIST VẬN HÀNH HÀNG TUẦN

- [ ] Kiểm tra backup gần nhất tồn tại và dung lượng hợp lý
- [ ] `docker stats` — không service nào vượt 80% resource limit
- [ ] `docker compose ps` — tất cả containers ở trạng thái healthy
- [ ] Kiểm tra Sentry dashboard (nếu đã kích hoạt) cho unhandled errors
- [ ] Review AI audit log cho các anomaly (prompt injection attempts, etc.)

---

> **Người soạn:** Tech Lead  
> **Ngày:** 19/09/2026
