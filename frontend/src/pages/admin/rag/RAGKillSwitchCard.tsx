import React from "react";
import { ShieldAlert, ShieldCheck, Power, AlertTriangle, Loader2 } from "lucide-react";
import type { RAGRuntimeConfig } from "@/lib/api/adminRAG";

interface RAGKillSwitchCardProps {
  config: RAGRuntimeConfig | null;
  loading: boolean;
  isUpdating: boolean;
  onToggle: (enabled: boolean) => void;
}

export const RAGKillSwitchCard: React.FC<RAGKillSwitchCardProps> = ({
  config,
  loading,
  isUpdating,
  onToggle,
}) => {
  if (loading || !config) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/4 mb-3" />
        <div className="h-4 bg-slate-100 rounded w-1/2" />
      </div>
    );
  }

  const isEnabled = config.is_rag_enabled;

  return (
    <div
      className={`border rounded-2xl p-5 shadow-xs transition-all ${
        isEnabled
          ? "bg-white border-slate-200"
          : "bg-red-50/70 border-red-200"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isEnabled ? "bg-emerald-50 text-emerald-600" : "bg-red-100 text-red-600"
            }`}
          >
            {isEnabled ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <ShieldAlert className="w-6 h-6 animate-bounce" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold text-slate-900">
                Khóa Khẩn Cấp RAG (Emergency Kill-Switch)
              </h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isEnabled
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {isEnabled ? "HOẠT ĐỘNG BÌNH THƯỜNG" : "ĐANG TẠM NGƯNG"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {isEnabled
                ? "Các nhà tuyển dụng có thể tìm kiếm ứng viên nội bộ và sử dụng AI Assistant bình thường."
                : config.maintenance_message || "Dịch vụ AI Talent Search đang bị ngắt khẩn cấp để bảo trì hoặc điều chỉnh kho Vector."}
            </p>
            {config.updated_by_email && (
              <p className="text-[11px] text-slate-600 font-mono mt-1">
                Lần cập nhật cuối: {new Date(config.updated_at).toLocaleString("vi-VN")} bởi {config.updated_by_email}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onToggle(!isEnabled)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs disabled:opacity-50 ${
              isEnabled
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {isUpdating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Power className="w-4 h-4" />
            )}
            <span>{isEnabled ? "Ngắt RAG Khẩn Cấp" : "Mở Lại Dịch Vụ"}</span>
          </button>
        </div>
      </div>

      {!isEnabled && (
        <div className="mt-4 pt-4 border-t border-red-200/60 flex items-center gap-2 text-xs font-medium text-red-800">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>
            Lưu ý: Mọi yêu cầu gọi RAG Query từ nhà tuyển dụng sẽ bị từ chối với mã HTTP 503 kèm thông điệp bảo trì.
          </span>
        </div>
      )}
    </div>
  );
};
