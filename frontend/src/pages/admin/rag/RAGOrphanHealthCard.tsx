import React, { useState, useEffect } from "react";
import {
  HeartPulse,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  HardDrive,
  ShieldCheck,
} from "lucide-react";
import {
  getAdminRAGOrphanStats,
  purgeAdminRAGOrphans,
  type OrphanStatsResponse,
} from "@/lib/api/adminRAG";

export const RAGOrphanHealthCard: React.FC = () => {
  const [stats, setStats] = useState<OrphanStatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [purging, setPurging] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await getAdminRAGOrphanStats();
      setStats(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handlePurge = async () => {
    const confirmed = window.confirm(
      "Hành động này sẽ xóa vĩnh viễn toàn bộ các vector chunks mồ côi không còn liên kết với hồ sơ hay tin tuyển dụng nào. Bạn có muốn tiếp tục?"
    );
    if (!confirmed) return;

    setPurging(true);
    setNotification(null);
    try {
      const res = await purgeAdminRAGOrphans();
      setNotification({
        type: "success",
        text: `Dọn dẹp thành công! Đã xóa vĩnh viễn ${res.purged_count} vector chunks mồ côi.`,
      });
      await fetchStats();
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err?.response?.data?.detail || "Lỗi khi dọn dẹp vector mồ côi.",
      });
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              pgvector Storage Health & Orphan Diagnostics
            </h3>
            <p className="text-xs text-slate-500">
              Chẩn đoán và quét các vector chunks mồ côi bị sót lại sau khi hồ sơ ứng viên hoặc tin tuyển dụng bị xóa
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchStats}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Quét lại
        </button>
      </div>

      {notification && (
        <div
          className={`mb-4 p-3.5 rounded-xl border flex items-center gap-2 text-xs font-medium ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {loading ? (
        <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
      ) : stats ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className={`p-4 rounded-xl border ${stats.total_orphans > 0 ? "bg-amber-50/60 border-amber-200" : "bg-emerald-50/50 border-emerald-200"}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Tổng vector mồ côi</span>
                <HardDrive className={`w-4 h-4 ${stats.total_orphans > 0 ? "text-amber-600" : "text-emerald-600"}`} />
              </div>
              <div className={`text-2xl font-bold mt-1 ${stats.total_orphans > 0 ? "text-amber-800" : "text-emerald-700"}`}>
                {stats.total_orphans}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {stats.total_orphans === 0 ? "Không có rác vector" : "Cần dọn dẹp giải phóng RAM/Disk"}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-600 font-medium">Từ File CV đính kèm</div>
              <div className="text-xl font-bold text-slate-800 mt-1">{stats.orphan_resume_chunks}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Resume PDF/DOCX</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-600 font-medium">Từ CV Builder</div>
              <div className="text-xl font-bold text-slate-800 mt-1">{stats.orphan_cv_document_chunks}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Hồ sơ web đã xóa</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-600 font-medium">Từ Tin tuyển dụng</div>
              <div className="text-xl font-bold text-slate-800 mt-1">{stats.orphan_job_chunks}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">JDs đã xóa hoàn toàn</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                {stats.total_orphans === 0
                  ? "Cơ sở dữ liệu pgvector đạt chỉ số sạch 100%. Không có vector rác làm sai lệch cosine similarity."
                  : `Phát hiện ${stats.total_orphans} vector chunks không còn cha. Bấm dọn dẹp để bảo đảm độ chính xác AI Matching.`}
              </span>
            </div>

            {stats.total_orphans > 0 && (
              <button
                type="button"
                onClick={handlePurge}
                disabled={purging}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{purging ? "Đang quét dọn..." : "Dọn Dẹp Triệt Để (Purge Orphans)"}</span>
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
