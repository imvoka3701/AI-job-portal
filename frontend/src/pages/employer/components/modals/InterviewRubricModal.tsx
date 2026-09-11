/**
 * InterviewRubricModal — Hệ thống Rubric Scoring & Đánh giá phỏng vấn cho Hội đồng tuyển dụng
 * UI/UX Architect & Frontend Engineer Component (Hướng B)
 *
 * Tính năng:
 * - Chọn bộ tiêu chuẩn đánh giá định hình sẵn (Tech, HR/Culture, Leadership, General, Custom)
 * - Thang đo 5 cấp độ (1-10 điểm): Chưa đạt, Cần cải thiện, Đạt yêu cầu, Khá tốt, Xuất sắc
 * - Nút chấm điểm nhanh (Pills 1..10) kèm thanh trượt và ghi chú theo từng tiêu chí
 * - Thêm / Sửa / Xóa tiêu chí linh hoạt
 * - Điểm trung bình tự động tính toán thời gian thực
 * - Quyết định tuyển dụng của Hội đồng: Strong Hire, Hire, Leaning Hire, Leaning No Hire, Strong No Hire
 * - Trợ lý AI tự động soạn thảo bản nhận xét đánh giá (Hiring Evaluation Memo)
 * - Tùy chọn tự động đồng bộ trạng thái vòng (Passed / Failed) khi lưu kết quả
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Plus,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Scale,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Code2,
  Users,
  Briefcase,
  Layers,
} from "lucide-react";
import { Button, Modal, Spinner } from "@/components/ui";
import { apiClient } from "@/lib/axios";
import { updateRound } from "@/lib/api/rounds";
import { cn } from "@/lib/utils";

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface RubricCriteriaItem {
  criteria_name: string;
  score: number; // 1..10
  notes: string;
}

export type HiringDecision =
  | "strong_hire"
  | "hire"
  | "leaning_hire"
  | "leaning_no_hire"
  | "strong_no_hire";

export interface InterviewRubricModalProps {
  isOpen: boolean;
  onClose: () => void;
  roundId: number | null;
  roundNumber?: number;
  roundType?: string;
  candidateName: string;
  candidateEmail?: string;
  jobTitle?: string;
  onSaveSuccess?: (savedAvgScore: number, newStatus?: string) => void;
}

// ─── Presets ──────────────────────────────────────────────────────────────────
export const RUBRIC_PRESETS: Record<
  string,
  { label: string; icon: typeof Code2; description: string; criteria: string[] }
> = {
  tech: {
    label: "Kỹ thuật & Công nghệ",
    icon: Code2,
    description: "Đánh giá thuật toán, kiến trúc, mã nguồn và tư duy giải quyết vấn đề",
    criteria: [
      "Thuật toán & Giải quyết vấn đề (Problem Solving)",
      "Kiến thức Chuyên môn & Tech Stack cốt lõi",
      "Chất lượng Mã nguồn & Clean Architecture",
      "Tư duy Thiết kế Hệ thống (System Design & Scalability)",
      "Kỹ năng Debugging & Trình bày giải pháp",
    ],
  },
  hr: {
    label: "HR & Văn hóa Doanh nghiệp",
    icon: Users,
    description: "Đánh giá động lực, giao tiếp, khả năng thích ứng và văn hóa",
    criteria: [
      "Động lực ứng tuyển & Mục tiêu nghề nghiệp",
      "Kỹ năng giao tiếp & Lắng nghe tích cực",
      "Làm việc nhóm & Hợp tác đa phòng ban (Collaboration)",
      "Khả năng thích ứng & Quản trị áp lực (Adaptability)",
      "Độ tương thích với Giá trị cốt lõi (Culture Fit)",
    ],
  },
  final: {
    label: "Quản lý & Lãnh đạo",
    icon: Briefcase,
    description: "Đánh giá tư duy chiến lược, lãnh đạo và ra quyết định",
    criteria: [
      "Tư duy Chiến lược & Định hướng bài toán kinh doanh",
      "Năng lực Dẫn dắt & Đào tạo đội ngũ (Leadership/Mentorship)",
      "Khả năng Ra quyết định & Tinh thần chịu trách nhiệm (Ownership)",
      "Cam kết gắn bó & Kỳ vọng chế độ đãi ngộ",
    ],
  },
  general: {
    label: "Tiêu chuẩn Tổng quát",
    icon: Layers,
    description: "Bộ tiêu chí cân bằng cho các vòng đánh giá cơ bản",
    criteria: [
      "Kỹ năng chuyên môn",
      "Kỹ năng giao tiếp",
      "Kinh nghiệm thực tế",
      "Thái độ & Tinh thần học hỏi",
      "Độ phù hợp văn hóa",
    ],
  },
};

// ─── Rating Scale Level Helper ────────────────────────────────────────────────
export function getScoreLevel(score: number): {
  label: string;
  color: string;
  bg: string;
  border: string;
} {
  if (score >= 9) {
    return {
      label: "Xuất sắc (Outstanding)",
      color: "text-purple-700",
      bg: "bg-purple-50",
      border: "border-purple-200",
    };
  }
  if (score >= 7) {
    return {
      label: "Khá tốt (Exceeds Standards)",
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    };
  }
  if (score >= 5) {
    return {
      label: "Đạt yêu cầu (Meets Standards)",
      color: "text-blue-700",
      bg: "bg-blue-50",
      border: "border-blue-200",
    };
  }
  if (score >= 3) {
    return {
      label: "Cần cải thiện (Needs Improvement)",
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
    };
  }
  return {
    label: "Chưa đạt (Below Expectations)",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
  };
}

// ─── Decision Config ──────────────────────────────────────────────────────────
const DECISION_CONFIG: Record<
  HiringDecision,
  { label: string; icon: typeof ThumbsUp; color: string; border: string; bg: string; badge: "success" | "danger" | "warning" | "default" }
> = {
  strong_hire: {
    label: "Strong Hire (Rất khuyến khích)",
    icon: Award,
    color: "text-emerald-700",
    border: "border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-400/30",
    bg: "bg-emerald-50",
    badge: "success",
  },
  hire: {
    label: "Hire (Đồng ý tuyển)",
    icon: ThumbsUp,
    color: "text-teal-700",
    border: "border-teal-500 bg-teal-50/80 ring-2 ring-teal-400/30",
    bg: "bg-teal-50",
    badge: "success",
  },
  leaning_hire: {
    label: "Leaning Hire (Cân nhắc nhận)",
    icon: Scale,
    color: "text-blue-700",
    border: "border-blue-500 bg-blue-50/80 ring-2 ring-blue-400/30",
    bg: "bg-blue-50",
    badge: "default",
  },
  leaning_no_hire: {
    label: "Leaning No Hire (Cân nhắc loại)",
    icon: Scale,
    color: "text-amber-700",
    border: "border-amber-500 bg-amber-50/80 ring-2 ring-amber-400/30",
    bg: "bg-amber-50",
    badge: "warning",
  },
  strong_no_hire: {
    label: "Strong No Hire (Dứt khoát từ chối)",
    icon: ThumbsDown,
    color: "text-rose-700",
    border: "border-rose-500 bg-rose-50/80 ring-2 ring-rose-400/30",
    bg: "bg-rose-50",
    badge: "danger",
  },
};

export function InterviewRubricModal({
  isOpen,
  onClose,
  roundId,
  roundNumber,
  roundType = "tech",
  candidateName,
  candidateEmail,
  jobTitle,
  onSaveSuccess,
}: InterviewRubricModalProps) {
  // ── States ──────────────────────────────────────────────────────────────────
  const [selectedPreset, setSelectedPreset] = useState<string>(() => {
    if (roundType === "tech") return "tech";
    if (roundType === "hr") return "hr";
    if (roundType === "final") return "final";
    return "general";
  });

  const [criteriaList, setCriteriaList] = useState<RubricCriteriaItem[]>([]);
  const [decision, setDecision] = useState<HiringDecision | null>(null);
  const [overallFeedback, setOverallFeedback] = useState<string>("");
  const [autoUpdateStatus, setAutoUpdateStatus] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedMemo, setCopiedMemo] = useState<boolean>(false);

  // New criteria form state
  const [newCriteriaName, setNewCriteriaName] = useState<string>("");
  const [isAddingCriteria, setIsAddingCriteria] = useState<boolean>(false);

  // ── Fetch existing criteria on mount or roundId change ─────────────────────
  const loadExistingCriteria = useCallback(async () => {
    if (!roundId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { data } = await apiClient.get<
        Array<{ criteria_name: string; score: number; notes: string | null }>
      >(`/rounds/${roundId}/criteria`);

      if (data && data.length > 0) {
        setCriteriaList(
          data.map((c) => ({
            criteria_name: c.criteria_name,
            score: c.score,
            notes: c.notes || "",
          }))
        );
      } else {
        // Init with selected preset
        const preset = RUBRIC_PRESETS[selectedPreset] ?? RUBRIC_PRESETS.general;
        setCriteriaList(
          preset.criteria.map((name) => ({
            criteria_name: name,
            score: 7, // default good rating
            notes: "",
          }))
        );
      }
    } catch (err: any) {
      // Fallback preset
      const preset = RUBRIC_PRESETS[selectedPreset] ?? RUBRIC_PRESETS.general;
      setCriteriaList(
        preset.criteria.map((name) => ({
          criteria_name: name,
          score: 7,
          notes: "",
        }))
      );
    } finally {
      setIsLoading(false);
    }
  }, [roundId, selectedPreset]);

  useEffect(() => {
    if (isOpen && roundId) {
      loadExistingCriteria();
    }
  }, [isOpen, roundId, loadExistingCriteria]);

  // ── Preset change handler ───────────────────────────────────────────────────
  const handleApplyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    const preset = RUBRIC_PRESETS[presetKey];
    if (!preset) return;
    setCriteriaList(
      preset.criteria.map((name) => ({
        criteria_name: name,
        score: 7,
        notes: "",
      }))
    );
  };

  // ── Metric calculation ─────────────────────────────────────────────────────
  const averageScore = useMemo(() => {
    if (criteriaList.length === 0) return 0;
    const sum = criteriaList.reduce((acc, c) => acc + c.score, 0);
    return Number((sum / criteriaList.length).toFixed(1));
  }, [criteriaList]);

  const scorePercentage = useMemo(() => {
    return Math.round((averageScore / 10) * 100);
  }, [averageScore]);

  // Suggest decision based on score if user hasn't explicitly clicked one yet
  useEffect(() => {
    if (!decision) {
      if (averageScore >= 8.5) setDecision("strong_hire");
      else if (averageScore >= 7.0) setDecision("hire");
      else if (averageScore >= 5.5) setDecision("leaning_hire");
      else if (averageScore >= 4.0) setDecision("leaning_no_hire");
      else if (averageScore > 0) setDecision("strong_no_hire");
    }
  }, [averageScore, decision]);

  // ── Single criteria score update ───────────────────────────────────────────
  const updateCriteriaScore = (index: number, score: number) => {
    setCriteriaList((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], score };
      return next;
    });
  };

  const updateCriteriaNotes = (index: number, notes: string) => {
    setCriteriaList((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], notes };
      return next;
    });
  };

  const removeCriteria = (index: number) => {
    setCriteriaList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddCriteria = () => {
    if (!newCriteriaName.trim()) return;
    setCriteriaList((prev) => [
      ...prev,
      { criteria_name: newCriteriaName.trim(), score: 7, notes: "" },
    ]);
    setNewCriteriaName("");
    setIsAddingCriteria(false);
  };

  // ── AI Evaluation Memo Generation ───────────────────────────────────────────
  const handleGenerateAIMemo = async () => {
    setIsGeneratingAI(true);
    try {
      // Synthesize professional hiring evaluation memo based on rubric scores & notes
      const highScores = criteriaList.filter((c) => c.score >= 8);
      const lowScores = criteriaList.filter((c) => c.score <= 5);
      const decisionText = decision ? DECISION_CONFIG[decision].label : "Đánh giá chung";

      let memo = `### ĐÁNH GIÁ PHỎNG VẤN — HỘI ĐỒNG TUYỂN DỤNG\n`;
      memo += `• Ứng viên: ${candidateName}${jobTitle ? ` | Vị trí: ${jobTitle}` : ""}\n`;
      memo += `• Điểm số Rubric trung bình: ${averageScore}/10 (${scorePercentage}%)\n`;
      memo += `• Đề xuất tuyển dụng: ${decisionText}\n\n`;

      memo += `1. ĐIỂM MẠNH NỔI BẬT:\n`;
      if (highScores.length > 0) {
        highScores.forEach((h) => {
          memo += `  - ${h.criteria_name}: ${h.score}/10${h.notes ? ` (${h.notes})` : " — Nắm vững kiến thức, thể hiện năng lực vượt trội"}\n`;
        });
      } else {
        memo += `  - Kỹ năng nhìn chung đồng đều ở mức cơ bản, thái độ hợp tác tích cực.\n`;
      }

      memo += `\n2. ĐIỂM CẦN LƯU Ý / CẢI THIỆN:\n`;
      if (lowScores.length > 0) {
        lowScores.forEach((l) => {
          memo += `  - ${l.criteria_name}: ${l.score}/10${l.notes ? ` (${l.notes})` : " — Cần thêm kinh nghiệm thực chiến hoặc đào tạo thêm sau khi onboard"}\n`;
        });
      } else {
        memo += `  - Không có cờ đỏ (red flags) nghiêm trọng. Ứng viên đáp ứng tốt toàn bộ yêu cầu tiêu chuẩn.\n`;
      }

      memo += `\n3. KẾT LUẬN & ĐỀ XUẤT:\n`;
      if (decision === "strong_hire" || decision === "hire") {
        memo += `  Khuyến nghị hoàn tất thủ tục và xúc tiến vòng phỏng vấn tiếp theo / thương lượng Offer với mức đãi ngộ cạnh tranh.`;
      } else if (decision === "leaning_hire") {
        memo += `  Cân nhắc tiếp nhận nếu có mentor theo sát trong thời gian thử việc, hoặc so sánh với các ứng viên khác trong cùng pipeline.`;
      } else {
        memo += `  Chưa đạt tiêu chuẩn yêu cầu cho vị trí này tại thời điểm hiện tại. Đề xuất gửi thư từ chối lịch sự và lưu trữ hồ sơ cho tương lai.`;
      }

      setOverallFeedback(memo);
    } catch (err) {
      // ignore
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const copyMemoToClipboard = () => {
    if (!overallFeedback) return;
    navigator.clipboard.writeText(overallFeedback);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  // ── Save Criteria & Round Decision ──────────────────────────────────────────
  const handleSave = async () => {
    if (!roundId) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      // 1. Bulk replace criteria
      await apiClient.put(`/rounds/${roundId}/criteria`, {
        criteria: criteriaList.map((c) => ({
          criteria_name: c.criteria_name,
          score: c.score,
          notes: c.notes || undefined,
        })),
      });

      // 2. Determine target status if autoUpdateStatus is checked
      let targetStatus: string | undefined = undefined;
      if (autoUpdateStatus && decision) {
        if (decision === "strong_hire" || decision === "hire" || decision === "leaning_hire") {
          targetStatus = "passed";
        } else if (decision === "strong_no_hire" || decision === "leaning_no_hire") {
          targetStatus = "failed";
        }
      }

      // 3. Update round score, feedback, and status
      await updateRound(roundId, {
        score: Math.round(averageScore),
        feedback: overallFeedback || undefined,
        status: targetStatus,
      });

      if (onSaveSuccess) {
        onSaveSuccess(Math.round(averageScore), targetStatus);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.detail || "Không thể lưu bảng đánh giá. Vui lòng thử lại."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bảng Đánh Giá Phỏng Vấn (Interview Rubric)"
      size="2xl"
    >
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
        {/* Candidate & Round Header Card */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/40 border border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900">{candidateName}</h3>
              {roundNumber && (
                <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Vòng {roundNumber}: {roundType.toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {jobTitle ? `${jobTitle} • ` : ""}
              {candidateEmail || "Hội đồng tuyển dụng đánh giá trực tiếp"}
            </p>
          </div>

          {/* Average Score Ring Meter */}
          <div className="flex items-center gap-3 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Điểm Rubric</p>
              <p className="text-lg font-black text-slate-900 leading-none">
                {averageScore}
                <span className="text-xs font-normal text-slate-400">/10</span>
              </p>
            </div>
            <div className="h-10 w-10 rounded-full flex items-center justify-center bg-indigo-50 border-2 border-indigo-200">
              <span className="text-xs font-black text-indigo-700">{scorePercentage}%</span>
            </div>
          </div>
        </div>

        {/* Preset Switcher Pills */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Bộ tiêu chí đánh giá chuẩn (Rubric Presets):</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(RUBRIC_PRESETS).map(([key, p]) => {
              const Icon = p.icon;
              const isSelected = selectedPreset === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleApplyPreset(key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Criteria Evaluation List */}
        {isLoading ? (
          <div className="py-12 text-center">
            <Spinner size="md" className="mx-auto mb-2 text-indigo-600" />
            <p className="text-xs text-slate-500">Đang tải bảng tiêu chí...</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Chi tiết tiêu chí ({criteriaList.length})
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddingCriteria(true)}
                className="h-7 text-xs font-bold rounded-xl border-slate-200"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Thêm tiêu chí
              </Button>
            </div>

            {/* Inline Add Criteria input */}
            {isAddingCriteria && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-indigo-200 animate-in fade-in">
                <input
                  type="text"
                  placeholder="Nhập tên tiêu chí đánh giá mới..."
                  value={newCriteriaName}
                  onChange={(e) => setNewCriteriaName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCriteria()}
                  className="flex-1 h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <Button size="sm" onClick={handleAddCriteria} className="h-8 text-xs font-bold rounded-lg">
                  Thêm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddingCriteria(false)}
                  className="h-8 text-xs rounded-lg"
                >
                  Hủy
                </Button>
              </div>
            )}

            {/* Criteria Cards */}
            <div className="space-y-3">
              {criteriaList.map((item, idx) => {
                const level = getScoreLevel(item.score);
                return (
                  <motion.div
                    key={item.criteria_name + idx}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5 transition-all hover:border-slate-300"
                  >
                    {/* Header of card */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {item.criteria_name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Score Level Badge */}
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-black border",
                            level.bg,
                            level.color,
                            level.border
                          )}
                        >
                          {item.score}/10 • {level.label.split("(")[0]}
                        </span>
                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => removeCriteria(idx)}
                          className="text-slate-300 hover:text-rose-500 transition-colors cursor-pointer p-0.5"
                          title="Xóa tiêu chí này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Score Pills 1..10 */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] font-semibold text-slate-400 mr-1">Chấm nhanh:</span>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
                        const isChosen = item.score === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => updateCriteriaScore(idx, val)}
                            className={cn(
                              "h-6 w-6 rounded-lg text-xs font-bold transition-all cursor-pointer",
                              isChosen
                                ? "bg-indigo-600 text-white shadow-2xs scale-105"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>

                    {/* Notes for this specific criteria */}
                    <input
                      type="text"
                      placeholder="Ghi chú nhận xét cụ thể cho tiêu chí này (tùy chọn)..."
                      value={item.notes}
                      onChange={(e) => updateCriteriaNotes(idx, e.target.value)}
                      className="w-full h-7 rounded-lg border border-slate-100 bg-slate-50/70 px-2 text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-300 transition-all"
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hiring Committee Decision Block */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>Quyết định của Hội đồng Tuyển dụng:</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(Object.entries(DECISION_CONFIG) as [HiringDecision, typeof DECISION_CONFIG[HiringDecision]][]).map(
              ([key, cfg]) => {
                const isSelected = decision === key;
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDecision(key)}
                    className={cn(
                      "flex flex-col items-center text-center p-2.5 rounded-xl border transition-all cursor-pointer",
                      isSelected
                        ? cfg.border
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 mb-1", cfg.color)} />
                    <span className="text-[11px] font-bold text-slate-800 leading-tight">
                      {cfg.label.split("(")[0].trim()}
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5">
                      {cfg.label.includes("(") ? `(${cfg.label.split("(")[1]}` : ""}
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Overall Feedback Memo + AI Assistant */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>Biên bản nhận xét & Lý do quyết định:</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateAIMemo}
                disabled={isGeneratingAI || criteriaList.length === 0}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {isGeneratingAI ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
                ) : (
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                )}
                <span>AI Tổng hợp nhận xét</span>
              </button>
              {overallFeedback && (
                <button
                  type="button"
                  onClick={copyMemoToClipboard}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                  title="Sao chép biên bản"
                >
                  {copiedMemo ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMemo ? "Đã chép" : "Chép"}</span>
                </button>
              )}
            </div>
          </div>

          <textarea
            rows={5}
            placeholder="Nhập nhận xét tổng hợp cho buổi phỏng vấn hoặc bấm 'AI Tổng hợp nhận xét' để sinh tự động..."
            value={overallFeedback}
            onChange={(e) => setOverallFeedback(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 leading-relaxed placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all font-mono"
          />

          {/* Auto status transition option */}
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={autoUpdateStatus}
              onChange={(e) => setAutoUpdateStatus(e.target.checked)}
              className="rounded text-indigo-600 accent-indigo-600"
            />
            <span>
              Tự động cập nhật trạng thái vòng này sang{" "}
              <strong className="text-emerald-700">Đã đạt (Passed)</strong> nếu Hire hoặc{" "}
              <strong className="text-rose-700">Chưa đạt (Failed)</strong> nếu No Hire.
            </span>
          </label>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Modal Footer */}
      <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving} className="rounded-xl">
          Hủy bỏ
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving || criteriaList.length === 0}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs px-5"
        >
          {isSaving ? (
            <span className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Đang lưu...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Lưu Đánh Giá ({averageScore}/10)</span>
            </span>
          )}
        </Button>
      </div>
    </Modal>
  );
}
