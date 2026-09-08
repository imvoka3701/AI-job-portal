"""Pytest fixtures — test database session, test client, authenticated user."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import StaticPool, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings
from app.core.rate_limiter import rate_limiter_store
from app.database import Base, get_db
from app.main import app

# In-memory SQLite for testing (no PostgreSQL required)
SQLALCHEMY_TEST_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def mock_smtp_backend(monkeypatch):
    """Ensure test executions never send real emails over network to real user inboxes."""
    class SafeMockSMTP:
        _is_mocked_for_test = True

        def __init__(self, host=None, port=None, timeout=None, **kwargs):
            self.host = host
            self.port = port
            self.timeout = timeout

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return None

        def starttls(self):
            return (220, b"2.0.0 Ready to start TLS")

        def login(self, username, password):
            return (235, b"2.7.0 Authentication successful")

        def send_message(self, message):
            return {}

        def sendmail(self, from_addr, to_addrs, msg, mail_options=(), rcpt_options=()):
            return {}

        def quit(self):
            return (221, b"2.0.0 Bye")

    monkeypatch.setattr("smtplib.SMTP", SafeMockSMTP)
    monkeypatch.setattr("smtplib.SMTP_SSL", SafeMockSMTP)
    monkeypatch.setattr("app.services.invitation_email_service.smtplib.SMTP", SafeMockSMTP)
    monkeypatch.setattr("app.services.invitation_email_service.smtplib.SMTP_SSL", SafeMockSMTP)
    monkeypatch.setattr("app.services.password_reset_service.smtplib.SMTP", SafeMockSMTP)
    monkeypatch.setattr("app.services.password_reset_service.smtplib.SMTP_SSL", SafeMockSMTP)


@pytest.fixture(autouse=True)
def db_session():
    """Create a fresh database and reset rate limiter state for each test."""
    rate_limiter_store.reset()
    settings.RATE_LIMIT_ENABLED = True
    settings.TESTING = True
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        rate_limiter_store.reset()
        settings.RATE_LIMIT_ENABLED = True
        settings.TESTING = True


@pytest.fixture
def client(db_session: Session):
    """FastAPI test client with overridden DB dependency."""

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
