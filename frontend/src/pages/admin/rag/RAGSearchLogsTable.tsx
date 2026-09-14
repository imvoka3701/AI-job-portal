import { useState } from "react";
import { Search, History, CheckCircle, HelpCircle, XCircle, Building2, User } from "lucide-react";
import type { RAGSearchLogEntry } from "@/lib/api/adminRAG";
import { AdminPagination } from "@/pages/admin/components/AdminPagination";

interface RAGSearchLogsTableProps {
  logs: RAGSearchLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (newPage: number) => void;
  onSearchFilter: (query: string, minLatency?: number) => void;
}

export const RAGSearchLogsTable: React.FC<RAGSearchLogsTableProps> = ({
  logs,
  total,
  page,
  pageSize,
  loading,
  onPageChange,
  onSearchFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [minLatency, setMinLatency] = useState<number | undefined>(undefined);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchFilter(searchTerm, minLatency);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Nhật Ký & Giám Sát Truy Vấn (Search Telemetry & Audit Logs)
            </h3>
            <p className="text-xs text-slate-500">
              Theo dõi chi tiết các lượt tìm kiếm ứng viên của NTD để đảm bảo tuân thủ bảo mật và hiệu năng
            </p>
          </div>
        </div>

        {/* Filters */}
        <form onSubmit={handleFilterSubmit} className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Lọc từ khóa query..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00B86B]"
            />
          </div>

          <select
            value={minLatency ?? ""}
            onChange={(e) =>
              setMinLatency(e.target.value ? parseInt(e.target.value, 10) : undefined)
            }
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none"
          >
            <option value="">Mọi độ trễ</option>
            <option value="100">&gt; 100 ms</option>
            <option value="200">&gt; 200 ms</option>
            <option value="500">&gt; 500 ms (Chậm)</option>
          </select>

          <button
            type="submit"
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            Lọc
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80">
            <tr>
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3">Người dùng / Cty</th>
              <th className="px-4 py-3">Từ khóa tìm kiếm (Query)</th>
              <th className="px-4 py-3">Bộ lọc / Job</th>
              <th className="px-4 py-3 text-center">Kết quả</th>
              <th className="px-4 py-3 text-right">Điểm cao nhất</th>
              <th className="px-4 py-3 text-right">Độ trễ</th>
              <th className="px-4 py-3 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400 animate-pulse">
                  Đang tải dữ liệu nhật ký...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  Không tìm thấy lượt truy vấn nào phù hợp
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isFast = log.duration_ms < 100;
                const isMedium = log.duration_ms >= 100 && log.duration_ms <= 300;

                return (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}{" "}
                      <span className="text-slate-400 text-[10px]">
                        {new Date(log.timestamp).toLocaleDateString("vi-VN")}
                      </span>
                    </td>

                    <td className="px-4 py-3 max-w-[190px]">
                      {log.company_name ? (
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 truncate" title={log.company_name}>
                          <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate">{log.company_name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 font-semibold text-slate-600 truncate">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Cá nhân</span>
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400 truncate mt-0.5" title={log.user_email || ""}>
                        {log.user_email || (log.user_id ? `User #${log.user_id}` : "Hệ thống")}
                      </div>
                    </td>

                    <td className="px-4 py-3 max-w-[240px]">
                      <div className="font-medium text-slate-900 truncate" title={log.query}>
                        "{log.query}"
                      </div>
                    </td>

                    <td className="px-4 py-3 max-w-[160px]">
                      {log.job_title ? (
                        <span className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] font-medium truncate max-w-full">
                          Job: {log.job_title}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Toàn bộ ứng viên</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                      {log.results_count}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-700">
                      {log.max_hybrid_score > 0 ? (
                        <span className="text-emerald-700">
                          {(log.max_hybrid_score * 100).toFixed(1)}%
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span
                        className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                          isFast
                            ? "bg-emerald-50 text-emerald-700"
                            : isMedium
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {log.duration_ms} ms
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {log.status === "success" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Thành công
                        </span>
                      )}
                      {log.status === "empty" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          <HelpCircle className="w-3 h-3" />
                          0 kết quả
                        </span>
                      )}
                      {log.status === "error" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" />
                          Lỗi
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <AdminPagination
        page={page}
        pageSize={pageSize}
        total={total}
        unitName="truy vấn"
        onPageChange={onPageChange}
        disabled={loading}
      />
    </div>
  );
};
