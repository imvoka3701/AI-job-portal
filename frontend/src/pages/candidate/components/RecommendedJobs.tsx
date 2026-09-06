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
} from "lucide-react";
import { Button, Badge, Card } from "@/components/ui";
import { getRecommendedJobs } from "@/lib/api/ai";
import type { RecommendedJob, JobRecommendationResponse } from "@/lib/api/ai";

interface RecommendedJobsProps {
  resumeId: number | null;
  isValidated: boolean;
}

const EXPERIENCE_LABEL_MAP: Record<string, string> = {
  fresher: "Fresher",
  junior: "Junior",
  middle: "Middle",
  senior: "Senior",
  lead: "Lead / Manager",
  INTERNSHIP: "Thực tập",
  ENTRY_LEVEL: "Entry Level",
  MID_LEVEL: "Mid Level",
  SENIOR_LEVEL: "Senior Level",
  DIRECTOR: "Giám đốc",
  EXECUTIVE: "Quản lý cấp cao",
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-blue-600";
  if (score >= 40) return "text-amber-600";
  return "text-gray-500";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-50 border-emerald-200";
  if (score >= 60) return "bg-blue-50 border-blue-200";
  if (score >= 40) return "bg-amber-50 border-amber-200";
  return "bg-gray-50 border-gray-200";
}

export function RecommendedJobs({ resumeId, isValidated }: RecommendedJobsProps) {
  const [data, setData] = useState<JobRecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (!resumeId || !isValidated) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getRecommendedJobs(resumeId, 10);
      setData(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Không thể tải gợi ý việc làm.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [resumeId, isValidated]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Not ready state
  if (!resumeId || !isValidated) {
    return (
      <Card className="p-6 border border-dashed border-gray-200 bg-gray-50/50">
        <div className="flex items-center gap-3 text-gray-500">
          <Zap className="w-5 h-5" />
          <p className="text-sm">
            Tải lên CV hợp lệ để nhận gợi ý việc làm phù hợp ngành nghề từ AI.
          </p>
        </div>
      </Card>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-gray-500">
            Đang phân tích CV và tìm việc làm phù hợp...
          </p>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="p-6 border-red-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecommendations}
            className="shrink-0"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Thử lại
          </Button>
        </div>
      </Card>
    );
  }

  // Empty state
  if (!data || data.recommendations.length === 0) {
    return (
      <Card className="p-6 bg-gray-50/50 border-gray-200">
        <div className="flex items-center gap-3 text-gray-500">
          <Briefcase className="w-5 h-5" />
          <p className="text-sm">
            Chưa tìm thấy việc làm phù hợp. Hệ thống sẽ cập nhật khi có tin
            tuyển dụng mới.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Việc Làm AI Gợi Ý Cho Bạn
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Ngành: <span className="font-medium text-gray-700">{data.industry_detected}</span>
              {" · "}
              {data.total_matched} kết quả phù hợp
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchRecommendations}
          className="text-gray-400 hover:text-gray-600"
          title="Làm mới gợi ý"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Job Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {data.recommendations.map((job: RecommendedJob, index: number) => (
            <motion.div
              key={job.job_id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Link
                to={`/jobs/${job.job_id}`}
                className="block group"
              >
                <div className={`p-4 rounded-xl border transition-all duration-200 
                  hover:shadow-md hover:border-primary/30 bg-white ${getScoreBg(job.match_score)}`}>
                  {/* Score badge */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-1 flex-1">
                      {job.title}
                    </h4>
                    <div
                      className={`flex items-center gap-1 shrink-0 text-xs font-bold ${getScoreColor(job.match_score)}`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {job.match_score}%
                    </div>
                  </div>

                  {/* Company & Location */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                    {job.company_name && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {job.company_name}
                      </span>
                    )}
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </span>
                    )}
                  </div>

                  {/* Match reason */}
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                    {job.match_reason}
                  </p>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between">
                    <Badge variant="info" size="sm" className="text-[10px]">
                      {EXPERIENCE_LABEL_MAP[job.experience_level] || job.experience_level}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
