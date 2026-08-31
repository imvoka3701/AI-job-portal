from app.schemas.ai import AIMatchRequest, AIMatchResponse, CVEvaluationResponse  # noqa: F401
from app.schemas.application import (  # noqa: F401
    ApplicationCreate,
    ApplicationRead,
    ApplicationUpdate,
)
from app.schemas.auth import LoginRequest, RegisterRequest, Token, TokenPayload  # noqa: F401
from app.schemas.cv_document import CvDocumentCreate, CvDocumentRead, CvDocumentUpdate  # noqa: F401
from app.schemas.job import JobCreate, JobRead, JobUpdate  # noqa: F401
from app.schemas.resume import ResumeCreate, ResumeRead  # noqa: F401
from app.schemas.user import UserCreate, UserRead, UserUpdate  # noqa: F401
