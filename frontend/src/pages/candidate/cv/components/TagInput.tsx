import { useState, type KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";

interface TagInputProps {
  label?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestedTags?: string[];
  helperText?: string;
}

export function TagInput({
  label,
  tags = [],
  onChange,
  placeholder = "Nhập từ khóa và nhấn Enter...",
  suggestedTags = [],
  helperText,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addTag = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      e.preventDefault();
      onChange(tags.slice(0, -1));
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    onChange(tags.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-bold text-slate-700">
          {label}
        </label>
      )}

      {/* Tags Box */}
      <div className="min-h-[46px] w-full rounded-2xl border border-slate-200 bg-white p-2 flex flex-wrap items-center gap-1.5 focus-within:border-[#00B86B] focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
        {tags.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 group"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => handleRemoveTag(index)}
              className="text-slate-400 hover:text-rose-600 hover:bg-slate-200 rounded-full p-0.5 transition-colors cursor-pointer"
            >
              <X size={12} />
            </button>
          </span>
        ))}

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue.trim()) addTag(inputValue);
          }}
          placeholder={tags.length === 0 ? placeholder : "Thêm..."}
          className="flex-1 min-w-[140px] text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent px-2 py-1"
        />
      </div>

      {helperText && <p className="text-[11px] text-slate-400">{helperText}</p>}

      {/* Suggested Tags */}
      {suggestedTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 pt-1">
          <span className="text-[10px] font-bold text-slate-400 mr-1">Gợi ý nhanh:</span>
          {suggestedTags
            .filter((st) => !tags.includes(st))
            .slice(0, 8)
            .map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => addTag(st)}
                className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
              >
                <Plus size={10} />
                <span>{st}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
