"""Pydantic schemas for ContactLead model."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ContactLeadCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255, description="Họ và tên người liên hệ")
    email: EmailStr = Field(..., description="Email doanh nghiệp")
    phone: str = Field(..., min_length=1, max_length=50, description="Số điện thoại liên hệ")
    company_name: str = Field(
        ..., min_length=1, max_length=255, description="Tên công ty / doanh nghiệp"
    )
    location: str = Field(..., min_length=1, max_length=100, description="Khu vực tuyển dụng")
    service_package: str = Field("pro", max_length=50, description="Gói giải pháp mong muốn")
    notes: str | None = Field(None, description="Ghi chú thêm từ khách hàng")


class ContactLeadRead(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str
    company_name: str
    location: str
    service_package: str
    status: str
    notes: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
