import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyResumes } from "@/lib/api/resumes";
import { getAiMatch } from "@/lib/api/ai";
import { useUser, useAuthStore } from "@/stores/authStore";
import { tokenStorage, getApiErrorMessage } from "@/lib/axios";
import { Button, Card, CardHeader, CardContent, Input, Badge, PageSpinner, Spinner, AIDisclaimerBanner } from "@/components/ui";
import type { Resume } from "@/types/resume";
import type { AIMatchResult } from "@/types/api";

// ─── Tier helpers ────────────────────────────────────────────────────────────────
interface TierInfo {
  label: string;
  variant: "success" | "warning" | "danger";
  strokeColor: string;
}

function getTier(score: number): TierInfo {
  if (score >= 80) return { label: "Rất phù hợp", variant: "success", strokeColor: "#10b981" };
  if (score >= 50) return { label: "Phù hợp một phần", variant: "warning", strokeColor: "#f59e0b" };
  return { label: "Ít phù hợp", variant: "danger", strokeColor: "#ef4444" };
}

// ─── Page ───────────────────────────────────────────────────────────────────────
export const AIMatchingPage = () => {
  const user = useUser();

  // Resume state
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);

  // Form
  const [jobIdInput, setJobIdInput] = useState("");

  // Result
  const [result, setResult] = useState<AIMatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch resumes ──────────────────────────────────────────────────────────
  const fetchResumes = useCallback(() => {
    if (!user) return;
    let cancelled = false;
    setResumesLoading(true);
    getMyResumes()
      .then((data) => {
        if (!cancelled) {
          setResumes(data);
          if (data.length > 0 && !selectedResumeId) {
            setSelectedResumeId(data[0].id);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError("Không thể tải danh sách CV.");
      })
      .finally(() => {
        if (!cancelled) setResumesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const cancel = fetchResumes();
    return cancel;
  }, [fetchResumes]);

  // Auth hydration
  useEffect(() => {
    if (!user && tokenStorage.get()) {
      useAuthStore.getState().fetchMe().catch(() => {});
    }
  }, [user]);

  // ── Handle match ───────────────────────────────────────────────────────────
  const handleMatch = async () => {
    if (!selectedResumeId || !jobIdInput.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await getAiMatch(selectedResumeId, Number(jobIdInput));
      setResult(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-page-bg px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">Bạn chưa đăng nhập</h1>
            <p className="mt-3 text-sm text-gray-600">
              Đăng nhập để sử dụng tính năng phân tích độ phù hợp CV với công việc.
            </p>
            <div className="mt-6 flex justify-center">
              <Link to="/login">
                <Button>Đăng nhập</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (resumesLoading) {
    return (
      <div className="min-h-screen bg-page-bg">
        <PageSpinner message="Đang tải dữ liệu..." />
      </div>
    );
  }

  // ── Score circle helpers ───────────────────────────────────────────────────
  const CIRCLE_R = 52;
  const circumference = 2 * Math.PI * CIRCLE_R;
  const dashOffset = result
    ? circumference - (Math.min(result.score, 100) / 100) * circumference
    : circumference;
  const tier = result ? getTier(result.score) : null;

  return (
    <div className="min-h-screen bg-page-bg px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <p className="text-sm text-emerald-600">AI Matching</p>
          <h1 className="text-3xl font-semibold text-gray-900">Phân tích độ phù hợp</h1>
          <p className="mt-2 text-sm text-gray-600">
            So sánh CV của bạn với yêu cầu công việc để đánh giá mức độ phù hợp và nhận gợi ý cải thiện.
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Thông tin phân tích</h2>
            <p className="text-sm text-gray-500">Chọn CV và nhập mã công việc để bắt đầu phân tích.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {resumes.length === 0 ? (
              /* ── Empty: no resumes ── */
              <div className="py-8 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">Bạn chưa tải lên CV nào</p>
                <p className="mt-1 text-xs text-gray-500">Tải lên CV để sử dụng tính năng phân tích AI.</p>
                <div className="mt-4">
                  <Link to="/dashboard">
                    <Button variant="primary" size="sm">Đi đến Dashboard</Button>
                  </Link>
                </div>
              </div>
            ) : (
              /* ── Form ── */
              <>
                <div>
                  <label htmlFor="resume-select" className="text-sm font-medium text-gray-700">
                    Chọn CV
                  </label>
                  <select
                    id="resume-select"
                    className="mt-1.5 w-full h-10 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    value={selectedResumeId ?? ""}
                    onChange={(e) => setSelectedResumeId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">-- Chọn CV --</option>
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} — {new Date(r.created_at).toLocaleDateString("vi-VN")}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Mã công việc (Job ID)"
                  type="number"
                  placeholder="Nhập mã công việc, ví dụ: 1"
                  value={jobIdInput}
                  onChange={(e) => setJobIdInput(e.target.value)}
                />

                <Button
                  variant="primary"
                  fullWidth
                  isLoading={loading}
                  disabled={!selectedResumeId || !jobIdInput.trim()}
                  onClick={handleMatch}
                >
                  Phân tích độ phù hợp
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── Loading ────────────────────────────────────────────────────── */}
        {loading && (
          <Card>
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <Spinner size="xl" color="green" label="AI đang phân tích..." />
              <p className="text-sm font-medium text-gray-700">AI đang phân tích, có thể mất 10-15 giây...</p>
              <p className="text-xs text-gray-400">Đang so sánh CV của bạn với yêu cầu công việc.</p>
            </div>
          </Card>
        )}

        {/* ── Result ─────────────────────────────────────────────────────── */}
        {result && tier && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Kết quả phân tích</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score + tier badge */}
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
                {/* SVG donut */}
                <div className="relative w-32 h-32 shrink-0">
                  <svg
                    width="128"
                    height="128"
                    viewBox="0 0 128 128"
                    className="-rotate-90"
                    aria-label={`Điểm phù hợp: ${result.score}%`}
                  >
                    <circle cx="64" cy="64" r={CIRCLE_R} fill="none" stroke="#e2e8f0" strokeWidth="8" />
                    <circle
                      cx="64"
                      cy="64"
                      r={CIRCLE_R}
                      fill="none"
                      stroke={tier.strokeColor}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">{result.score}%</span>
                    <span className="text-[10px] text-gray-400">phù hợp</span>
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <Badge variant={tier.variant} size="lg">
                    {tier.label}
                  </Badge>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{result.explanation}</p>
                </div>
              </div>

              {/* Phân tích chi tiết */}
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  Phân tích chi tiết
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{result.explanation}</p>
              </div>

              {/* Strengths */}
              {result.strengths.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Điểm mạnh
                  </h3>
                  <ul className="space-y-1.5">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-500 mt-0.5 shrink-0 select-none">✓</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Gaps */}
              {result.gaps.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    Kỹ năng cần bổ sung
                  </h3>
                  <ul className="space-y-1.5">
                    {result.gaps.map((g, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-amber-500 mt-0.5 shrink-0 select-none font-bold">!</span>
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Fallback when no strengths/gaps */}
              {result.strengths.length === 0 && result.gaps.length === 0 && (
                <p className="text-xs text-gray-400 text-center">
                  Điểm phù hợp được tính từ độ tương đồng embedding giữa CV và JD.
                  Tải lên CV chi tiết hơn hoặc thử với tin tuyển dụng khác để có kết quả phân tích sâu hơn.
                </p>
              )}

              {/* AI Disclaimer */}
              <AIDisclaimerBanner context="matching" />

              {/* CTA to roadmap */}
              <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                <Link to="/ai/roadmap">
                  <Button variant="outline" size="sm">
                    Xem lộ trình phát triển →
                  </Button>
                </Link>
                <Link to="/jobs">
                  <Button variant="secondary" size="sm">
                    Tìm việc khác
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
