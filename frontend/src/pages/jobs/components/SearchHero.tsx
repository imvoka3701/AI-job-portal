import { Search, X, Sparkles, Globe, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useRef, useState, useCallback, useEffect } from "react";
import { useJobStore } from "@/stores/jobStore";
import { LocationPicker } from "./LocationPicker";
import { normalizeLocations } from "@/lib/locations";

const QUICK_FILTERS: { label: string; keyword?: string; locations?: string[] }[] = [
  { label: "IT", keyword: "IT" },
  { label: "Marketing", keyword: "Marketing" },
  { label: "Kế toán", keyword: "Kế toán" },
  { label: "Kinh doanh", keyword: "Kinh doanh" },
  { label: "Hà Nội", locations: ["Hà Nội"] },
  { label: "TP. Hồ Chí Minh", locations: ["TP. Hồ Chí Minh"] },
];

export function SearchHero() {
  const setFilters = useJobStore((s) => s.setFilters);
  const currentFilters = useJobStore((s) => s.filters);

  const [keywordInput, setKeywordInput] = useState(currentFilters.keyword ?? "");
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    currentFilters.locations ?? []
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setSelectedLocations(currentFilters.locations ?? []);
  }, [currentFilters.locations]);

  // Initial fixed positions for the 4 skill cards
  const initialPositions = [
    { top: 40, right: 340 }, // React
    { top: 280, right: 360 }, // Python
    { top: 60, right: 20 }, // Remote
    { top: 300, right: 50 }, // Node
  ];
  const [cardPositions, setCardPositions] = useState(initialPositions);

  const handleCardHover = (index: number) => {
    setCardPositions(prev => {
      const newPos = [...prev];
      // Randomize position within the right column's boundary to dodge the mouse
      // Top can be between 20 and 340. Right can be between 0 and 380.
      newPos[index] = {
        top: Math.floor(Math.random() * 320) + 20,
        right: Math.floor(Math.random() * 380),
      };
      return newPos;
    });
  };

  // Close dropdown when clicking outside parallax without React state re-renders
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (heroRef.current) {
        heroRef.current.style.setProperty("--mouse-x", `${x}px`);
        heroRef.current.style.setProperty("--mouse-y", `${y}px`);
      }
    });
  }, []);

  const applyLocations = useCallback(
    (locations: string[]) => {
      const normalized = normalizeLocations(locations);
      setSelectedLocations(normalized);
      setFilters({ locations: normalized.length ? normalized : undefined });
    },
    [setFilters]
  );

  /** 500ms debounce on keyword */
  const handleKeywordChange = useCallback(
    (value: string) => {
      setKeywordInput(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setFilters({ keyword: value.trim() || undefined });
      }, 500);
    },
    [setFilters]
  );

  const handleSearch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setFilters({
      keyword: keywordInput.trim() || undefined,
      locations: selectedLocations.length ? selectedLocations : undefined,
    });
  };

  const handleQuickFilter = (f: (typeof QUICK_FILTERS)[0]) => {
    const newKeyword = f.keyword;
    const newLocations = normalizeLocations(f.locations ?? []);
    setKeywordInput(newKeyword ?? "");
    setSelectedLocations(newLocations);
    setFilters({
      keyword: newKeyword,
      locations: newLocations.length ? newLocations : undefined,
    });
  };

  const isChipActive = (f: (typeof QUICK_FILTERS)[0]) => {
    if (f.keyword) return currentFilters.keyword === f.keyword;
    if (f.locations) {
      const canonical = normalizeLocations(f.locations);
      return (
        canonical.length > 0 &&
        canonical.every((loc) => currentFilters.locations?.includes(loc))
      );
    }
    return false;
  };

  return (
    <motion.div
      ref={heroRef}
      onMouseMove={handleMouseMove}
      className="relative z-40 w-full max-w-[1200px] mx-auto min-h-[430px] rounded-[24px] sm:rounded-[28px] p-6 sm:p-10 lg:p-12 border border-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-[20px] bg-gradient-to-br from-white/92 via-[#EFFAF6]/78 to-white/90 mb-8"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, y: 15 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
        },
      }}
    >
      {/* Subtle Background Radial Depth Globs (Mesh Gradient) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[24px] sm:rounded-[28px]">
        {/* Animated Mesh Gradient Globs */}
        <motion.div 
          className="absolute -top-1/4 -left-1/4 w-[60%] h-[60%] bg-emerald-200/30 rounded-full blur-[80px]"
          animate={{ 
            x: ["0%", "15%", "0%", "-15%", "0%"],
            y: ["0%", "15%", "-10%", "15%", "0%"],
            scale: [1, 1.1, 0.9, 1.1, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute -bottom-1/4 -right-1/4 w-[60%] h-[60%] bg-teal-200/30 rounded-full blur-[80px]"
          animate={{ 
            x: ["0%", "-20%", "10%", "-15%", "0%"],
            y: ["0%", "-15%", "20%", "-10%", "0%"],
            scale: [1, 1.1, 1.2, 0.9, 1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="absolute right-0 top-0 bottom-0 w-[55%] hidden lg:block">
          <motion.div 
            className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[420px] h-[420px] bg-emerald-300/20 rounded-full blur-[90px]"
            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute top-10 right-10 w-[250px] h-[250px] bg-cyan-200/20 rounded-full blur-[70px]"
            animate={{ y: [0, -40, 0], x: [0, 30, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
        {/* 1. LEFT COLUMN: CONTENT & SEARCH */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0 }}
          >
            {/* Glass Pill Badge: Powered by AI */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#10B981]/[0.07] border border-[#10B981]/20 text-[#059669] font-bold text-xs mb-3 sm:mb-4 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
              ✦ Powered by AI
            </div>

            {/* Main Title */}
            <h1 className="text-[30px] sm:text-[38px] lg:text-[48px] font-extrabold text-[#0F172A] tracking-[-0.035em] leading-[1.05] mb-3">
              Tìm công việc{" "}
              <span className="text-[#00B86B] underline decoration-emerald-200 decoration-wavy underline-offset-4">
                phù hợp
              </span>{" "}
              <br className="hidden sm:inline" />
              với bạn <span className="inline-block text-amber-400">✨</span>
            </h1>

            {/* Subtitle */}
            <p className="text-[15px] text-[#64748B] max-w-[520px] leading-[1.7]">
              Khám phá hàng nghìn cơ hội việc làm và để AI tìm ra những công việc phù hợp nhất.
            </p>
          </motion.div>

          {/* Premium SaaS Search bar — ONLY 1 Search icon in keyword section & ONLY 1 MapPin inside LocationPicker */}
          <motion.div
            className="relative z-20 max-w-2xl bg-white/92 rounded-[18px] border border-[#E2E8F0] shadow-[0_8px_30px_rgba(15,23,42,0.07)] p-2 md:p-1.5 md:h-[62px] flex flex-col md:flex-row items-center gap-2 md:gap-0 transition-all duration-300 focus-within:border-[#10B981]/50 focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.08),0_10px_35px_rgba(16,185,129,0.08)]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.14 }}
          >
            {/* Keyword input section: Search Icon ONLY */}
            <div className="flex-1 flex items-center gap-3 px-3.5 py-2 md:py-0 h-full w-full border-b md:border-b-0 md:border-r border-slate-200/60">
              <Search className="w-5 h-5 text-[#10B981] shrink-0" />
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => handleKeywordChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Nhập vị trí, kỹ năng, tên công việc..."
                aria-label="Tìm kiếm việc làm"
                className="w-full outline-none text-[#0F172A] placeholder-[#94A3B8] bg-transparent text-[14.5px] font-medium"
              />
              {keywordInput && (
                <button
                  type="button"
                  aria-label="Xóa từ khóa"
                  onClick={() => {
                    setKeywordInput("");
                    setFilters({ keyword: undefined });
                  }}
                  className="p-1 hover:bg-slate-100 rounded-full transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5 text-[#94A3B8] hover:text-[#0F172A]" />
                </button>
              )}
            </div>

            {/* Location selector section: LocationPicker contains MapPin icon internally */}
            <div className="shrink-0 md:w-[200px] px-2 py-1 flex items-center w-full h-full">
              <LocationPicker value={selectedLocations} onChange={applyLocations} />
            </div>

            {/* Search button — 48px height */}
            <div className="p-0.5 w-full md:w-auto shrink-0 h-full flex items-center">
              <motion.button
                onClick={handleSearch}
                aria-label="Tìm kiếm việc làm"
                className="w-full md:w-auto h-[48px] px-6 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm rounded-[14px] flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(16,185,129,0.22)] transition-all cursor-pointer"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Tìm kiếm</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>

          {/* Quick Filter Chips */}
          <motion.div
            className="flex flex-wrap items-center gap-2 pt-1"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {QUICK_FILTERS.map((f) => (
              <button
                key={f.label}
                onClick={() => handleQuickFilter(f)}
                className={`h-8 px-4 rounded-full text-xs font-semibold transition-all duration-200 border cursor-pointer ${
                  isChipActive(f)
                    ? "bg-[#10B981] border-[#10B981] text-white shadow-xs"
                    : "bg-white/65 border-[#10B981]/12 text-[#059669] hover:bg-[#10B981]/10 hover:border-[#10B981]/25 hover:-translate-y-0.5"
                }`}
              >
                {f.label}
              </button>
            ))}
          </motion.div>
        </div>

        {/* 2. RIGHT COLUMN: AI VISUAL (Floating Frosted Glass AI Skill Cards + Robot) */}
        <div className="hidden lg:block h-[410px] shrink-0" style={{ width: 480, minWidth: 480, position: 'relative' }}>
          
          {/* Floating Frosted Glass AI Skill Cards (z-40 to float above AI Matching Card & Robot) */}
          {/* Card 1: React.js (top-left, z-40) */}
          <motion.div
            onClick={() => {
              setKeywordInput("React");
              setFilters({ keyword: "React" });
            }}
            className="skill-card-frosted-glass px-5 py-2.5 flex items-center gap-3 text-sm font-bold text-[#0F172A] cursor-pointer min-w-fit hover:scale-105 transition-transform select-none"
            style={{ position: 'absolute', zIndex: 40 }}
            initial={{ top: 40, right: 340 }}
            animate={{ top: cardPositions[0].top, right: cardPositions[0].right }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            onMouseEnter={() => handleCardHover(0)}
            title="Tìm việc làm React.js"
          >
            <div className="relative z-10 w-[28px] h-[28px] rounded-[8px] bg-white/80 shadow-[inset_0_1px_2px_rgba(255,255,255,1)] flex items-center justify-center shrink-0">
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" alt="React" className="w-4 h-4" />
            </div>
            <span className="relative z-10 whitespace-nowrap">React.js</span>
          </motion.div>

          {/* Card 2: Python (middle-left, z-40) */}
          <motion.div
            onClick={() => {
              setKeywordInput("Python");
              setFilters({ keyword: "Python" });
            }}
            className="skill-card-frosted-glass px-5 py-2.5 flex items-center gap-3 text-sm font-bold text-[#0F172A] cursor-pointer min-w-fit hover:scale-105 transition-transform select-none"
            style={{ position: 'absolute', zIndex: 40 }}
            initial={{ top: 280, right: 360 }}
            animate={{ top: cardPositions[1].top, right: cardPositions[1].right }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            onMouseEnter={() => handleCardHover(1)}
            title="Tìm việc làm Python"
          >
            <div className="relative z-10 w-[28px] h-[28px] rounded-[8px] bg-white/80 shadow-[inset_0_1px_2px_rgba(255,255,255,1)] flex items-center justify-center shrink-0">
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg" alt="Python" className="w-4 h-4" />
            </div>
            <span className="relative z-10 whitespace-nowrap">Python</span>
          </motion.div>

          {/* Card 3: Remote (top-right, z-40) */}
          <motion.div
            onClick={() => {
              setFilters({ job_type: "remote" });
            }}
            className="skill-card-frosted-glass px-5 py-2.5 flex items-center gap-3 text-sm font-bold text-[#0F172A] cursor-pointer min-w-fit hover:scale-105 transition-transform select-none"
            style={{ position: 'absolute', zIndex: 40 }}
            initial={{ top: 60, right: 20 }}
            animate={{ top: cardPositions[2].top, right: cardPositions[2].right }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            onMouseEnter={() => handleCardHover(2)}
            title="Tìm việc làm Remote"
          >
            <div className="relative z-10 w-[28px] h-[28px] rounded-[8px] bg-white/80 shadow-[inset_0_1px_2px_rgba(255,255,255,1)] flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="relative z-10 whitespace-nowrap">Remote</span>
          </motion.div>

          {/* Card 4: Node.js (bottom-right, z-40) */}
          <motion.div
            onClick={() => {
              setKeywordInput("Node.js");
              setFilters({ keyword: "Node.js" });
            }}
            className="skill-card-frosted-glass px-5 py-2.5 flex items-center gap-3 text-sm font-bold text-[#0F172A] cursor-pointer min-w-fit hover:scale-105 transition-transform select-none"
            style={{ position: 'absolute', zIndex: 40 }}
            initial={{ top: 300, right: 50 }}
            animate={{ top: cardPositions[3].top, right: cardPositions[3].right }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            onMouseEnter={() => handleCardHover(3)}
            title="Tìm việc làm Node.js"
          >
            <div className="relative z-10 w-[28px] h-[28px] rounded-[8px] bg-white/80 shadow-[inset_0_1px_2px_rgba(255,255,255,1)] flex items-center justify-center shrink-0">
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg" alt="Node.js" className="w-4 h-4" />
            </div>
            <span className="relative z-10 whitespace-nowrap">Node.js</span>
          </motion.div>

          {/* Glassmorphic AI Matching Card (z-20) */}
          <motion.div
            className="bg-white/90 backdrop-blur-[24px] border border-white rounded-[18px] shadow-[0_15px_40px_rgba(16,185,129,0.15)] p-5 w-48"
            style={{ position: 'absolute', top: '50%', right: 260, zIndex: 20, marginTop: '-50px' }}
            initial={{ y: 0 }}
            animate={{ y: [-8, 8, -8] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="text-xs font-extrabold text-[#10B981] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
              <span>AI Matching</span>
            </div>

            <div className="text-3xl font-black text-[#10B981] my-1.5 tracking-tight">
              95%
            </div>

            {/* Animated Equalizer Bar Chart */}
            <div className="flex items-end gap-1.5 h-8 mt-1.5">
              {[25, 45, 35, 75, 95, 60, 100].map((height, i) => (
                <motion.div
                  key={i}
                  className="flex-1 bg-[#10B981] rounded-full"
                  animate={{
                    height: [`${height * 0.4}%`, `${height}%`, `${height * 0.5}%`],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Robot Illustration (z-10) — float animation without rotation */}
          <motion.img
            src="/images/robot-hero-2.png"
            alt="AI Recruitment Robot"
            className="drop-shadow-[0_20px_35px_rgba(16,185,129,0.2)] select-none"
            style={{ position: 'absolute', right: 0, top: '50%', marginTop: '-170px', width: 340, height: 340, objectFit: 'contain', zIndex: 10 }}
            initial={{ y: 0 }}
            animate={{ y: [-8, 8, -8] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* MOBILE ROBOT ILLUSION (Scaled down under content for mobile) */}
        <div className="flex lg:hidden flex-col items-center justify-center pt-2 select-none">
          <motion.img
            src="/images/robot-hero-2.png"
            alt="AI Recruitment Robot Mobile"
            className="w-[75%] max-w-[260px] h-auto object-contain drop-shadow-lg"
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
