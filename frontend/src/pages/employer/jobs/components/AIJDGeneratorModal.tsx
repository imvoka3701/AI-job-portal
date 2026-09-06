import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import {
  Sparkles,
  Wand2,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Building2,
  DollarSign,
  Layers,
  ChevronRight,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { generateJobDescription, type GenerateJDResponse } from "@/lib/api/aiJD";

interface AIJDGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTitle?: string;
  onApplyJD: (data: GenerateJDResponse) => void;
}

const POPULAR_INDUSTRIES = [
  "Công nghệ thông tin (IT / Phần mềm)",
  "Tài chính - Ngân hàng - Bảo hiểm",
  "Marketing - Truyền thông - Quảng cáo",
  "Bán hàng - Phát triển kinh doanh (B2B/B2C)",
  "Bất động sản - Xây dựng - Kiến trúc",
  "Bán lẻ - Hàng tiêu dùng nhanh (FMCG)",
  "Y tế - Dược phẩm - Chăm sóc sức khỏe",
  "Giáo dục - Đào tạo - EdTech",
  "Logistics - Vận tải - Xuất nhập khẩu",
  "Nhân sự - Tuyển dụng (HR)",
  "Kế toán - Kiểm toán - Thuế",
  "Khách sạn - Du lịch - Ẩm thực (F&B)",
  "Sản xuất - Vận hành nhà máy",
  "Thiết kế - Đồ họa - UI/UX",
  "Pháp lý - Luật doanh nghiệp",
];

const EXPERIENCE_LEVELS = [
  { value: "intern", label: "Thực tập sinh (Intern)" },
  { value: "fresher", label: "Mới tốt nghiệp (Fresher)" },
  { value: "junior", label: "Nhân viên (Junior - 1-2 năm)" },
  { value: "middle", label: "Chuyên viên (Middle - 2-4 năm)" },
  { value: "senior", label: "Chuyên viên cao cấp (Senior - 4-6 năm)" },
  { value: "lead", label: "Trưởng nhóm (Team Lead)" },
  { value: "manager", label: "Trưởng phòng (Manager)" },
  { value: "director", label: "Giám đốc / Trưởng khối (Director)" },
];

const JOB_TYPES = [
  { value: "full_time", label: "Toàn thời gian (Full-time)" },
  { value: "part_time", label: "Bán thời gian (Part-time)" },
  { value: "remote", label: "Làm việc từ xa (Remote)" },
  { value: "internship", label: "Thực tập (Internship)" },
  { value: "freelance", label: "Cộng tác viên / Dự án" },
];

const WRITING_TONES = [
  { value: "professional", label: "Chuyên nghiệp & Chuẩn mực (Corporate)" },
  { value: "modern_startup", label: "Năng động & Trẻ trung (Tech Startup)" },
  { value: "corporate_formal", label: "Trang trọng & Quy chuẩn Tập đoàn" },
];

export const AIJDGeneratorModal: React.FC<AIJDGeneratorModalProps> = ({
  isOpen,
  onClose,
  initialTitle = "",
  onApplyJD,
}) => {
  const [jobTitle, setJobTitle] = useState(initialTitle);
  const [industry, setIndustry] = useState(POPULAR_INDUSTRIES[0]);
  const [experienceLevel, setExperienceLevel] = useState("middle");
  const [jobType, setJobType] = useState("full_time");
  const [tone, setTone] = useState("professional");
  const [keyNotes, setKeyNotes] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedJD, setGeneratedJD] = useState<GenerateJDResponse | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  useEffect(() => {
    if (initialTitle) {
      setJobTitle(initialTitle);
    }
  }, [initialTitle]);

  const handleGenerate = async () => {
    if (!jobTitle.trim() || jobTitle.trim().length < 2) {
      setError("Vui lòng nhập chức danh tuyển dụng (tối thiểu 2 ký tự).");
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const result = await generateJobDescription({
        job_title: jobTitle.trim(),
        industry,
        experience_level: experienceLevel,
        job_type: jobType,
        tone,
        key_notes: keyNotes.trim() || undefined,
      });
      setGeneratedJD(result);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Có lỗi xảy ra khi gọi AI soạn thảo JD.";
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!generatedJD) return;
    onApplyJD(generatedJD);
    onClose();
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const formatSalary = (amount: number | null) => {
    if (!amount) return "Thoả thuận";
    return `${(amount / 1_000_000).toLocaleString("vi-VN")} Triệu`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      title="AI Multi-Industry JD Copilot Studio"
    >
      <div className="space-y-6 text-slate-800">
        {/* Banner Introduction */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-900/90 via-slate-900 to-teal-950 p-5 text-white shadow-sm border border-emerald-800/40">
          <div className="flex items-start gap-3.5">
            <div className="rounded-xl bg-emerald-500/20 p-2.5 text-emerald-400 border border-emerald-400/30 shrink-0">
              <Wand2 size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-white">
                  Studio Soạn Thảo JD Thông Minh Đa Ngành
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/25 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 border border-emerald-400/30">
                  <Sparkles size={11} /> DeepSeek Engine
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                Tự động kết hợp hồ sơ công ty và tiêu chuẩn ngành nghề thực tế tại Việt Nam để soạn thảo JD chuẩn ATS, trích xuất bộ kỹ năng khớp nối và đề xuất mức lương thị trường.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Job Title */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              Chức danh cần tuyển <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="VD: Giám sát Công trình, Chuyên viên Tín dụng SME, Trưởng phòng Marketing..."
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white"
            />
          </div>

          {/* Industry */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <Building2 size={13} className="text-slate-500" /> Ngành nghề / Lĩnh vực
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white cursor-pointer"
            >
              {POPULAR_INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* Experience Level */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <Layers size={13} className="text-slate-500" /> Cấp bậc yêu cầu
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white cursor-pointer"
            >
              {EXPERIENCE_LEVELS.map((lvl) => (
                <option key={lvl.value} value={lvl.value}>
                  {lvl.label}
                </option>
              ))}
            </select>
          </div>

          {/* Job Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <Briefcase size={13} className="text-slate-500" /> Hình thức làm việc
            </label>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white cursor-pointer"
            >
              {JOB_TYPES.map((jt) => (
                <option key={jt.value} value={jt.value}>
                  {jt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tone */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <Sparkles size={13} className="text-slate-500" /> Phong cách văn phong
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white cursor-pointer"
            >
              {WRITING_TONES.map((tn) => (
                <option key={tn.value} value={tn.value}>
                  {tn.label}
                </option>
              ))}
            </select>
          </div>

          {/* Key Notes */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Ghi chú riêng / Yêu cầu ưu tiên của Doanh nghiệp (Tùy chọn)
            </label>
            <textarea
              rows={2}
              value={keyNotes}
              onChange={(e) => setKeyNotes(e.target.value)}
              placeholder="VD: Cần ứng viên có chứng chỉ CFA; biết tiếng Trung là lợi thế; sẵn sàng đi công tác các tỉnh..."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white resize-none"
            />
          </div>
        </div>

        {/* Generate Button CTA */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !jobTitle.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Đang phân tích ngành & soạn thảo JD...</span>
              </>
            ) : (
              <>
                <Wand2 size={14} />
                <span>Soạn Thảo JD Với AI (1-Click)</span>
              </>
            )}
          </button>
        </div>

        {/* Generated Result Preview */}
        {generatedJD && (
          <div className="rounded-2xl border border-emerald-200 bg-slate-50/70 p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                  Bản Thảo Hoàn Tất Chuẩn ATS
                </span>
                <h4 className="text-lg font-black text-slate-900">{generatedJD.title}</h4>
              </div>

              {/* Badges preview */}
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="default" className="text-[11px] bg-white border-slate-200 text-slate-700">
                  <Briefcase size={11} className="mr-1 text-slate-500" />
                  {generatedJD.job_type}
                </Badge>
                <Badge variant="default" className="text-[11px] bg-white border-slate-200 text-slate-700">
                  <Layers size={11} className="mr-1 text-slate-500" />
                  {generatedJD.experience_level}
                </Badge>
                {(generatedJD.salary_min || generatedJD.salary_max) && (
                  <Badge variant="success" className="text-[11px]">
                    <DollarSign size={11} className="mr-0.5" />
                    {formatSalary(generatedJD.salary_min)} - {formatSalary(generatedJD.salary_max)}
                  </Badge>
                )}
              </div>
            </div>

            {/* Suggested Skills */}
            {generatedJD.suggested_skills.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-600">
                  Kỹ năng cốt lõi được AI đề xuất cho vị trí này:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {generatedJD.suggested_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Sections Content */}
            <div className="space-y-3.5 text-xs text-slate-700 max-h-80 overflow-y-auto pr-1">
              {/* Description */}
              <div className="rounded-xl bg-white p-3.5 border border-slate-200 relative group">
                <div className="flex items-center justify-between mb-1.5">
                  <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    1. Mô tả công việc (Job Description)
                  </h5>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedJD.description, "desc")}
                    className="text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {copiedSection === "desc" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  </button>
                </div>
                <div className="whitespace-pre-line text-slate-600 leading-relaxed font-sans">
                  {generatedJD.description}
                </div>
              </div>

              {/* Requirements */}
              <div className="rounded-xl bg-white p-3.5 border border-slate-200 relative group">
                <div className="flex items-center justify-between mb-1.5">
                  <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    2. Yêu cầu ứng viên (Requirements)
                  </h5>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedJD.requirements, "req")}
                    className="text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {copiedSection === "req" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  </button>
                </div>
                <div className="whitespace-pre-line text-slate-600 leading-relaxed font-sans">
                  {generatedJD.requirements}
                </div>
              </div>

              {/* Benefits */}
              <div className="rounded-xl bg-white p-3.5 border border-slate-200 relative group">
                <div className="flex items-center justify-between mb-1.5">
                  <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    3. Chế độ đãi ngộ & Quyền lợi (Benefits)
                  </h5>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedJD.benefits, "ben")}
                    className="text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {copiedSection === "ben" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  </button>
                </div>
                <div className="whitespace-pre-line text-slate-600 leading-relaxed font-sans">
                  {generatedJD.benefits}
                </div>
              </div>
            </div>

            {/* Apply Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-[11px] text-slate-500">
                Nhấn áp dụng để tự động điền các mục vào trang tạo việc làm.
              </span>
              <button
                type="button"
                onClick={handleApply}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#00B86B] hover:bg-[#009e5b] text-white px-4 py-2 text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <CheckCircle2 size={15} />
                <span>Áp dụng vào Tin Tuyển Dụng</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
