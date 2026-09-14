import React, { useState, useEffect } from "react";
import { Sliders, Save, CheckCircle2, Sparkles } from "lucide-react";
import type { RAGRuntimeConfig, RAGRuntimeConfigUpdatePayload } from "@/lib/api/adminRAG";

interface RAGAlgorithmTuningCardProps {
  config: RAGRuntimeConfig | null;
  loading: boolean;
  onSave: (payload: RAGRuntimeConfigUpdatePayload) => Promise<void>;
  isSaving: boolean;
}

export const RAGAlgorithmTuningCard: React.FC<RAGAlgorithmTuningCardProps> = ({
  config,
  loading,
  onSave,
  isSaving,
}) => {
  const [alphaDense, setAlphaDense] = useState<number>(0.7);
  const [minScore, setMinScore] = useState<number>(0.55);
  const [topK, setTopK] = useState<number>(20);
  const [maintenanceMsg, setMaintenanceMsg] = useState<string>("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (config) {
      setAlphaDense(config.hybrid_alpha_dense);
      setMinScore(config.default_min_score);
      setTopK(config.default_top_k);
      setMaintenanceMsg(config.maintenance_message);
    }
  }, [config]);

  const alphaSparse = Math.max(0, Math.min(1, Math.round((1 - alphaDense) * 100) / 100));

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setAlphaDense(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      hybrid_alpha_dense: alphaDense,
      hybrid_alpha_sparse: alphaSparse,
      default_min_score: minScore,
      default_top_k: topK,
      maintenance_message: maintenanceMsg,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  if (loading || !config) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="h-24 bg-slate-100 rounded mb-4" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 text-[#00B86B] rounded-xl">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Cân Chỉnh Trọng Số Thuật Toán Hybrid Retrieval
            </h3>
            <p className="text-xs text-slate-500">
              Điều chỉnh tức thời (Real-time Tuning) tỷ trọng giữa Vector Cosine và Lexical BM25
            </p>
          </div>
        </div>

        {savedSuccess && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
            Đã lưu & đồng bộ tức thì
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Alpha Dense vs Sparse Slider */}
        <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Trọng số Ngữ nghĩa Dense (α) vs Từ khóa BM25 (1 - α)
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-violet-700 font-bold bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                Dense: {(alphaDense * 100).toFixed(0)}%
              </span>
              <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                BM25: {(alphaSparse * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Balance visual bar */}
          <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex shadow-inner">
            <div
              className="bg-violet-600 h-full transition-all duration-200"
              style={{ width: `${alphaDense * 100}%` }}
              title={`Dense Vector: ${(alphaDense * 100).toFixed(0)}%`}
            />
            <div
              className="bg-blue-500 h-full transition-all duration-200"
              style={{ width: `${alphaSparse * 100}%` }}
              title={`Sparse BM25: ${(alphaSparse * 100).toFixed(0)}%`}
            />
          </div>

          {/* Range input */}
          <div className="pt-1">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={alphaDense}
              onChange={handleSliderChange}
              className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-600 mt-1 font-medium">
              <span>0% (Chỉ khớp từ khóa BM25)</span>
              <span>Khuyến nghị (70% Dense - 30% BM25)</span>
              <span>100% (Chỉ khớp ngữ nghĩa Vector)</span>
            </div>
          </div>
        </div>

        {/* 2. Min Score & Top K Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ngưỡng điểm tối thiểu (Default Min Score Cutoff)
            </label>
            <p className="text-[11px] text-slate-600 mb-2">
              Các đoạn hồ sơ có điểm Hybrid dưới ngưỡng này sẽ bị loại bỏ để giảm nhiễu (0.0 - 1.0).
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0.1"
                max="0.95"
                step="0.05"
                value={minScore}
                onChange={(e) => setMinScore(parseFloat(e.target.value))}
                className="w-24 px-3 py-1.5 text-sm font-mono font-bold bg-white border border-slate-300 rounded-lg text-slate-800"
              />
              <span className="text-xs text-slate-600">Khuyến nghị B2B: 0.50 - 0.60</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Số lượng Chunks tối đa (Default Top K)
            </label>
            <p className="text-[11px] text-slate-600 mb-2">
              Giới hạn số lượng đoạn trích xuất gửi về hoặc nạp vào Context Window của LLM.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="5"
                max="100"
                step="5"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value, 10))}
                className="w-24 px-3 py-1.5 text-sm font-mono font-bold bg-white border border-slate-300 rounded-lg text-slate-800"
              />
              <span className="text-xs text-slate-600">Khuyến nghị: 15 - 30 chunks</span>
            </div>
          </div>
        </div>

        {/* 3. Maintenance Message */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Thông điệp khi bảo trì (Maintenance Announcement)
          </label>
          <input
            type="text"
            value={maintenanceMsg}
            onChange={(e) => setMaintenanceMsg(e.target.value)}
            placeholder="Thông báo hiển thị cho nhà tuyển dụng khi RAG tạm ngưng..."
            className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B86B]/20 focus:border-[#00B86B]"
          />
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#00B86B] hover:bg-[#00995C] text-white rounded-xl font-bold text-xs shadow-xs transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Đang lưu cấu hình..." : "Lưu Cấu Hình Thuật Toán"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
