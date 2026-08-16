/** Horizontal pipeline stepper — shows progress dots for each round. */

import { type RoundItem } from "@/lib/api/rounds";

const ROUND_LABELS: Record<string, string> = {
  cv_screen: "CV",
  tech: "Tech",
  hr: "HR",
  final: "Final",
  custom: "?",
};

interface Props {
  rounds: RoundItem[] | null;
  loading?: boolean;
}

export function PipelineStepper({ rounds, loading }: Props) {
  if (loading) {
    return (
      <div className="flex items-center gap-1.5">
        {[24, 16, 20, 14].map((w, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-200 animate-pulse" />
            {i < 3 && <div className="h-0.5 bg-gray-100 animate-pulse" style={{ width: w }} />}
          </div>
        ))}
      </div>
    );
  }

  if (!rounds || rounds.length === 0) return null;

  return (
    <div className="flex items-center gap-1" title={`${rounds.length} vòng`}>
      {rounds.map((r, i) => {
        const isPassed = r.status === "passed";
        const isCurrent = r.status === "pending" || r.status === "in_progress";
        const isFailed = r.status === "failed";
        const isSkipped = r.status === "skipped";

        const dotClass = isPassed
          ? "bg-green-500 border-green-500"
          : isFailed
            ? "bg-red-500 border-red-500"
            : isSkipped
              ? "bg-gray-300 border-gray-300"
              : isCurrent
                ? "bg-amber-400 border-amber-400 animate-pulse"
                : "bg-gray-200 border-gray-200";

        const tooltip = `${ROUND_LABELS[r.round_type] || r.round_type} — ${r.status}`;

        return (
          <div key={r.id} className="flex items-center gap-1 shrink-0">
            <div
              className={`w-2.5 h-2.5 rounded-full border-2 ${dotClass}`}
              title={tooltip}
            />
            {i < rounds.length - 1 && (
              <div
                className={`h-0.5 w-3 rounded ${
                  isPassed || isSkipped ? "bg-green-400" : isCurrent ? "bg-amber-200" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
