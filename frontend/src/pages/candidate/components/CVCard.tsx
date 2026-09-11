import { useState } from "react";
import { FileText, Trash2, Eye, Loader2, AlertCircle, Zap, Download } from "lucide-react";
import { Button, ConfirmDialog } from "@/components/ui";
import { apiClient } from "@/lib/axios";
import type { Resume } from "@/types/resume";

interface CVCardProps {
  resume: Resume;
  onDelete: (id: number) => void;
  onPreview: (id: number) => void;
  onEvaluate: (id: number) => void;
  state?: "idle" | "loading" | "error";
  isEvaluating?: boolean;
}

export function CVCard({ resume, onDelete, onPreview, onEvaluate, state = "idle", isEvaluating = false }: CVCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const isReady = Boolean(resume.ai_evaluation_json);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await apiClient.get(`/resumes/${resume.id}/download`, {
        responseType: "arraybuffer",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = resume.title?.endsWith(".pdf") ? resume.title : `CV_${resume.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Silently fail — user can try again
    } finally {
      setIsDownloading(false);
    }
  };

  const displayName = resume.title || `CV #${resume.id}`;

  return (
    <>
      <div
        className={`relative p-4 sm:p-5 rounded-2xl bg-white border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          state === "error"
            ? "border-rose-200 bg-rose-50/50"
            : "border-slate-200/90 hover:border-purple-300 hover:shadow-xs"
        }`}
      >
        {state === "loading" && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center rounded-2xl z-10">
            <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
          </div>
        )}

        {/* Info Left */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${
              state === "error"
                ? "bg-rose-100 border-rose-200 text-rose-600"
                : "bg-purple-50 border-purple-100 text-purple-600"
            }`}
          >
            <FileText size={20} />
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-slate-900 truncate max-w-[240px] sm:max-w-[320px]" title={displayName}>
                {displayName}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                PDF
              </span>

              {state === "error" ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Lỗi
                </span>
              ) : isReady ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                  Sẵn sàng AI
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                  Chờ phân tích
                </span>
              )}

              {resume.is_validated && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200">
                  ✓ Verified ATS
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>Tải lên: {new Date(resume.created_at).toLocaleDateString("vi-VN")}</span>
            </p>
          </div>
        </div>

        {/* Actions Right */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl text-xs font-bold h-8 px-3 border-slate-200 text-slate-700 hover:bg-slate-50"
            onClick={() => onPreview(resume.id)}
            disabled={state !== "idle" || isEvaluating}
          >
            <Eye className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            Xem
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="rounded-xl text-xs font-bold h-8 px-2.5 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            onClick={handleDownload}
            disabled={state !== "idle" || isEvaluating || isDownloading}
            title="Tải file PDF về máy"
          >
            {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="rounded-xl text-xs font-bold h-8 px-3 border-purple-200 text-purple-600 bg-purple-50/60 hover:bg-purple-100/80 transition-colors"
            onClick={() => onEvaluate(resume.id)}
            isLoading={isEvaluating}
            disabled={state !== "idle" || isEvaluating}
          >
            {!isEvaluating && <Zap className="w-3.5 h-3.5 mr-1.5 text-purple-600" />}
            AI Review
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="rounded-xl text-xs font-bold h-8 px-2.5 border-rose-200 text-rose-600 bg-rose-50/40 hover:bg-rose-100 hover:text-rose-700 hover:border-rose-300 transition-colors cursor-pointer"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={state !== "idle" || isEvaluating}
            title="Xóa CV"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Xóa hồ sơ CV"
        description={`Bạn có chắc chắn muốn xóa bản CV "${displayName}" khỏi danh sách hồ sơ của bạn? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xóa CV"
        variant="destructive"
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDelete(resume.id);
        }}
      />
    </>
  );
}
