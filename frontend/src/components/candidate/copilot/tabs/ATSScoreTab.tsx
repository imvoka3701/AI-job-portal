/**
 * ATSScoreTab — ATS Readiness Audit & AI Improvement Engine
 * Persona: UI/UX Architect & Frontend Engineer
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui";
import { ATSScoreGauge } from "../shared/ATSScoreGauge";
import type { CvContent } from "@/types/cvDocument";
import type { ATSSuggestion } from "../types";

interface ATSScoreTabProps {
  cvContent: CvContent;
  onApplyContentUpdate?: (updater: (prev: CvContent) => CvContent) => void;
}

export function ATSScoreTab({
  cvContent,
  onApplyContentUpdate,
}: ATSScoreTabProps) {
  const [appliedIds, setAppliedIds] = useState<Record<string, boolean>>({});

  // ── Calculate ATS metrics ──────────────────────────────────────────────────
  const personal = cvContent.personal || { full_name: "", email: "", headline: "" };
  const expList = cvContent.experience || [];
  const skillList = cvContent.skills || [];
  const eduList = cvContent.education || [];
  const projList = cvContent.projects || [];
  const summaryLength = (cvContent.summary || "").trim().length;

  const auditItems = [
    {
      id: "personal",
      title: "Thông tin cá nhân & Tiêu đề",
      passed: Boolean(personal.full_name && personal.email && personal.headline),
      score: 20,
      detail: "Họ tên, Email và Headline giúp hệ thống ATS định danh ứng viên.",
    },
    {
      id: "summary",
      title: "Tóm tắt chuyên môn",
      passed: summaryLength >= 50,
      score: 20,
      detail:
        summaryLength >= 50
          ? `${summaryLength} ký tự (đạt tiêu chuẩn tối thiểu 50 ký tự)`
          : "Tóm tắt còn ngắn hoặc chưa có, cần tối thiểu 50 ký tự.",
    },
    {
      id: "experience",
      title: "Kinh nghiệm làm việc & Số liệu",
      passed:
        expList.length > 0 &&
        expList.some((e) => (e.bullets || []).filter(Boolean).length >= 2),
      score: 25,
      detail: "Tối thiểu 1 vị trí có từ 2 gạch đầu dòng mô tả cụ thể.",
    },
    {
      id: "skills",
      title: "Kỹ năng chuyên môn cốt lõi",
      passed: skillList.filter(Boolean).length >= 5,
      score: 20,
      detail: `Hiện có ${skillList.length} kỹ năng (khuyến nghị tối thiểu 5 kỹ năng).`,
    },
    {
      id: "education",
      title: "Học vấn & Dự án thực tế",
      passed: eduList.length > 0 || projList.length > 0,
      score: 15,
      detail: "Có mục đào tạo học vấn hoặc dự án thực chiến.",
    },
  ];

  const totalScore = auditItems.reduce(
    (acc, item) => (item.passed ? acc + item.score : acc),
    0
  );

  // ── Actionable AI Suggestions ─────────────────────────────────────────────
  const suggestions: ATSSuggestion[] = [
    {
      id: "sug-summary",
      category: "wording",
      title: "Tối ưu hóa Tóm tắt chuyên môn bằng STAR Framework",
      description:
        "Viết lại phần tóm tắt để làm nổi bật thế mạnh công nghệ, số năm kinh nghiệm và cam kết tạo ra giá trị đo lường được cho doanh nghiệp.",
      impact: "high",
      actionType: "enhance_summary",
      suggestedText: `Kỹ sư phần mềm giàu đam mê với hơn 3 năm kinh nghiệm thực chiến phát triển các giải pháp Web quy mô lớn bằng React, TypeScript và FastAPI. Có thế mạnh về tối ưu hiệu năng Core Web Vitals, thiết kế API chuẩn RESTful/Microservices và tích hợp AI. Luôn chủ động, kỷ luật và cam kết đem lại giá trị đo lường được cho sản phẩm.`,
    },
    {
      id: "sug-verbs",
      category: "quantifiable",
      title: "Bổ sung số liệu đo lường và động từ hành động",
      description:
        "Các nhà tuyển dụng B2B và bộ lọc ATS đánh giá rất cao các chỉ số % cải thiện (ví dụ: 'giảm 35% latency', 'tăng 40% traffic').",
      impact: "high",
      actionType: "add_bullet",
      targetSection: "experience",
      suggestedText:
        "Tối ưu hóa pipeline xử lý và bộ nhớ đệm Redis, giúp tăng 40% tốc độ phản hồi và giảm 25% chi phí hạ tầng máy chủ.",
    },
    {
      id: "sug-skills",
      category: "keywords",
      title: "Bổ sung các từ khóa công nghệ đang được săn đón",
      description:
        "Thêm các kỹ năng công nghệ liên quan trực tiếp đến hồ sơ để tăng điểm tương đồng khi hệ thống ATS quét hồ sơ.",
      impact: "medium",
      actionType: "add_skill",
      suggestedItems: ["Docker", "PostgreSQL", "Tailwind CSS", "Git"],
    },
  ];

  const handleApplySuggestion = (sug: ATSSuggestion) => {
    if (!onApplyContentUpdate) return;

    if (sug.actionType === "enhance_summary" && sug.suggestedText) {
      onApplyContentUpdate((prev) => ({
        ...prev,
        summary: sug.suggestedText!,
      }));
    } else if (sug.actionType === "add_bullet" && sug.suggestedText) {
      onApplyContentUpdate((prev) => {
        const exp = [...(prev.experience || [])];
        if (exp.length > 0) {
          exp[0] = {
            ...exp[0],
            bullets: [...(exp[0].bullets || []), sug.suggestedText!],
          };
        }
        return { ...prev, experience: exp };
      });
    } else if (sug.actionType === "add_skill" && sug.suggestedItems) {
      onApplyContentUpdate((prev) => {
        const existing = new Set(prev.skills || []);
        sug.suggestedItems!.forEach((s) => existing.add(s));
        return { ...prev, skills: Array.from(existing) };
      });
    }

    setAppliedIds((prev) => ({ ...prev, [sug.id]: true }));
  };

  return (
    <div className="space-y-6 pb-6">
      {/* ── ATS Score Card ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <ATSScoreGauge score={totalScore} />

          <div className="flex-1 text-center sm:text-left space-y-2">
            <h4 className="text-base font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Đánh giá mức độ tương thích ATS
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Điểm số dựa trên tiêu chuẩn quét tự động của các hệ thống Applicant
              Tracking System (ATS) hàng đầu: định dạng chuẩn, từ khóa kỹ thuật và
              thành tựu định lượng.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                <FileCheck className="w-3 h-3 text-slate-500" />
                {auditItems.filter((i) => i.passed).length}/{auditItems.length} Tiêu chí đạt
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                Đạt chuẩn B2B SaaS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5 Criteria Checklist ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Danh mục kiểm tra chi tiết (Audit Checklist)
        </h4>

        <div className="space-y-2">
          {auditItems.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                item.passed
                  ? "bg-slate-50/50 border-slate-200 text-slate-800"
                  : "bg-amber-50/40 border-amber-200 text-slate-800"
              }`}
            >
              {item.passed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    {item.title}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      item.passed
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    +{item.passed ? item.score : 0}/{item.score}đ
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-normal">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Actionable AI Improvements ────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Gợi ý nâng cấp từ AI Copilot (Actionable Insights)
          </h4>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {suggestions.length} Đề xuất
          </span>
        </div>

        <div className="space-y-3">
          {suggestions.map((sug) => {
            const isApplied = appliedIds[sug.id];
            return (
              <motion.div
                key={sug.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-emerald-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {sug.title}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          sug.impact === "high"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {sug.impact === "high" ? "Ưu tiên cao" : "Nên có"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {sug.description}
                    </p>
                  </div>
                </div>

                {sug.suggestedText && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 leading-relaxed">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Nội dung đề xuất:
                    </div>
                    &ldquo;{sug.suggestedText}&rdquo;
                  </div>
                )}

                {sug.suggestedItems && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {sug.suggestedItems.map((item) => (
                      <span
                        key={item}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                      >
                        +{item}
                      </span>
                    ))}
                  </div>
                )}

                {onApplyContentUpdate && (
                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      onClick={() => handleApplySuggestion(sug)}
                      disabled={isApplied}
                      className={`text-xs font-bold rounded-lg transition-all ${
                        isApplied
                          ? "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-100"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                          Đã áp dụng vào CV
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
                          Áp dụng vào CV ngay
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
