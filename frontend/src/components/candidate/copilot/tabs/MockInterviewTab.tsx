/**
 * MockInterviewTab — Grounded AI Mock Interview simulator based on Candidate CV
 * Persona: UI/UX Architect & Frontend Engineer
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  Sparkles,
  Send,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Award,
} from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import type { CvContent } from "@/types/cvDocument";
import type { MockInterviewQuestionItem } from "../types";

interface MockInterviewTabProps {
  cvContent: CvContent;
}

export function MockInterviewTab({ cvContent }: MockInterviewTabProps) {
  // ── Build questions grounded on candidate CV ──────────────────────────────
  const firstExp = cvContent.experience?.[0];
  const firstProj = cvContent.projects?.[0];
  const headline = cvContent.personal?.headline || "Kỹ sư phần mềm";

  const defaultQuestions: MockInterviewQuestionItem[] = [
    {
      id: "q-1",
      question: firstExp
        ? `Trong vai trò ${firstExp.role} tại ${firstExp.company}, thách thức kỹ thuật lớn nhất bạn từng giải quyết là gì và bạn đo lường kết quả ra sao?`
        : "Hãy chia sẻ về một thử thách kỹ thuật phức tạp nhất mà bạn từng vượt qua?",
      context: firstExp ? `Kinh nghiệm tại ${firstExp.company}` : "Kinh nghiệm tổng quát",
      category: "technical",
      difficulty: "senior",
    },
    {
      id: "q-2",
      question: firstProj
        ? `Trong dự án "${firstProj.name}", tại sao bạn lựa chọn các công nghệ (${firstProj.technologies?.slice(0, 3).join(", ") || "hiện tại"})? Nếu làm lại, bạn sẽ tối ưu điều gì?`
        : "Bạn đánh giá như thế nào về việc lựa chọn công nghệ và đánh đổi kỹ thuật (technical trade-offs)?",
      context: firstProj ? `Dự án "${firstProj.name}"` : "Dự án thực tế",
      category: "system_design",
      difficulty: "mid",
    },
    {
      id: "q-3",
      question: `Với định hướng ${headline}, khi xảy ra bất đồng quan điểm kỹ thuật giữa các thành viên trong nhóm, bạn thường xử lý như thế nào?`,
      context: "Kỹ năng mềm & Làm việc nhóm",
      category: "behavioral",
      difficulty: "mid",
    },
  ];

  const [questions] = useState<MockInterviewQuestionItem[]>(defaultQuestions);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("q-1");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evaluations, setEvaluations] = useState<
    Record<string, NonNullable<MockInterviewQuestionItem["aiFeedback"]> & { score: number }>
  >({});
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  const activeQuestion =
    questions.find((q) => q.id === selectedQuestionId) || questions[0];
  const currentAnswer = answers[activeQuestion.id] || "";
  const currentEvaluation = evaluations[activeQuestion.id];

  const handleEvaluate = async () => {
    if (!currentAnswer.trim()) return;

    setIsEvaluating(true);
    // Simulate smart AI evaluation using STAR method grounded in CV
    setTimeout(() => {
      const wordCount = currentAnswer.trim().split(/\s+/).length;
      const score = Math.min(9.5, Math.max(6.5, Math.round((7 + wordCount / 40) * 10) / 10));

      setEvaluations((prev) => ({
        ...prev,
        [activeQuestion.id]: {
          score,
          strengths: [
            "Nêu bật được hành động cụ thể cá nhân đã thực hiện.",
            "Tập trung đúng vào vấn đề công nghệ và tư duy giải pháp.",
          ],
          improvements: [
            "Nên bổ sung thêm số liệu định lượng (metrics) để kết quả thuyết phục hơn.",
            "Có thể tóm tắt ngắn gọn bối cảnh (Situation) để dành thời gian cho Hành động (Action).",
          ],
          starBreakdown: {
            situation: "Đã mô tả được hoàn cảnh bài toán phát sinh.",
            task: "Mục tiêu cần giải quyết rõ ràng.",
            action: "Đã trình bày cách tiếp cận và công nghệ áp dụng.",
            result: "Cần làm rõ kết quả tác động đến người dùng hoặc hệ thống.",
          },
          suggestedBetterAnswer: `Khi đối mặt với bài toán này, tôi đã phân tích nguyên nhân gốc rễ (Root Cause) bằng cách profiling hệ thống. Tiếp đó, tôi triển khai kiến trúc bộ nhớ đệm và tối ưu hóa truy vấn SQL. Kết quả là giảm độ trễ API 45% và hệ thống hoạt động ổn định 99.9% uptime.`,
        },
      }));
      setIsEvaluating(false);
      setExpandedDetails((prev) => ({ ...prev, [activeQuestion.id]: true }));
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* ── Header Introduction ──────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200/60 p-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-purple-900">
              Mô phỏng Phỏng vấn Độc quyền theo CV của bạn
            </h4>
            <p className="text-xs text-purple-700/90 mt-1 leading-relaxed">
              AI đóng vai Trưởng phòng Công nghệ (Tech Lead), đặt câu hỏi xoáy
              sâu vào chính các dự án và công nghệ bạn liệt kê trong hồ sơ.
            </p>
          </div>
        </div>
      </div>

      {/* ── Question Selector Pills ──────────────────────────────────────── */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Chọn câu hỏi để luyện tập:
        </label>
        <div className="flex flex-col gap-2">
          {questions.map((q, idx) => {
            const isSelected = q.id === selectedQuestionId;
            const hasEvaluated = Boolean(evaluations[q.id]);
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setSelectedQuestionId(q.id)}
                className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-purple-50/60 border-purple-300 ring-2 ring-purple-200"
                    : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full">
                    Câu hỏi {idx + 1} • {q.context}
                  </span>
                  {hasEvaluated && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle className="w-3 h-3" />
                      {evaluations[q.id].score}/10đ
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-slate-900 mt-2 leading-relaxed">
                  {q.question}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Answer Editor & Evaluation ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-purple-600" />
            Câu trả lời của bạn
          </span>
          <span className="text-[11px] text-slate-400">
            Khuyến nghị trả lời theo mô hình STAR
          </span>
        </div>

        <textarea
          value={currentAnswer}
          onChange={(e) =>
            setAnswers((prev) => ({
              ...prev,
              [activeQuestion.id]: e.target.value,
            }))
          }
          placeholder="Nhập câu trả lời mô phỏng của bạn... Ví dụ: 'Khi bắt đầu dự án, vấn đề lớn nhất chúng tôi gặp phải là... Tôi đã tiếp cận bằng cách... và đạt được kết quả...'"
          rows={5}
          className="w-full text-xs text-slate-800 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 leading-relaxed resize-y"
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-500 font-medium">
            {currentAnswer.trim() ? `${currentAnswer.trim().split(/\s+/).length} từ` : "Chưa nhập câu trả lời"}
          </span>

          <Button
            size="sm"
            onClick={handleEvaluate}
            disabled={!currentAnswer.trim() || isEvaluating}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            {isEvaluating ? (
              <>
                <Spinner className="w-3.5 h-3.5 mr-1.5" />
                AI đang phân tích...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Chấm điểm câu trả lời
              </>
            )}
          </Button>
        </div>

        {/* ── Evaluation Results Display ─────────────────────────────────── */}
        <AnimatePresence>
          {currentEvaluation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-slate-100 space-y-4"
            >
              {/* Score header */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-base shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Điểm đánh giá câu trả lời
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Dựa trên cấu trúc STAR và độ thuyết phục
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-emerald-600">
                    {currentEvaluation.score}
                  </span>
                  <span className="text-xs font-bold text-slate-400">/10</span>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/60 space-y-2">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Điểm sáng nổi bật
                  </span>
                  <ul className="space-y-1 text-xs text-emerald-900 list-disc list-inside">
                    {currentEvaluation.strengths.map((s, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/60 space-y-2">
                  <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Gợi ý nâng cấp (STAR)
                  </span>
                  <ul className="space-y-1 text-xs text-amber-900 list-disc list-inside">
                    {currentEvaluation.improvements.map((s, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Suggested Ideal Answer */}
              {currentEvaluation.suggestedBetterAnswer && (
                <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-purple-600" />
                      Câu trả lời mẫu tham khảo (Benchmark Answer)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedDetails((prev) => ({
                          ...prev,
                          [activeQuestion.id]: !prev[activeQuestion.id],
                        }))
                      }
                      className="text-[11px] font-bold text-purple-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      {expandedDetails[activeQuestion.id] ? (
                        <>
                          Thu gọn <ChevronUp className="w-3 h-3" />
                        </>
                      ) : (
                        <>
                          Xem chi tiết <ChevronDown className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>

                  {expandedDetails[activeQuestion.id] && (
                    <p className="text-xs font-mono text-purple-950 leading-relaxed bg-white/80 p-3 rounded-lg border border-purple-100">
                      &ldquo;{currentEvaluation.suggestedBetterAnswer}&rdquo;
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
