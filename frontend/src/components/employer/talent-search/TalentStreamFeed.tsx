import { motion } from "framer-motion";
import {
  Briefcase,
  Layers,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CandidateGroup } from "./CandidateDossierCard";

interface TalentStreamFeedProps {
  candidates: CandidateGroup[];
  selectedCandidateId: string | null;
  onSelectCandidate: (candidate: CandidateGroup) => void;
}

const getScoreBadge = (score: number) => {
  const pct = Math.round(score * 100);
  if (pct >= 80) {
    return {
      label: `${pct}%`,
      sub: "Rất phù hợp",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dotColor: "bg-emerald-500",
    };
  }
  if (pct >= 60) {
    return {
      label: `${pct}%`,
      sub: "Phù hợp",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      dotColor: "bg-indigo-500",
    };
  }
  return {
    label: `${pct}%`,
    sub: "Tiềm năng",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    dotColor: "bg-amber-500",
  };
};

export function TalentStreamFeed({
  candidates,
  selectedCandidateId,
  onSelectCandidate,
}: TalentStreamFeedProps) {
  return (
    <div className="flex flex-col h-full space-y-2">
      {/* Feed Header */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-semibold">
        <span>
          Danh sách ứng viên ({candidates.length})
        </span>
        <span className="text-[11px] text-slate-400 font-normal">
          Sắp xếp theo độ khớp AI
        </span>
      </div>

      {/* Candidate Cards Stream */}
      <div className="space-y-2.5 overflow-y-auto max-h-[720px] pr-1.5 scrollbar-thin scrollbar-thumb-slate-200">
        {candidates.map((candidate, idx) => {
          const isSelected = selectedCandidateId === candidate.id;
          const score = getScoreBadge(candidate.maxHybridScore);
          const initials =
            candidate.candidateName
              .split(" ")
              .filter(Boolean)
              .slice(-2)
              .map((w) => w[0]?.toUpperCase())
              .join("") || "UV";

          return (
            <motion.div
              key={candidate.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
              onClick={() => onSelectCandidate(candidate)}
              className={cn(
                "group relative p-3.5 rounded-xl border transition-all cursor-pointer text-left",
                isSelected
                  ? "bg-indigo-50/50 border-indigo-400 shadow-sm ring-1 ring-indigo-400/50"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs"
              )}
            >
              {/* Top Row: Avatar + Info + Score Badge */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors",
                      isSelected
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-700 group-hover:from-indigo-100 group-hover:to-indigo-50 group-hover:text-indigo-700"
                    )}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                      <span className="truncate">{candidate.candidateName}</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <Briefcase className="w-3 h-3 shrink-0 text-slate-400" />
                      <span className="truncate">
                        {candidate.appliedJobTitle || "Ứng viên đã nộp"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* AI Score Badge */}
                <div
                  className={cn(
                    "px-2 py-1 rounded-lg border text-right shrink-0",
                    score.badgeColor
                  )}
                >
                  <div className="text-xs font-black leading-none">{score.label}</div>
                  <div className="text-[9px] font-semibold opacity-85 leading-tight mt-0.5">
                    {score.sub}
                  </div>
                </div>
              </div>

              {/* Skills Tags */}
              {candidate.allSkills.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 mt-2.5">
                  {candidate.allSkills.slice(0, 3).map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60"
                    >
                      {skill}
                    </span>
                  ))}
                  {candidate.allSkills.length > 3 && (
                    <span className="text-[10px] text-slate-400 font-semibold px-1">
                      +{candidate.allSkills.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Bottom metadata */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-indigo-500" />
                  <span>{candidate.chunks.length} phân đoạn khớp</span>
                </span>
                <span className="flex items-center gap-1 font-medium text-slate-400 group-hover:text-indigo-600 transition-colors">
                  <span className="text-[10px]">Xem chi tiết</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
