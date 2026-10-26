/**
 * CVCopilotDrawer — AI Copilot grounded chat drawer for candidate CV analysis.
 * Implements Chapter 7: "Thiết kế hệ thống và dữ liệu cho ứng dụng AI tạo sinh"
 * Persona: UI/UX Architect & Frontend Engineer (B2B SaaS Style - TopCV/Stripe/Vercel)
 *
 * Cho phép Nhà tuyển dụng / Người phỏng vấn đặt câu hỏi xoáy sâu vào hồ sơ ứng viên:
 * - Trích xuất các phân đoạn CV liên quan bằng Vector Similarity
 * - LLM trả lời với trích dẫn bằng chứng cụ thể ([Chunk #...])
 * - Typewriter / Streaming animation với con trỏ pulsing cursor & nút Dừng tạo
 * - Bộ Quick Prompts 4 nhóm chuyên sâu (Tổng quan, Kỹ năng, Lỗ hổng, Câu hỏi phỏng vấn)
 * - Nút Thử lại (Regenerate) và sao chép trực tiếp từng phân đoạn trích dẫn
 * - 4 Trạng thái: Ideal, Loading, Empty, Error
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Send,
  User as UserIcon,
  Bot,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  RotateCcw,
  Square,
  Target,
  Code,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import {
  chatWithCVCopilot,
  type RAGCVChatMessage,
  type RAGSearchResult,
} from "@/lib/api/rag";
import { cn } from "@/lib/utils";

export interface CVCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName?: string | null;
  documentTitle?: string | null;
  cvDocumentId?: number | null;
  resumeId?: number | null;
}

interface ChatEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  fullContent?: string;
  timestamp: string;
  citedChunkIds?: number[];
  referencedChunks?: RAGSearchResult[];
  isStreaming?: boolean;
}

type PromptCategory = "overview" | "skills" | "red_flags" | "questions";

interface QuickPromptCategoryMeta {
  key: PromptCategory;
  label: string;
  icon: typeof Target;
  accentBg: string;
  accentText: string;
  items: string[];
}

const QUICK_PROMPT_CATEGORIES: QuickPromptCategoryMeta[] = [
  {
    key: "overview",
    label: "Tổng quan & Độ phù hợp",
    icon: Target,
    accentBg: "bg-indigo-50",
    accentText: "text-indigo-700",
    items: [
      "Tóm tắt 3 kinh nghiệm kỹ thuật nổi bật nhất của ứng viên",
      "Đánh giá mức độ phù hợp cho vai trò Senior / Lead",
      "Tổng hợp các thành tựu và chỉ số định lượng (KPIs/Metrics) trong CV",
    ],
  },
  {
    key: "skills",
    label: "Kỹ năng & Tech Stack",
    icon: Code,
    accentBg: "bg-emerald-50",
    accentText: "text-emerald-700",
    items: [
      "Ứng viên có kinh nghiệm thực chiến với kiến trúc Microservices & SQL không?",
      "Kiểm tra kinh nghiệm làm việc với Docker, CI/CD và Cloud (AWS/GCP)",
      "Ứng viên đã từng làm việc với AI, LLM hoặc pgvector chưa?",
    ],
  },
  {
    key: "red_flags",
    label: "Lỗ hổng & Điểm nghi vấn",
    icon: AlertTriangle,
    accentBg: "bg-amber-50",
    accentText: "text-amber-800",
    items: [
      "Có khoảng trống thời gian hoặc công việc nào ngắn hạn bất thường không?",
      "Những công nghệ nào trong CV chỉ mang tính học tập mà thiếu kinh nghiệm thực tế?",
      "Thời gian gắn bó trung bình tại các công ty trước đây thế nào?",
    ],
  },
  {
    key: "questions",
    label: "Câu hỏi phỏng vấn gợi ý",
    icon: HelpCircle,
    accentBg: "bg-purple-50",
    accentText: "text-purple-700",
    items: [
      "Gợi ý 3 câu hỏi phỏng vấn kỹ thuật hóc búa cần làm rõ dựa trên CV này",
      "Gợi ý câu hỏi tình huống xử lý sự cố (Troubleshooting) sát với dự án của ứng viên",
    ],
  },
];

export function CVCopilotDrawer({
  isOpen,
  onClose,
  candidateName,
  documentTitle,
  cvDocumentId,
  resumeId,
}: CVCopilotDrawerProps) {
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedChunkId, setCopiedChunkId] = useState<number | null>(null);
  const [expandedChunkId, setExpandedChunkId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<PromptCategory>("overview");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamingTimerRef = useRef<number | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isStreaming, scrollToBottom]);

  // Clean up streaming timer on unmount
  useEffect(() => {
    return () => {
      if (streamingTimerRef.current !== null) {
        clearInterval(streamingTimerRef.current);
      }
    };
  }, []);

  const handleStopStreaming = () => {
    if (streamingTimerRef.current !== null) {
      clearInterval(streamingTimerRef.current);
      streamingTimerRef.current = null;
    }
    setMessages((prev) =>
      prev.map((msg) =>
        msg.isStreaming
          ? { ...msg, content: msg.fullContent || msg.content, isStreaming: false }
          : msg
      )
    );
    setIsStreaming(false);
  };

  const streamTextResponse = (
    fullText: string,
    entryMeta: Omit<ChatEntry, "content" | "isStreaming" | "fullContent">
  ) => {
    const entryId = entryMeta.id;
    const initialEntry: ChatEntry = {
      ...entryMeta,
      content: "",
      fullContent: fullText,
      isStreaming: true,
    };

    setMessages((prev) => [...prev, initialEntry]);
    setIsStreaming(true);

    let currentLength = 0;
    const chunkSize = 5; // characters per tick for smooth typewriter feel
    const intervalMs = 16;

    streamingTimerRef.current = window.setInterval(() => {
      currentLength += chunkSize;
      if (currentLength >= fullText.length) {
        if (streamingTimerRef.current !== null) {
          clearInterval(streamingTimerRef.current);
          streamingTimerRef.current = null;
        }
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === entryId
              ? { ...msg, content: fullText, isStreaming: false }
              : msg
          )
        );
        setIsStreaming(false);
      } else {
        const slice = fullText.slice(0, currentLength);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === entryId ? { ...msg, content: slice } : msg
          )
        );
      }
    }, intervalMs);
  };

  const handleSendQuery = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || isLoading || isStreaming) return;

    if (!cvDocumentId && !resumeId) {
      setErrorMsg("Không xác định được mã hồ sơ của ứng viên.");
      return;
    }

    const userEntry: ChatEntry = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userEntry]);
    setInputText("");
    setIsLoading(true);
    setErrorMsg(null);

    // Prepare chat history payload for API (omit references)
    const historyPayload: RAGCVChatMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await chatWithCVCopilot({
        query: trimmed,
        cv_document_id: cvDocumentId,
        resume_id: resumeId,
        chat_history: historyPayload,
      });

      setIsLoading(false);

      streamTextResponse(response.answer, {
        id: `ai-${Date.now()}`,
        role: "assistant",
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        citedChunkIds: response.cited_chunk_ids,
        referencedChunks: response.referenced_chunks,
      });
    } catch (err: unknown) {
      setIsLoading(false);
      const error = err as { response?: { data?: { detail?: string } } };
      setErrorMsg(
        error?.response?.data?.detail ||
          "Không thể gửi câu hỏi đến CV Copilot. Vui lòng thử lại sau giây lát."
      );
    }
  };

  const handleRegenerate = async () => {
    if (isLoading || isStreaming) return;
    const lastUserIndex = [...messages].reverse().findIndex((m) => m.role === "user");
    if (lastUserIndex === -1) return;
    const realIndex = messages.length - 1 - lastUserIndex;
    const lastQuery = messages[realIndex].content;

    // Prune messages back to before this user query
    setMessages((prev) => prev.slice(0, realIndex));
    await handleSendQuery(lastQuery);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyChunkSnippet = (snippet: string, chunkId: number) => {
    navigator.clipboard.writeText(snippet);
    setCopiedChunkId(chunkId);
    setTimeout(() => setCopiedChunkId(null), 2000);
  };

  const handleClearHistory = () => {
    if (streamingTimerRef.current !== null) {
      clearInterval(streamingTimerRef.current);
      streamingTimerRef.current = null;
    }
    setIsStreaming(false);
    setIsLoading(false);
    setMessages([]);
    setErrorMsg(null);
  };

  const activeCategoryMeta = QUICK_PROMPT_CATEGORIES.find((c) => c.key === activeCategory) || QUICK_PROMPT_CATEGORIES[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer slide-in panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="relative w-full max-w-xl bg-white shadow-2xl flex flex-col h-full z-10 border-l border-slate-200"
          >
            {/* ── Header ── */}
            <div className="p-4 border-b border-slate-200/80 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900">
                      CV Copilot AI
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-700 border border-indigo-200">
                      Grounded RAG
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate max-w-xs">
                    {candidateName || "Ứng viên"}
                    {documentTitle ? ` • ${documentTitle}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    title="Xóa lịch sử hội thoại"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* ── Content Stream ── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Intro Welcome Card with Categorized Quick Prompts */}
              {messages.length === 0 && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-purple-50/30 to-white border border-indigo-100/80 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Trợ lý Phân tích Hồ sơ Không Ảo giác (Zero Hallucination)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    CV Copilot được kết nối trực tiếp với các phân đoạn văn bản thực tế trong hồ sơ của{" "}
                    <strong>{candidateName || "ứng viên"}</strong>. Mọi câu trả lời đều được kiểm chứng và trích dẫn
                    nguồn gốc cụ thể.
                  </p>

                  {/* Category Filter Tabs */}
                  <div className="space-y-2.5 pt-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Chọn chủ đề phân tích chuyên sâu:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_PROMPT_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = activeCategory === cat.key;
                        return (
                          <button
                            key={cat.key}
                            type="button"
                            onClick={() => setActiveCategory(cat.key)}
                            className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                              isSelected
                                ? "bg-indigo-600 text-white shadow-2xs font-bold"
                                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300"
                            )}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Prompts for Selected Category */}
                    <motion.div
                      key={activeCategory}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col gap-1.5 pt-1"
                    >
                      {activeCategoryMeta.items.map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendQuery(q)}
                          className="text-left text-xs px-3.5 py-2.5 rounded-xl bg-white hover:bg-indigo-50/70 border border-slate-200/80 hover:border-indigo-200 text-slate-700 font-medium transition-all shadow-2xs cursor-pointer group flex items-start gap-2"
                        >
                          <span className="text-indigo-500 font-bold mt-0.5">•</span>
                          <span className="group-hover:text-indigo-900 transition-colors">{q}</span>
                        </button>
                      ))}
                    </motion.div>
                  </div>
                </div>
              )}

              {/* Chat Message List */}
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                const isLatestAssistant = !isUser && index === messages.length - 1;

                return (
                  <div
                    key={msg.id}
                    className={cn("flex flex-col space-y-1.5", isUser ? "items-end" : "items-start")}
                  >
                    <div className="flex items-center gap-1.5 px-1 text-[11px] text-slate-400">
                      {isUser ? (
                        <>
                          <span>Bạn</span>
                          <UserIcon className="w-3 h-3" />
                        </>
                      ) : (
                        <>
                          <Bot className="w-3 h-3 text-indigo-600" />
                          <span className="font-bold text-slate-600">CV Copilot</span>
                        </>
                      )}
                      <span>• {msg.timestamp}</span>
                    </div>

                    <div
                      className={cn(
                        "p-4 rounded-2xl text-xs leading-relaxed max-w-[90%] whitespace-pre-line shadow-2xs font-sans",
                        isUser
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none"
                          : "bg-slate-50 border border-slate-200/90 text-slate-800 rounded-bl-none"
                      )}
                    >
                      <span>{msg.content}</span>

                      {/* Blinking Typewriter Cursor while Streaming */}
                      {msg.isStreaming && (
                        <span className="inline-block w-1.5 h-3.5 bg-indigo-600 animate-pulse ml-0.5 align-middle" />
                      )}

                      {/* Assistant actions: Copy answer & Regenerate */}
                      {!isUser && !msg.isStreaming && (
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/60">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleCopyText(msg.content, msg.id)}
                              className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700">Đã chép</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Sao chép</span>
                                </>
                              )}
                            </button>

                            {isLatestAssistant && (
                              <button
                                type="button"
                                onClick={handleRegenerate}
                                title="Tạo lại câu trả lời"
                                className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Thử lại</span>
                              </button>
                            )}
                          </div>

                          {msg.citedChunkIds && msg.citedChunkIds.length > 0 && (
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                              {msg.citedChunkIds.length} trích dẫn được kiểm chứng
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Grounded Evidence Citations Accordion (Only revealed when not streaming) */}
                    {!isUser && !msg.isStreaming && msg.referencedChunks && msg.referencedChunks.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-full max-w-[90%] space-y-1.5 pt-1"
                      >
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                          Chứng cứ đối chiếu từ hồ sơ:
                        </p>
                        <div className="space-y-1">
                          {msg.referencedChunks.map((chunk) => {
                            const isExpanded = expandedChunkId === chunk.chunk_id;
                            const isCopiedSnippet = copiedChunkId === chunk.chunk_id;

                            return (
                              <div
                                key={chunk.chunk_id}
                                className="rounded-xl border border-slate-200 bg-white overflow-hidden text-xs shadow-2xs"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedChunkId(isExpanded ? null : chunk.chunk_id)
                                  }
                                  className="w-full px-3 py-1.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700">
                                    <FileText className="w-3 h-3 text-indigo-600" />
                                    <span>
                                      Phân đoạn: {chunk.section_type} (Mã #{chunk.chunk_id})
                                    </span>
                                  </div>
                                  {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                </button>
                                {isExpanded && (
                                  <div className="p-3 bg-slate-50/70 border-t border-slate-100 text-[11px] text-slate-600 leading-relaxed font-mono whitespace-pre-line space-y-2">
                                    <div>{chunk.content}</div>
                                    <div className="pt-2 border-t border-slate-200/60 flex justify-end">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCopyChunkSnippet(chunk.content, chunk.chunk_id);
                                        }}
                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                                      >
                                        {isCopiedSnippet ? (
                                          <>
                                            <Check className="w-3 h-3 text-emerald-600" />
                                            <span className="text-emerald-700">Đã chép đoạn trích</span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3 h-3" />
                                            <span>Chép đoạn trích</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-start gap-2 max-w-[85%]">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                    <Bot className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="p-3.5 rounded-2xl rounded-bl-none bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-2">
                    <div className="flex items-center gap-2">
                      <Spinner size="sm" className="text-indigo-600" />
                      <span className="font-semibold text-slate-700">
                        CV Copilot đang truy xuất trích đoạn và phân tích...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error banner */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Input Box & Stop Generating Controls ── */}
            <div className="p-3.5 border-t border-slate-200 bg-white space-y-2">
              {/* Stop Generation Banner when Streaming */}
              {isStreaming && (
                <div className="flex justify-center pb-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleStopStreaming}
                    className="h-7 text-xs border-slate-300 text-slate-700 hover:bg-slate-100 gap-1.5 shadow-2xs"
                  >
                    <Square className="w-3 h-3 fill-rose-500 text-rose-500" />
                    <span>Dừng tạo</span>
                  </Button>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendQuery(inputText);
                }}
                className="relative flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Hỏi bất kỳ điều gì về kinh nghiệm, kỹ năng của ứng viên..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isLoading || isStreaming}
                  className="flex-1 h-11 pl-4 pr-10 rounded-xl border border-slate-200 bg-slate-50/60 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium disabled:opacity-60"
                />
                <Button
                  type="submit"
                  disabled={isLoading || isStreaming || !inputText.trim()}
                  className="h-11 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs shrink-0 disabled:opacity-50"
                >
                  {isLoading ? <Spinner size="sm" className="text-white" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
              <p className="text-[10px] text-slate-400 text-center">
                Mô hình sử dụng RAG đối chiếu chéo với kho hồ sơ đã phân đoạn để loại bỏ hiện tượng bịa đặt.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
