import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  MapPin,
  Zap,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Building2,
  TrendingUp,
  ArrowRight,
  Coins,
} from "lucide-react";
import { Button, Badge, Card, CardHeader, CardContent } from "@/components/ui";
import { getRecommendedJobs } from "@/lib/api/ai";
import { getJobs } from "@/lib/api/jobs";
import type { RecommendedJob, JobRecommendationResponse } from "@/lib/api/ai";
import type { Job } from "@/types/job";

interface RecommendedJobsProps {
  resumeId?: number | null;
  cvDocumentId?: number | null;
  isValidated?: boolean;
}

const EXPERIENCE_LABEL_MAP: Record<string, string> = {
  fresher: "Fresher",
  junior: "Junior",
  middle: "Middle",
  senior: "Senior",
  lead: "Lead",
  internship: "Thực tập",
  INTERNSHIP: "Thực tập",
  ENTRY_LEVEL: "Entry Level",
  MID_LEVEL: "Mid Level",
  SENIOR_LEVEL: "Senior Level",
  DIRECTOR: "Giám đốc",
  EXECUTIVE: "Quản lý",
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (score >= 60) return "text-blue-700 bg-blue-50 border-blue-200";
  if (score >= 40) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-slate-600 bg-slate-100 border-slate-200";
}

function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return "Thoả thuận";
  if (min && max) {
    const minM = Math.round(min / 1_000_000);
    const maxM = Math.round(max / 1_000_000);
    return `${minM} - ${maxM} triệu`;
  }
  if (min) return `Từ ${Math.round(min / 1_000_000)} triệu`;
  if (max) return `Tới ${Math.round(max / 1_000_000)} triệu`;
  return "Thoả thuận";
}

export function RecommendedJobs({ resumeId, cvDocumentId, isValidated = true }: RecommendedJobsProps) {
  const [data, setData] = useState<JobRecommendationResponse | null>(null);
  const [fallbackJobs, setFallbackJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  const hasCv = Boolean(resumeId || cvDocumentId);

  // Lấy việc làm mới nhất khi không có gợi ý AI
  const fetchFallbackJobs = useCallback(async () => {
    try {
      const res = await getJobs({ page_size: 4 });
      setFallbackJobs(res.items || []);
      setIsUsingFallback(true);
    } catch {
      setFallbackJobs([]);
    }
  }, []);

  const fetchRecommendations = useCallback(async () => {
    if (!hasCv || !isValidated) {
      await fetchFallbackJobs();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getRecommendedJobs({
        resume_id: resumeId ?? undefined,
        cv_document_id: cvDocumentId ?? undefined,
        limit: 5,
      });

      if (result && result.recommendations && result.recommendations.length > 0) {
        setData(result);
        setIsUsingFallback(false);
      } else {
        // AI không tìm thấy kết quả -> fallback về danh sách việc làm mới nhất
        setData(null);
        await fetchFallbackJobs();
      }
    } catch {
      // Khi lỗi AI endpoint -> fallback sang việc làm thông thường
      await fetchFallbackJobs();
    } finally {
      setLoading(false);
    }
  }, [resumeId, cvDocumentId, hasCv, isValidated, fetchFallbackJobs]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return (
    <Card className="rounded-[32px] border-slate-200/90 shadow-xs bg-white p-6 space-y-4 overflow-hidden">
      {/* Header */}
      <CardHeader className="p-0 border-b border-slate-100 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00B86B] to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
            {isUsingFallback ? <Briefcase size={18} /> : <TrendingUp size={18} />}
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <span>{isUsingFallback ? "Việc Làm Đề Xuất Dành Cho Bạn" : "Việc Làm AI Khớp Năng Lực"}</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {isUsingFallback
                ? "Việc làm công nghệ tuyển gấp mới nhất"
                : `${data?.total_matched || data?.recommendations.length || 0} vị trí phù hợp với CV của bạn`}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={fetchRecommendations}
          disabled={loading}
          className="h-8 w-8 p-0 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          title="Làm mới danh sách"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#00B86B]" : ""}`} />
        </Button>
      </CardHeader>

      <CardContent className="p-0 space-y-3">
        {/* Loading state */}
        {loading && (
          <div className="py-8 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-[#00B86B] animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Đang tìm kiếm cơ hội phù hợp...</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-between gap-3 text-xs text-rose-700">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
            <Button size="sm" variant="outline" onClick={fetchRecommendations} className="h-7 text-[11px]">
              Thử lại
            </Button>
          </div>
        )}

        {/* AI Recommendations List (1-column vertical stack in sidebar) */}
        {!loading && !isUsingFallback && data && data.recommendations.length > 0 && (
          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {data.recommendations.map((job: RecommendedJob, index: number) => (
                <motion.div
                  key={job.job_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, delay: index * 0.04 }}
                >
                  <Link
                    to={`/jobs/${job.job_id}`}
                    className="block p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-emerald-50/30 hover:border-emerald-300 hover:shadow-xs transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2.5 mb-1.5">
                      <h4 className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 flex-1">
                        {job.title}
                      </h4>
                      <div
                        className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 ${getScoreColor(
                          job.match_score
                        )}`}
                      >
                        <Zap size={11} />
                        <span>{job.match_score}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-[11px] text-slate-500 mb-2">
                      {job.company_name && (
                        <span className="flex items-center gap-1 font-medium truncate max-w-[140px]">
                          <Building2 size={11} className="shrink-0" />
                          <span className="truncate">{job.company_name}</span>
                        </span>
                      )}
                      {job.location && (
                        <span className="flex items-center gap-1 truncate max-w-[120px]">
                          <MapPin size={11} className="shrink-0" />
                          <span className="truncate">{job.location}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/50">
                      <Badge variant="default" size="sm" className="text-[9px] px-1.5 py-0 font-bold bg-white border border-slate-200 text-slate-700">
                        {EXPERIENCE_LABEL_MAP[job.experience_level] || job.experience_level}
                      </Badge>
                      <span className="text-[11px] font-bold text-[#00B86B] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        <span>Ứng tuyển</span>
                        <ChevronRight size={12} />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Fallback Jobs List (Khi AI rỗng hoặc chưa khớp) */}
        {!loading && isUsingFallback && fallbackJobs.length > 0 && (
          <div className="space-y-2.5">
            {fallbackJobs.map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="block p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-emerald-50/30 hover:border-emerald-300 hover:shadow-xs transition-all group"
              >
                <div className="flex items-start justify-between gap-2.5 mb-1.5">
                  <h4 className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 flex-1">
                    {job.title}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                    Mới đăng
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-[11px] text-slate-500 mb-2">
                  <span className="flex items-center gap-1 font-medium truncate max-w-[140px]">
                    <Building2 size={11} className="shrink-0" />
                    <span className="truncate">
                      {job.company?.name || job.employer?.company_name || job.employer?.full_name || "Doanh nghiệp IT"}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 truncate max-w-[120px]">
                    <MapPin size={11} className="shrink-0" />
                    <span className="truncate">{job.location || "Toàn quốc"}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/50">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                    <Coins size={12} className="shrink-0" />
                    <span>{formatSalary(job.salary_min, job.salary_max)}</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#00B86B] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    <span>Xem JD</span>
                    <ChevronRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* View All Jobs Link */}
        <div className="pt-2 border-t border-slate-100">
          <Link
            to="/jobs"
            className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200/80 hover:border-emerald-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <span>Khám phá 500+ việc làm IT</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
