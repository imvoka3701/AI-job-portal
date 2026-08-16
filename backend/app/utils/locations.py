"""Location normalization helpers for consistent job search filtering."""

from __future__ import annotations

# Canonical value -> search patterns (lowercase)
LOCATION_PATTERNS: dict[str, list[str]] = {
    "Hà Nội": ["hà nội", "ha noi", "hn"],
    "TP. Hồ Chí Minh": [
        "tp. hồ chí minh",
        "tp hồ chí minh",
        "hồ chí minh",
        "ho chi minh",
        "tphcm",
        "hcm",
    ],
    "Đà Nẵng": ["đà nẵng", "da nang"],
    "Remote": ["remote"],
}

# User-facing alias -> canonical stored value
LOCATION_ALIASES: dict[str, str] = {}
for canonical, patterns in LOCATION_PATTERNS.items():
    LOCATION_ALIASES[canonical.lower()] = canonical
    for pattern in patterns:
        LOCATION_ALIASES[pattern] = canonical


def normalize_location(value: str) -> str:
    """Map free-text/alias input to a canonical location label."""
    cleaned = value.strip()
    if not cleaned:
        return cleaned
    return LOCATION_ALIASES.get(cleaned.lower(), cleaned)


def normalize_locations(values: list[str]) -> list[str]:
    """Normalize and deduplicate location filters."""
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        canonical = normalize_location(value)
        if canonical and canonical not in seen:
            seen.add(canonical)
            result.append(canonical)
    return result


def expand_location_patterns(location: str) -> list[str]:
    """Return lowercase patterns used to match a location filter."""
    canonical = normalize_location(location)
    patterns = LOCATION_PATTERNS.get(canonical)
    if patterns:
        return patterns
    return [canonical.lower()]


def parse_locations_param(raw: str | None) -> list[str]:
    """Parse comma-separated locations query param."""
    if not raw:
        return []
    parts = [part.strip() for part in raw.split(",") if part.strip()]
    return normalize_locations(parts)
