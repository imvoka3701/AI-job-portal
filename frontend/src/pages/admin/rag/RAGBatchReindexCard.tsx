import React, { useState } from "react";
import { RefreshCw, CheckCircle2, AlertCircle, Cpu, Loader2 } from "lucide-react";
import type { BatchReindexResponse } from "@/lib/api/adminRAG";

interface RAGBatchReindexCardProps {
  onReindex: (scope: "all" | "resume" | "cv_document" | "job") => Promise<BatchReindexResponse | null>;
  isReindexing: boolean;
}

export const RAGBatchReindexCard: React.FC<RAGBatchReindexCardProps> = ({
  onReindex,
  isReindexing,
}) => {
  const [scope, setScope] = useState<"all" | "resume" | "cv_document" | "job">("all");
  const [result, setResult] = useState<BatchReindexResponse | null>(null);

  const handleTrigger = async () => {
    if (
      !window.confirm(
        `Xác nhận tái lập chỉ mục Vector cho phạm vi [${scope.toUpperCase()}]? Quá trình này sẽ sinh lại embeddings và cập nhật pgvector.`
      )
    ) {
      return;
    }
    const res = await onReindex(scope);
    if (res) {
      setResult(res);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Tái Lập Chỉ Mục Hàng Loạt (Batch Vector Re-indexing)
            </h3>
            <p className="text-xs text-slate-500">
              Quét lại tài liệu trong CSDL, băm nhỏ (chunking) và sinh vector embeddings nạp vào pgvector
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Scope Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Phạm vi quét và lập chỉ mục:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: "all", label: "Toàn bộ tài nguyên", desc: "CV + File + Jobs" },
              { id: "resume", label: "CV Builder", desc: "Hồ sơ ứng viên tạo trên web" },
              { id: "cv_document", label: "File CV đính kèm", desc: "PDF / DOCX phân tích" },
              { id: "job", label: "Tin tuyển dụng", desc: "JDs đang hoạt động" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setScope(item.id as any)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  scope === item.id
                    ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="text-xs font-bold text-slate-900">{item.label}</div>
                <div className="text-[11px] text-slate-600 mt-0.5">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Button & Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Lưu ý: Quá trình băm và sinh embeddings diễn ra trực tiếp qua mô hình Text Embedding.
            </span>
          </div>

          <button
            type="button"
            disabled={isReindexing}
            onClick={handleTrigger}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all disabled:opacity-50"
          >
            {isReindexing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>{isReindexing ? "Đang xử lý chỉ mục..." : "Bắt đầu Re-indexing"}</span>
          </button>
        </div>

        {/* Result banner */}
        {result && (
          <div className="mt-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{result.message}</span>
            </div>
            <span className="font-mono font-bold bg-emerald-100 px-2 py-0.5 rounded text-emerald-900">
              +{result.indexed_chunks_count} chunks
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
