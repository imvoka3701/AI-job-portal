import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import {
  BriefcaseBusiness,
  ClipboardList,
  Eye,
  FilePenLine,
  Plus,
  Send,
  Users,
  X,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Modal,
  Skeleton,
  Toast,
  PageTransition,
} from "@/components/ui";
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
import type {
  RecruitmentRequest,
  RecruitmentRequestPayload,
  RecruitmentRequestStatus,
} from "@/types/company";
import { RecruitmentRequestFormModal } from "./components/recruitment/RecruitmentRequestFormModal";
import { RecruitmentRequestReviewModal } from "./components/recruitment/RecruitmentRequestReviewModal";

const STATUS_META: Record<
  RecruitmentRequestStatus,
  { label: string; variant: "default" | "warning" | "success" | "danger" | "info" }
> = {
  draft: { label: "Bản nháp", variant: "default" },
  submitted: { label: "Chờ HR duyệt", variant: "warning" },
  approved: { label: "Đã phê duyệt", variant: "success" },
  rejected: { label: "Cần chỉnh sửa", variant: "danger" },
  cancelled: { label: "Đã hủy", variant: "default" },
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Thấp",
  normal: "Bình thường",
  high: "Cao",
  urgent: "Khẩn cấp",
};

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
  const [confirming, setConfirming] = useState<{
    request: RecruitmentRequest;
    action: "submit" | "cancel";
  } | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const canCreate = hasPermission("recruitment_request:create");
  const canReview = hasPermission("recruitment_request:review");

  const statusParam = searchParams.get("status") as RecruitmentRequestStatus | null;
  const validStatuses: RecruitmentRequestStatus[] = [
    "draft",
    "submitted",
    "approved",
    "rejected",
    "cancelled",
  ];
  const statusFilter = statusParam && validStatuses.includes(statusParam) ? statusParam : "all";

  const departmentParam = Number(searchParams.get("department"));
  const departmentFilter =
    Number.isInteger(departmentParam) && departmentParam > 0 ? departmentParam : "all";

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

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = useMemo(
    () => ({
      submitted: items.filter((item) => item.status === "submitted").length,
      headcount: items
        .filter((item) => item.status !== "cancelled")
        .reduce((sum, item) => sum + item.headcount, 0),
    }),
    [items]
  );

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const notify = (title: string, description?: string) =>
    setToast({ id: Date.now(), title, description, variant: "success" });

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

  return (
    <PageTransition className="w-full space-y-6 pb-12">
      {/* ── Header Banner ── */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ClipboardList className="w-3.5 h-3.5" />
                Kế hoạch nhân sự nội bộ
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Nhu cầu tuyển dụng
            </h1>
            <p className="mt-1.5 text-sm text-gray-500 max-w-2xl leading-relaxed">
              Trưởng bộ phận đề xuất kế hoạch tuyển dụng; Phòng Nhân sự (HR) xem xét, duyệt định biên và tự động chuyển đổi thành tin tuyển dụng.
            </p>
          </div>

          {canCreate && (
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                Tạo yêu cầu
              </Button>
            </div>
          )}
        </div>

        {/* ── 3 KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 shadow-2xs">
            <div className="w-11 h-11 rounded-xl bg-primary-light/60 border border-primary/20 flex items-center justify-center text-primary shadow-2xs">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Tổng số yêu cầu</p>
              <p className="text-xl font-bold text-slate-900">{total}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 shadow-2xs">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Đang chờ HR duyệt</p>
              <p className="text-xl font-bold text-slate-900">{metrics.submitted}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 shadow-2xs">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Nhân sự đề xuất</p>
              <p className="text-xl font-bold text-slate-900">{metrics.headcount} người</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <Card noPadding className="border-slate-200/90 shadow-xs overflow-hidden bg-white">
        {/* Filter Bar */}
        <div className="grid gap-3 border-b border-gray-200 bg-slate-50/60 p-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Lọc theo trạng thái</label>
            <select
              aria-label="Lọc theo trạng thái yêu cầu"
              value={statusFilter}
              onChange={(event) => updateFilter("status", event.target.value)}
              className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Tất cả trạng thái</option>
              {Object.entries(STATUS_META).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Phạm vi phòng ban</label>
            {canReview ? (
              <select
                aria-label="Lọc yêu cầu theo phòng ban"
                value={departmentFilter}
                onChange={(event) => updateFilter("department", event.target.value)}
                className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">Tất cả phòng ban</option>
                {context.departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex h-10 items-center rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-600">
                Phòng ban phụ trách: {context.membership.department_name || "Chưa phân ban"}
              </div>
            )}
          </div>
        </div>

        {/* Content Table / States */}
        {loading ? (
          <RequestListSkeleton compact />
        ) : error ? (
          <div className="p-6">
            <ErrorState
              title="Không tải được nhu cầu tuyển dụng"
              message={error}
              onRetry={() => void load()}
            />
          </div>
        ) : items.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<ClipboardList className="h-9 w-9 text-gray-400" />}
              title="Chưa có nhu cầu tuyển dụng"
              description={
                canCreate
                  ? "Tạo bản nháp đầu tiên để thống nhất kế hoạch tuyển dụng với HR."
                  : "Các yêu cầu đề xuất từ Trưởng bộ phận sẽ hiển thị tại đây."
              }
              action={
                canCreate ? (
                  <Button variant="primary" size="sm" onClick={() => setFormOpen(true)}>
                    Tạo yêu cầu
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-3.5">Vị trí đề xuất</th>
                  <th className="px-4 py-3.5">Phòng ban</th>
                  <th className="px-4 py-3.5">Định biên / Ưu tiên</th>
                  <th className="px-4 py-3.5">Trạng thái</th>
                  <th className="px-4 py-3.5">Cập nhật</th>
                  <th className="px-6 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((request, index) => (
                  <motion.tr
                    key={request.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: index * 0.02 }}
                    className="text-gray-700 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{request.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Đề xuất bởi <span className="font-medium text-slate-700">{request.requester_name}</span>
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <span className="font-medium text-slate-800">{request.department_name}</span>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{request.headcount} nhân sự</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Ưu tiên: <span className="font-medium text-slate-600">{PRIORITY_LABELS[request.priority] || request.priority}</span>
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <Badge dot variant={STATUS_META[request.status].variant}>
                        {STATUS_META[request.status].label}
                      </Badge>
                      {request.converted_job_id && (
                        <p className="mt-1.5 text-xs text-primary font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-primary" />
                          Đã tạo Job #{request.converted_job_id}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-4 text-xs text-gray-500">
                      {new Date(request.updated_at).toLocaleDateString("vi-VN")}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Xem chi tiết"
                          aria-label={`Xem yêu cầu ${request.title}`}
                          onClick={() => setViewing(request)}
                        >
                          <Eye className="h-4 w-4 text-slate-500" />
                        </Button>

                        {canCreate && ["draft", "rejected"].includes(request.status) && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Chỉnh sửa"
                            aria-label={`Chỉnh sửa ${request.title}`}
                            onClick={() => {
                              setEditing(request);
                              setFormOpen(true);
                            }}
                          >
                            <FilePenLine className="h-4 w-4 text-primary" />
                          </Button>
                        )}

                        {canCreate && ["draft", "rejected"].includes(request.status) && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Gửi duyệt"
                            aria-label={`Gửi duyệt ${request.title}`}
                            onClick={() => setConfirming({ request, action: "submit" })}
                          >
                            <Send className="h-4 w-4 text-emerald-600" />
                          </Button>
                        )}

                        {canCreate && ["draft", "submitted", "rejected"].includes(request.status) && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Hủy yêu cầu"
                            aria-label={`Hủy ${request.title}`}
                            onClick={() => setConfirming({ request, action: "cancel" })}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        )}

                        {canReview && request.status === "submitted" && (
                          <Button size="sm" variant="primary" onClick={() => setReviewing(request)}>
                            Duyệt
                          </Button>
                        )}

                        {canReview && request.status === "approved" && !request.converted_job_id && (
                          <Link to={`/employer/jobs/new?request_id=${request.id}`}>
                            <Button size="sm" variant="outline" leftIcon={<BriefcaseBusiness className="h-4 w-4" />}>
                              Đăng tin tuyển
                            </Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Modals & Dialogs ── */}
      <RecruitmentRequestFormModal
        open={formOpen}
        request={editing}
        departmentName={
          editing?.department_name ?? context.membership.department_name ?? "Chưa gán phòng ban"
        }
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={saveRequest}
      />

      <RecruitmentRequestReviewModal
        request={reviewing}
        onClose={() => setReviewing(null)}
        onReview={async (decision, note) => {
          await reviewRecruitmentRequest(reviewing!.id, decision, note);
          notify(
            decision === "approved" ? "Đã phê duyệt yêu cầu" : "Đã gửi yêu cầu chỉnh sửa",
            reviewing!.title
          );
          await load();
        }}
      />

      <RequestDetailModal request={viewing} onClose={() => setViewing(null)} />

      <ConfirmDialog
        isOpen={Boolean(confirming)}
        title={
          confirming?.action === "submit"
            ? "Gửi nhu cầu cho HR duyệt"
            : "Hủy nhu cầu tuyển dụng"
        }
        description={
          confirming?.action === "submit"
            ? "Sau khi gửi, nội dung sẽ tạm khóa cho đến khi HR phản hồi."
            : "Yêu cầu đã hủy được giữ trong lịch sử nhưng không thể gửi lại."
        }
        confirmLabel={confirming?.action === "submit" ? "Gửi duyệt" : "Hủy yêu cầu"}
        variant={confirming?.action === "submit" ? "primary" : "destructive"}
        onClose={() => setConfirming(null)}
        onConfirm={async () => {
          if (!confirming) return;
          if (confirming.action === "submit")
            await submitRecruitmentRequest(confirming.request.id);
          else await cancelRecruitmentRequest(confirming.request.id);
          notify(
            confirming.action === "submit" ? "Đã gửi HR duyệt" : "Đã hủy yêu cầu",
            confirming.request.title
          );
          await load();
        }}
      />

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </PageTransition>
  );
}

function RequestDetailModal({
  request,
  onClose,
}: {
  request: RecruitmentRequest | null;
  onClose: () => void;
}) {
  return (
    <Modal isOpen={Boolean(request)} onClose={onClose} title="Chi tiết nhu cầu tuyển dụng" size="lg">
      {request && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {request.department_name} · {request.headcount} nhân sự
              </p>
            </div>
            <Badge dot variant={STATUS_META[request.status].variant}>
              {STATUS_META[request.status].label}
            </Badge>
          </div>
          <DetailSection title="Lý do tuyển dụng" content={request.reason} />
          <DetailSection title="Trách nhiệm chính" content={request.responsibilities} />
          <DetailSection title="Yêu cầu chuyên môn" content={request.requirements} />
          {request.review_note && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800">Phản hồi của HR</p>
              <p className="mt-1 whitespace-pre-line text-sm text-amber-700">
                {request.review_note}
              </p>
            </div>
          )}
          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function DetailSection({ title, content }: { title: string; content: string }) {
  return (
    <section>
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{title}</h4>
      <p className="whitespace-pre-line text-sm leading-6 text-gray-700 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
        {content}
      </p>
    </section>
  );
}

function RequestListSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-4 p-5">
      {!compact && (
        <>
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-20 w-full" />
        </>
      )}
      {[1, 2, 3].map((item) => (
        <div key={item} className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}
