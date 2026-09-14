"""Prompt Armor — Security middleware and validation against Prompt Injection / Jailbreak attacks.

Protects LLM workloads (CV Copilot, CV Evaluation, AI Assistant) from:
- System prompt extraction / leakage
- Instruction overriding (Jailbreak / DAN / Developer mode)
- Malicious delimiter manipulation
- Privilege escalation via prompt hijacking
"""

import logging
import re
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

# Patterns matching prompt injection and jailbreak attempts (case-insensitive)
INJECTION_PATTERNS: list[tuple[str, str]] = [
    # 1. Direct instruction overrides
    (r"\bignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules|commands|context)\b", "instruction_override"),
    (r"\bdisregard\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules|commands)\b", "instruction_override"),
    (r"\bforget\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules|commands)\b", "instruction_override"),
    (r"\boverride\s+(the\s+)?(system|safety|security)\s+(rules|prompts|instructions|policy)\b", "system_override"),

    # 2. System prompt leakage attempts
    (r"\b(reveal|print|show|output|leak|repeat|display|dump)\s+(your\s+|the\s+)?(entire\s+)?(system\s+prompt|initial\s+prompt|hidden\s+instructions|secret\s+instructions)\b", "prompt_leakage"),
    (r"\bwhat\s+(is|are)\s+(your\s+|the\s+)?(system\s+prompt|initial\s+prompt|hidden\s+instructions)\b", "prompt_leakage"),
    (r"\b(output|print|show|dump)\s+(all\s+)?(env(ironment)?\s+variables|api\s*keys?|database\s+credentials|secret_key)\b", "secret_leakage"),

    # 3. Persona / Jailbreak modes
    (r"\byou\s+are\s+now\s+(an?\s+)?(unrestricted|jailbroken|unfiltered|dan|evil|chaos|hacker)\b", "jailbreak_persona"),
    (r"\b(enter|switch\s+to|activate|enable)\s+(developer\s+mode|jailbreak\s+mode|dan\s+mode|god\s+mode|unrestricted\s+mode)\b", "mode_switch"),
    (r"\bpretend\s+you\s+(are\s+|have\s+)?(no\s+rules|no\s+restrictions|unfiltered|jailbroken)\b", "jailbreak_persona"),
    (r"\bact\s+as\s+(dan|an\s+evil\s+ai|an\s+unrestricted\s+ai)\b", "jailbreak_persona"),

    # 4. Vietnamese Prompt Injection variants
    (r"quên\s+(?:hết\s+)?(?:tất\s+cả\s+)?(?:mọi\s+)?(?:các\s+)?(?:chỉ\s+dẫn|hướng\s+dẫn|lời\s+nhắc|quy\s+tắc)\s+trước\s+đó", "vi_instruction_override"),
    (r"bỏ\s+qua\s+(?:hết\s+)?(?:tất\s+cả\s+)?(?:mọi\s+)?(?:các\s+)?(?:chỉ\s+dẫn|hướng\s+dẫn|lời\s+nhắc|quy\s+tắc)", "vi_instruction_override"),
    (r"(?:in\s+ra|tiết\s+lộ|cho\s+tôi\s+xem|hiển\s+thị)\s+(?:toàn\s+bộ\s+)?(?:prompt\s+hệ\s+thống|chỉ\s+dẫn\s+hệ\s+thống|system\s+prompt)", "vi_prompt_leakage"),
    (r"(?:in\s+ra|tiết\s+lộ|xuất)\s+(?:toàn\s+bộ\s+)?(?:biến\s+môi\s+trường|api\s*key|mật\s+khẩu|chuỗi\s+kết\s+nối)", "vi_secret_leakage"),
    (r"bạn\s+bây\s+giờ\s+là\s+(?:một\s+)?(?:ai\s+không\s+giới\s+hạn|hacker|quản\s+trị\s+viên\s+tối\s+cao)", "vi_jailbreak_persona"),
    (r"bật\s+(?:chế\s+độ\s+)?(?:developer\s+mode|bẻ\s+khóa|không\s+kiểm\s+duyệt)", "vi_mode_switch"),
]

# Delimiter tags often used in delimiter injection attacks
SUSPICIOUS_TAGS = [
    "<|im_start|>",
    "<|im_end|>",
    "<system>",
    "</system>",
    "[INST]",
    "[/INST]",
    "<<SYS>>",
    "<</SYS>>",
]

COMPILED_INJECTION_REGEXES = [
    (re.compile(pattern, re.IGNORECASE | re.UNICODE), threat_type)
    for pattern, threat_type in INJECTION_PATTERNS
]


def detect_prompt_injection(text: str) -> Tuple[bool, Optional[str]]:
    """Scan input text for known prompt injection / jailbreak patterns.

    Returns:
        (is_injected: bool, threat_type: Optional[str])
    """
    if not text or not isinstance(text, str):
        return False, None

    # Check delimiter tags
    for tag in SUSPICIOUS_TAGS:
        if tag.lower() in text.lower():
            return True, f"delimiter_injection:{tag}"

    # Check regex injection patterns
    for regex, threat_type in COMPILED_INJECTION_REGEXES:
        match = regex.search(text)
        if match:
            return True, threat_type

    return False, None


def sanitize_prompt_text(text: str, max_length: int = 2000) -> str:
    """Sanitize and clamp user input to mitigate delimiter injection."""
    if not text:
        return ""
    sanitized = text[:max_length]
    for tag in SUSPICIOUS_TAGS:
        sanitized = re.sub(re.escape(tag), "", sanitized, flags=re.IGNORECASE)
    return sanitized.strip()


SAFE_PROMPT_DEFLECTION_MESSAGE = (
    "Yêu cầu của bạn chứa các chỉ thị can thiệp vào nguyên tắc an toàn hoặc cố tình thay đổi "
    "cấu trúc hệ thống của AI. Tôi là trợ lý AI chuyên môn của JobPortal, luôn sẵn lòng hỗ trợ "
    "bạn các thắc mắc về tuyển dụng, đánh giá hồ sơ và tìm kiếm việc làm phù hợp."
)


class PromptArmor:
    """Security helper class for prompt injection inspection and sanitization."""

    def inspect(self, text: str) -> tuple[bool, Optional[str], Optional[str]]:
        """Inspect text for prompt injection.

        Returns:
            (is_safe: bool, reason: Optional[str], threat_type: Optional[str])
        """
        is_injected, threat_type = detect_prompt_injection(text)
        if is_injected:
            return False, f"Detected threat: {threat_type}", threat_type
        return True, None, None

    def sanitize(self, text: str, max_length: int = 2000) -> str:
        return sanitize_prompt_text(text, max_length=max_length)


prompt_armor = PromptArmor()
