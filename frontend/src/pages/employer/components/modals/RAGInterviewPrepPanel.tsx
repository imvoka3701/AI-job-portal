/**
 * RAGInterviewPrepPanel — Bảng Gợi ý Câu hỏi Phỏng vấn Thực chiến Bám sát CV & JD
 * Persona: UI/UX Architect & Frontend Engineer (B2B SaaS Style)
 *
 * Tính năng:
 * - Gọi RAG API (/rag/interview-questions) trích xuất ngữ cảnh thực tế từ CV và JD
 * - Hiển thị bằng chứng trích dẫn (Evidence / Citations) từ các đoạn kinh nghiệm cụ thể
 * - Thêm 1-click vào danh sách tiêu chí chấm điểm Rubric (Human-in-the-loop)
 * - Đủ 4 trạng thái: Ideal, Loading, Empty, Error
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  HelpCircle,
  PlusCircle,
  Copy,
  Check,
  AlertCircle,
  FileText,
  Briefcase,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import {
  generateRAGInterviewQuestions,
  type RAGInterviewQuestionItem,
  type RAGSearchResult,
} from "@/lib/api/rag";
import { cn } from "@/lib/utils";

interface RAGInterviewPrepPanelProps {
  jobId?: number;
  jobTitle?: string;
  candidateName: string;
  cvDocumentId?: number | null;
  resumeId?: number | null;
  onAddQuestionToRubric?: (questionText: string, category: string) => void;
}

const CATEGORY_FILTERS = [
  { id: "all", label: "Tất cả danh mục" },
  { id: "Kỹ thuật chuyên sâu", label: "Kỹ thuật chuyên sâu" },
  { id: "Thiết kế hệ thống", label: "System Design" },
  { id: "Xử lý sự cố", label: "Troubleshooting" },
  { id: "Văn hóa & Teamwork", label: "Culture & Teamwork" },
];

export function RAGInterviewPrepPanel({
  jobId,
  jobTitle,
  candidateName,
  cvDocumentId,
  resumeId,
  onAddQuestionToRubric,
}: RAGInterviewPrepPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [questions, setQuestions] = useState<RAGInterviewQuestionItem[]>([]);
  const [referencedChunks, setReferencedChunks] = useState<RAGSearchResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [addedIndexes, setAddedIndexes] = useState<Record<number, boolean>>({});
  const [expandedChunks, setExpandedChunks] = useState<Record<number, boolean>>({});

  const handleGenerateQuestions = async () => {
    if (!jobId) {
      setErrorMsg("Chưa xác định được tin tuyển dụng cho ứng viên này.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await generateRAGInterviewQuestions({
        job_id: jobId,
        cv_document_id: cvDocumentId,
        resume_id: resumeId,
        count: 4,
        rubric_category: selectedCategory !== "all" ? selectedCategory : null,
      });

      setQuestions(response.questions || []);
      setReferencedChunks(response.referenced_chunks || []);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setErrorMsg(
        error?.response?.data?.detail ||
          "Không thể sinh câu hỏi phỏng vấn RAG. Vui lòng kiểm tra lại dữ liệu CV và JD."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyQuestion = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleAddToRubric = (q: RAGInterviewQuestionItem, index: number) => {
    if (onAddQuestionToRubric) {
      onAddQuestionToRubric(q.question, q.category);
      setAddedIndexes((prev) => ({ ...prev, [index]: true }));
    }
  };

  const toggleChunkExpand = (index: number) => {
    setExpandedChunks((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Find cited chunk content
  const getChunkContent = (chunkId: number): string | null => {
    const chunk = referencedChunks.find((c) => c.chunk_id === chunkId);
    return chunk ? chunk.content : null;
  };

  return (
    <div className="space-y-4">
      {/* Control Banner Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/60 border border-indigo-100/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-indigo-900 font-black text-sm">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>RAG Grounded Interview Questions</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tạo câu hỏi đối chiếu giữa hồ sơ của <strong>{candidateName}</strong> và yêu cầu vị trí{" "}
              <strong>{jobTitle || "Hiện tại"}</strong>.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleGenerateQuestions}
            disabled={isLoading || !jobId}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs h-9 px-4 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-1.5 text-white" /> Đang đối chiếu RAG...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Sinh câu hỏi thực chiến
              </>
            )}
          </Button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-indigo-100/60">
          <span className="text-[11px] font-bold text-slate-500 mr-1">Trọng tâm:</span>
          {CATEGORY_FILTERS.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  isSelected
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-white/80 text-slate-600 border border-slate-200 hover:bg-slate-100/80"
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error State */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading State Skeleton */}
      {isLoading && (
        <div className="space-y-3 py-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5 animate-pulse shadow-2xs"
            >
              <div className="h-4 bg-slate-200 rounded-md w-3/4" />
              <div className="h-3 bg-slate-100 rounded-md w-1/2" />
              <div className="h-12 bg-slate-50 rounded-lg w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && questions.length === 0 && !errorMsg && (
        <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 p-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-3 text-indigo-600">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Chưa có câu hỏi phỏng vấn RAG nào</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Nhấn nút <strong>"Sinh câu hỏi thực chiến"</strong> để hệ thống RAG quét và phân tích
            các dự án thực tế của ứng viên so với tiêu chuẩn JD.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateQuestions}
            disabled={!jobId}
            className="rounded-xl text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Thử sinh câu hỏi ngay
          </Button>
        </div>
      )}

      {/* Questions List (Ideal State) */}
      {!isLoading && questions.length > 0 && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Câu hỏi đề xuất bám sát chứng cứ ({questions.length})
            </span>
            <span className="text-[11px] text-slate-400">
              Được trích xuất từ {referencedChunks.length} đoạn ngữ nghĩa
            </span>
          </div>

          <AnimatePresence>
            {questions.map((q, idx) => {
              const isCopied = copiedIndex === idx;
              const isAdded = !!addedIndexes[idx];
              const isExpanded = !!expandedChunks[idx];
              const citedText = q.cited_chunk_ids?.[0] ? getChunkContent(q.cited_chunk_ids[0]) : null;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all space-y-3"
                >
                  {/* Question Header & Badges */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                        {q.category || "Kỹ thuật"}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                          q.difficulty === "senior" || q.difficulty === "lead"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-sky-50 text-sky-700 border-sky-200"
                        )}
                      >
                        {q.difficulty || "Intermediate"}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyQuestion(q.question, idx)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-200 cursor-pointer"
                        title="Sao chép câu hỏi"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-[11px] text-emerald-600 font-bold">Đã sao chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span className="text-[11px]">Sao chép</span>
                          </>
                        )}
                      </button>

                      <Button
                        type="button"
                        size="sm"
                        variant={isAdded ? "outline" : "primary"}
                        disabled={isAdded}
                        onClick={() => handleAddToRubric(q, idx)}
                        className={cn(
                          "h-7 text-xs font-bold rounded-lg px-2.5 cursor-pointer",
                          isAdded
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                        )}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3 h-3 mr-1" /> Đã thêm vào Rubric
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-3 h-3 mr-1" /> Thêm vào Rubric
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Question Content */}
                  <h5 className="text-sm font-black text-slate-900 leading-relaxed">
                    {q.question}
                  </h5>

                  {/* Rationale */}
                  {q.rationale && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2">
                      <Briefcase className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                      <div>
                        <strong className="text-slate-700">Mục đích đánh giá:</strong>{" "}
                        {q.rationale}
                      </div>
                    </div>
                  )}

                  {/* Evidence Citation Accordion */}
                  {citedText && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => toggleChunkExpand(idx)}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 hover:text-indigo-800 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Xem đoạn chứng cứ gốc trong CV</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>

                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-700 whitespace-pre-line leading-relaxed font-mono text-[11px]"
                        >
                          {citedText}
                        </motion.div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
