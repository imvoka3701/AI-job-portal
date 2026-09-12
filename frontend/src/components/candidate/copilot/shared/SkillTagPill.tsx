/**
 * SkillTagPill — Interactive pill for skills (Matched, Missing, Recommended)
 * Persona: UI/UX Architect
 */

import { Check, Plus } from "lucide-react";

interface SkillTagPillProps {
  name: string;
  status: "matched" | "missing" | "recommended";
  onAdd?: (skillName: string) => void;
  isAdded?: boolean;
}

export function SkillTagPill({
  name,
  status,
  onAdd,
  isAdded = false,
}: SkillTagPillProps) {
  if (status === "matched") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>{name}</span>
      </span>
    );
  }

  if (status === "missing") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 group">
        <span>{name}</span>
        {onAdd && !isAdded ? (
          <button
            type="button"
            onClick={() => onAdd(name)}
            title="Thêm kỹ năng này vào CV"
            className="ml-1 p-0.5 rounded hover:bg-rose-200 text-rose-700 transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
          </button>
        ) : isAdded ? (
          <Check className="w-3 h-3 ml-1 text-rose-700" />
        ) : null}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
      <span>{name}</span>
      {onAdd && !isAdded ? (
        <button
          type="button"
          onClick={() => onAdd(name)}
          title="Thêm gợi ý này vào CV"
          className="ml-1 p-0.5 rounded hover:bg-indigo-200 text-indigo-700 transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" />
        </button>
      ) : isAdded ? (
        <Check className="w-3 h-3 ml-1 text-indigo-700" />
      ) : null}
    </span>
  );
}
