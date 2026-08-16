/**
 * AI Match Score Badge helper
 * Returns the appropriate badge style based on score threshold.
 * - >= 90 → Gradient shimmer badge (HIGH)
 * - 70-89 → Solid emerald badge (MEDIUM)
 * - < 70  → Muted gray text (LOW)
 */

export type MatchTier = "high" | "medium" | "low";

export function getMatchTier(score: number): MatchTier {
  if (score >= 90) return "high";
  if (score >= 70) return "medium";
  return "low";
}

export const matchBadgeConfig: Record<
  MatchTier,
  { wrapperClass: string; textClass: string; shimmer: boolean }
> = {
  high: {
    wrapperClass:
      "relative overflow-hidden bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-full px-2.5 py-1",
    textClass:
      "text-[13px] font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent",
    shimmer: true,
  },
  medium: {
    wrapperClass:
      "bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1",
    textClass: "text-[13px] font-semibold text-emerald-600",
    shimmer: false,
  },
  low: {
    wrapperClass: "px-2.5 py-1",
    textClass: "text-[13px] font-medium text-[#94a3b8]",
    shimmer: false,
  },
};
