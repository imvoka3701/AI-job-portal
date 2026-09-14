import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Flame } from "lucide-react";
import type { RAGVectorStats } from "@/lib/api/adminRAG";

interface RAGTrendChartsProps {
  stats: RAGVectorStats | null;
  loading: boolean;
}

export const RAGTrendCharts: React.FC<RAGTrendChartsProps> = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs animate-pulse h-72" />
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs animate-pulse h-72" />
      </div>
    );
  }

  const trends = stats.daily_search_trends || [];
  const topQueries = stats.top_searched_queries || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Daily Search Activity & Latency Chart */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-violet-50 text-violet-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Xu Hướng Tìm Kiếm & Độ Trễ (7 Ngày Gần Nhất)
              </h3>
              <p className="text-xs text-slate-500">
                Quan sát thông lượng truy vấn của nhà tuyển dụng và thời gian phản hồi
              </p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSearches" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00B86B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00B86B" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: "#00B86B" }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E2E8F0",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                }}
                formatter={(value: any, name?: any) => {
                  if (name === "searches") return [`${value} lượt`, "Truy vấn"];
                  if (name === "avg_latency_ms") return [`${value} ms`, "Độ trễ TB"];
                  return [value, String(name ?? "")];
                }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="searches"
                stroke="#8B5CF6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSearches)"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="avg_latency_ms"
                stroke="#00B86B"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#colorLatency)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Top Searched Queries */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Từ Khóa Phổ Biến</h3>
            <p className="text-xs text-slate-500">Các vị trí, kỹ năng nhà tuyển dụng hay tìm nhất</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          {topQueries.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-600">
              Chưa có dữ liệu tìm kiếm gần đây
            </div>
          ) : (
            <div className="space-y-2.5">
              {topQueries.slice(0, 6).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl transition-colors text-xs"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800 truncate" title={item.query}>
                      {item.query}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full text-[11px]">
                    {item.count} lượt
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
            Dữ liệu được tổng hợp từ ring-buffer telemetry của RAG Service
          </div>
        </div>
      </div>
    </div>
  );
};
