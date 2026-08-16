import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { RecruitmentRequest } from "@/types/company";


export function RecruitmentRequestReviewModal({
  request,
  onClose,
  onReview,
}: {
  request: RecruitmentRequest | null;
  onClose: () => void;
  onReview: (decision: "approved" | "rejected", note?: string) => Promise<void>;
}) {
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDecision("approved");
    setNote("");
    setError(null);
  }, [request]);

  const submit = async () => {
    if (decision === "rejected" && !note.trim()) {
      setError("Vui lòng ghi rõ lý do từ chối để Trưởng bộ phận có thể điều chỉnh.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onReview(decision, note.trim() || undefined);
      onClose();
    } catch {
      setError("Không thể lưu quyết định. Yêu cầu vẫn giữ nguyên trạng thái trước đó.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={Boolean(request)} onClose={submitting ? () => undefined : onClose} title="Duyệt nhu cầu tuyển dụng" size="md">
      {request && <div className="space-y-5">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="font-semibold text-gray-900">{request.title}</p>
          <p className="mt-1 text-sm text-gray-500">{request.department_name} · {request.headcount} nhân sự · {request.requester_name}</p>
        </div>
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Quyết định duyệt">
          <button type="button" role="radio" aria-checked={decision === "approved"} onClick={() => setDecision("approved")} className={cn("flex items-center gap-3 rounded-lg border p-4 text-left transition-colors", decision === "approved" ? "border-primary bg-primary-light" : "border-gray-200 hover:bg-gray-50")}><CheckCircle2 className="h-5 w-5 text-primary" /><span><strong className="block text-sm text-gray-900">Phê duyệt</strong><span className="text-xs text-gray-500">Cho phép HR tạo tin</span></span></button>
          <button type="button" role="radio" aria-checked={decision === "rejected"} onClick={() => setDecision("rejected")} className={cn("flex items-center gap-3 rounded-lg border p-4 text-left transition-colors", decision === "rejected" ? "border-red-300 bg-red-50" : "border-gray-200 hover:bg-gray-50")}><XCircle className="h-5 w-5 text-red-600" /><span><strong className="block text-sm text-gray-900">Yêu cầu chỉnh sửa</strong><span className="text-xs text-gray-500">Trả về bộ phận</span></span></button>
        </div>
        <div><label htmlFor="recruitment-review-note" className="mb-2 block text-sm font-medium text-gray-700">Ghi chú phản hồi {decision === "rejected" && <span className="text-red-600">*</span>}</label><textarea id="recruitment-review-note" value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder={decision === "approved" ? "Ngân sách, thời hạn hoặc lưu ý cho HR..." : "Nội dung cần Trưởng bộ phận bổ sung..."} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose} disabled={submitting}>Hủy</Button><Button variant={decision === "rejected" ? "destructive" : "primary"} isLoading={submitting} onClick={() => void submit()}>{decision === "approved" ? "Phê duyệt yêu cầu" : "Gửi yêu cầu chỉnh sửa"}</Button></div>
      </div>}
    </Modal>
  );
}
