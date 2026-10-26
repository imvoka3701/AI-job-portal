import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Building2,
  FileCheck,
  Users,
  Award,
  Calendar,
} from "lucide-react";

export interface AppliedStatusTrackerProps {
  applicationId?: number;
  status?: string | null;
  appliedAt?: string | null;
  aiMatchingScore?: number | null;
  companyName: string;
  jobTitle?: string;
  isLoading?: boolean;
}

interface PipelineStep {
  id: string;
  label: string;
  subLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PIPELINE_STEPS: PipelineStep[] = [
  { id: "applied", label: "Đã nộp", subLabel: "Hồ sơ tiếp nhận", icon: FileCheck },
  { id: "review", label: "Thẩm định", subLabel: "HR xem xét CV", icon: Clock },
  { id: "interview", label: "Phỏng vấn", subLabel: "Trao đổi kỹ thuật", icon: Users },
  { id: "decision", label: "Kết quả", subLabel: "Đưa ra quyết định", icon: Award },
];

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeBg: string; badgeText: string; badgeBorder: string; activeStep: number }
> = {
  pending: {
    label: "Đang xét duyệt",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    badgeBorder: "border-amber-200",
    activeStep: 1,
  },
  reviewed: {
    label: "Đã xem qua CV",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-700",
    badgeBorder: "border-sky-200",
    activeStep: 1,
  },
  shortlisted: {
    label: "Đã vào Shortlist",
    badgeBg: "bg-teal-50",
    badgeText: "text-teal-700",
    badgeBorder: "border-teal-200",
    activeStep: 2,
  },
  interview: {
    label: "Vòng phỏng vấn",
    badgeBg: "bg-indigo-50",
    badgeText: "text-indigo-700",
    badgeBorder: "border-indigo-200",
    activeStep: 2,
  },
  accepted: {
    label: "Đã trúng tuyển",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-800",
    badgeBorder: "border-emerald-300",
    activeStep: 3,
  },
  rejected: {
    label: "Hồ sơ lưu trữ",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-600",
    badgeBorder: "border-slate-200",
    activeStep: 3,
  },
};

export const AppliedStatusTracker: React.FC<AppliedStatusTrackerProps> = ({
  status = "pending",
  appliedAt,
  aiMatchingScore,
  companyName,
  isLoading = false,
}) => {
  const normalizedStatus = status ? status.toLowerCase() : "pending";
  const currentStatus = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.pending;

  const formattedDate = React.useMemo(() => {
    if (!appliedAt) return "Vừa mới đây";
    try {
      const d = new Date(appliedAt);
      return d.toLocaleDateString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return appliedAt;
    }
  }, [appliedAt]);

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div
        id="apply-box"
        className="p-5 sm:p-6 rounded-[32px] bg-white border border-slate-200/90 shadow-xs space-y-4 animate-pulse"
      >
        <div className="flex items-center justify-between">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-6 bg-slate-100 rounded-full w-24"></div>
        </div>
        <div className="h-10 bg-slate-100 rounded-2xl w-full"></div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="h-14 bg-slate-100 rounded-2xl"></div>
          <div className="h-14 bg-slate-100 rounded-2xl"></div>
        </div>
        <div className="h-11 bg-slate-200 rounded-2xl w-full"></div>
      </div>
    );
  }

  return (
    <motion.div
      id="apply-box"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="p-5 sm:p-6 rounded-[32px] bg-gradient-to-b from-emerald-50/70 via-white to-white border border-emerald-100/90 shadow-xs space-y-5"
    >
      {/* Header with Live Indicator & Status Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
              Hồ sơ đang hoạt động
            </span>
          </div>
          <h4 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
            Bạn đã nộp hồ sơ thành công
          </h4>
        </div>

        {/* Current Status Pill */}
        <div
          className={`px-3 py-1 rounded-full text-[11px] font-bold border ${currentStatus.badgeBg} ${currentStatus.badgeText} ${currentStatus.badgeBorder} shadow-2xs shrink-0 flex items-center gap-1.5`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
          <span>{currentStatus.label}</span>
        </div>
      </div>

      {/* Mini Progress Pipeline (4-step Stepper) */}
      <div className="py-2">
        <div className="relative flex items-center justify-between">
          {/* Background Track */}
          <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-slate-100 -z-0"></div>

          {/* Active Fill Track */}
          <div
            className="absolute top-1/2 left-4 -translate-y-1/2 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 -z-0 transition-all duration-500"
            style={{
              width: `${(Math.min(currentStatus.activeStep, PIPELINE_STEPS.length - 1) / (PIPELE_LEN_SUB_1 || 3)) * 82}%`,
            }}
          ></div>

          {PIPELINE_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStatus.activeStep;
            const isCurrent = idx === currentStatus.activeStep;
            const Icon = step.icon;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center group">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? "bg-emerald-500 text-white shadow-xs"
                      : isCurrent
                      ? "bg-white text-emerald-600 border-2 border-emerald-600 ring-4 ring-emerald-100 shadow-xs"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>
                <span
                  className={`mt-1.5 text-[10px] sm:text-[11px] font-bold text-center leading-tight transition-colors ${
                    isCurrent
                      ? "text-emerald-800"
                      : isCompleted
                      ? "text-slate-700"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Applied Metadata Summary Grid */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-0.5">
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>Ngày nộp</span>
          </div>
          <p className="text-xs font-bold text-slate-800 truncate" title={formattedDate}>
            {formattedDate}
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-0.5">
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>AI Matching</span>
          </div>
          <p className="text-xs font-bold text-emerald-700 truncate">
            {aiMatchingScore ? `${aiMatchingScore}% Phù hợp` : "Đã đồng bộ"}
          </p>
        </div>
      </div>

      {/* Recruiter SLA / Guarantee Note */}
      <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex items-start gap-2.5 text-[11px] text-slate-600 leading-relaxed">
        <Building2 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800">{companyName}</span> thường phản hồi hồ sơ trong vòng <strong className="text-emerald-700">3 - 5 ngày làm việc</strong>. Bạn sẽ nhận email và thông báo khi nhà tuyển dụng xử lý hồ sơ.
        </div>
      </div>

      {/* Action CTA: Smart Link to Candidate Dashboard */}
      <div className="pt-1 space-y-2">
        <Link
          to="/dashboard"
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer group"
        >
          <span>Theo dõi hồ sơ tại Dashboard</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </motion.div>
  );
};

const PIPELE_LEN_SUB_1 = PIPELINE_STEPS.length - 1;
