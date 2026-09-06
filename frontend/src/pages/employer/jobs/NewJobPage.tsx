import { useEffect, useState, useMemo } from "react";
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
  Circle,
  Lightbulb,
  Building2,
  DollarSign,
  FileText,
  ShieldCheck,
  Zap,
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

const mapJobType = (t: string): "full_time" | "part_time" | "internship" | "freelance" | "remote" => {
  const lower = t.toLowerCase();
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

  const currentTitle = watch("title") || "";
  const currentDesc = watch("description") || "";
  const currentReq = watch("requirements") || "";
  const currentBenefits = watch("benefits") || "";
  const currentLoc = watch("location") || "";
  const currentMin = watch("salary_min");
  const currentMax = watch("salary_max");

  // Dynamic ATS Quality Checklist
  const checklist = useMemo(() => [
    { label: "Tiêu đề chức danh rõ ràng (>= 5 ký tự)", done: currentTitle.trim().length >= 5 },
    { label: "Địa điểm làm việc cụ thể", done: currentLoc.trim().length >= 3 },
    { label: "Dải lương minh bạch & hợp lý", done: Boolean(currentMin && currentMax && currentMax >= currentMin) },
    { label: "Mô tả công việc chi tiết (>= 80 ký tự)", done: currentDesc.trim().length >= 80 },
    { label: "Yêu cầu năng lực & kỹ năng (>= 50 ký tự)", done: currentReq.trim().length >= 50 },
    { label: "Chế độ đãi ngộ & quyền lợi (>= 30 ký tự)", done: currentBenefits.trim().length >= 30 },
  ], [currentTitle, currentLoc, currentMin, currentMax, currentDesc, currentReq, currentBenefits]);

  const atsScore = useMemo(() => {
    const passed = checklist.filter((item) => item.done).length;
    return Math.round((passed / checklist.length) * 100);
  }, [checklist]);

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
      <div className="py-16 flex items-center justify-center p-4 font-sans">
        <ErrorState
          title="Bạn không có quyền đăng tin"
          message="Chỉ Chủ sở hữu (Owner) hoặc thành viên Nhân sự được tạo và chỉnh sửa tin tuyển dụng."
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 font-sans text-slate-900 pb-16">
      {/* ── 1. TOP BREADCRUMB & BACK ───────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/employer/jobs"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft size={15} />
          <span>Quay lại Quản lý tin tuyển dụng</span>
        </Link>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Building2 size={14} className="text-slate-400" />
          <span>Doanh nghiệp:</span>
          <strong className="text-slate-800 font-bold">
            {companyContext?.company.name || "TechCorp"}
          </strong>
        </div>
      </div>

      {/* ── 2. HEADER COMMAND BANNER (WIDE BENTO) ─────────────────── */}
      <section className="rounded-[32px] bg-white border border-slate-200/90 shadow-xs p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Sparkles size={13} className="text-[#00B86B]" />
                AI JD Copilot v2.0 Sẵn Sàng
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Chuẩn ATS Quốc Tế
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Đăng Tin Tuyển Dụng Mới
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl">
              Tạo bài đăng việc làm với sự hỗ trợ của AI đa ngành để tối ưu từ khóa, chuẩn hóa yêu cầu và thu hút ứng viên chất lượng cao.
            </p>
          </div>

          {/* Quick AI Trigger Button */}
          <div className="shrink-0 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all cursor-pointer"
            >
              <Wand2 size={16} />
              <span>AI JD Copilot Studio Đa Ngành</span>
              <Sparkles size={14} className="text-emerald-200" />
            </button>
          </div>
        </div>
      </section>

      {sourceRequest && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-center justify-between shadow-2xs">
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

      {/* ── 3. 2-COLUMN ENTERPRISE WORKSPACE GRID ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: THE COMPREHENSIVE FORM (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                <CheckCircle2 size={16} className="text-[#00B86B] shrink-0" />
                <span>{aiSuccessMessage}</span>
              </motion.div>
            )}

            {/* CARD 1: THÔNG TIN VỊ TRÍ & PHÂN LOẠI */}
            <Card className="p-6 sm:p-8 rounded-[32px] border-slate-200/90 shadow-xs bg-white space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00B86B] flex items-center justify-center font-bold">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">1. Thông tin vị trí &amp; Phân loại</h2>
                    <p className="text-[11px] text-slate-500">Chức danh, phòng ban và cấp độ kinh nghiệm</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer"
                >
                  <Wand2 size={12} />
                  <span>AI Gợi ý soạn thảo</span>
                </button>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tiêu đề chức danh tuyển dụng <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="VD: Senior React Native Developer, Trưởng nhóm Marketing, Kế toán trưởng..."
                  {...register("title")}
                  error={errors.title?.message}
                  className="rounded-xl text-sm"
                />
              </div>

              {/* Location & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Địa điểm làm việc <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="VD: Hà Nội, TP. Hồ Chí Minh, Toàn quốc..."
                    {...register("location")}
                    error={errors.location?.message}
                    className="rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Phòng ban trực thuộc
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
              </div>

              {/* Exp Level & Job Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <option value="freelance">Freelance / Dự án</option>
                    <option value="remote">Làm việc từ xa (Remote 100%)</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* CARD 2: CHÍNH SÁCH LƯƠNG & THU NHẬP */}
            <Card className="p-6 sm:p-8 rounded-[32px] border-slate-200/90 shadow-xs bg-white space-y-6">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <DollarSign size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">2. Chính sách thu nhập &amp; Đãi ngộ</h2>
                  <p className="text-[11px] text-slate-500">Mức lương cạnh tranh theo thị trường</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Lương tối thiểu (VND)</label>
                  <Input
                    type="number"
                    min={0}
                    step={1000000}
                    placeholder="VD: 20000000"
                    {...register("salary_min", { valueAsNumber: true })}
                    error={errors.salary_min?.message}
                    className="rounded-xl"
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
                    className="rounded-xl"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                💡 <em>Mẹo:</em> Tin tuyển dụng công khai dải lương minh bạch thu hút nhiều hơn 60% lượt ứng tuyển chất lượng từ ứng viên phù hợp.
              </p>
            </Card>

            {/* CARD 3: BẢN MÔ TẢ CÔNG VIỆC CHUẨN ATS */}
            <Card className="p-6 sm:p-8 rounded-[32px] border-slate-200/90 shadow-xs bg-white space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">3. Chi tiết công việc chuẩn ATS</h2>
                    <p className="text-[11px] text-slate-500">Mô tả trách nhiệm, tiêu chuẩn tuyển dụng và quyền lợi</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                  Markdown Hỗ Trợ
                </span>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mô tả công việc (Job Description) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={7}
                  placeholder="Mô tả các trách nhiệm chính của vị trí (dạng gạch đầu dòng để ứng viên dễ nắm bắt)..."
                  className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-xs font-medium text-slate-900 leading-relaxed focus:border-[#00B86B] focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                  {...register("description")}
                />
                {errors.description?.message && (
                  <p className="text-xs text-rose-600 font-medium">{errors.description?.message}</p>
                )}
              </div>

              {/* Requirements */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Yêu cầu ứng viên &amp; Kỹ năng chuyên môn
                </label>
                <textarea
                  rows={5}
                  placeholder="Kỹ năng bắt buộc, kinh nghiệm làm việc, học vấn hoặc chứng chỉ liên quan..."
                  className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-xs font-medium text-slate-900 leading-relaxed focus:border-[#00B86B] focus:outline-none"
                  {...register("requirements")}
                />
              </div>

              {/* Benefits */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Chế độ đãi ngộ &amp; Quyền lợi đặc thù
                </label>
                <textarea
                  rows={5}
                  placeholder="Lương tháng 13, thưởng hiệu quả, bảo hiểm sức khỏe cao cấp, máy tính cấp mới, du lịch..."
                  className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-xs font-medium text-slate-900 leading-relaxed focus:border-[#00B86B] focus:outline-none"
                  {...register("benefits")}
                />
              </div>
            </Card>

            {/* ACTION BUTTONS */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="bg-gradient-to-r from-[#00B86B] to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm rounded-full px-10 py-3.5 shadow-lg shadow-emerald-600/25 cursor-pointer"
              >
                Đăng Tin Tuyển Dụng Ngay
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="rounded-full text-xs font-bold px-6 py-3.5 border-slate-200 text-slate-700"
              >
                Hủy bỏ
              </Button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: STICKY COPILOT & ATS QUALITY SCOREBOARD (4 COLS) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          {/* PANEL 1: AI COPILOT LAUNCHPAD */}
          <Card className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white shadow-xl border-slate-800 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Zap size={14} />
              </span>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">AI Copilot v2.0</span>
            </div>
            <h3 className="text-base font-black tracking-tight text-white mb-1.5">
              Soạn Thảo JD Tự Động
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              Tự động tạo bản mô tả công việc, chuẩn hóa yêu cầu và gợi ý dải lương thị trường theo hơn 15+ nhóm ngành nghề chuẩn chỉ trong 3 giây.
            </p>
            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#00B86B] to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <Wand2 size={15} />
              <span>Mở AI JD Copilot Studio (1-Click)</span>
            </button>
          </Card>

          {/* PANEL 2: ATS LIVE QUALITY SCORECARD */}
          <Card className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Điểm Chuẩn Hóa ATS</h3>
                <p className="text-[11px] text-slate-500">Đo lường độ hoàn thiện của bài đăng</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-xs bg-slate-50 border border-slate-200 text-slate-800">
                <span className={atsScore >= 80 ? "text-[#00B86B]" : atsScore >= 50 ? "text-blue-600" : "text-amber-500"}>
                  {atsScore}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <motion.div
                className={`h-full rounded-full transition-all duration-500 ${
                  atsScore >= 80 ? "bg-[#00B86B]" : atsScore >= 50 ? "bg-blue-500" : "bg-amber-400"
                }`}
                style={{ width: `${atsScore}%` }}
              />
            </div>

            {/* Live Checklist */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              {checklist.map((item) => (
                <div key={item.label} className="flex items-start gap-2.5 text-xs">
                  {item.done ? (
                    <CheckCircle2 size={15} className="text-[#00B86B] shrink-0 mt-0.5" />
                  ) : (
                    <Circle size={15} className="text-slate-300 shrink-0 mt-0.5" />
                  )}
                  <span className={item.done ? "text-slate-800 font-semibold" : "text-slate-400"}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 leading-relaxed">
              🎯 <em>Lợi ích:</em> Tin tuyển dụng đạt trên 80% điểm ATS sẽ được thuật toán AI Matching ưu tiên đề xuất cho các ứng viên hàng đầu.
            </p>
          </Card>

          {/* PANEL 3: RECRUITMENT PRO-TIPS */}
          <Card className="p-5 rounded-3xl bg-slate-50/80 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Lightbulb size={15} className="text-amber-500" />
              <span>Mẹo thu hút ứng viên hiệu quả</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>Nêu rõ các dự án hoặc công nghệ ứng viên sẽ trực tiếp tham gia làm việc.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>Liệt kê từ 4 - 6 quyền lợi thiết thực nhất thay vì liệt kê quá chung chung.</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>

      <AIJDGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        initialTitle={currentTitle}
        onApplyJD={handleApplyJD}
      />
    </div>
  );
}
