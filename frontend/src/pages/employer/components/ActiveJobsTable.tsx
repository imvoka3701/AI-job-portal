import { Card, CardHeader, CardContent, Badge } from "@/components/ui";
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
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {scoped ? "Job trong phạm vi phụ trách" : "Tin tuyển dụng đang hoạt động"}
          </h2>
          <p className="text-sm text-gray-500">
            {scoped ? "Các vị trí thuộc phòng ban hoặc được Nhân sự phân công" : "Hiệu suất và số lượng ứng viên theo thời gian thực"}
          </p>
        </div>
        <Link to="/employer/jobs" className="text-sm font-medium text-primary hover:text-primary-hover flex items-center">
          Xem tất cả <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </CardHeader>
      
      <CardContent>
        {jobs.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
              <Briefcase className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Chưa có tin tuyển dụng nào
            </h3>
            <p className="text-xs text-gray-500 mb-4 max-w-sm">
              {canManageJobs ? "Bạn chưa có tin tuyển dụng nào đang hoạt động. Hãy tạo tin mới để bắt đầu tìm kiếm nhân tài." : "Chưa có job nào thuộc phòng ban hoặc được phân công cho bạn. Liên hệ Nhân sự để cập nhật phạm vi."}
            </p>
            {canManageJobs && <Link to="/employer/jobs/new" className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm">Đăng tin tuyển dụng</Link>}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-3 pt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Vị trí
                  </th>
                  <th className="pb-3 pt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Loại
                  </th>
                  <th className="pb-3 pt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Địa điểm
                  </th>
                  <th className="pb-3 pt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                    Ứng viên
                  </th>
                  <th className="pb-3 pt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                    Điểm AI TB
                  </th>
                  <th className="pb-3 pt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {jobs.map((job, idx) => (
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={job.id}
                    className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                    onClick={() => onSelectJob?.(job)}
                  >
                    <td className="py-4 font-semibold text-gray-900 pr-4">
                      <h3 className="text-sm font-semibold text-gray-900">{job.title}</h3>
                      <div className="text-xs text-gray-400 font-normal sm:hidden mt-1">
                        {job.job_type.replace('_', '-')} • {job.location || 'Remote'}
                      </div>
                    </td>
                    <td className="py-4 hidden sm:table-cell">
                      <Badge variant="default" className="bg-gray-100 text-gray-600 font-medium">
                        {job.job_type.replace('_', '-')}
                      </Badge>
                    </td>
                    <td className="py-4 text-gray-500 hidden md:table-cell">
                      {job.location || "—"}
                    </td>
                    <td className="py-4 text-center">
                      <div className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs">
                        {job.applicant_count}
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      {job.avg_ai_match != null ? (
                        <Badge
                          variant={
                            job.avg_ai_match >= 80 ? "success"
                            : job.avg_ai_match >= 50 ? "warning"
                            : "danger"
                          }
                          className="font-bold"
                        >
                          {job.avg_ai_match.toFixed(0)}%
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-xs font-medium">—</span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <Link
                        to={`/employer/candidates?jobId=${job.id}`}
                        className="inline-flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Xem pipeline <ChevronRight className="w-3 h-3 ml-0.5" />
                      </Link>
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
