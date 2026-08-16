import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Brain, Compass, Trash2 } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState, ErrorState, Spinner } from "@/components/ui";
import { getApiErrorMessage } from "@/lib/axios";
import { deleteAssessmentAttempt, getMyAssessmentAttempts, type AssessmentAttempt } from "@/lib/api/assessments";
import { Header as PublicHeader } from "@/pages/jobs/components/Header";

export function AssessmentHistoryPage() {
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = async () => { setLoading(true); setError(null); try { setAttempts(await getMyAssessmentAttempts()); } catch (requestError) { setError(getApiErrorMessage(requestError)); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const remove = async (id: number) => { try { await deleteAssessmentAttempt(id); setAttempts((items) => items.filter((item) => item.id !== id)); } catch (requestError) { setError(getApiErrorMessage(requestError)); } };
  return <div className="min-h-screen bg-page-bg font-sans text-gray-900"><PublicHeader /><main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8"><Link to="/tools" className="text-sm font-medium text-gray-600 hover:text-primary">← Công cụ</Link><div className="mt-5"><p className="text-sm font-medium text-primary">HỒ SƠ CÁ NHÂN</p><h1 className="mt-2 text-3xl font-semibold">Lịch sử kết quả</h1><p className="mt-2 text-sm text-gray-600">Các kết quả đã lưu trong tài khoản ứng viên của bạn.</p></div>{loading ? <div className="flex justify-center py-20"><Spinner size="lg" label="Đang tải lịch sử" /></div> : error ? <Card className="mt-6"><ErrorState message={error} onRetry={() => void load()} /></Card> : attempts.length === 0 ? <Card className="mt-6"><EmptyState icon={<Brain className="h-7 w-7 text-gray-400" />} title="Chưa có kết quả nào" description="Hoàn thành MBTI hoặc MI để lưu kết quả đầu tiên." action={<Link to="/tools"><Button>Bắt đầu ngay</Button></Link>} /></Card> : <div className="mt-6 space-y-4">{attempts.map((attempt) => { const Icon = attempt.assessment_type === "mbti" ? Brain : Compass; return <Card key={attempt.id}><CardHeader><div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light"><Icon className="h-5 w-5 text-primary" /></div><div><CardTitle>{attempt.result.title}</CardTitle><p className="mt-1 text-xs text-gray-500">{attempt.assessment_type.toUpperCase()} · {new Date(attempt.completed_at).toLocaleString("vi-VN")}</p></div></div><Button variant="ghost" size="icon-sm" aria-label={`Xóa kết quả ${attempt.result.title}`} onClick={() => void remove(attempt.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button></div></CardHeader><CardContent><p className="text-sm text-gray-700">{attempt.result.summary}</p><p className="mt-2 text-xs text-gray-500">Mã kết quả: {attempt.result.code}</p></CardContent></Card>; })}</div>}</main></div>;
}
