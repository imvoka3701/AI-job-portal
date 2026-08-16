import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Search, ChevronDown, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { LOCATION_PICKER_OPTIONS, normalizeLocation } from "@/lib/locations";

// ─── Province Data ─────────────────────────────────────────────────────────────
const PROVINCES = LOCATION_PICKER_OPTIONS;

interface LocationPickerProps {
  value: string[];
  onChange: (locations: string[]) => void;
  placeholder?: string;
}

export function LocationPicker({
  value,
  onChange,
  placeholder = "Tất cả địa điểm",
}: LocationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<string[]>(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync pending with external value when dropdown opens
  useEffect(() => {
    if (isOpen) setPending(value);
  }, [isOpen, value]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filtered = PROVINCES.filter((p) =>
    p.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = useCallback((province: string) => {
    const canonical = normalizeLocation(province);
    setPending((prev) =>
      prev.includes(canonical)
        ? prev.filter((item) => item !== canonical)
        : [...prev, canonical]
    );
  }, []);

  const handleApply = () => {
    onChange(pending);
    setIsOpen(false);
    setSearch("");
  };

  const handleClearAll = () => {
    setPending([]);
  };

  const handleRemoveTag = (loc: string) => {
    const next = value.filter((v) => v !== loc);
    onChange(next);
  };

  // Display label
  const displayText =
    value.length === 0
      ? placeholder
      : value.length === 1
      ? value[0]
      : `${value[0]} +${value.length - 1}`;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`w-full h-12 flex items-center gap-2 px-3 rounded-lg border bg-white text-left text-[15px] transition-all duration-200 ${
          isOpen
            ? "border-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.1)]"
            : "border-transparent hover:border-emerald-200"
        }`}
      >
        <MapPin
          className={`w-5 h-5 shrink-0 transition-colors ${
            value.length > 0 ? "text-[#00B86B]" : "text-emerald-400"
          }`}
        />
        <span
          className={`flex-1 truncate ${
            value.length === 0 ? "text-[#94a3b8]" : "text-[#172033] font-medium"
          }`}
        >
          {displayText}
        </span>
        {value.length > 0 ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange([]);
            }}
            className="p-0.5 rounded-full hover:bg-gray-100"
          >
            <X className="w-4 h-4 text-[#94a3b8]" />
          </button>
        ) : (
          <ChevronDown
            className={`w-4 h-4 text-[#94a3b8] transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {/* Selected tags (show below trigger if multiple) */}
      {value.length > 1 && (
        <div className="flex flex-wrap gap-1 mt-1.5 px-1">
          {value.map((loc) => (
            <span
              key={loc}
              className="flex items-center gap-1 text-[12px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full"
            >
              {loc}
              <button onClick={() => handleRemoveTag(loc)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-[calc(100%+6px)] left-0 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-[#E5EAF0] overflow-hidden"
          >
            {/* Search input */}
            <div className="p-3 border-b border-[#E5EAF0]">
              <div className="flex items-center gap-2 bg-page-bg px-3 py-2 rounded-xl">
                <Search className="w-4 h-4 text-[#94a3b8] shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nhập Tỉnh/Thành phố..."
                  className="flex-1 bg-transparent text-[14px] outline-none text-[#172033] placeholder-[#94a3b8]"
                />
                {search && (
                  <button onClick={() => setSearch("")}>
                    <X className="w-3.5 h-3.5 text-[#94a3b8]" />
                  </button>
                )}
              </div>
            </div>

            {/* Province list */}
            <div className="max-h-64 overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <p className="text-center text-[14px] text-[#94a3b8] py-6">
                  Không tìm thấy địa điểm
                </p>
              ) : (
                filtered.map((province) => {
                  const canonical = normalizeLocation(province);
                  const selected = pending.includes(canonical);
                  return (
                    <button
                      key={province}
                      type="button"
                      onClick={() => toggle(province)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-[14px] transition-colors hover:bg-emerald-50 ${
                        selected ? "text-[#00B86B] font-semibold" : "text-[#172033]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Custom checkbox */}
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            selected
                              ? "bg-[#00B86B] border-[#00B86B]"
                              : "border-[#cbd5e1] bg-white"
                          }`}
                        >
                          {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                        {province}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-[#E5EAF0] flex items-center justify-between bg-[#FAFAFA]">
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[13px] text-[#64748B] hover:text-[#ef4444] transition-colors"
              >
                Bỏ chọn tất cả
              </button>
              <div className="flex items-center gap-2">
                {pending.length > 0 && (
                  <span className="text-[13px] text-[#00B86B] font-medium">
                    Đã chọn {pending.length}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-5 py-2 bg-[#00B86B] hover:bg-[#00A35E] text-white text-[14px] font-semibold rounded-xl transition-colors shadow-sm"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
