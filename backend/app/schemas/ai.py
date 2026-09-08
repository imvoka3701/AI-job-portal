"""AI-related Pydantic schemas — matching, CV evaluation, roadmap."""

from typing import Any

from pydantic import BaseModel, field_validator, model_validator


class AIMatchRequest(BaseModel):
    job_id: int
    resume_id: int | None = None
    cv_document_id: int | None = None

    @model_validator(mode="after")
    def check_cv_source(self) -> "AIMatchRequest":
        if self.resume_id is None and self.cv_document_id is None:
            raise ValueError("Cần cung cấp ít nhất resume_id hoặc cv_document_id.")
        return self


class MatchBreakdown(BaseModel):
    skills_score: float = 0.0
    experience_score: float = 0.0
    domain_score: float = 0.0


class AIMatchResponse(BaseModel):
    score: float
    explanation: str
    strengths: list[str] = []
    gaps: list[str] = []
    breakdown: MatchBreakdown | None = None
    deal_breakers: list[str] = []
    interview_questions: list[str] = []


class CVEvaluationRequest(BaseModel):
    resume_id: int | None = None
    cv_document_id: int | None = None

    @model_validator(mode="after")
    def check_cv_source(self) -> "CVEvaluationRequest":
        if self.resume_id is None and self.cv_document_id is None:
            raise ValueError("Cần cung cấp ít nhất resume_id hoặc cv_document_id.")
        return self


class CVEvaluationResponse(BaseModel):
    overall_score: float
    summary: str
    suggestions: list[str]
    skill_analysis: dict[str, Any]  # LLM may return scores (int), text (str), or rich objects

    @field_validator("skill_analysis", mode="before")
    @classmethod
    def normalize_skill_scores(cls, value: Any) -> dict[str, Any]:
        """Accept legacy 0-100 LLM scores while exposing the documented 0-10 scale."""
        if not isinstance(value, dict):
            return value
        return {
            skill: round(float(assessment) / 10, 1)
            if isinstance(assessment, (int, float)) and assessment > 10
            else assessment
            for skill, assessment in value.items()
        }


class RoadmapRequest(BaseModel):
    resume_id: int | None = None
    cv_document_id: int | None = None
    target_role: str

    @model_validator(mode="after")
    def check_cv_source(self) -> "RoadmapRequest":
        if self.resume_id is None and self.cv_document_id is None:
            raise ValueError("Cần cung cấp ít nhất resume_id hoặc cv_document_id.")
        return self


# RoadmapStep must be declared before RoadmapResponse
class RoadmapStep(BaseModel):
    order: int
    title: str
    description: str
    skills_to_learn: list[str]
    resources: list[str]


class RoadmapResponse(BaseModel):
    target_role: str
    current_level: str
    steps: list[RoadmapStep]
    estimated_months: int


class CVSummarizeRequest(BaseModel):
    resume_id: int | None = None
    cv_document_id: int | None = None
    job_id: int

    @model_validator(mode="after")
    def check_cv_source(self) -> "CVSummarizeRequest":
        if self.resume_id is None and self.cv_document_id is None:
            raise ValueError("Cần cung cấp ít nhất resume_id hoặc cv_document_id.")
        return self


class CVSummarizeResponse(BaseModel):
    fit_points: list[str]  # điểm phù hợp (dạng mô tả, không phải %)
    questions: list[str]  # điểm cần hỏi thêm / làm rõ
    summary: str  # tóm tắt ngắn gọn (2-3 câu)


class InterviewQuestionItem(BaseModel):
    question: str
    purpose: str  # mục đích đánh giá (đang hỏi để kiểm tra điều gì)
    skill_related: str  # kỹ năng liên quan


class InterviewQuestionsRequest(BaseModel):
    resume_id: int | None = None
    cv_document_id: int | None = None
    job_id: int
    skills_to_assess: list[str]  # danh sách kỹ năng nhân sự muốn hỏi sâu

    @model_validator(mode="after")
    def check_cv_source(self) -> "InterviewQuestionsRequest":
        if self.resume_id is None and self.cv_document_id is None:
            raise ValueError("Cần cung cấp ít nhất resume_id hoặc cv_document_id.")
        return self


class InterviewQuestionsResponse(BaseModel):
    questions: list[InterviewQuestionItem]


class GenerateEmailRequest(BaseModel):
    application_id: int
    email_type: str  # "invite" | "reject" | "offer"
    tone: str | None = None  # "formal" | "friendly" | "concise"
    custom_prompt: str | None = None


class GenerateEmailResponse(BaseModel):
    subject: str
    body: str


class CvSuggestionBase(BaseModel):
    cv_document_id: int
    target_role: str = ""
    language: str = "vi"


class CvSummarySuggestionRequest(CvSuggestionBase):
    current_text: str = ""


class CvSummarySuggestionResponse(BaseModel):
    suggestion: str
    rationale: str


class CvExperienceSuggestionRequest(CvSuggestionBase):
    experience_text: str
    job_id: int | None = (
        None  # Optional: context from target job for more specific bullet rewriting
    )


class CvExperienceSuggestionResponse(BaseModel):
    bullets: list[str]
    rationale: str


class CvSkillsSuggestionRequest(CvSuggestionBase):
    job_id: int | None = None
    current_skills: list[str] = []


class CvSkillsSuggestionResponse(BaseModel):
    skills: list[str]
    rationale: str


class RecommendedJob(BaseModel):
    """A single job recommendation with match score and reason."""

    job_id: int
    title: str
    company_name: str | None = None
    location: str | None = None
    experience_level: str
    match_score: float  # 0-100
    match_reason: str  # Vietnamese explanation of why it matches


class JobRecommendationResponse(BaseModel):
    """Response for GET /ai/recommend-jobs endpoint."""

    resume_id: int | None = None
    cv_document_id: int | None = None
    industry_detected: str
    total_matched: int
    recommendations: list[RecommendedJob]


class GenerateJDRequest(BaseModel):
    """Payload for requesting AI-assisted multi-industry Job Description generation."""

    job_title: str
    industry: str | None = None
    category_id: int | None = None
    experience_level: str = "middle"  # fresher, junior, middle, senior, lead
    job_type: str = "full_time"  # full_time, part_time, remote, internship, freelance
    tone: str = "professional"  # professional, modern_startup, corporate_formal
    key_notes: str | None = None
    location: str | None = None


class GenerateJDResponse(BaseModel):
    """Structured response containing AI-drafted JD sections, suggested skills, and salary."""

    title: str
    description: str
    requirements: str
    benefits: str
    suggested_skills: list[str] = []
    salary_min: int | None = None
    salary_max: int | None = None
    job_type: str
    experience_level: str
    suggested_category_id: int | None = None


class CoverLetterRequest(BaseModel):
    job_id: int
    resume_id: int | None = None
    cv_document_id: int | None = None
    tone: str = "professional"  # professional, confident, enthusiastic, concise
    custom_notes: str | None = None

    @model_validator(mode="after")
    def check_cv_source(self) -> "CoverLetterRequest":
        if self.resume_id is None and self.cv_document_id is None:
            raise ValueError("Cần cung cấp ít nhất resume_id hoặc cv_document_id.")
        return self


class CoverLetterResponse(BaseModel):
    cover_letter: str
