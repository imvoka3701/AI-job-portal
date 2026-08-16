# AI Job Portal — Backend

FastAPI backend with PostgreSQL (pgvector), JWT authentication, and LLM-powered AI features.

## Tech Stack

- **Framework:** FastAPI
- **Database:** PostgreSQL + pgvector
- **ORM:** SQLAlchemy 2.0
- **Auth:** OAuth2 + JWT (bcrypt)
- **AI:** Deepseek API integration

## Quick Start

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Setup environment
cp .env.example .env
# Edit .env with your actual values

# 4. Run database migrations
alembic upgrade head

# 5. Start server
uvicorn app.main:app --reload --port 8000
```

## API Docs

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
app/
├── main.py          # App factory
├── config.py        # Settings
├── database.py      # DB engine
├── models/          # SQLAlchemy models
├── schemas/         # Pydantic schemas
├── crud/            # Data access
├── services/        # Business logic + AI
├── routers/         # API endpoints
├── core/            # Security, deps
└── utils/           # Helpers
```
