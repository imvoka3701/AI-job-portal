import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Save,
  Sparkles,
  Keyboard,
  Briefcase,
  Copy,
  Check,
  LayoutGrid,
  Clock,
  Zap,
  ExternalLink,
  ChevronRight,
  Flame,
  Award,
  BookOpen,
  Compass,
} from "lucide-react";
import {
  AIDisclaimerBanner,
  Badge,
  Button,
  Card,
  CardContent,
  ErrorState,
  PageSpinner,
} from "@/components/ui";
import { Header } from "@/pages/jobs/components/Header";
import { getApiErrorMessage } from "@/lib/axios";
import {
  getAssessmentQuestions,
  saveAssessmentAttempt,
  scorePublicAssessment,
  type AssessmentResult,
  type AssessmentType,
} from "@/lib/api/assessments";
import { useUser } from "@/stores/authStore";

interface PastelBubbleOption {
  value: number;
  label: string;
  subLabel?: string;
  sizeClass: string;
  baseColor: string;
  borderColor: string;
  textColor: string;
  selectedBg: string;
  selectedText: string;
  selectedRing: string;
  hoverBorder: string;
  glowShadow: string;
}

const PASTEL_BUBBLES: PastelBubbleOption[] = [
  {
    value: 1,
    label: "Rất không đúng",
    subLabel: "Hoàn toàn sai",
    sizeClass: "w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32",
    baseColor: "bg-[#FFF1F2]/90",
    borderColor: "border-[#FECDD3]",
    textColor: "text-[#9F1239]",
    selectedBg: "bg-gradient-to-br from-[#FB7185] to-[#E11D48]",
    selectedText: "text-white font-bold",
    selectedRing: "ring-[#FDA4AF] shadow-[0_10px_25px_rgba(244,63,94,0.35)]",
    hoverBorder: "hover:border-[#FB7185] hover:bg-[#FFE4E6]",
    glowShadow: "hover:shadow-[0_8px_20px_rgba(244,63,94,0.18)]",
  },
  {
    value: 2,
    label: "Không đúng",
    subLabel: "Hiếm khi",
    sizeClass: "w-20 h-20 sm:w-24 sm:h-24 lg:w-26 lg:h-26",
    baseColor: "bg-[#FFFBEB]/90",
    borderColor: "border-[#FDE68A]",
    textColor: "text-[#92400E]",
    selectedBg: "bg-gradient-to-br from-[#FBBF24] to-[#D97706]",
    selectedText: "text-white font-bold",
    selectedRing: "ring-[#FCD34D] shadow-[0_10px_25px_rgba(245,158,11,0.35)]",
    hoverBorder: "hover:border-[#FBBF24] hover:bg-[#FEF3C7]",
    glowShadow: "hover:shadow-[0_8px_20px_rgba(245,158,11,0.18)]",
  },
  {
    value: 3,
    label: "Trung lập",
    subLabel: "Phân vân",
    sizeClass: "w-16 h-16 sm:w-20 sm:h-20 lg:w-22 lg:h-22",
    baseColor: "bg-[#F8FAFC]/90",
    borderColor: "border-[#E2E8F0]",
    textColor: "text-[#475569]",
    selectedBg: "bg-gradient-to-br from-[#64748B] to-[#475569]",
    selectedText: "text-white font-bold",
    selectedRing: "ring-[#CBD5E1] shadow-[0_10px_25px_rgba(100,116,139,0.3)]",
    hoverBorder: "hover:border-[#94A3B8] hover:bg-[#F1F5F9]",
    glowShadow: "hover:shadow-[0_8px_20px_rgba(100,116,139,0.15)]",
  },
  {
    value: 4,
    label: "Khá đúng",
    subLabel: "Thường xuyên",
    sizeClass: "w-20 h-20 sm:w-24 sm:h-24 lg:w-26 lg:h-26",
    baseColor: "bg-[#F0FDF4]/90",
    borderColor: "border-[#BBF7D0]",
    textColor: "text-[#166534]",
    selectedBg: "bg-gradient-to-br from-[#4ADE80] to-[#16A34A]",
    selectedText: "text-white font-bold",
    selectedRing: "ring-[#86EFAC] shadow-[0_10px_25px_rgba(34,197,94,0.35)]",
    hoverBorder: "hover:border-[#4ADE80] hover:bg-[#DCFCE7]",
    glowShadow: "hover:shadow-[0_8px_20px_rgba(34,197,94,0.18)]",
  },
  {
    value: 5,
    label: "Rất chính xác",
    subLabel: "Luôn luôn đúng",
    sizeClass: "w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32",
    baseColor: "bg-[#ECFDF5]/90",
    borderColor: "border-[#A7F3D0]",
    textColor: "text-[#065F46]",
    selectedBg: "bg-gradient-to-br from-[#10B981] to-[#059669]",
    selectedText: "text-white font-bold",
    selectedRing: "ring-[#6EE7B7] shadow-[0_12px_28px_rgba(16,185,129,0.4)]",
    hoverBorder: "hover:border-[#10B981] hover:bg-[#D1FAE5]",
    glowShadow: "hover:shadow-[0_8px_20px_rgba(16,185,129,0.22)]",
  },
];

export function AssessmentPage() {
  const { type: rawType } = useParams<{ type: string }>();
  const type: AssessmentType = rawType === "mi" ? "mi" : "mbti";
  const user = useUser();
  const storageKey = `assessment-progress-${type}`;

  const [questionnaire, setQuestionnaire] = useState<Awaited<ReturnType<typeof getAssessmentQuestions>> | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [attemptSaved, setAttemptSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQuestionMap, setShowQuestionMap] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAssessmentQuestions(type);
      setQuestionnaire(data);
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const progress = JSON.parse(saved) as { answers?: Record<string, number>; currentIndex?: number };
          setAnswers(progress.answers ?? {});
          setCurrentIndex(Math.min(progress.currentIndex ?? 0, data.questions.length - 1));
        } catch {
          localStorage.removeItem(storageKey);
        }
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [type]);

  useEffect(() => {
    if (questionnaire && !result) {
      localStorage.setItem(storageKey, JSON.stringify({ answers, currentIndex }));
    }
  }, [answers, currentIndex, questionnaire, result, storageKey]);

  const question = questionnaire?.questions[currentIndex];
  const totalQuestions = questionnaire?.questions.length ?? 0;
  const answeredCount = Object.keys(answers).length;
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const canNext = Boolean(question && answers[question.id]);
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const estimatedMinutesLeft = Math.max(1, Math.ceil((totalQuestions - answeredCount) * 0.1));

  const title = type === "mbti" ? "Trắc nghiệm Tính cách MBTI" : "Trắc nghiệm Trí thông minh Đa dạng (MI)";

  const handleNext = useCallback(() => {
    if (questionnaire && currentIndex < questionnaire.questions.length - 1) {
      setDirection("forward");
      setCurrentIndex((idx) => idx + 1);
    }
  }, [currentIndex, questionnaire]);

  const handlePrev = useCallback(() => {
    setDirection("backward");
    setCurrentIndex((idx) => Math.max(idx - 1, 0));
  }, []);

  const handleSelectScore = useCallback((score: number) => {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: score }));

    if (autoAdvance && currentIndex < totalQuestions - 1) {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(() => {
        handleNext();
      }, 220);
    }
  }, [question, autoAdvance, currentIndex, totalQuestions, handleNext]);

  const jumpToQuestion = (idx: number) => {
    setDirection(idx > currentIndex ? "forward" : "backward");
    setCurrentIndex(idx);
    setShowQuestionMap(false);
  };

  const submit = async () => {
    if (!questionnaire || Object.keys(answers).length !== questionnaire.questions.length) return;
    setSubmitting(true);
    setError(null);
    try {
      const data =
        user?.role === "candidate"
          ? await saveAssessmentAttempt(type, questionnaire.version, answers)
          : { result: await scorePublicAssessment(type, questionnaire.version, answers) };
      setResult(data.result);
      setAttemptSaved(user?.role === "candidate");
      localStorage.removeItem(storageKey);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  // Keyboard navigation: 1-5 keys, Arrow keys, Enter key
  useEffect(() => {
    if (result || !questionnaire) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key >= "1" && e.key <= "5") {
        const score = parseInt(e.key, 10);
        handleSelectScore(score);
      } else if (e.key === "ArrowRight") {
        if (canNext) handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "Enter") {
        if (isLastQuestion && Object.keys(answers).length === totalQuestions) {
          void submit();
        } else if (canNext) {
          handleNext();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [result, questionnaire, canNext, isLastQuestion, totalQuestions, answers, handleSelectScore, handleNext, handlePrev]);

  const reset = () => {
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
    setAttemptSaved(false);
    localStorage.removeItem(storageKey);
    setError(null);
  };

  const handleCopyResult = () => {
    if (!result) return;
    const textToCopy = `✨ Kết quả ${title} của tôi:
• Nhóm tính cách: ${result.code} - ${result.title}
• Tóm tắt: ${result.summary}
• Điểm mạnh: ${result.strengths.join(", ")}
• Đánh giá chi tiết tại: ${window.location.href}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  const dimensions = useMemo(() => (result ? Object.entries(result.dimensions) : []), [result]);

  if (loading) return <PageSpinner message="Đang nạp bộ câu hỏi đánh giá chuẩn hóa..." />;
  if (error && !questionnaire) {
    return (
      <div className="min-h-screen bg-page-bg">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-12">
          <Card className="p-8 border-gray-200">
            <ErrorState title="Không tải được bài test" message={error} onRetry={() => void load()} />
          </Card>
        </main>
      </div>
    );
  }
  if (!questionnaire) return null;

  return (
    <div className="relative min-h-screen bg-[#F1F5F9] font-sans text-gray-900 selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      {/* ========================================================================= */}
      {/*           AURORA MESH & VIBRANT DOT GRID AMBIENT BACKGROUND               */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Visible Matrix Dot Grid Pattern */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(#64748B 1.5px, transparent 1.5px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Ambient Glowing Aurora Orbs - High Vibrancy & Smooth Animation */}
        {/* Orb 1: Lush Emerald / Mint (Top Left) */}
        <motion.div
          className="absolute -top-32 -left-32 w-[650px] lg:w-[750px] h-[650px] lg:h-[750px] rounded-full bg-gradient-to-tr from-[#10B981]/30 via-[#2DD4BF]/25 to-transparent blur-[90px]"
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -40, 30, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Orb 2: Lavender Violet / Indigo (Top Right) */}
        <motion.div
          className="absolute top-0 -right-32 w-[650px] lg:w-[750px] h-[650px] lg:h-[750px] rounded-full bg-gradient-to-bl from-[#8B5CF6]/30 via-[#6366F1]/25 to-transparent blur-[95px]"
          animate={{
            x: [0, -45, 35, 0],
            y: [0, 40, -35, 0],
            scale: [1, 0.92, 1.08, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Orb 3: Coral Rose / Amber Peach (Bottom Left / Center) */}
        <motion.div
          className="absolute -bottom-40 left-1/5 w-[600px] lg:w-[700px] h-[600px] lg:h-[700px] rounded-full bg-gradient-to-r from-[#F43F5E]/25 via-[#F59E0B]/20 to-transparent blur-[90px]"
          animate={{
            x: [0, 35, -35, 0],
            y: [0, -35, 35, 0],
            scale: [1, 1.12, 0.94, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Orb 4: Sky Cyan (Center Floating) */}
        <motion.div
          className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#06B6D4]/20 via-[#3B82F6]/15 to-transparent blur-[80px]"
          animate={{
            x: [0, -25, 25, 0],
            y: [0, 30, -20, 0],
            scale: [1, 1.05, 0.95, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10">
        <Header />
      </div>

      <main className={`mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-5 relative z-10 ${
        result ? "max-w-7xl xl:max-w-[1440px]" : "max-w-4xl"
      }`}>
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/tools"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 hover:text-[#00B86B] bg-white/80 backdrop-blur-xs px-3.5 py-2 rounded-full border border-gray-200/70 shadow-2xs transition-all hover:shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại danh mục Công cụ
          </Link>

          {!result ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAutoAdvance(!autoAdvance)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-xs transition-colors cursor-pointer ${
                  autoAdvance
                    ? "bg-emerald-50/90 text-[#00874E] border-emerald-200 shadow-2xs"
                    : "bg-white/80 text-gray-600 border-gray-200 shadow-2xs"
                }`}
                title="Tự động chuyển sang câu tiếp theo khi chọn đáp án"
              >
                <Zap className={`w-3 h-3 ${autoAdvance ? "text-[#00B86B]" : "text-gray-400"}`} />
                Tự động chuyển câu: {autoAdvance ? "Bật" : "Tắt"}
              </button>

              <button
                type="button"
                onClick={() => setShowQuestionMap(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/85 backdrop-blur-xs border border-gray-200 text-gray-700 hover:border-[#00B86B] hover:text-[#00B86B] shadow-2xs transition-all cursor-pointer"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Bản đồ câu hỏi ({answeredCount}/{totalQuestions})
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Button
                onClick={reset}
                variant="outline"
                size="sm"
                className="bg-white/90 backdrop-blur-xs border-gray-200 text-xs sm:text-sm font-semibold shadow-2xs px-3.5 py-2"
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Làm lại bài test
              </Button>
              {attemptSaved && (
                <Link to="/tools/assessments/history">
                  <Button variant="ghost" size="sm" className="text-xs sm:text-sm font-semibold">
                    Lịch sử làm bài
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        {!result ? (
          /* ========================================================================= */
          /*                       ACTIVE TEST FLOW SCREEN                             */
          /* ========================================================================= */
          <div className="space-y-6">
            {/* Top Meta Capsule & Segmented Progress (Frosted Glass) */}
            <div className="bg-white/85 backdrop-blur-md rounded-3xl border border-white/80 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#ECFDF5] text-[#00995C] border border-emerald-200 uppercase tracking-wider">
                      {type === "mbti" ? "MBTI Test" : "MI Assessment"}
                    </span>
                    <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" /> Dự kiến {estimatedMinutesLeft} phút còn lại
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                    {title}
                  </h1>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#00B86B]">{progress}%</span>
                    <span className="block text-[11px] text-gray-400 font-medium">
                      Đã làm {answeredCount}/{totalQuestions} câu
                    </span>
                  </div>
                </div>
              </div>

              {/* Smooth Animated Progress Bar */}
              <div className="w-full bg-gray-100/80 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-teal-400 via-[#00B86B] to-emerald-500 h-2.5 rounded-full shadow-xs"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* IMMERSIVE QUESTION CARD (Frosted Glassmorphism) */}
            <Card className="border-white/90 shadow-[0_20px_50px_rgba(0,0,0,0.06)] bg-white/90 backdrop-blur-lg rounded-3xl overflow-hidden relative">
              {/* Subtle soothing pastel top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#FECDD3] via-[#FDE68A] to-[#A7F3D0]" />

              <CardContent className="p-6 sm:p-10 space-y-8">
                {/* Question Text with Horizontal Transition */}
                <div className="min-h-[105px] flex flex-col justify-center text-center sm:text-left">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2 flex items-center justify-center sm:justify-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Câu hỏi {currentIndex + 1} trên {totalQuestions}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={question?.id}
                      initial={{ opacity: 0, x: direction === "forward" ? 25 : -25 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: direction === "forward" ? -25 : 25 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                    >
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 leading-snug">
                        {question?.text}
                      </h2>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* SOOTHING PASTEL BUBBLE LIKERT SCALE (Text inside bubbles + Floating Animation) */}
                <div className="pt-2 pb-4 space-y-5">
                  {/* Track Axis Header */}
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider px-3">
                    <span className="text-rose-600 flex items-center gap-1 font-extrabold">
                      ← Không đồng ý
                    </span>
                    <span className="text-gray-400 hidden sm:inline font-normal">
                      Hãy chọn cảm nhận tự nhiên và chân thật nhất của bạn
                    </span>
                    <span className="text-emerald-700 flex items-center gap-1 font-extrabold">
                      Đồng ý →
                    </span>
                  </div>

                  {/* Bubble Track Container (Glassmorphic) */}
                  <div className="relative py-8 px-4 sm:px-6 bg-gradient-to-b from-white/80 to-[#F8FAFC]/80 backdrop-blur-sm rounded-3xl border border-gray-200/70 flex items-center justify-between gap-2 sm:gap-4 overflow-x-auto min-h-[170px] shadow-inner">
                    {/* Connecting dashed center axis line */}
                    <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-0.5 border-t-2 border-dashed border-gray-300/80 -z-0 pointer-events-none" />

                    {PASTEL_BUBBLES.map((opt, i) => {
                      const isSelected = question && answers[question.id] === opt.value;
                      return (
                        <div key={opt.value} className="flex flex-col items-center justify-center z-10 shrink-0">
                          <motion.button
                            type="button"
                            onClick={() => handleSelectScore(opt.value)}
                            className={`rounded-full border-2 flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer select-none ${opt.sizeClass} ${
                              isSelected
                                ? `${opt.selectedBg} ${opt.selectedText} ${opt.selectedRing} ring-4 scale-105 border-transparent`
                                : `${opt.baseColor} ${opt.borderColor} ${opt.textColor} ${opt.hoverBorder} ${opt.glowShadow} shadow-2xs`
                            }`}
                            initial={{ opacity: 0, scale: 0.8, y: 15 }}
                            animate={{
                              opacity: 1,
                              scale: isSelected ? 1.08 : 1,
                              y: isSelected ? 0 : [-3, 3, -3],
                            }}
                            transition={{
                              y: {
                                duration: 3.2 + i * 0.4,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: i * 0.15,
                              },
                              opacity: { duration: 0.3, delay: i * 0.05 },
                              scale: { type: "spring", stiffness: 300, damping: 20 },
                            }}
                            whileHover={{ scale: isSelected ? 1.12 : 1.09, y: -4 }}
                            whileTap={{ scale: 0.94 }}
                            title={opt.label}
                          >
                            <span className="text-[11px] sm:text-xs lg:text-[13px] leading-tight font-extrabold px-1">
                              {opt.label}
                            </span>
                            {opt.subLabel && (
                              <span className={`text-[9px] sm:text-[10px] opacity-75 mt-0.5 hidden sm:block ${isSelected ? "text-white/90" : ""}`}>
                                {opt.subLabel}
                              </span>
                            )}
                          </motion.button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Question Card Bottom Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Keyboard className="w-3.5 h-3.5 text-gray-400" />
                    <span>Bấm phím <strong>1</strong> đến <strong>5</strong> để chọn nhanh</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrev}
                      disabled={currentIndex === 0}
                      leftIcon={<ArrowLeft className="h-4 w-4" />}
                    >
                      Câu trước
                    </Button>

                    {isLastQuestion ? (
                      <Button
                        onClick={() => void submit()}
                        isLoading={submitting}
                        disabled={!canNext || answeredCount !== totalQuestions}
                        className="bg-[#00B86B] hover:bg-[#00995C] text-white px-6 font-bold shadow-sm"
                        leftIcon={<Award className="h-4 w-4" />}
                      >
                        Hoàn thành & Xem kết quả
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNext}
                        disabled={!canNext}
                        variant="primary"
                        className="bg-gray-900 hover:bg-gray-800 text-white px-5 font-bold"
                        rightIcon={<ArrowRight className="h-4 w-4" />}
                      >
                        Câu tiếp theo
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <AIDisclaimerBanner />
          </div>
        ) : (
          /* ========================================================================= */
          /*            TRENDING BENTO GRID DASHBOARD (ZERO-SCROLL WIDESCREEN)         */
          /* ========================================================================= */
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* --------------------------------------------------------------------- */}
            {/* CỘT TRÁI (HERO PROFILE & ACTIONS) - 5 COLS                            */}
            {/* --------------------------------------------------------------------- */}
            <div className="lg:col-span-5 flex flex-col justify-between p-7 sm:p-9 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-[0_20px_50px_rgba(0,0,0,0.06)] relative overflow-hidden space-y-6">
              {/* Radiant background glow */}
              <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-emerald-300/30 blur-3xl -z-0 pointer-events-none" />

              <div className="space-y-5 relative z-10">
                {/* Header Tag & Status */}
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ECFDF5] text-[#00874E] text-xs sm:text-sm font-bold border border-emerald-200 shadow-2xs">
                    <Sparkles className="w-4 h-4 text-[#00B86B]" />
                    Hồ sơ tính cách hoàn tất
                  </div>

                  <span className="text-xs sm:text-sm text-gray-500 font-semibold flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-emerald-600" /> Chuẩn quốc tế
                  </span>
                </div>

                {/* Main Archetype Badge & Title */}
                <div className="flex items-center gap-5 pt-2">
                  <motion.div
                    className="w-22 h-22 sm:w-26 sm:h-26 rounded-3xl bg-gradient-to-tr from-[#00B86B] via-[#059669] to-teal-400 text-white flex flex-col items-center justify-center shadow-xl shadow-emerald-500/30 border-4 border-white shrink-0"
                    initial={{ scale: 0.85 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  >
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-widest leading-none">{result.code}</span>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-100 mt-1">Profile</span>
                  </motion.div>

                  <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                      {result.title}
                    </h1>
                    <p className="text-xs sm:text-sm text-[#00874E] font-extrabold uppercase tracking-wider">
                      Nhóm {result.code} Archetype
                    </p>
                  </div>
                </div>

                {/* Summary Quote Box */}
                <div className="p-5 rounded-2xl bg-gray-50/90 border border-gray-200/80 shadow-2xs">
                  <p className="text-sm sm:text-base text-gray-800 leading-relaxed font-normal">
                    {result.summary}
                  </p>
                </div>
              </div>

              {/* Action Cluster in Left Column */}
              <div className="space-y-3 pt-4 relative z-10 border-t border-gray-100">
                <Link to="/jobs" className="w-full block">
                  <Button
                    size="md"
                    className="w-full bg-[#00B86B] hover:bg-[#00995C] text-white font-bold py-3.5 text-sm sm:text-base rounded-2xl shadow-md shadow-emerald-500/20"
                    rightIcon={<ExternalLink className="w-4 h-4" />}
                  >
                    Khám phá việc làm phù hợp với {result.code}
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  size="md"
                  onClick={handleCopyResult}
                  className="w-full bg-white hover:bg-gray-50 text-gray-800 py-3 text-xs sm:text-sm font-bold border border-gray-200 rounded-2xl shadow-2xs"
                  leftIcon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                >
                  {copied ? "Đã sao chép báo cáo kết quả!" : "Sao chép báo cáo kết quả (1-Click)"}
                </Button>

                {!attemptSaved && (
                  <div className="pt-1 flex items-center justify-between text-xs sm:text-sm text-blue-900 bg-blue-50/90 border border-blue-200 p-3 rounded-2xl">
                    <span className="flex items-center gap-2 truncate">
                      <Save className="w-4 h-4 text-blue-600 shrink-0" />
                      Lưu kết quả này vào hồ sơ?
                    </span>
                    <Link to="/login" className="font-bold text-blue-700 hover:underline shrink-0 ml-2">
                      Đăng nhập ngay
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* CỘT PHẢI (BENTO 2X2 GRID OF INSIGHTS) - 7 COLS                        */}
            {/* --------------------------------------------------------------------- */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* BENTO BOX 1: 4 DIMENSIONS SPECTRUM */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-[0_15px_35px_rgba(0,0,0,0.05)] flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-all">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-gray-800">
                    <Compass className="w-4 h-4 text-[#00B86B]" />
                    Phân bổ tỷ lệ các chiều
                  </div>
                  <Badge variant="primary" size="sm" className="text-xs font-bold py-0.5 px-2.5">
                    {dimensions.length} Chiều
                  </Badge>
                </div>

                <div className="space-y-3.5">
                  {dimensions.map(([label, value]) => {
                    const left = value;
                    const right = 100 - value;
                    return (
                      <div key={label} className="space-y-1.5 text-xs sm:text-sm">
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-[#00874E] text-xs sm:text-sm">{label}: {left}%</span>
                          <span className="text-gray-400 text-xs">{right}%</span>
                        </div>
                        <div className="h-3 rounded-full bg-gray-100 overflow-hidden flex">
                          <motion.div
                            className="h-full bg-gradient-to-r from-teal-400 to-[#00B86B]"
                            initial={{ width: 0 }}
                            animate={{ width: `${left}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                          <div className="h-full bg-gray-200/80" style={{ width: `${right}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BENTO BOX 2: CORE STRENGTHS */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-[0_15px_35px_rgba(0,0,0,0.05)] flex flex-col justify-between space-y-4 hover:border-amber-300 transition-all">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-gray-800 border-b border-gray-100 pb-3">
                  <Flame className="w-4 h-4 text-amber-500" />
                  Điểm mạnh cốt lõi
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-gray-700">
                  {result.strengths.slice(0, 3).map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-snug font-medium text-gray-800">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* BENTO BOX 3: WORK ENVIRONMENTS */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-[0_15px_35px_rgba(0,0,0,0.05)] flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-all">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-gray-800 border-b border-gray-100 pb-3">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  Môi trường phù hợp
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-gray-700">
                  {result.environments.slice(0, 3).map((env, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span className="leading-snug font-medium text-gray-800">{env}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* BENTO BOX 4: CAREER SUGGESTIONS */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-[0_15px_35px_rgba(0,0,0,0.05)] flex flex-col justify-between space-y-4 hover:border-teal-300 transition-all">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-gray-800">
                    <BookOpen className="w-4 h-4 text-[#00B86B]" />
                    Vị trí gợi ý cho bạn
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {result.career_ctas.slice(0, 4).map((career) => (
                    <Link
                      key={career}
                      to={`/jobs?keyword=${encodeURIComponent(career)}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-[#ECFDF5] border border-gray-200/90 hover:border-emerald-300 text-xs sm:text-sm font-bold text-gray-800 hover:text-[#00874E] transition-all cursor-pointer shadow-2xs"
                    >
                      <span>{career}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* QUESTION MAP MODAL */}
        {showQuestionMap && questionnaire && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/80 shadow-2xl max-w-xl w-full p-6 space-y-5"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-bold text-base text-gray-900">Bản đồ câu hỏi ({title})</h3>
                  <p className="text-xs text-gray-500">Đã trả lời {answeredCount}/{totalQuestions} câu</p>
                </div>
                <button
                  onClick={() => setShowQuestionMap(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 max-h-[340px] overflow-y-auto p-1">
                {questionnaire.questions.map((q, idx) => {
                  const isAnswered = Boolean(answers[q.id]);
                  const isCurrent = idx === currentIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => jumpToQuestion(idx)}
                      className={`h-11 rounded-xl font-bold text-xs flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-gray-900 text-white ring-2 ring-[#00B86B]"
                          : isAnswered
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      <span>{idx + 1}</span>
                      {isAnswered && <span className="text-[9px] text-[#00874E]">✓ ({answers[q.id]})</span>}
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Đã trả lời
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" /> Chưa trả lời
                  </span>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowQuestionMap(false)}>
                  Đóng
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
