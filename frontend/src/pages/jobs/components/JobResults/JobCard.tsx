import { useState, useRef, useCallback } from "react";
import { MapPin, Briefcase, Clock, Bookmark, CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import type { Job } from "@/types/job";
import { getFileUrl } from "@/lib/utils";
import { AIMatchBadge } from "./JobUIHelpers";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return "Thỏa thuận";
  const fmt = (n: number) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(0)} triệu`
      : n.toLocaleString("vi-VN");
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `Từ ${fmt(min)}`;
  return `Đến ${fmt(max!)}`;
}

function formatPostedAt(dateStr: string): string {
  const diff = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return "Hôm nay";
  if (diff === 1) return "1 ngày trước";
  if (diff < 30) return `${diff} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

function jobTypeLabel(type: string): string {
  const map: Record<string, string> = {
    full_time: "Full-time",
    part_time: "Part-time",
    internship: "Thực tập",
    freelance: "Freelance",
    remote: "Remote",
  };
  return map[type] ?? type;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function JobCard({ job, viewMode = "list" }: { job: Job; viewMode?: "list" | "grid" }) {
  const navigate = useNavigate();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // High performance mouse tracking — zero React rerenders
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${clientX}px`);
    cardRef.current.style.setProperty("--mouse-y", `${clientY}px`);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty("--glow-opacity", "1");
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty("--glow-opacity", "0");
  }, []);

  // Derive employer name and logo placeholder
  const companyName = job.employer?.company_name || job.employer?.full_name || "Nhà tuyển dụng";
  const employerAvatar = getFileUrl(job.employer?.avatar_url);
  const logoSrc = employerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(
    companyName
  )}&background=e8f8f1&color=00995c&bold=true&size=48`;

  const toggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  const handleCardClick = () => {
    navigate(`/jobs/${job.id}`);
  };

  return (
    <motion.div
      ref={cardRef}
      onClick={handleCardClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="job-card-glass h-full p-5 cursor-pointer select-none group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-emerald-300"
      whileTap={{ scale: 0.99 }}
      data-view={viewMode}
    >
      <div className="relative z-10 h-full flex flex-col">
        {/* Top Row: Logo, Title & Bookmark */}
        <div className="flex items-start justify-between gap-4 mb-3.5">
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            {/* 48x48 Company Logo container */}
            <div className="w-12 h-12 rounded-[14px] overflow-hidden shrink-0 border border-[#E2E8F0] bg-white/80 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform duration-300">
              <img
                src={logoSrc}
                alt={companyName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback for broken image URLs
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    companyName
                  )}&background=e8f8f1&color=00995c&bold=true&size=48`;
                }}
              />
            </div>

            {/* Job Title & Company */}
            <div className="min-w-0 flex-1">
              <Link to={`/jobs/${job.id}`} className="block" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-[16px] font-extrabold text-[#0F172A] group-hover:text-[#00B86B] transition-colors leading-snug line-clamp-1">
                  {job.title}
                </h3>
              </Link>
              <div className="flex items-center gap-1.5 mt-1 text-[13.5px] text-[#64748B]">
                <span className="truncate font-medium">{companyName}</span>
                <span title="Nhà tuyển dụng xác thực" className="inline-flex">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00B86B] shrink-0" />
                </span>
              </div>
            </div>
          </div>

          {/* Bookmark Button */}
          <motion.button
            type="button"
            onClick={toggleBookmark}
            aria-label={`Lưu công việc ${job.title}`}
            className={`p-2 rounded-xl border transition-colors shrink-0 ${
              isBookmarked
                ? "bg-[#ECFDF5] border-emerald-200 text-[#00B86B]"
                : "bg-white/80 border-[#E2E8F0] text-[#94A3B8] hover:text-[#00B86B] hover:bg-[#ECFDF5]"
            }`}
            whileTap={{ scale: 1.15 }}
            transition={{ duration: 0.18 }}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
          </motion.button>
        </div>

        {/* Meta Row: Salary, Location, Job Type */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mb-3.5 text-[13.5px]">
          <div className="font-extrabold text-[#00B86B]">
            {formatSalary(job.salary_min, job.salary_max)}
          </div>
          {job.location && (
            <div className="flex items-center gap-1.5 text-[#64748B]">
              <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
              {job.location}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[#64748B]">
            <Briefcase className="w-3.5 h-3.5 text-[#94A3B8]" />
            {jobTypeLabel(job.job_type)}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <span className="px-3 py-1 bg-slate-100/80 hover:bg-[#ECFDF5] text-[#475569] hover:text-[#00995C] text-xs font-medium rounded-full transition-colors">
            {job.experience_level}
          </span>
          {job.job_type === "remote" && (
            <span className="px-3 py-1 bg-slate-100/80 hover:bg-[#ECFDF5] text-[#475569] hover:text-[#00995C] text-xs font-medium rounded-full transition-colors">
              Remote
            </span>
          )}
        </div>

        {/* Footer Row: AI Match Score, Date Posted, View JD CTA Button */}
        <div className="flex items-center justify-between pt-3.5 border-t border-[#E2E8F0]/80 mt-auto">
          <div className="flex items-center gap-3">
            {/* AI Match score badge — only display when real match score is available */}
            {typeof (job as Job & { ai_matching_score?: number | null }).ai_matching_score === "number" &&
            (job as Job & { ai_matching_score: number }).ai_matching_score > 0 ? (
              <AIMatchBadge
                score={(job as Job & { ai_matching_score: number }).ai_matching_score}
              />
            ) : null}
            <div className="flex items-center gap-1 text-[#94A3B8] text-xs">
              <Clock className="w-3.5 h-3.5" />
              {formatPostedAt(job.created_at)}
            </div>
          </div>

          {/* View JD & Apply Direct Button */}
          <Link
            to={`/jobs/${job.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#00B86B] hover:bg-[#00995C] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all group/btn"
          >
            <span>Xem JD & Ứng Tuyển</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
