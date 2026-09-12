"""RAG Pydantic schemas — Semantic Chunks, Hybrid Search, and Grounded Generation."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class ChunkMetadata(BaseModel):
    model_config = ConfigDict(extra="allow")

    title: str | None = None
    role: str | None = None
    company_name: str | None = None
    period: str | None = None
    skills: list[str] = Field(default_factory=list)
    seniority: str | None = None
    level: str | None = None
    importance: str | None = None  # "must_have" | "nice_to_have"


class DocumentChunkBase(BaseModel):
    document_type: str = Field(..., description="'resume' | 'cv_document' | 'job'")
    document_id: int = Field(..., description="ID của tài liệu nguồn")
    company_id: int | None = Field(None, description="Tenant boundary isolation (Công ty sở hữu)")
    user_id: int | None = Field(None, description="ID của ứng viên sở hữu")
    section_type: str = Field(..., description="'experience' | 'project' | 'skills' | 'education' | 'requirement' | 'benefit' | 'summary'")
    chunk_index: int = Field(0, ge=0)
    content: str = Field(..., min_length=1)
    metadata_json: str | None = None


class DocumentChunkCreate(DocumentChunkBase):
    pass


class DocumentChunkRead(DocumentChunkBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class RAGSearchResult(BaseModel):
    chunk_id: int
    document_type: str
    document_id: int
    company_id: int | None = None
    user_id: int | None = None
    candidate_name: str | None = None
    document_title: str | None = None
    section_type: str
    chunk_index: int
    content: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    dense_score: float = Field(0.0, ge=0.0, le=1.0)
    sparse_score: float = Field(0.0, ge=0.0)
    hybrid_score: float = Field(0.0, ge=0.0, le=1.0)


class RAGQueryRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=1000, description="Nội dung tìm kiếm ngữ nghĩa")
    document_type: str | None = Field(None, description="'resume' | 'cv_document' | 'job' hoặc None để tìm tất cả")
    company_id: int | None = Field(None, description="Tenant ID để lọc cách ly dữ liệu")
    user_id: int | None = Field(None, description="Lọc theo người sở hữu tài liệu")
    section_types: list[str] | None = Field(None, description="Bộ lọc các section cụ thể")
    limit: int = Field(5, ge=1, le=50, description="Số lượng kết quả lấy ra")
    min_score: float = Field(0.4, ge=0.0, le=1.0, description="Ngưỡng tương đồng tối thiểu")
    exclude_drafts: bool = Field(True, description="Loại trừ CV Builder đang ở trạng thái nháp (chỉ lấy published)")


class RAGQueryResponse(BaseModel):
    query: str
    results: list[RAGSearchResult]
    total_matched: int


class RAGInterviewQuestionItem(BaseModel):
    question: str
    rationale: str
    category: str
    difficulty: str  # "basic" | "intermediate" | "advanced"
    cited_chunk_ids: list[int] = Field(default_factory=list)


class RAGInterviewQuestionsRequest(BaseModel):
    job_id: int
    resume_id: int | None = None
    cv_document_id: int | None = None
    rubric_category: str | None = Field(None, description="Lọc câu hỏi theo tiêu chí Rubric")
    count: int = Field(3, ge=1, le=10)


class RAGInterviewQuestionsResponse(BaseModel):
    job_title: str
    candidate_name: str | None = None
    questions: list[RAGInterviewQuestionItem]
    referenced_chunks: list[RAGSearchResult] = Field(default_factory=list)


class RAGCVChatMessage(BaseModel):
    role: Literal["user", "assistant"] = Field(..., description="'user' | 'assistant'")
    content: str = Field(..., min_length=1)


class RAGCVChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000, description="Câu hỏi dành cho AI về hồ sơ ứng viên")
    cv_document_id: int | None = None
    resume_id: int | None = None
    chat_history: list[RAGCVChatMessage] = Field(default_factory=list)


class RAGCVChatResponse(BaseModel):
    answer: str
    candidate_name: str | None = None
    document_title: str | None = None
    cited_chunk_ids: list[int] = Field(default_factory=list)
    referenced_chunks: list[RAGSearchResult] = Field(default_factory=list)
