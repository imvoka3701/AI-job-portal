import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Briefcase,
  Check,
  ChevronRight,
  Compass,
  Copy,
  FileText,
  Maximize2,
  Minimize2,
  RotateCcw,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Building2,
  GraduationCap,
} from "lucide-react";
import { useAssistantStore, type DisplayMessage } from "@/stores/assistantStore";
import { useUser } from "@/stores/authStore";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { EmbeddedCard } from "@/lib/api/assistant";

type PersonaCategory = "candidate" | "employer" | "tools";

export function AIAssistantDrawer() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useUser();
  const [inputText, setInputText] = useState("");
  const [activeCategory, setActiveCategory] = useState<PersonaCategory>("candidate");
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    isOpen,
    isTyping,
    error,
    messages,
    suggestions,
    setOpen,
    sendMessage,
    loadSuggestions,
    clearMessages,
  } = useAssistantStore();

  // Set initial category based on user role or current path
  useEffect(() => {
    if (user?.role === "employer" || location.pathname.startsWith("/employer")) {
      setActiveCategory("employer");
    } else if (location.pathname.startsWith("/tools")) {
      setActiveCategory("tools");
    } else {
      setActiveCategory("candidate");
    }
  }, [location.pathname, user?.role]);

  // Load contextual suggestions
  useEffect(() => {
    loadSuggestions(location.pathname, user?.role);
  }, [location.pathname, user?.role, loadSuggestions]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isTyping]);

  const handleSend = () => {
    if (!inputText.trim() || isTyping) return;
    const text = inputText;
    setInputText("");
    void sendMessage(text, location.pathname, user?.role);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    void sendMessage(prompt, location.pathname, user?.role);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeakToggle = (id: string, text: string) => {
    if ("speechSynthesis" in window) {
      if (speakingId === id) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
      } else {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`[\]]/g, ""));
        utterance.lang = "vi-VN";
        utterance.rate = 1.05;
        utterance.onend = () => setSpeakingId(null);
        utterance.onerror = () => setSpeakingId(null);
        setSpeakingId(id);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const handleCardClick = (card: EmbeddedCard) => {
    if (card.url.startsWith("http")) {
      window.open(card.url, "_blank");
    } else {
      navigate(card.url);
      if (window.innerWidth < 768) {
        setOpen(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          width: isExpanded ? "min(920px, 94vw)" : "min(440px, calc(100vw - 2rem))",
          height: isExpanded ? "min(720px, 90vh)" : "min(600px, 86vh)",
        }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="fixed bottom-20 right-4 sm:right-6 z-50 flex flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden font-sans text-gray-900"
      >
        {/* Bright Clean Header with Neural Waveform */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white font-bold shadow-xs">
              <Bot className="h-5 w-5" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 animate-ping" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-bold text-gray-900 tracking-tight">JobPortal AI Advisor</h3>
                <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  24/7 Live
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <NeuralWaveform isTyping={isTyping} />
                <span className="text-[11px] text-gray-500 font-medium">Cố vấn Tuyển dụng & Sự nghiệp</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Thu nhỏ cửa sổ" : "Mở rộng không gian chat"}
              className="hidden sm:flex rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={clearMessages}
              title="Làm mới cuộc trò chuyện"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              title="Đóng chat"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Bright Category Navigation Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/80 px-3 py-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveCategory("candidate")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all",
              activeCategory === "candidate"
                ? "bg-white text-primary border border-gray-200 shadow-2xs"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <GraduationCap className="h-3.5 w-3.5 text-primary" />
            Ứng viên & Việc làm
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("employer")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all",
              activeCategory === "employer"
                ? "bg-white text-emerald-700 border border-gray-200 shadow-2xs"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <Building2 className="h-3.5 w-3.5 text-emerald-600" />
            Doanh nghiệp B2B
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("tools")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all",
              activeCategory === "tools"
                ? "bg-white text-purple-700 border border-gray-200 shadow-2xs"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <Compass className="h-3.5 w-3.5 text-purple-600" />
            MBTI & CV Tools
          </button>
        </div>

        {/* Contextual Quick Chips Bar (Light Mode) */}
        {suggestions.length > 0 && (
          <div className="border-b border-gray-100 bg-white px-3 py-2">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary shrink-0 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Gợi ý:
              </span>
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickPrompt(s.prompt)}
                  disabled={isTyping}
                  className="shrink-0 rounded-full border border-gray-200 bg-gray-50/80 px-3 py-1 text-[11px] font-medium text-gray-700 hover:border-primary hover:bg-primary-light/40 hover:text-primary transition-all shadow-2xs"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages Body (Bright Page Background) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {/* Welcome Superpowers Showcase when chat is starting */}
          {messages.length <= 1 && (
            <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Khám phá Siêu năng lực AI Advisor
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <SuperpowerTile
                  icon={<Briefcase className="h-4 w-4 text-primary" />}
                  title="Tìm việc Match >90%"
                  desc="Gợi ý việc làm theo vector năng lực"
                  onClick={() => handleQuickPrompt("Tìm giúp tôi các công việc có độ phù hợp cao nhất với năng lực và mức lương hấp dẫn.")}
                />
                <SuperpowerTile
                  icon={<FileText className="h-4 w-4 text-emerald-600" />}
                  title="Tạo CV chuẩn ATS"
                  desc="Khám & sửa lỗi CV xin việc tức thì"
                  onClick={() => handleQuickPrompt("Hướng dẫn tôi cách tạo và tối ưu hóa CV để vượt qua bộ lọc ATS của nhà tuyển dụng.")}
                />
                <SuperpowerTile
                  icon={<Compass className="h-4 w-4 text-purple-600" />}
                  title="Trắc nghiệm MBTI & MI"
                  desc="Định vị thế mạnh tính cách & nghề"
                  onClick={() => handleQuickPrompt("Tôi muốn làm bài test MBTI hoặc Đa trí tuệ MI để tìm ra hướng đi nghề nghiệp chuẩn xác.")}
                />
                <SuperpowerTile
                  icon={<Building2 className="h-4 w-4 text-blue-600" />}
                  title="Tư vấn Tuyển dụng B2B"
                  desc="Soạn JD chuẩn & sàng lọc ATS"
                  onClick={() => handleQuickPrompt("Tôi là nhà tuyển dụng, hãy tư vấn cách viết JD thu hút và quy trình sàng lọc ứng viên hiệu quả.")}
                />
              </div>
            </div>
          )}

          {/* Messages Stream */}
          {messages.map((msg) => (
            <DiplomaticMessageItem
              key={msg.id}
              message={msg}
              isCopied={copiedId === msg.id}
              isSpeaking={speakingId === msg.id}
              onCopy={() => handleCopy(msg.id, msg.content)}
              onSpeakToggle={() => handleSpeakToggle(msg.id, msg.content)}
              onCardClick={handleCardClick}
              onFollowupClick={handleQuickPrompt}
              disabled={isTyping}
            />
          ))}

          {/* Neural Thinking State */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-white font-bold text-xs shadow-xs">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-xs text-gray-600 font-medium ml-1.5">
                    AI Advisor đang phân tích giải pháp tối ưu...
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center justify-between">
              <span>{error}</span>
              <Button size="sm" variant="ghost" className="text-xs h-7 text-red-800" onClick={handleSend}>
                Thử lại
              </Button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bright Clean Input Island */}
        <div className="border-t border-gray-100 bg-white p-3 space-y-2">
          <div className="flex items-end gap-2 rounded-xl border border-gray-200 bg-gray-50/80 p-2 focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/15 transition-all">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Đặt câu hỏi cho AI Advisor... (Enter để gửi)"
              rows={1}
              className="max-h-28 min-h-[36px] w-full resize-none bg-transparent px-2.5 py-1 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
            <Button
              size="sm"
              variant="primary"
              disabled={!inputText.trim() || isTyping}
              onClick={handleSend}
              className="h-8 w-8 shrink-0 p-0 rounded-lg shadow-xs"
              aria-label="Gửi tin nhắn"
            >
              <Send className="h-3.5 w-3.5 text-white" />
            </Button>
          </div>
          <p className="text-center text-[10px] text-gray-400">
            AI Advisor hỗ trợ tư vấn 24/7. Mọi quyết định tuyển dụng & sự nghiệp luôn thuộc về bạn.
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function SuperpowerTile({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50/70 p-2.5 text-left hover:border-primary hover:bg-primary-light/20 transition-all shadow-2xs"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200 group-hover:border-primary/30 transition-colors shadow-2xs">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-gray-900 group-hover:text-primary transition-colors">
          {title}
        </p>
        <p className="truncate text-[11px] text-gray-500">{desc}</p>
      </div>
    </button>
  );
}

function NeuralWaveform({ isTyping }: { isTyping: boolean }) {
  return (
    <div className="flex items-center gap-0.5 h-3">
      {[40, 70, 100, 55, 85].map((height, i) => (
        <span
          key={i}
          className={cn(
            "w-0.5 rounded-full bg-primary transition-all duration-300",
            isTyping ? "animate-pulse" : "opacity-50"
          )}
          style={{
            height: isTyping ? `${height}%` : "30%",
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

function DiplomaticMessageItem({
  message,
  isCopied,
  isSpeaking,
  onCopy,
  onSpeakToggle,
  onCardClick,
  onFollowupClick,
  disabled,
}: {
  message: DisplayMessage;
  isCopied: boolean;
  isSpeaking: boolean;
  onCopy: () => void;
  onSpeakToggle: () => void;
  onCardClick: (card: EmbeddedCard) => void;
  onFollowupClick: (prompt: string) => void;
  disabled?: boolean;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-xs sm:text-sm text-white shadow-xs">
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-white font-bold shadow-xs">
        <Bot className="h-4 w-4" />
      </div>

      <div className="min-w-0 max-w-[88%] space-y-2.5">
        {/* Message Content Bubble (White Card with Gray Border) */}
        <div className="rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3 text-xs sm:text-sm text-gray-800 shadow-2xs space-y-2.5">
          <div className="space-y-2 leading-relaxed">
            {message.content.split("\n").map((line, idx) => {
              if (line.startsWith("### ")) {
                return (
                  <h4 key={idx} className="font-bold text-gray-900 text-sm mt-3 mb-1">
                    {line.replace("### ", "")}
                  </h4>
                );
              }
              if (line.startsWith("- ") || line.startsWith("* ")) {
                return (
                  <div key={idx} className="flex items-start gap-2 pl-1">
                    <span className="text-primary font-bold">•</span>
                    <span>{parseRichText(line.substring(2))}</span>
                  </div>
                );
              }
              if (/^\d+\.\s/.test(line)) {
                return (
                  <div key={idx} className="flex items-start gap-2 pl-1">
                    <span className="font-semibold text-primary">{line.match(/^\d+\./)?.[0]}</span>
                    <span>{parseRichText(line.replace(/^\d+\.\s/, ""))}</span>
                  </div>
                );
              }
              if (!line.trim()) {
                return <div key={idx} className="h-1" />;
              }
              return <p key={idx}>{parseRichText(line)}</p>;
            })}
          </div>

          {/* Action Tools Row */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
            <button
              type="button"
              onClick={onCopy}
              className="flex items-center gap-1 hover:text-gray-900 transition-colors"
            >
              {isCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              <span>{isCopied ? "Đã sao chép" : "Sao chép"}</span>
            </button>
            <button
              type="button"
              onClick={onSpeakToggle}
              className="flex items-center gap-1 hover:text-gray-900 transition-colors"
            >
              {isSpeaking ? <VolumeX className="h-3 w-3 text-primary" /> : <Volume2 className="h-3 w-3" />}
              <span>{isSpeaking ? "Dừng đọc" : "Đọc to"}</span>
            </button>
          </div>
        </div>

        {/* Embedded Interactive Rich Cards */}
        {message.cards && message.cards.length > 0 && (
          <div className="space-y-2 pt-0.5">
            {message.cards.map((card, cIdx) => (
              <button
                key={cIdx}
                type="button"
                onClick={() => onCardClick(card)}
                className="group flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-3 text-left hover:border-primary hover:bg-primary-light/10 transition-all shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary shadow-2xs group-hover:scale-105 transition-transform">
                    {card.card_type === "job" ? (
                      <Briefcase className="h-4 w-4" />
                    ) : card.card_type === "tool" ? (
                      <Compass className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-gray-900 group-hover:text-primary transition-colors">
                      {card.title}
                    </p>
                    {card.subtitle && (
                      <p className="truncate text-[11px] text-gray-500 mt-0.5">{card.subtitle}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform shrink-0">
                  <span>Xem ngay</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Follow-up Prompts */}
        {message.followups && message.followups.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {message.followups.map((fu, fuIdx) => (
              <button
                key={fuIdx}
                type="button"
                disabled={disabled}
                onClick={() => onFollowupClick(fu)}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:border-primary hover:bg-primary-light/30 hover:text-primary transition-all shadow-2xs text-left"
              >
                {fu}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function parseRichText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          className="font-semibold text-primary hover:underline underline-offset-2"
          onClick={(e) => {
            if (!linkMatch[2].startsWith("http")) {
              e.preventDefault();
              window.location.href = linkMatch[2];
            }
          }}
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}
