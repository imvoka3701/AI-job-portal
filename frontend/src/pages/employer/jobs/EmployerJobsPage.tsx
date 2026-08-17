import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getCompanyJobs } from "@/lib/api/company";
import { updateJob, deleteJob } from "@/lib/api/jobs";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  JobTypeBadge,
  ExperienceBadge,
  Skeleton,
  Input,
  Modal,
} from "@/components/ui";
import { useEmployerCompany } from "@/contexts/EmployerCompanyContext";
import type { Job, JobType, ExperienceLevel } from "@/types/job";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  MapPin,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: "full_time", label: "Toàn thời gian" },
  { value: "part_time", label: "Bán thời gian" },
  { value: "internship", label: "Thực tập" },
  { value: "freelance", label: "Freelance" },
  { value: "remote", label: "Làm việc từ xa" },
];

const EXP_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: "fresher", label: "Fresher (< 1 năm)" },
  { value: "junior", label: "Junior (1 - 2 năm)" },
  { value: "middle", label: "Middle (2 - 4 năm)" },
  { value: "senior", label: "Senior (4 - 6 năm)" },
  { value: "lead", label: "Lead / Trưởng nhóm" },
];

export function EmployerJobsPage() {
  const { data: context, hasPermission } = useEmployerCompany();
  const companyId = context?.company.id;
  const membershipId = context?.membership.id;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "closed">("all");

  // Edit Job State
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);

  // Edit Form Fields
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editRequirements, setEditRequirements] = useState("");
  const [editBenefits, setEditBenefits] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editJobType, setEditJobType] = useState<JobType>("full_time");
  const [editExpLevel, setEditExpLevel] = useState<ExperienceLevel>("middle");
  const [editSalaryMin, setEditSalaryMin] = useState<number | "">("");
  const [editSalaryMax, setEditSalaryMax] = useState<number | "">("");

  // Delete Job State
  const [deletingJobId, setDeletingJobId] = useState<number | null>(null);

  const fetchJobs = () => {
    if (!companyId) return;
    setIsLoading(true);
    setError(null);
    getCompanyJobs()
      .then((res) => setJobs(res))
      .catch(() => setError("Không thể tải danh sách tin tuyển dụng. Vui lòng thử lại."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchJobs();
  }, [companyId, membershipId]);

  const handleOpenEdit = (job: Job) => {
    setEditingJob(job);
    setEditTitle(job.title);
    setEditDescription(job.description || "");
    setEditRequirements(job.requirements || "");
    setEditBenefits(job.benefits || "");
    setEditLocation(job.location || "");
    setEditJobType(job.job_type || "full_time");
    setEditExpLevel(job.experience_level || "middle");
    setEditSalaryMin(job.salary_min ?? "");
    setEditSalaryMax(job.salary_max ?? "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    setIsUpdating(true);
    try {
      const updated = await updateJob(editingJob.id, {
        title: editTitle,
        description: editDescription,
        requirements: editRequirements || undefined,
        benefits: editBenefits || undefined,
        location: editLocation || undefined,
        job_type: editJobType,
        experience_level: editExpLevel,
        salary_min: editSalaryMin === "" ? undefined : Number(editSalaryMin),
        salary_max: editSalaryMax === "" ? undefined : Number(editSalaryMax),
      });
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? { ...j, ...updated } : j)));
      setEditSuccess(true);
      setTimeout(() => {
        setEditSuccess(false);
        setEditingJob(null);
      }, 1000);
    } catch {
      alert("Cập nhật tin tuyển dụng thất bại. Vui lòng kiểm tra lại.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleActive = async (job: Job) => {
    try {
      const updated = await updateJob(job.id, {
        is_active: !job.is_active,
      });
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, is_active: updated.is_active } : j))
      );
    } catch {
      alert("Không thể thay đổi trạng thái tuyển dụng.");
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tin tuyển dụng này? Thao tác này không thể hoàn tác.")) {
      return;
    }
    setDeletingJobId(jobId);
    try {
      await deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch {
      alert("Xóa tin tuyển dụng thất bại.");
    } finally {
      setDeletingJobId(null);
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesKeyword =
        !searchKeyword ||
        job.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (job.location && job.location.toLowerCase().includes(searchKeyword.toLowerCase()));
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && job.is_active) ||
        (filterStatus === "closed" && !job.is_active);
      return matchesKeyword && matchesStatus;
    });
  }, [jobs, searchKeyword, filterStatus]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý Tin tuyển dụng</h1>
          <p className="mt-1 text-sm text-gray-500">
            Theo dõi, chỉnh sửa và quản trị các vị trí tuyển dụng của doanh nghiệp.
          </p>
        </div>
        {hasPermission("job:manage") && (
          <Link to="/employer/jobs/new">
            <Button variant="primary" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Đăng tin mới
            </Button>
          </Link>
        )}
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-white border-gray-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Tìm theo tiêu đề, địa điểm..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Trạng thái:</span>
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  filterStatus === "all" ? "bg-white text-primary shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Tất cả ({jobs.length})
              </button>
              <button
                onClick={() => setFilterStatus("active")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  filterStatus === "active" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Đang tuyển ({jobs.filter((j) => j.is_active).length})
              </button>
              <button
                onClick={() => setFilterStatus("closed")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  filterStatus === "closed" ? "bg-white text-gray-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Tạm đóng ({jobs.filter((j) => !j.is_active).length})
              </button>
            </div>
          </div>
        </div>
      </Card>

      {error && <ErrorState title="Không tải được tin tuyển dụng" message={error} />}

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} className="p-5">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="mt-3 h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          title={searchKeyword ? "Không tìm thấy tin phù hợp" : "Chưa có tin tuyển dụng nào"}
          description={
            searchKeyword
              ? "Hãy thử tìm kiếm với từ khóa khác."
              : hasPermission("job:manage")
              ? "Tạo tin tuyển dụng đầu tiên để bắt đầu nhận hồ sơ ứng viên."
              : "Liên hệ HR để được gán quyền phụ trách tin tuyển dụng."
          }
          action={
            hasPermission("job:manage") && !searchKeyword ? (
              <Link to="/employer/jobs/new">
                <Button variant="primary">Đăng tin ngay</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4">
          {filteredJobs.map((job) => {
            const salaryText =
              job.salary_min && job.salary_max
                ? `${(job.salary_min / 1000000).toFixed(0)} - ${(job.salary_max / 1000000).toFixed(0)} triệu VNĐ`
                : job.salary_min
                ? `Từ ${(job.salary_min / 1000000).toFixed(0)} triệu VNĐ`
                : "Thỏa thuận";

            return (
              <Card
                key={job.id}
                className={`p-5 transition-all border ${
                  job.is_active ? "border-gray-200 hover:border-primary/40 hover:shadow-sm" : "border-gray-200 bg-gray-50/70 opacity-80"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Job Main Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-base font-bold text-gray-900 hover:text-primary transition-colors">
                        <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                      </h2>
                      {job.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Đang tuyển
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-300">
                          <XCircle className="w-3 h-3" /> Tạm đóng
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {job.location || "Toàn quốc"}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-semibold text-gray-700">{salaryText}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        Đăng ngày: {new Date(job.created_at).toLocaleDateString("vi-VN")}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <ExperienceBadge level={job.experience_level} />
                      <JobTypeBadge type={job.job_type} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100 lg:pt-0 lg:border-0">
                    <Link to={`/jobs/${job.id}`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
                        <Eye className="w-3.5 h-3.5" />
                        Xem trang JD
                      </Button>
                    </Link>

                    {hasPermission("job:manage") && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(job)}
                          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 hover:border-blue-300"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Sửa tin
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(job)}
                          className={`flex items-center gap-1 text-xs ${
                            job.is_active
                              ? "text-amber-600 hover:text-amber-700 hover:border-amber-300"
                              : "text-emerald-600 hover:text-emerald-700 hover:border-emerald-300"
                          }`}
                        >
                          {job.is_active ? "Tạm đóng" : "Mở lại"}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteJob(job.id)}
                          disabled={deletingJobId === job.id}
                          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 hover:border-red-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Xóa
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Job Modal */}
      {editingJob && (
        <Modal
          isOpen={Boolean(editingJob)}
          onClose={() => setEditingJob(null)}
          title={`Chỉnh sửa: ${editingJob.title}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
            {editSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Đã cập nhật tin tuyển dụng thành công!
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tiêu đề công việc <span className="text-red-500">*</span>
              </label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Hình thức làm việc</label>
                <select
                  value={editJobType}
                  onChange={(e) => setEditJobType(e.target.value as JobType)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {JOB_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Kinh nghiệm yêu cầu</label>
                <select
                  value={editExpLevel}
                  onChange={(e) => setEditExpLevel(e.target.value as ExperienceLevel)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {EXP_LEVELS.map((exp) => (
                    <option key={exp.value} value={exp.value}>
                      {exp.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Địa điểm làm việc</label>
              <Input
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="VD: Hà Nội, TP.HCM..."
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Lương tối thiểu (VNĐ)</label>
                <Input
                  type="number"
                  value={editSalaryMin}
                  onChange={(e) => setEditSalaryMin(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="VD: 15000000"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Lương tối đa (VNĐ)</label>
                <Input
                  type="number"
                  value={editSalaryMax}
                  onChange={(e) => setEditSalaryMax(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="VD: 30000000"
                  className="text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Mô tả công việc <span className="text-red-500">*</span>
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                required
                className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Yêu cầu ứng viên</label>
              <textarea
                value={editRequirements}
                onChange={(e) => setEditRequirements(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Quyền lợi & Đãi ngộ</label>
              <textarea
                value={editBenefits}
                onChange={(e) => setEditBenefits(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={() => setEditingJob(null)}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" disabled={isUpdating}>
                {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
