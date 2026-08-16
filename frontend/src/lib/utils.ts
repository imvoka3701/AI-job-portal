import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes safely — resolves conflicts (e.g. p-2 + p-4 → p-4).
 * Use this everywhere instead of plain template literals.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a salary range into a readable string.
 * e.g. formatSalary(1000, 2000) → "1,000 - 2,000 USD"
 */
export function formatSalary(
  min: number | null,
  max: number | null,
  currency = "USD"
): string {
  if (!min && !max) return "Negotiable";
  if (min && !max) return `From ${min.toLocaleString()} ${currency}`;
  if (!min && max) return `Up to ${max.toLocaleString()} ${currency}`;
  return `${min!.toLocaleString()} - ${max!.toLocaleString()} ${currency}`;
}

/**
 * Format a date string into a readable relative time.
 * e.g. "2 days ago", "just now"
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Get initials from a full name.
 * e.g. "Nguyen Van A" → "NV"
 */
export function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

/**
 * Truncate a string to a max length, appending "..." if truncated.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/**
 * Safely resolves relative file/image paths (e.g. /uploads/...) or returns full URL.
 */
export function getFileUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return path;
  return `/${path}`;
}
