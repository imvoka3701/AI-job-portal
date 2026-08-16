import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiClient, getApiErrorMessage } from "@/lib/axios";
import { useUser, useAuthStore } from "@/stores/authStore";
import { tokenStorage } from "@/lib/axios";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  ErrorState,
  PageTransition,
} from "@/components/ui";
import { AdminTabNavigation } from "./components/AdminTabNavigation";
import { Calendar, Clock, MapPin, Users, AlertTriangle, CheckCircle2, XCircle, Filter } from "lucide-react";
import { motion } from "framer-motion";

interface InterviewRoundItem {
  id: number;
  application_id: number;
  round_type: string;
  round_name: string;
  scheduled_at: string | null;
  location: string | null;
  interviewer_notes: string | null;
  result: "passed" | "failed" | "pending" | null;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  company_name: string;
  employer_email: string;
  created_at: string;
  needs_review: boolean;
  review_reason: string | null;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

type ResultFilter = "all" | "passed" | "failed" | "pending";
type RoundTypeFilter = "all" | "cv_screen" | "phone_screen" | "technical" | "behavioral" | "final";

export function AdminInterviewsPage() {
  const user = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [rounds, setRounds] = useState<InterviewRoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [roundTypeFilter, setRoundTypeFilter] = useState<RoundTypeFilter>("all");
  const [needsReviewOnly, setNeedsReviewOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const [markingReview, setMarkingReview] = useState<number | null>(null);
  const [reviewReason, setReviewReason] = useState("");

  useEffect(() => {
    if (!user && tokenStorage.get()) {
      useAuthStore.getState().fetchMe().catch(() => {});
    }
  }, [user]);

  const fetchRounds = async (page = 1) => {
    if (!user || user.role !== "admin") return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params: Record<string, string | number> = {
        page,
        page_size: pagination.pageSize,
      };
      
      if (resultFilter !== "all") params.result = resultFilter;
      if (roundTypeFilter !== "all") params.round_type = roundTypeFilter;
      if (needsReviewOnly) params.needs_review = "true";
      
      const { data } = await apiClient.get<PaginatedResponse<InterviewRoundItem>>(
        "/admin/interview-rounds",
        { params }
      );
      
      setRounds(data.items);
      setPagination({ page: data.page, pageSize: data.page_size, total: data.total });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const pageParam = searchParams.get("page");
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    fetchRounds(page);
  }, [user, searchParams, resultFilter, roundTypeFilter, needsReviewOnly]);

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: String(newPage) }, { replace: true });
  };

  const handleMarkForReview = async (roundId: number, reason: string) => {
    try {
      setMarkingReview(roundId);
      await apiClient.patch(`/admin/interview-rounds/${roundId}/mark-review`, {
        needs_review: true,
        review_reason: reason,
      });
      
      setRounds((prev) =>
        prev.map((r) =>
          r.id === roundId ? { ...r, needs_review: true, review_reason: reason } : r
        )
      );
      
      setMarkingReview(null);
      setReviewReason("");
    } catch (err) {
      alert(getApiErrorMessage(err));
      setMarkingReview(null);
    }
  };

  const handleClearReview = async (roundId: number) => {
    try {
      await apiClient.patch(`/admin/interview-rounds/${roundId}/mark-review`, {
        needs_review: false,
        review_reason: null,
      });
      
      setRounds((prev) =>
        prev.map((r) =>
          r.id === roundId ? { ...r, needs_review: false, review_reason: null } : r
        )
      );
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-page-bg px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">Bạn chưa đăng nhập</h1>
            <p className="mt-3 text-sm text-gray-600">Đăng nhập để truy cập.</p>
          </Card>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-page-bg px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">Không có quyền truy cập</h1>
            <p className="mt-3 text-sm text-gray-600">Trang này chỉ dành cho Quản trị viên.</p>
          </Card>
        </div>
      </div>
    );
  }

  const activeFilters = (resultFilter !== "all" ? 1 : 0) + (roundTypeFilter !== "all" ? 1 : 0) + (needsReviewOnly ? 1 : 0);

  return (
    <PageTransition className="min-h-screen bg-page-bg px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="primary" className="flex items-center gap-1.5 text-xs font-semibold">
                <Users className="w-3.5 h-3.5" />
                Interview Oversight
              </Badge>
            </div>
            <h1 className="text-3xl font-semibold text-gray-900">Quản lý vòng phỏng vấn</h1>
            <p className="text-sm text-gray-500 mt-1">
              Giám sát toàn bộ vòng phỏng vấn, feedback và đánh dấu cần rà soát
            </p>
          </div>
        </div>

        <AdminTabNavigation />

        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Danh sách vòng phỏng vấn</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {rounds.length} vòng {pagination.total !== rounds.length && `(${pagination.total} tổng)`}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Filter className="w-3.5 h-3.5" />}
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "border-primary text-primary" : ""}
              >
                Bộ lọc {activeFilters > 0 && <Badge variant="primary" size="sm" className="ml-1">{activeFilters}</Badge>}
              </Button>
            </div>

            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap items-end gap-3 pt-4 border-t border-gray-100 mt-4"
              >
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Kết quả</label>
                  <select
                    value={resultFilter}
                    onChange={(e) => setResultFilter(e.target.value as ResultFilter)}
                    className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="all">Tất cả</option>
                    <option value="pending">Chờ kết quả</option>
                    <option value="passed">Đạt</option>
                    <option value="failed">Không đạt</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Loại vòng</label>
                  <select
                    value={roundTypeFilter}
                    onChange={(e) => setRoundTypeFilter(e.target.value as RoundTypeFilter)}
                    className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="all">Tất cả</option>
                    <option value="cv_screen">Sàng lọc CV</option>
                    <option value="phone_screen">Điện thoại</option>
                    <option value="technical">Kỹ thuật</option>
                    <option value="behavioral">Hành vi</option>
                    <option value="final">Cuối cùng</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 h-9">
                  <input
                    type="checkbox"
                    id="needs-review"
                    checked={needsReviewOnly}
                    onChange={(e) => setNeedsReviewOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="needs-review" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Chỉ hiển thị cần rà soát
                  </label>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setResultFilter("all");
                    setRoundTypeFilter("all");
                    setNeedsReviewOnly(false);
                  }}
                >
                  Xóa bộ lọc
                </Button>
              </motion.div>
            )}
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-100" />
                ))}
              </div>
            ) : error ? (
              <ErrorState title="Không tải được dữ liệu" message={error} onRetry={() => fetchRounds(pagination.page)} />
            ) : rounds.length === 0 ? (
              <EmptyState
                icon={<Calendar className="w-7 h-7 text-gray-400" />}
                title={activeFilters > 0 ? "Không có vòng phù hợp bộ lọc" : "Chưa có vòng phỏng vấn"}
                description={activeFilters > 0 ? "Thử điều chỉnh bộ lọc để xem thêm." : "Vòng phỏng vấn sẽ xuất hiện khi employer tạo."}
                className="py-12"
              />
            ) : (
              <div className="space-y-3">
                {rounds.map((round, idx) => (
                  <motion.div
                    key={round.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className={`rounded-lg border p-4 ${
                      round.needs_review
                        ? "border-amber-300 bg-amber-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {round.candidate_name}
                          </h3>
                          <Badge variant="default" size="sm">
                            {round.round_name}
                          </Badge>
                          {round.result && (
                            <Badge
                              variant={
                                round.result === "passed"
                                  ? "success"
                                  : round.result === "failed"
                                  ? "danger"
                                  : "warning"
                              }
                              size="sm"
                            >
                              {round.result === "passed" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : round.result === "failed" ? <XCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                              {round.result === "passed" ? "Đạt" : round.result === "failed" ? "Không đạt" : "Chờ"}
                            </Badge>
                          )}
                          {round.needs_review && (
                            <Badge variant="warning" size="sm">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Cần rà soát
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-gray-400" />
                            <span className="truncate">{round.candidate_email}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-gray-700 truncate">
                              {round.job_title} · {round.company_name}
                            </span>
                          </div>
                        </div>

                        {round.scheduled_at && (
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mb-3">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-primary" />
                              <span>
                                {new Date(round.scheduled_at).toLocaleDateString("vi-VN", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              <span>
                                {new Date(round.scheduled_at).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            {round.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-primary" />
                                <span className="truncate max-w-[200px]">{round.location}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {round.interviewer_notes && (
                          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 mb-3">
                            <p className="text-xs font-medium text-gray-700 mb-1">Feedback của Employer:</p>
                            <p className="text-sm text-gray-900">{round.interviewer_notes}</p>
                          </div>
                        )}

                        {round.needs_review && round.review_reason && (
                          <div className="rounded-lg bg-amber-100 border border-amber-200 p-3">
                            <p className="text-xs font-medium text-amber-800 mb-1">Lý do cần rà soát:</p>
                            <p className="text-sm text-amber-900">{round.review_reason}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        {round.needs_review ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleClearReview(round.id)}
                          >
                            Bỏ đánh dấu
                          </Button>
                        ) : (
                          <>
                            {markingReview === round.id ? (
                              <div className="flex flex-col gap-2 w-64">
                                <textarea
                                  value={reviewReason}
                                  onChange={(e) => setReviewReason(e.target.value)}
                                  placeholder="Lý do cần rà soát..."
                                  className="w-full min-h-20 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleMarkForReview(round.id, reviewReason)}
                                    disabled={!reviewReason.trim()}
                                  >
                                    Xác nhận
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setMarkingReview(null);
                                      setReviewReason("");
                                    }}
                                  >
                                    Hủy
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
                                onClick={() => setMarkingReview(round.id)}
                              >
                                Đánh dấu rà soát
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {pagination.total > pagination.pageSize && (
              <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-6">
                <p className="text-sm text-gray-600">
                  Hiển thị {(pagination.page - 1) * pagination.pageSize + 1} -{" "}
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)} trong tổng{" "}
                  {pagination.total} vòng
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page * pagination.pageSize >= pagination.total}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
