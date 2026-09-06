import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createJob } from "@/lib/api/jobs";
import { Button, Card, ErrorState, Input } from "@/components/ui";
import { useEmployerCompany } from "@/contexts/EmployerCompanyContext";
import { getRecruitmentRequest } from "@/lib/api/recruitmentRequests";
import type { RecruitmentRequest } from "@/types/company";
import {
  Sparkles,
  ArrowLeft,
  Wand2,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { AIJDGeneratorModal } from "./components/AIJDGeneratorModal";
import type { GenerateJDResponse } from "@/lib/api/aiJD";

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

const mapExperienceLevel = (lvl: string): "fresher" | "junior" | "middle" | "senior" | "lead" => {
  const lower = lvl.toLowerCase();
  if (lower.includes("fresher") || lower.includes("intern")) return "fresher";
  if (lower.includes("junior")) return "junior";
  if (lower.includes("middle") || lower.includes("mid")) return "middle";
  if (lower.includes("senior")) return "senior";
  if (lower.includes("lead") || lower.includes("manager") || lower.includes("director")) return "lead";
  return "middle";
};

const mapJobType = (jt: string): "full_time" | "part_time" | "internship" | "freelance" | "remote" => {
  const lower = jt.toLowerCase();
  if (lower.includes("part")) return "part_time";
  if (lower.includes("intern")) return "internship";
  if (lower.includes("free") || lower.includes("project")) return "freelance";
  if (lower.includes("remote") || lower.includes("hybrid")) return "remote";
  return "full_time";
};

export function NewJobPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: companyContext, hasPermission } = useEmployerCompany();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [sourceRequest, setSourceRequest] = useState<RecruitmentRequest | null>(null);
  const requestId = Number(searchParams.get("request_id"));

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
      experience_level: "middle",
      salary_min: 20000000,
      salary_max: 40000000,
      location: "Hà Nội / Hồ Chí Minh (Hybrid)",
      category_id: undefined,
      department_id: undefined,
    },
  });

  const currentTitle = watch("title");

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
          experience_level: "middle",
          salary_min: undefined,
          salary_max: undefined,
          location: "Hà Nội / Hồ Chí Minh",
          category_id: undefined,
          department_id: request.department_id,
        });
      })
      .catch(() => setSubmitError("Không thể tải nhu cầu tuyển dụng để điền sẵn thông tin."));
    return () => {
      active = false;
    };
  }, [hasPermission, requestId, reset]);

  const handleApplyJD = (data: GenerateJDResponse) => {
    setValue("title", data.title, { shouldValidate: true });
    setValue("description", data.description, { shouldValidate: true });
    setValue("requirements", data.requirements, { shouldValidate: true });
    setValue("benefits", data.benefits, { shouldValidate: true });
    if (data.salary_min) setValue("salary_min", data.salary_min, { shouldValidate: true });
    if (data.salary_max) setValue("salary_max", data.salary_max, { shouldValidate: true });
    setValue("job_type", mapJobType(data.job_type), { shouldValidate: true });
    setValue("experience_level", mapExperienceLevel(data.experience_level), { shouldValidate: true });
    if (data.suggested_category_id) {
      setValue("category_id", data.suggested_category_id, { shouldValidate: true });
    }

    setAiSuccessMessage(
      `AI Copilot đã hoàn thiện toàn bộ bản mô tả JD, yêu cầu, đãi ngộ và gợi ý ${data.suggested_skills.length} kỹ năng trọng tâm!`
    );
    setTimeout(() => setAiSuccessMessage(null), 6000);
  };

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
      <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center p-4">
        <ErrorState
          title="Bạn không có quyền đăng tin"
          message="Chỉ Chủ sở hữu (Owner) hoặc thành viên Nhân sự được tạo và chỉnh sửa tin tuyển dụng."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFB] font-sans pb-16 text-slate-900 selection:bg-emerald-500 selection:text-white">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back Link */}
        <Link
          to="/employer/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Quay lại Quản lý tin tuyển dụng</span>
        </Link>

        {/* Header Title Card */}
        <section className="rounded-3xl bg-white border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Sparkles size={12} className="text-[#00B86B]" />
                  AI JD Copilot Sẵn Sàng
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Đăng Tin Tuyển Dụng Mới
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Tạo bài đăng việc làm với sự hỗ trợ của AI để thu hút ứng viên chất lượng cao.
              </p>
            </div>

            {/* AI Studio Trigger Button */}
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <Wand2 size={15} />
                <span>AI JD Copilot Studio Đa Ngành</span>
                <Sparkles size={13} className="text-emerald-200" />
              </button>
            </div>
          </div>
        </section>

        {sourceRequest && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-800">
                Tạo từ nhu cầu tuyển dụng đã duyệt #{sourceRequest.id}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                {sourceRequest.department_name} · {sourceRequest.headcount} nhân sự · đề xuất bởi {sourceRequest.requester_name}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-emerald-700 border border-emerald-200">
              Đã duyệt
            </span>
          </div>
        )}

        {/* Main Form */}
        <Card className="p-6 sm:p-8 rounded-[32px] border-slate-200/90 shadow-xs bg-white space-y-6">
          {submitError && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-700">
              {submitError}
            </div>
          )}

          {aiSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2"
            >
              <CheckCircle2 size={16} className="text-[#00B86B]" />
              <span>{aiSuccessMessage}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title & AI Auto Draft Trigger */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tiêu đề vị trí tuyển dụng <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200 hover:from-emerald-100 hover:to-teal-100 transition-all cursor-pointer shadow-2xs"
                >
                  <Wand2 size={13} className="text-[#00B86B]" />
                  <span>AI Soạn Thảo JD Đa Ngành (1-Click)</span>
                </button>
              </div>
              <Input
                placeholder="VD: Senior React Native Developer, Golang Backend Engineer..."
                {...register("title")}
                error={errors.title?.message}
                className="rounded-xl"
              />
            </div>

            {/* Department, Location, Exp Level & Job Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Địa điểm làm việc <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="VD: Hà Nội, TP. Hồ Chí Minh, Toàn quốc..."
                  {...register("location")}
                  error={errors.location?.message}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Phòng ban phụ trách
                </label>
                <select
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-[#00B86B] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  {...register("department_id", {
                    setValueAs: (value) => (value ? Number(value) : undefined),
                  })}
                >
                  <option value="">Chưa phân phòng ban</option>
                  {companyContext?.departments
                    .filter((department) => department.is_active)
                    .map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Cấp độ kinh nghiệm
                </label>
                <select
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-[#00B86B] focus:outline-none"
                  {...register("experience_level")}
                >
                  <option value="fresher">Fresher (&lt; 1 năm)</option>
                  <option value="junior">Junior (1 - 2 năm)</option>
                  <option value="middle">Middle (2 - 4 năm)</option>
                  <option value="senior">Senior (4 - 6 năm)</option>
                  <option value="lead">Lead / Quản lý nhóm</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Hình thức làm việc
                </label>
                <select
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-[#00B86B] focus:outline-none"
                  {...register("job_type")}
                >
                  <option value="full_time">Toàn thời gian (Full-time)</option>
                  <option value="part_time">Bán thời gian (Part-time)</option>
                  <option value="internship">Thực tập sinh (Internship)</option>
                  <option value="freelance">Freelance</option>
                  <option value="remote">Làm việc từ xa (Remote 100%)</option>
                </select>
              </div>
            </div>

            {/* Salary Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Lương tối thiểu (VND)</label>
                <Input
                  type="number"
                  min={0}
                  step={1000000}
                  placeholder="VD: 20000000"
                  {...register("salary_min", { valueAsNumber: true })}
                  error={errors.salary_min?.message}
                  className="rounded-xl bg-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Lương tối đa (VND)</label>
                <Input
                  type="number"
                  min={0}
                  step={1000000}
                  placeholder="VD: 40000000"
                  {...register("salary_max", { valueAsNumber: true })}
                  error={errors.salary_max?.message}
                  className="rounded-xl bg-white"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mô tả công việc (Job Description) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={6}
                placeholder="Mô tả các trách nhiệm chính của vị trí..."
                className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-xs font-medium text-slate-900 leading-relaxed focus:border-[#00B86B] focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                {...register("description")}
              />
              {errors.description?.message && (
                <p className="text-xs text-rose-600 font-medium">{errors.description?.message}</p>
              )}
            </div>

            {/* Requirements & Benefits */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Yêu cầu kỹ năng &amp; Năng lực
                </label>
                <textarea
                  rows={4}
                  placeholder="Các kỹ năng bắt buộc, bằng cấp hoặc số năm kinh nghiệm..."
                  className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-xs font-medium text-slate-900 leading-relaxed focus:border-[#00B86B] focus:outline-none"
                  {...register("requirements")}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Chế độ đãi ngộ &amp; Quyền lợi
                </label>
                <textarea
                  rows={4}
                  placeholder="Lương tháng 13, bảo hiểm sức khỏe, thiết bị làm việc, du lịch..."
                  className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-xs font-medium text-slate-900 leading-relaxed focus:border-[#00B86B] focus:outline-none"
                  {...register("benefits")}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="bg-gradient-to-r from-[#00B86B] to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-full px-8 py-3 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                Đăng Tin Tuyển Ngay
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="rounded-full text-xs font-bold px-6 py-3 border-slate-200"
              >
                Hủy bỏ
              </Button>
            </div>
          </form>
        </Card>
      </main>

        <AIJDGeneratorModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          initialTitle={currentTitle}
          onApplyJD={handleApplyJD}
        />
    </div>
  );
}
