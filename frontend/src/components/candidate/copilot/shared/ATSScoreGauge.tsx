/**
 * ATSScoreGauge — Circular animated gauge for ATS readiness score
 * Persona: UI/UX Architect
 */

import { motion } from "framer-motion";

interface ATSScoreGaugeProps {
  score: number; // 0 to 100
  size?: number; // default 140
  strokeWidth?: number; // default 10
}

export function ATSScoreGauge({
  score,
  size = 130,
  strokeWidth = 9,
}: ATSScoreGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let colorClass = "text-emerald-600";
  let strokeColor = "#059669";
  let bgColorClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
  let label = "Sẵn sàng cho ATS";

  if (score < 60) {
    colorClass = "text-rose-600";
    strokeColor = "#E11D48";
    bgColorClass = "bg-rose-50 text-rose-800 border-rose-200";
    label = "Cần bổ sung gấp";
  } else if (score < 80) {
    colorClass = "text-amber-600";
    strokeColor = "#D97706";
    bgColorClass = "bg-amber-50 text-amber-800 border-amber-200";
    label = "Khá tốt • Cần tối ưu";
  }

  return (
    <div className="flex flex-col items-center justify-center p-3">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="rotate-[-90deg] transition-all duration-700"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated score circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Center score display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-2xl font-black tracking-tight ${colorClass}`}
          >
            {score}
            <span className="text-xs font-semibold text-slate-400">/100</span>
          </motion.span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            ATS Score
          </span>
        </div>
      </div>

      <span
        className={`mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${bgColorClass}`}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: strokeColor }}
        />
        {label}
      </span>
    </div>
  );
}
