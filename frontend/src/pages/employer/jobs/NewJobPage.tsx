import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createJob } from "@/lib/api/jobs";
import { Button, Card, ErrorState, Input } from "@/components/ui";
import { useEmployerCompany } from "@/contexts/EmployerCompanyContext";
import { getRecruitmentRequest } from "@/lib/api/recruitmentRequests";
import type { RecruitmentRequest } from "@/types/company";

const newJobSchema = z.object({
  title: z.string().min(5, "Tiêu đề phải có ít nhất 5 ký tự"),
  description: z.string().min(20, "Mô tả phải có ít nhất 20 ký tự"),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  job_type: z.enum(["full_time", "part_time", "internship", "freelance", "remote"]),
  experience_level: z.enum(["fresher", "junior", "middle", "senior", "lead"]),
  salary_min: z.number().int().nonnegative().optional(),
  salary_max: z.number().int().nonnegative().optional(),
  location: z.string().min(1, "Địa điểm không được để trống"),
  category_id: z.number().int().positive().optional(),
  department_id: z.number().int().positive().optional(),
});

type NewJobFormValues = z.infer<typeof newJobSchema>;

export function NewJobPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: companyContext, hasPermission } = useEmployerCompany();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sourceRequest, setSourceRequest] = useState<RecruitmentRequest | null>(null);
  const requestId = Number(searchParams.get("request_id"));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewJobFormValues>({
    resolver: zodResolver(newJobSchema),
    defaultValues: {
      title: "",
      description: "",
      requirements: "",
      benefits: "",
      job_type: "full_time",
      experience_level: "fresher",
      salary_min: undefined,
      salary_max: undefined,
      location: "",
      category_id: undefined,
      department_id: undefined,
    },
  });

  useEffect(() => {
    if (!Number.isInteger(requestId) || requestId <= 0 || !hasPermission("job:manage")) return;
    let active = true;
    getRecruitmentRequest(requestId)
      .then((request) => {
        if (!active) return;
        if (request.status !== "approved" || request.converted_job_id) {
          setSubmitError("Nhu cầu tuyển dụng chưa được duyệt hoặc đã được chuyển thành tin.");
          return;
        }
        setSourceRequest(request);
        reset({
          title: request.title,
          description: request.responsibilities,
          requirements: request.requirements,
          benefits: "",
          job_type: request.job_type,
          experience_level: "fresher",
          salary_min: undefined,
          salary_max: undefined,
          location: "",
          category_id: undefined,
          department_id: request.department_id,
        });
      })
      .catch(() => setSubmitError("Không thể tải nhu cầu tuyển dụng để điền sẵn thông tin."));
    return () => { active = false; };
  }, [hasPermission, requestId, reset]);

  const onSubmit = async (data: NewJobFormValues) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        salary_min: Number.isFinite(data.salary_min) ? data.salary_min : undefined,
        salary_max: Number.isFinite(data.salary_max) ? data.salary_max : undefined,
        category_id: Number.isFinite(data.category_id) ? data.category_id : undefined,
        department_id: Number.isFinite(data.department_id) ? data.department_id : undefined,
        recruitment_request_id: sourceRequest?.id,
      };
      const created = await createJob(payload);
      navigate(`/jobs/${created.id}`);
    } catch {
      setSubmitError("Không thể tạo tin tuyển dụng. Vui lòng kiểm tra thông tin và thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasPermission("job:manage")) {
    return (
      <ErrorState
        title="Bạn không có quyền đăng tin"
        message="Chỉ Owner hoặc thành viên Nhân sự được tạo và chỉnh sửa tin tuyển dụng."
      />
    );
  }

  return (
    <div className="py-4">
      <div className="max-w-[900px] mx-auto">
        <Card className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">Đăng tin tuyển dụng mới</h1>
            <p className="mt-2 text-sm text-gray-500">Tạo bài đăng việc làm để ứng viên có thể xem và ứng tuyển.</p>
          </div>

          {sourceRequest && (
            <div className="mb-6 rounded-lg border border-primary/20 bg-primary-light p-4">
              <p className="text-sm font-semibold text-primary-dark">Tạo từ nhu cầu đã duyệt #{sourceRequest.id}</p>
              <p className="mt-1 text-sm text-gray-600">{sourceRequest.department_name} · {sourceRequest.headcount} nhân sự · đề xuất bởi {sourceRequest.requester_name}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {submitError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input label="Tiêu đề công việc" {...register("title")} error={errors.title?.message} />
              <Input label="Địa điểm" {...register("location")} error={errors.location?.message} />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Phòng ban phụ trách</label>
                <select
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  {...register("department_id", {
                    setValueAs: (value) => value ? Number(value) : undefined,
                  })}
                >
                  <option value="">Chưa phân phòng ban</option>
                  {companyContext?.departments
                    .filter((department) => department.is_active)
                    .map((department) => (
                      <option key={department.id} value={department.id}>{department.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Cấp độ kinh nghiệm</label>
                <select
                  className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900"
                  {...register("experience_level")}
                >
                  <option value="fresher">Fresher</option>
                  <option value="junior">Junior</option>
                  <option value="middle">Middle</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Hình thức làm việc</label>
                <select
                  className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900"
                  {...register("job_type")}
                >
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="internship">Internship</option>
                  <option value="freelance">Freelance</option>
                  <option value="remote">Remote</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="Lương tối thiểu"
                type="number"
                min={0}
                step={100000}
                {...register("salary_min", { valueAsNumber: true })}
                error={errors.salary_min?.message}
              />
              <Input
                label="Lương tối đa"
                type="number"
                min={0}
                step={100000}
                {...register("salary_max", { valueAsNumber: true })}
                error={errors.salary_max?.message}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input label="Yêu cầu" {...register("requirements")} error={errors.requirements?.message} />
              <Input label="Quyền lợi" {...register("benefits")} error={errors.benefits?.message} />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Mô tả công việc</label>
              <textarea
                className="w-full min-h-[160px] rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 focus:border-primary focus:ring-primary/20"
                {...register("description")}
              />
              {errors.description?.message && (
                <p className="mt-2 text-sm text-red-600">{errors.description?.message}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <Button type="submit" isLoading={isSubmitting} fullWidth className="max-w-[220px]">
                Tạo tin tuyển dụng
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
                Quay lại
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
