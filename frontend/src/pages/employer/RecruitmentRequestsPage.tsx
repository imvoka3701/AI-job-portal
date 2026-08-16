import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { BriefcaseBusiness, CalendarDays, ClipboardList, Eye, FilePenLine, Plus, Send, Users, X } from "lucide-react";
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, Modal, Skeleton, Toast } from "@/components/ui";
import type { ToastMessage } from "@/components/ui";
import { useEmployerCompany } from "@/contexts/EmployerCompanyContext";
import {
  cancelRecruitmentRequest,
  createRecruitmentRequest,
  getRecruitmentRequests,
  reviewRecruitmentRequest,
  submitRecruitmentRequest,
  updateRecruitmentRequest,
} from "@/lib/api/recruitmentRequests";
import type { RecruitmentRequest, RecruitmentRequestPayload, RecruitmentRequestStatus } from "@/types/company";
import { RecruitmentRequestFormModal } from "./components/recruitment/RecruitmentRequestFormModal";
import { RecruitmentRequestReviewModal } from "./components/recruitment/RecruitmentRequestReviewModal";


const STATUS_META: Record<RecruitmentRequestStatus, { label: string; variant: "default" | "warning" | "success" | "danger" | "info" }> = {
  draft: { label: "Bản nháp", variant: "default" },
  submitted: { label: "Chờ HR duyệt", variant: "warning" },
  approved: { label: "Đã phê duyệt", variant: "success" },
  rejected: { label: "Cần chỉnh sửa", variant: "danger" },
  cancelled: { label: "Đã hủy", variant: "default" },
};
const PRIORITY_LABELS = { low: "Thấp", normal: "Bình thường", high: "Cao", urgent: "Khẩn cấp" };
const PAGE_SIZE = 12;

export function RecruitmentRequestsPage() {
  const { data: context, hasPermission } = useEmployerCompany();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<RecruitmentRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RecruitmentRequest | null>(null);
  const [reviewing, setReviewing] = useState<RecruitmentRequest | null>(null);
  const [viewing, setViewing] = useState<RecruitmentRequest | null>(null);
  const [confirming, setConfirming] = useState<{ request: RecruitmentRequest; action: "submit" | "cancel" } | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const canCreate = hasPermission("recruitment_request:create");
  const canReview = hasPermission("recruitment_request:review");
  const statusParam = searchParams.get("status") as RecruitmentRequestStatus | null;
  const validStatuses: RecruitmentRequestStatus[] = ["draft", "submitted", "approved", "rejected", "cancelled"];
  const statusFilter = statusParam && validStatuses.includes(statusParam) ? statusParam : "all";
  const departmentParam = Number(searchParams.get("department"));
  const departmentFilter = Number.isInteger(departmentParam) && departmentParam > 0 ? departmentParam : "all";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getRecruitmentRequests({
        status: statusFilter === "all" ? undefined : statusFilter,
        department_id: departmentFilter === "all" ? undefined : departmentFilter,
        page: 1,
        page_size: PAGE_SIZE,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch {
      setError("Không thể tải nhu cầu tuyển dụng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [departmentFilter, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  const metrics = useMemo(() => ({
    submitted: items.filter((item) => item.status === "submitted").length,
    headcount: items.filter((item) => item.status !== "cancelled").reduce((sum, item) => sum + item.headcount, 0),
  }), [items]);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete(key); else next.set(key, value);
    setSearchParams(next, { replace: true });
  };
  const notify = (title: string, description?: string) => setToast({ id: Date.now(), title, description, variant: "success" });

  const saveRequest = async (payload: RecruitmentRequestPayload, submitNow: boolean) => {
    if (editing) {
      const updated = await updateRecruitmentRequest(editing.id, payload);
      if (submitNow) await submitRecruitmentRequest(updated.id);
      notify(submitNow ? "Đã gửi lại yêu cầu" : "Đã lưu thay đổi", editing.title);
    } else {
      await createRecruitmentRequest({ ...payload, submit: submitNow });
      notify(submitNow ? "Đã gửi HR duyệt" : "Đã lưu bản nháp", payload.title);
    }
    setEditing(null);
    await load();
  };

  if (!context) return <RequestListSkeleton />;

  return <div className="mx-auto max-w-7xl space-y-6 pb-10">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary"><ClipboardList className="h-4 w-4" />Kế hoạch nhân sự nội bộ</div><h1 className="text-2xl font-semibold text-gray-900">Nhu cầu tuyển dụng</h1><p className="mt-1 text-sm text-gray-500">Trưởng bộ phận đề xuất nhu cầu; HR xác minh và chuyển yêu cầu đã duyệt thành tin tuyển dụng.</p></div>{canCreate && <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setFormOpen(true); }}>Tạo yêu cầu</Button>}</header>

    <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200"><Metric icon={ClipboardList} value={total} label="Tổng yêu cầu" /><Metric icon={CalendarDays} value={metrics.submitted} label="Chờ duyệt" /><Metric icon={Users} value={metrics.headcount} label="Nhân sự đề xuất" /></div>

    <Card noPadding>
      <div className="grid gap-3 border-b border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
        <select aria-label="Lọc theo trạng thái yêu cầu" value={statusFilter} onChange={(event) => updateFilter("status", event.target.value)} className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"><option value="all">Tất cả trạng thái</option>{Object.entries(STATUS_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select>
        {canReview ? <select aria-label="Lọc yêu cầu theo phòng ban" value={departmentFilter} onChange={(event) => updateFilter("department", event.target.value)} className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"><option value="all">Tất cả phòng ban</option>{context.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select> : <div className="flex items-center rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-500">Phạm vi: {context.membership.department_name}</div>}
      </div>
      {loading ? <RequestListSkeleton compact /> : error ? <div className="p-5"><ErrorState title="Không tải được nhu cầu tuyển dụng" message={error} onRetry={() => void load()} /></div> : items.length === 0 ? <div className="p-6"><EmptyState icon={<ClipboardList className="h-7 w-7 text-gray-400" />} title="Chưa có nhu cầu tuyển dụng" description={canCreate ? "Tạo bản nháp đầu tiên để thống nhất nhu cầu với HR." : "Các yêu cầu do Trưởng bộ phận gửi sẽ xuất hiện tại đây."} action={canCreate ? <Button onClick={() => setFormOpen(true)}>Tạo yêu cầu</Button> : undefined} /></div> : <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500"><tr><th className="px-5 py-3">Vị trí</th><th className="px-4 py-3">Phòng ban</th><th className="px-4 py-3">Nhu cầu</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Cập nhật</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-gray-100">{items.map((request, index) => <motion.tr key={request.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15, delay: index * 0.02 }} className="text-gray-700"><td className="px-5 py-4"><p className="font-semibold text-gray-900">{request.title}</p><p className="mt-1 text-xs text-gray-500">Đề xuất bởi {request.requester_name}</p></td><td className="px-4 py-4">{request.department_name}</td><td className="px-4 py-4"><p>{request.headcount} nhân sự</p><p className="mt-1 text-xs text-gray-400">Ưu tiên {PRIORITY_LABELS[request.priority].toLowerCase()}</p></td><td className="px-4 py-4"><Badge dot variant={STATUS_META[request.status].variant}>{STATUS_META[request.status].label}</Badge>{request.converted_job_id && <p className="mt-2 text-xs text-primary">Đã tạo job #{request.converted_job_id}</p>}</td><td className="px-4 py-4 text-xs text-gray-500">{new Date(request.updated_at).toLocaleDateString("vi-VN")}</td><td className="px-5 py-4"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon-sm" title="Xem chi tiết" aria-label={`Xem yêu cầu ${request.title}`} onClick={() => setViewing(request)}><Eye className="h-4 w-4" /></Button>{canCreate && ["draft", "rejected"].includes(request.status) && <Button variant="ghost" size="icon-sm" title="Chỉnh sửa" aria-label={`Chỉnh sửa ${request.title}`} onClick={() => { setEditing(request); setFormOpen(true); }}><FilePenLine className="h-4 w-4 text-primary" /></Button>}{canCreate && ["draft", "rejected"].includes(request.status) && <Button variant="ghost" size="icon-sm" title="Gửi duyệt" aria-label={`Gửi duyệt ${request.title}`} onClick={() => setConfirming({ request, action: "submit" })}><Send className="h-4 w-4 text-primary" /></Button>}{canCreate && ["draft", "submitted", "rejected"].includes(request.status) && <Button variant="ghost" size="icon-sm" title="Hủy yêu cầu" aria-label={`Hủy ${request.title}`} onClick={() => setConfirming({ request, action: "cancel" })}><X className="h-4 w-4 text-red-600" /></Button>}{canReview && request.status === "submitted" && <Button size="sm" onClick={() => setReviewing(request)}>Duyệt</Button>}{canReview && request.status === "approved" && !request.converted_job_id && <Link to={`/employer/jobs/new?request_id=${request.id}`}><Button size="sm" variant="outline" leftIcon={<BriefcaseBusiness className="h-4 w-4" />}>Tạo tin</Button></Link>}</div></td></motion.tr>)}</tbody></table></div>}
    </Card>

    <RecruitmentRequestFormModal open={formOpen} request={editing} departmentName={editing?.department_name ?? context.membership.department_name ?? "Chưa gán phòng ban"} onClose={() => { setFormOpen(false); setEditing(null); }} onSubmit={saveRequest} />
    <RecruitmentRequestReviewModal request={reviewing} onClose={() => setReviewing(null)} onReview={async (decision, note) => { await reviewRecruitmentRequest(reviewing!.id, decision, note); notify(decision === "approved" ? "Đã phê duyệt yêu cầu" : "Đã gửi yêu cầu chỉnh sửa", reviewing!.title); await load(); }} />
    <RequestDetailModal request={viewing} onClose={() => setViewing(null)} />
    <ConfirmDialog isOpen={Boolean(confirming)} title={confirming?.action === "submit" ? "Gửi nhu cầu cho HR duyệt" : "Hủy nhu cầu tuyển dụng"} description={confirming?.action === "submit" ? "Sau khi gửi, nội dung sẽ tạm khóa cho đến khi HR phản hồi." : "Yêu cầu đã hủy được giữ trong lịch sử nhưng không thể gửi lại."} confirmLabel={confirming?.action === "submit" ? "Gửi duyệt" : "Hủy yêu cầu"} variant={confirming?.action === "submit" ? "primary" : "destructive"} onClose={() => setConfirming(null)} onConfirm={async () => { if (!confirming) return; if (confirming.action === "submit") await submitRecruitmentRequest(confirming.request.id); else await cancelRecruitmentRequest(confirming.request.id); notify(confirming.action === "submit" ? "Đã gửi HR duyệt" : "Đã hủy yêu cầu", confirming.request.title); await load(); }} />
    <Toast message={toast} onDismiss={() => setToast(null)} />
  </div>;
}

function Metric({ icon: Icon, value, label }: { icon: typeof ClipboardList; value: number; label: string }) { return <div className="flex items-center gap-3 bg-white px-5 py-4"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary"><Icon className="h-4 w-4" /></div><div><p className="text-xl font-semibold text-gray-900">{value}</p><p className="text-xs text-gray-500">{label}</p></div></div>; }

function RequestDetailModal({ request, onClose }: { request: RecruitmentRequest | null; onClose: () => void }) { return <Modal isOpen={Boolean(request)} onClose={onClose} title="Chi tiết nhu cầu tuyển dụng" size="lg">{request && <div className="space-y-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-semibold text-gray-900">{request.title}</h3><p className="mt-1 text-sm text-gray-500">{request.department_name} · {request.headcount} nhân sự</p></div><Badge dot variant={STATUS_META[request.status].variant}>{STATUS_META[request.status].label}</Badge></div><DetailSection title="Lý do tuyển dụng" content={request.reason} /><DetailSection title="Trách nhiệm chính" content={request.responsibilities} /><DetailSection title="Yêu cầu chuyên môn" content={request.requirements} />{request.review_note && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-700">Phản hồi của HR</p><p className="mt-1 whitespace-pre-line text-sm text-amber-700">{request.review_note}</p></div>}<div className="flex justify-end"><Button variant="outline" onClick={onClose}>Đóng</Button></div></div>}</Modal>; }
function DetailSection({ title, content }: { title: string; content: string }) { return <section><h4 className="text-sm font-semibold text-gray-900">{title}</h4><p className="mt-1 whitespace-pre-line text-sm leading-6 text-gray-600">{content}</p></section>; }
function RequestListSkeleton({ compact = false }: { compact?: boolean }) { return <div className="space-y-4 p-5">{!compact && <><Skeleton className="h-8 w-72" /><Skeleton className="h-20 w-full" /></>}{[1, 2, 3].map((item) => <div key={item} className="flex items-center gap-4"><Skeleton className="h-10 w-10" /><div className="flex-1"><Skeleton className="h-4 w-64" /><Skeleton className="mt-2 h-3 w-40" /></div></div>)}</div>; }
