"""Calendar service — generate RFC 5545 iCalendar (.ics) and 1-click Google Calendar links."""

from datetime import datetime, timedelta, timezone
from urllib.parse import quote
from zoneinfo import ZoneInfo

from app.models.interview_round import InterviewRound

VIETNAM_TZ = ZoneInfo("Asia/Ho_Chi_Minh")


def escape_ics_text(text: str | None) -> str:
    """Escape text according to RFC 5545 specification."""
    if not text:
        return ""
    # Replace backslash first, then semicolon, comma, and newlines
    escaped = text.replace("\\", "\\\\")
    escaped = escaped.replace(";", "\\;")
    escaped = escaped.replace(",", "\\,")
    escaped = escaped.replace("\r\n", "\\n").replace("\n", "\\n").replace("\r", "\\n")
    return escaped


def to_utc(dt: datetime) -> datetime:
    """Ensure datetime has timezone awareness and convert to UTC."""
    if dt.tzinfo is None:
        # Naive datetime from VN portal is assumed to be Asia/Ho_Chi_Minh
        dt = dt.replace(tzinfo=VIETNAM_TZ)
    return dt.astimezone(timezone.utc)


def format_ics_datetime(dt: datetime) -> str:
    """Format datetime as YYYYMMDDTHHMMSSZ for RFC 5545."""
    return to_utc(dt).strftime("%Y%m%dT%H%M%SZ")


def build_interview_details(round_obj: InterviewRound) -> dict:
    """Extract and normalize interview metadata for calendar events."""
    app = round_obj.application
    job = app.job if app else None
    company = job.company if job and hasattr(job, "company") and job.company else None
    employer = job.employer if job and hasattr(job, "employer") else None

    candidate = app.candidate if app and hasattr(app, "candidate") else None
    candidate_name = candidate.full_name if candidate else "Ứng viên"
    candidate_email = candidate.email if candidate else "candidate@jobportal.vn"

    company_name = (
        company.name
        if company and company.name
        else (employer.company_name if employer and employer.company_name else "Doanh nghiệp")
    )
    organizer_email = (
        employer.email if employer and employer.email else "recruitment@jobportal.vn"
    )

    job_title = job.title if job else "Vị trí tuyển dụng"
    round_label = round_obj.round_name or f"Vòng {round_obj.round_number}"

    summary = f"Phỏng vấn {round_label}: {job_title} - {company_name}"

    desc_lines = [
        f"Lịch phỏng vấn tuyển dụng tại {company_name}",
        f"Vị trí: {job_title}",
        f"Vòng phỏng vấn: {round_label} ({round_obj.round_type})",
        f"Ứng viên: {candidate_name} ({candidate_email})",
        f"Người liên hệ: {organizer_email}",
    ]
    if round_obj.location:
        desc_lines.append(f"Địa điểm / Phòng họp: {round_obj.location}")
    if round_obj.notes:
        desc_lines.append(f"Ghi chú chuẩn bị: {round_obj.notes}")
    desc_lines.append("Hệ thống tuyển dụng thông minh AI Job Portal (aijobportal.vn)")

    description = "\n".join(desc_lines)
    location = round_obj.location or "Thông báo sau"

    return {
        "summary": summary,
        "description": description,
        "location": location,
        "company_name": company_name,
        "organizer_email": organizer_email,
        "candidate_name": candidate_name,
        "candidate_email": candidate_email,
        "job_title": job_title,
        "round_label": round_label,
    }


def generate_ics_calendar(
    round_obj: InterviewRound, duration_minutes: int = 60
) -> str:
    """Generate an RFC 5545 compliant iCalendar string (.ics) for an interview round."""
    if not round_obj.scheduled_at:
        raise ValueError("Lịch phỏng vấn chưa được thiết lập thời gian (scheduled_at is None).")

    start_dt = round_obj.scheduled_at
    end_dt = start_dt + timedelta(minutes=duration_minutes)
    now_utc = datetime.now(timezone.utc)

    details = build_interview_details(round_obj)

    uid = f"interview-round-{round_obj.id}-{int(start_dt.timestamp())}@aijobportal.vn"
    summary_escaped = escape_ics_text(details["summary"])
    desc_escaped = escape_ics_text(details["description"])
    location_escaped = escape_ics_text(details["location"])
    organizer_cn = escape_ics_text(details["company_name"])
    candidate_cn = escape_ics_text(details["candidate_name"])

    # RFC 5545 standard specifies CRLF line endings
    crlf = "\r\n"
    ics_lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//AI Job Portal//Interview Calendar Service//VI",
        "CALSCALE:GREGORIAN",
        "METHOD:REQUEST",
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{now_utc.strftime('%Y%m%dT%H%M%SZ')}",
        f"DTSTART:{format_ics_datetime(start_dt)}",
        f"DTEND:{format_ics_datetime(end_dt)}",
        f"SUMMARY:{summary_escaped}",
        f"DESCRIPTION:{desc_escaped}",
        f"LOCATION:{location_escaped}",
        f"ORGANIZER;CN={organizer_cn}:mailto:{details['organizer_email']}",
        f"ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN={candidate_cn}:mailto:{details['candidate_email']}",
        "STATUS:CONFIRMED",
        "SEQUENCE:0",
        "TRANSP:OPAQUE",
        "BEGIN:VALARM",
        "TRIGGER:-PT30M",
        "ACTION:DISPLAY",
        "DESCRIPTION:Nhắc nhở lịch phỏng vấn sắp diễn ra trong 30 phút",
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR",
    ]

    return crlf.join(ics_lines) + crlf


def generate_google_calendar_url(
    round_obj: InterviewRound, duration_minutes: int = 60
) -> str:
    """Generate a 1-click Google Calendar web event creation link."""
    if not round_obj.scheduled_at:
        return ""

    start_dt = round_obj.scheduled_at
    end_dt = start_dt + timedelta(minutes=duration_minutes)

    details = build_interview_details(round_obj)

    dates_param = f"{format_ics_datetime(start_dt)}/{format_ics_datetime(end_dt)}"
    text_param = quote(details["summary"])
    details_param = quote(details["description"])
    location_param = quote(details["location"])

    return (
        f"https://calendar.google.com/calendar/render?action=TEMPLATE"
        f"&text={text_param}"
        f"&dates={dates_param}"
        f"&details={details_param}"
        f"&location={location_param}"
    )


def get_calendar_links(
    round_obj: InterviewRound, duration_minutes: int = 60
) -> dict:
    """Return both Google Calendar URL and metadata for client consumption."""
    google_url = generate_google_calendar_url(round_obj, duration_minutes=duration_minutes)
    return {
        "round_id": round_obj.id,
        "scheduled_at": round_obj.scheduled_at.isoformat() if round_obj.scheduled_at else None,
        "duration_minutes": duration_minutes,
        "google_calendar_url": google_url,
        "ics_download_url": f"/api/applications/rounds/{round_obj.id}/calendar.ics",
    }
