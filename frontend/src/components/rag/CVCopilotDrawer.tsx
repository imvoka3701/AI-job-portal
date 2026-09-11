/**
 * CVCopilotDrawer — AI Copilot grounded chat drawer for candidate CV analysis.
 * Implements Chapter 7: "Thiết kế hệ thống và dữ liệu cho ứng dụng AI tạo sinh"
 * Persona: UI/UX Architect & Frontend Engineer (B2B SaaS Style - TopCV/Stripe/Vercel)
 *
 * Cho phép Nhà tuyển dụng / Người phỏng vấn đặt câu hỏi xoáy sâu vào hồ sơ ứng viên:
 * - Trích xuất các phân đoạn CV liên quan bằng Vector Similarity
 * - LLM trả lời với trích dẫn bằng chứng cụ thể ([Chunk #...])
 * - Accordion cho phép kiểm chứng nguyên văn đoạn trích từ CV
 * - 4 Trạng thái: Ideal, Loading, Empty, Error
 */

import { useState, useRef, useEffect } from "react";
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
  timestamp: string;
  citedChunkIds?: number[];
  referencedChunks?: RAGSearchResult[];
}

const QUICK_PROMPTS = [
  "Tóm tắt 3 kinh nghiệm kỹ thuật nổi bật nhất của ứng viên",
  "Ứng viên có kinh nghiệm thực chiến với kiến trúc Microservices & SQL không?",
  "Đánh giá mức độ phù hợp cho vai trò Senior / Lead",
  "Gợi ý 3 câu hỏi phỏng vấn hóc búa cần làm rõ dựa trên CV này",
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedChunkId, setExpandedChunkId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendQuery = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || isLoading) return;

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

      const assistantEntry: ChatEntry = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: response.answer,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        citedChunkIds: response.cited_chunk_ids,
        referencedChunks: response.referenced_chunks,
      };

      setMessages((prev) => [...prev, assistantEntry]);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setErrorMsg(
        error?.response?.data?.detail ||
          "Không thể gửi câu hỏi đến CV Copilot. Vui lòng thử lại sau giây lát."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([]);
    setErrorMsg(null);
  };

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
            <div className="p-4 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
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
              {/* Intro Welcome Card */}
              {messages.length === 0 && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-purple-50/30 to-white border border-indigo-100/80 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Trợ lý Phân tích Hồ sơ Không Ảo giác (Zero Hallucination)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    CV Copilot được kết nối trực tiếp với các phân đoạn văn bản thực tế trong hồ sơ của{" "}
                    <strong>{candidateName || "ứng viên"}</strong>. Mọi câu trả lời đều được kiểm chứng và trích dẫn
                    nguồn gốc cụ thể.
                  </p>

                  <div className="pt-2 space-y-1.5">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Gợi ý câu hỏi bắt đầu:
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {QUICK_PROMPTS.map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendQuery(q)}
                          className="text-left text-xs px-3 py-2 rounded-xl bg-white hover:bg-indigo-50/80 border border-slate-200/80 hover:border-indigo-200 text-slate-700 font-medium transition-all shadow-2xs cursor-pointer"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Message List */}
              {messages.map((msg) => {
                const isUser = msg.role === "user";
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
                      {msg.content}

                      {/* Assistant actions: Copy answer */}
                      {!isUser && (
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/60">
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

                          {msg.citedChunkIds && msg.citedChunkIds.length > 0 && (
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                              {msg.citedChunkIds.length} trích dẫn được kiểm chứng
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Grounded Evidence Citations Accordion (Assistant only) */}
                    {!isUser && msg.referencedChunks && msg.referencedChunks.length > 0 && (
                      <div className="w-full max-w-[90%] space-y-1.5 pt-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                          Chứng cứ đối chiếu từ hồ sơ:
                        </p>
                        <div className="space-y-1">
                          {msg.referencedChunks.map((chunk) => {
                            const isExpanded = expandedChunkId === chunk.chunk_id;
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
                                  <div className="p-3 bg-slate-50/70 border-t border-slate-100 text-[11px] text-slate-600 leading-relaxed font-mono whitespace-pre-line">
                                    {chunk.content}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
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

            {/* ── Input Box ── */}
            <div className="p-3.5 border-t border-slate-200 bg-white space-y-2">
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
                  disabled={isLoading}
                  className="flex-1 h-11 pl-4 pr-10 rounded-xl border border-slate-200 bg-slate-50/60 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !inputText.trim()}
                  className="h-11 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs shrink-0"
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
