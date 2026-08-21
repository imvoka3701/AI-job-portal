import { Card, CardHeader, CardContent } from "@/components/ui";
import type { ActiveJobSummary } from "@/lib/api/employer";
import { Link } from "react-router-dom";
import { ChevronRight, Briefcase } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  jobs: ActiveJobSummary[];
  loading: boolean;
  onSelectJob?: (job: ActiveJobSummary) => void;
  canManageJobs?: boolean;
  scoped?: boolean;
}

export function ActiveJobsTable({ jobs, loading, onSelectJob, canManageJobs = true, scoped = false }: Props) {
  if (loading) {
    return (
      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-1/3 mt-2 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-gray-200 rounded-2xl overflow-hidden bg-white">
      <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 bg-gray-50/50 pb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {scoped ? "Job trong phạm vi phụ trách" : "Tin tuyển dụng đang hoạt động"}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {scoped ? "Các vị trí thuộc phòng ban hoặc được Nhân sự phân công" : "Hiệu suất và số lượng ứng viên theo thời gian thực"}
          </p>
        </div>
        <Link to="/employer/jobs" className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center transition-colors border border-blue-100 shadow-sm">
          Xem tất cả <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </CardHeader>
      
      <CardContent className="p-0">
        {jobs.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center bg-gray-50/30">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-4">
              <Briefcase className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Chưa có tin tuyển dụng nào
            </h3>
            <p className="text-xs text-gray-500 mb-5 max-w-sm">
              {canManageJobs ? "Bạn chưa có tin tuyển dụng nào đang hoạt động. Hãy tạo tin mới để bắt đầu tìm kiếm nhân tài." : "Chưa có job nào thuộc phòng ban hoặc được phân công cho bạn. Liên hệ Nhân sự để cập nhật phạm vi."}
            </p>
            {canManageJobs && (
              <Link to="/employer/jobs/new" className="inline-flex items-center justify-center px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm">
                Đăng tin tuyển dụng
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-white">
                  <th className="pb-3 pt-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-left">
                    Vị trí / Chức danh
                  </th>
                  <th className="pb-3 pt-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell text-left">
                    Loại hình
                  </th>
                  <th className="pb-3 pt-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell text-left">
                    Địa điểm
                  </th>
                  <th className="pb-3 pt-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                    Ứng viên
                  </th>
                  <th className="pb-3 pt-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                    Điểm AI TB
                  </th>
                  <th className="pb-3 pt-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {jobs.map((job, idx) => (
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    key={job.id}
                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                    onClick={() => onSelectJob?.(job)}
                  >
                    <td className="py-4 px-6 font-semibold text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                          <Briefcase className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{job.title}</h3>
                          <div className="text-[11px] text-gray-400 font-medium sm:hidden mt-0.5">
                            {job.job_type.replace('_', '-')} • {job.location || 'Remote'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 hidden sm:table-cell">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200/60">
                        {job.job_type.replace('_', '-')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-500 hidden md:table-cell font-medium text-xs">
                      {job.location || "Remote"}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-bold text-xs shadow-sm">
                        {job.applicant_count}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {job.avg_ai_match != null ? (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border shadow-sm ${
                            job.avg_ai_match >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : job.avg_ai_match >= 50 ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-red-50 text-red-700 border-red-200"
                          }`}>
                          {job.avg_ai_match.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs font-medium">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end items-center">
                        <Link
                          to={`/employer/candidates?jobId=${job.id}`}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="sr-only">Xem pipeline</span>
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
