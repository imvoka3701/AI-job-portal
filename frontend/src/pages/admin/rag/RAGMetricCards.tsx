import React from "react";
import { Database, Zap, Layers, Search } from "lucide-react";
import type { RAGVectorStats } from "@/lib/api/adminRAG";

interface RAGMetricCardsProps {
  stats: RAGVectorStats | null;
  loading: boolean;
}

export const RAGMetricCards: React.FC<RAGMetricCardsProps> = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs animate-pulse"
          >
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
            <div className="h-7 bg-slate-100 rounded w-2/3 mb-2" />
            <div className="h-3 bg-slate-50 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  const coveragePct = stats.overall_coverage_pct;
  const isHealthyLatency = stats.avg_latency_ms < 150;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Vector Chunks */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Vector Chunks
          </span>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Database className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.total_chunks.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px]">
            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md font-medium">
              CV: {stats.resume_chunks}
            </span>
            <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-md font-medium">
              File: {stats.cv_document_chunks}
            </span>
            <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md font-medium">
              Job: {stats.job_chunks}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Indexing Coverage */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tỷ lệ phủ Indexing
          </span>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {coveragePct.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {stats.indexed_resumes + stats.indexed_cv_documents} / {stats.total_resumes + stats.total_cv_documents} hồ sơ
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                coveragePct > 80 ? "bg-[#00B86B]" : coveragePct > 50 ? "bg-amber-500" : "bg-red-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, coveragePct))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Average Latency */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Độ trễ trung bình
          </span>
          <div
            className={`p-2 rounded-xl ${
              isHealthyLatency
                ? "bg-emerald-50 text-emerald-600"
                : "bg-amber-50 text-amber-600"
            }`}
          >
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.avg_latency_ms.toFixed(0)}{" "}
            <span className="text-sm font-sans font-normal text-slate-500">ms</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                isHealthyLatency ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span>
              {isHealthyLatency ? "Phản hồi cực nhanh (<150ms)" : "Tải trung bình (>150ms)"}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Searches Volume */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Lượt tìm kiếm
          </span>
          <div className="p-2 bg-violet-50 text-violet-600 rounded-xl">
            <Search className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.total_searches_today}{" "}
            <span className="text-xs font-sans font-normal text-slate-400">hôm nay</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Tổng tuần: <span className="font-semibold text-slate-700">{stats.total_searches_week}</span> lượt truy vấn
          </div>
        </div>
      </div>
    </div>
  );
};
