import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyResumes } from "@/lib/api/resumes";
import { generateRoadmap } from "@/lib/api/ai";
import { useUser, useAuthStore } from "@/stores/authStore";
import { tokenStorage, getApiErrorMessage } from "@/lib/axios";
import { Button, Card, CardHeader, CardContent, Input, Badge, PageSpinner, Spinner, AIDisclaimerBanner } from "@/components/ui";
import type { Resume } from "@/types/resume";
import type { RoadmapResult } from "@/types/api";

// ─── Page ───────────────────────────────────────────────────────────────────────
export const RoadmapPage = () => {
  const user = useUser();

  // Resume state
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);

  // Form
  const [targetRole, setTargetRole] = useState("");

  // Result
  const [result, setResult] = useState<RoadmapResult | null>(null);
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
          if (data.length > 0) {
            setSelectedResumeId((prev) => prev ?? data[0].id);
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

  // ── Handle generate ────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedResumeId || !targetRole.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await generateRoadmap(selectedResumeId, targetRole.trim());
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
              Đăng nhập để tạo lộ trình phát triển nghề nghiệp với AI.
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

  return (
    <div className="min-h-screen bg-page-bg px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <p className="text-sm text-emerald-600">AI Roadmap</p>
          <h1 className="text-3xl font-semibold text-gray-900">Lộ trình phát triển nghề nghiệp</h1>
          <p className="mt-2 text-sm text-gray-600">
            AI sẽ phân tích CV của bạn và đề xuất lộ trình học tập để đạt được vị trí mong muốn.
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Tạo lộ trình</h2>
            <p className="text-sm text-gray-500">Chọn CV và nhập vị trí bạn muốn hướng tới.</p>
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
                <p className="mt-1 text-xs text-gray-500">Tải lên CV để AI có thể phân tích và đề xuất lộ trình.</p>
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
                  <label htmlFor="roadmap-resume-select" className="text-sm font-medium text-gray-700">
                    Chọn CV
                  </label>
                  <select
                    id="roadmap-resume-select"
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
                  label="Vị trí mong muốn"
                  placeholder="Ví dụ: Senior Backend Developer, Data Engineer..."
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                />

                <Button
                  variant="primary"
                  fullWidth
                  isLoading={loading}
                  disabled={!selectedResumeId || !targetRole.trim()}
                  onClick={handleGenerate}
                >
                  Tạo lộ trình
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Loading ────────────────────────────────────────────────────── */}
        {loading && (
          <Card>
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <Spinner size="xl" color="green" label="AI đang tạo lộ trình..." />
              <p className="text-sm font-medium text-gray-700">AI đang tạo lộ trình, có thể mất 10-15 giây...</p>
              <p className="text-xs text-gray-400">Đang phân tích CV và đề xuất lộ trình phát triển phù hợp.</p>
            </div>
          </Card>
        )}

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── Result ─────────────────────────────────────────────────────── */}
        {result && (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  Lộ trình: {result.target_role}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="info" size="sm">
                  Hiện tại: {result.current_level}
                </Badge>
                <Badge variant="primary" size="sm">
                  Dự kiến: {result.estimated_months} tháng
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Timeline */}
              <div className="space-y-0">
                {result.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-4">
                    {/* Left column: circle + connector */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {step.order}
                      </div>
                      {idx < result.steps.length - 1 && (
                        <div className="w-0.5 flex-1 min-h-[1.5rem] bg-gray-200" />
                      )}
                    </div>

                    {/* Right column: content */}
                    <div className="pb-6 flex-1 min-w-0">
                      <Card className="shadow-sm">
                        <div className="p-4 space-y-3">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">{step.title}</h3>
                            <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                              {step.description}
                            </p>
                          </div>

                          {/* Skills */}
                          {step.skills_to_learn.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                Kỹ năng cần học
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {step.skills_to_learn.map((skill, si) => (
                                  <Badge key={si} variant="primary" size="sm">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Resources */}
                          {step.resources.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                Tài nguyên tham khảo
                              </p>
                              <ul className="space-y-1">
                                {step.resources.map((res, ri) => (
                                  <li key={ri}>
                                    <a
                                      href={res}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline break-all"
                                    >
                                      {res}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Disclaimer */}
              <AIDisclaimerBanner context="matching" />

              {/* CTA */}
              <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                <Link to="/ai/matching">
                  <Button variant="outline" size="sm">
                    Phân tích độ phù hợp →
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
