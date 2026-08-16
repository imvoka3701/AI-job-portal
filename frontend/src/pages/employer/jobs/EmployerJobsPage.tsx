import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCompanyJobs } from "@/lib/api/company";
import { Button, Card, EmptyState, ErrorState, JobTypeBadge, ExperienceBadge, Skeleton } from "@/components/ui";
import { useEmployerCompany } from "@/contexts/EmployerCompanyContext";
import type { Job } from "@/types/job";

export function EmployerJobsPage() {
  const { data: context, hasPermission } = useEmployerCompany();
  const companyId = context?.company.id;
  const membershipId = context?.membership.id;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;

    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    getCompanyJobs()
      .then((response) => {
        if (!isCancelled) {
          setJobs(response);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setError("Không thể tải danh sách tin tuyển dụng. Vui lòng thử lại.");
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [companyId, membershipId]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Quản lý tuyển dụng</h1>
            <p className="mt-2 text-sm text-gray-500">Xem các tin tuyển dụng trong phạm vi vai trò và phòng ban của bạn.</p>
          </div>
          {hasPermission("job:manage") && <Link to="/employer/jobs/new"><Button variant="primary">Đăng tin tuyển dụng mới</Button></Link>}
        </div>

        {error && <ErrorState title="Không tải được tin tuyển dụng" message={error} />}

        {isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Card key={idx} className="h-28"><Skeleton className="h-5 w-1/3" /><Skeleton className="mt-3 h-4 w-1/2" /></Card>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState title="Chưa có tin tuyển dụng trong phạm vi" description={hasPermission("job:manage") ? "Tạo tin mới để bắt đầu thu hút ứng viên." : "Liên hệ Nhân sự để được gán vào job hoặc phòng ban phù hợp."} action={hasPermission("job:manage") ? <Link to="/employer/jobs/new"><Button>Tạo tin mới</Button></Link> : undefined} />
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Card key={job.id} className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{job.title}</h2>
                    <p className="mt-1 text-sm text-gray-500">{job.location ?? "Không xác định địa điểm"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <ExperienceBadge level={job.experience_level} />
                    <JobTypeBadge type={job.job_type} />
                    <Link
                      to={`/jobs/${job.id}`}
                      className="text-sm font-semibold text-primary hover:text-primary-hover"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
}
