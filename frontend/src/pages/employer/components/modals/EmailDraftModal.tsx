import { useEffect, useRef, useState } from "react";
import {
  Check,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Mail,
  Calendar,
  Award,
  UserX,
  FileCode2,
  SlidersHorizontal,
  Copy,
} from "lucide-react";
import { AIDisclaimerBanner, Button, Input, Modal, Spinner, Badge } from "@/components/ui";
import { motion, AnimatePresence } from "framer-motion";
import type { GenerateEmailResult } from "@/types/api";

export type EmailType = "invite" | "offer" | "reject" | "test";
export type EmailTone = "formal" | "friendly" | "concise";

interface EmailDraftModalProps {
  candidateName: string;
  candidateEmail?: string;
  jobTitle?: string;
  matchScore?: number | null;
  isOpen: boolean;
  result: GenerateEmailResult | null;
  loading: boolean;
  error: string | null;
  onRetry: (type?: "invite" | "reject" | "offer", customPrompt?: string) => void;
  onClose: () => void;
}

export function EmailDraftModal({
  candidateName,
  candidateEmail = "candidate@example.com",
  jobTitle = "Vị trí tuyển dụng",
  matchScore,
  isOpen,
  result,
  loading,
  error,
  onRetry,
  onClose,
}: EmailDraftModalProps) {
  const [selectedType, setSelectedType] = useState<EmailType>("invite");
  const [selectedTone, setSelectedTone] = useState<EmailTone>("formal");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [showPromptInput, setShowPromptInput] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync result to form.
  // Cố ý chỉ phụ thuộc [result, candidateName, jobTitle]: effect này dùng để đồng bộ
  // nội dung từ kết quả AI, hoặc nạp template mặc định KHI CHƯA có kết quả (lúc mở modal).
  // selectedType/selectedTone đã được xử lý riêng qua handleTypeChange/handleToneChange;
  // nếu thêm chúng vào deps, khi đã có `result` mà người dùng đổi tone/type thì effect sẽ
  // ghi đè template do handler nạp bằng nội dung `result` — sai nghiệp vụ. Vì vậy giữ nguyên deps.
  useEffect(() => {
    if (result) {
      setSubject(result.subject ?? "");
      setBody(result.body ?? "");
      setCopied(false);
    } else {
      // Default initial templates when starting
      loadDefaultTemplate(selectedType, selectedTone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, candidateName, jobTitle]);

  useEffect(() => () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);

  const loadDefaultTemplate = (type: EmailType, tone: EmailTone) => {
    const compName = "TechCorp VN";
    if (type === "invite") {
      setSubject(`[${compName}] Thư mời phỏng vấn vị trí ${jobTitle} - ${candidateName}`);
      if (tone === "friendly") {
        setBody(
          `Chào ${candidateName},\n\n` +
          `Cảm ơn bạn đã dành sự quan tâm và gửi hồ sơ ứng tuyển vị trí ${jobTitle} tại ${compName}.\n\n` +
          `Đội ngũ tuyển dụng rất ấn tượng với profile và kinh nghiệm chuyên môn của bạn. Chúng tôi trân trọng mời bạn tham gia buổi phỏng vấn trực tiếp để cùng trao đổi chi tiết hơn về cơ hội hợp tác:\n\n` +
          `📅 Thời gian: [Nhập ngày giờ, VD: 14:00 - Thứ Năm, 20/08/2026]\n` +
          `📍 Hình thức: Phỏng vấn Online qua Google Meet: [Link Google Meet]\n` +
          `👥 Người phỏng vấn: Trưởng bộ phận Kỹ thuật & Phòng Nhân sự\n\n` +
          `Bạn vui lòng phản hồi email này trước 17:00 ngày mai để xác nhận lịch hẹn nhé.\n\n` +
          `Chúc bạn một ngày làm việc tuyệt vời!\n` +
          `Trân trọng,\n` +
          `Phòng Tuyển dụng TechCorp VN`
        );
      } else if (tone === "concise") {
        setSubject(`[${compName}] Lịch phỏng vấn vị trí ${jobTitle} - ${candidateName}`);
        setBody(
          `Kính gửi ${candidateName},\n\n` +
          `Phòng Nhân sự ${compName} trân trọng mời bạn tham dự buổi phỏng vấn vị trí ${jobTitle}:\n\n` +
          `• Thời gian: [Thời gian cụ thể]\n` +
          `• Địa điểm / Link: [Google Meet / Văn phòng]\n` +
          `• Thời lượng: ~45 phút\n\n` +
          `Vui lòng phản hồi để xác nhận tham dự.\n\n` +
          `Trân trọng,\n` +
          `${compName} Talent Acquisition`
        );
      } else {
        setSubject(`[${compName}] Thư mời tham dự phỏng vấn - Vị trí ${jobTitle}`);
        setBody(
          `Kính gửi Ông/Bà ${candidateName},\n\n` +
          `Lời đầu tiên, thay mặt Công ty ${compName}, chúng tôi xin gửi lời cảm ơn chân thành vì sự quan tâm của bạn dành cho vị trí ${jobTitle}.\n\n` +
          `Qua quá trình thẩm định hồ sơ, chúng tôi đánh giá cao năng lực cũng như những thành tựu mà bạn đã đạt được. Chúng tôi trân trọng kính mời bạn tham dự buổi phỏng vấn trao đổi chuyên môn với thông tin chi tiết như sau:\n\n` +
          `1. Thời gian phỏng vấn: [Thời gian dự kiến]\n` +
          `2. Hình thức: [Trực tiếp tại trụ sở công ty / Google Meet]\n` +
          `3. Thành phần tham dự: Hội đồng Tuyển dụng & Đại diện Ban Giám đốc\n\n` +
          `Xin vui lòng phản hồi email này để xác nhận sự hiện diện của bạn.\n\n` +
          `Trân trọng,\n` +
          `Ban Nhân sự - ${compName}`
        );
      }
    } else if (type === "offer") {
      setSubject(`[${compName}] Thư đề nghị nhận việc (Job Offer Letter) - Vị trí ${jobTitle}`);
      setBody(
        `Thân gửi ${candidateName},\n\n` +
        `Chúc mừng bạn đã hoàn thành xuất sắc các vòng phỏng vấn tại ${compName}!\n\n` +
        `Chúng tôi rất vui mừng chính thức gửi đến bạn Thư đề nghị nhận việc (Job Offer) cho vị trí ${jobTitle} với các điều khoản tóm tắt sau:\n\n` +
        `• Vị trí công tác: ${jobTitle}\n` +
        `• Mức lương chính thức: [Nhập mức lương thỏa thuận, VD: 35.000.000 VNĐ/tháng]\n` +
        `• Ngày bắt đầu làm việc (Onboarding): [Ngày bắt đầu]\n` +
        `• Chế độ phúc lợi: Thưởng hiệu suất quý, MacBook Pro, Bảo hiểm sức khỏe cao cấp\n\n` +
        `Chi tiết hợp đồng và thư mời đính kèm. Vui lòng xác nhận trước [Hạn phản hồi].\n\n` +
        `Chào mừng bạn gia nhập đại gia đình ${compName}!\n\n` +
        `Trân trọng,\n` +
        `Phòng Nhân sự ${compName}`
      );
    } else if (type === "reject") {
      setSubject(`[${compName}] Thư cảm ơn và phản hồi ứng tuyển - Vị trí ${jobTitle}`);
      setBody(
        `Kính gửi ${candidateName},\n\n` +
        `Lời đầu tiên, ${compName} xin chân thành cảm ơn bạn đã dành thời gian và tâm huyết tham gia quy trình ứng tuyển cho vị trí ${jobTitle}.\n\n` +
        `Hội đồng tuyển dụng đánh giá rất cao năng lực và tinh thần làm việc của bạn. Tuy nhiên, sau khi cân nhắc kỹ lưỡng các tiêu chí phù hợp nhất với giai đoạn hiện tại của dự án, chúng tôi rất tiếc chưa thể có cơ hội đồng hành cùng bạn lần này.\n\n` +
        `Chúng tôi xin phép được lưu giữ hồ sơ của bạn trong Mạng lưới Nhân tài (Talent Pool) và sẽ chủ động liên hệ ngay khi có vị trí phù hợp hơn trong tương lai.\n\n` +
        `Chúc bạn luôn dồi dào sức khỏe và gặt hái nhiều thành công rực rỡ trên con đường sự nghiệp!\n\n` +
        `Trân trọng,\n` +
        `Đội ngũ Tuyển dụng ${compName}`
      );
    } else if (type === "test") {
      setSubject(`[${compName}] Bài kiểm tra năng lực kỹ thuật (Technical Assessment) - ${jobTitle}`);
      setBody(
        `Chào ${candidateName},\n\n` +
        `Cảm ơn bạn đã ứng tuyển vị trí ${jobTitle} tại ${compName}.\n\n` +
        `Để đánh giá chính xác kỹ năng thực chiến của bạn, chúng tôi gửi bài test kỹ thuật nhỏ sau:\n\n` +
        `• Đề bài / Yêu cầu: [Mô tả bài test hoặc đính kèm link bài tập]\n` +
        `• Thời hạn nộp bài: [Hạn chót, VD: 23:59 Chủ Nhật]\n` +
        `• Hình thức nộp: Phản hồi email này hoặc đính kèm link GitHub repo.\n\n` +
        `Nếu có bất kỳ thắc mắc nào, đừng ngần ngại trao đổi lại nhé.\n\n` +
        `Chúc bạn hoàn thành bài test thật tốt!\n\n` +
        `Trân trọng,\n` +
        `Tech Team - ${compName}`
      );
    }
  };

  const handleTypeChange = (type: EmailType) => {
    setSelectedType(type);
    if (type === "invite" || type === "offer" || type === "reject") {
      onRetry(type);
    } else {
      loadDefaultTemplate(type, selectedTone);
    }
  };

  const handleToneChange = (tone: EmailTone) => {
    setSelectedTone(tone);
    loadDefaultTemplate(selectedType, tone);
  };

  const handleInsertTag = (tag: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const newBody = body.substring(0, start) + tag + body.substring(end);
    setBody(newBody);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + tag.length, start + tag.length);
      }
    }, 50);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`Tiêu đề: ${subject}\n\n${body}`);
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleOpenGmail = () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      candidateEmail
    )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  };

  const handleCustomRegenerate = () => {
    const apiType = selectedType === "test" ? "invite" : selectedType;
    onRetry(apiType, customPrompt);
    setShowPromptInput(false);
  };

  const hasChanges = result !== null && (subject !== result.subject || body !== result.body);

  const EMAIL_TYPES = [
    { id: "invite" as const, label: "Mời phỏng vấn", icon: Calendar, color: "text-blue-600 bg-blue-50 border-blue-200" },
    { id: "offer" as const, label: "Mời nhận việc (Offer)", icon: Award, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    { id: "test" as const, label: "Bài test Kỹ thuật", icon: FileCode2, color: "text-purple-600 bg-purple-50 border-purple-200" },
    { id: "reject" as const, label: "Thư từ chối khéo", icon: UserX, color: "text-gray-600 bg-gray-50 border-gray-200" },
  ];

  const TONES = [
    { id: "formal" as const, label: "Trang trọng" },
    { id: "friendly" as const, label: "Thân thiện" },
    { id: "concise" as const, label: "Ngắn gọn" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="lg"
    >
      <div className="space-y-5 -mt-2">
        {/* ── Studio Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">AI Gmail Studio</h2>
                <Badge variant="primary" size="sm" className="bg-red-50 text-red-600 border-red-200">
                  Gmail 1-Click
                </Badge>
              </div>
              <p className="text-xs text-gray-500">
                Gửi tới: <span className="font-semibold text-gray-800">{candidateName}</span> ({candidateEmail}) · {jobTitle}
              </p>
            </div>
          </div>

          {matchScore != null && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 self-start sm:self-auto">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Điểm AI Match: {matchScore}%
            </div>
          )}
        </div>

        {/* ── Email Type Tabs ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {EMAIL_TYPES.map((t) => {
            const Icon = t.icon;
            const isSelected = selectedType === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTypeChange(t.id)}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  isSelected
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : ""}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Tone & Tag Toolbar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50/80 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Giọng điệu:
            </span>
            <div className="flex rounded-lg bg-white border border-gray-200 p-0.5 shadow-xs">
              {TONES.map((tone) => (
                <button
                  key={tone.id}
                  type="button"
                  onClick={() => handleToneChange(tone.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    selectedTone === tone.id
                      ? "bg-primary text-white font-semibold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tone.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-gray-400">Chèn nhanh:</span>
            <button
              type="button"
              onClick={() => handleInsertTag("{ngày_giờ}")}
              className="text-[11px] bg-white hover:bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-gray-600 transition-colors"
            >
              + Ngày giờ
            </button>
            <button
              type="button"
              onClick={() => handleInsertTag("{link_google_meet}")}
              className="text-[11px] bg-white hover:bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-gray-600 transition-colors"
            >
              + Link Meet
            </button>
            <button
              type="button"
              onClick={() => handleInsertTag("{mức_lương}")}
              className="text-[11px] bg-white hover:bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-gray-600 transition-colors"
            >
              + Mức lương
            </button>
          </div>
        </div>

        {/* ── Loading Spinner ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <Spinner size="lg" color="blue" label="DeepSeek AI đang soạn email..." />
            <span className="text-xs text-gray-500 font-medium animate-pulse">
              Đang tối ưu ngữ cảnh CV và vị trí {jobTitle}...
            </span>
          </div>
        )}

        {/* ── Error Box ── */}
        {!loading && error && (
          <div role="alert" className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={() => onRetry(selectedType === "test" ? "invite" : selectedType)}>
              Thử lại
            </Button>
          </div>
        )}

        {/* ── Editor Form ── */}
        {!loading && (
          <div className="space-y-4">
            <div>
              <label htmlFor="email-subject" className="block text-xs font-semibold text-gray-700 mb-1">
                Tiêu đề Email (Subject Line)
              </label>
              <Input
                id="email-subject"
                aria-label="Tiêu đề email"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Tiêu đề email..."
                className="font-medium text-sm"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="email-body" className="block text-xs font-semibold text-gray-700">
                  Nội dung Email
                </label>
                <span className="text-[11px] text-gray-400">{body.length} ký tự</span>
              </div>
              <textarea
                id="email-body"
                aria-label="Nội dung email"
                ref={textareaRef}
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-3.5 py-3 border border-gray-300 rounded-xl text-sm font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
                placeholder="Nội dung thư..."
              />
            </div>

            {/* Trạng thái chỉnh sửa so với bản AI gốc */}
            {result && (
              <p
                className={`text-[11px] font-medium ${
                  hasChanges ? "text-amber-600" : "text-gray-400"
                }`}
              >
                {hasChanges
                  ? "Bạn đang dùng phiên bản đã chỉnh sửa."
                  : "Nội dung đang giữ nguyên bản AI."}
              </p>
            )}

            {/* Custom AI Instruction Bar */}
            <AnimatePresence>
              {showPromptInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl flex gap-2"
                >
                  <Input
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="VD: Nhắc ứng viên chuẩn bị laptop và mang theo portfolio..."
                    className="text-xs bg-white flex-1"
                  />
                  <Button size="sm" onClick={handleCustomRegenerate} className="gap-1 shrink-0">
                    <Sparkles className="w-3.5 h-3.5" /> Tạo lại
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <AIDisclaimerBanner context="email" />
          </div>
        )}

        {/* ── Footer Actions ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowPromptInput(!showPromptInput)}
              className="text-xs font-semibold text-primary hover:text-primary-dark flex items-center gap-1 py-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {showPromptInput ? "Đóng tùy chỉnh AI" : "Thêm chỉ thị AI riêng"}
            </button>
            {hasChanges && (
              <button
                type="button"
                onClick={() => {
                  if (result) {
                    setSubject(result.subject ?? "");
                    setBody(result.body ?? "");
                  } else {
                    loadDefaultTemplate(selectedType, selectedTone);
                  }
                }}
                className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 py-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Khôi phục bản AI
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Đóng
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? "Đã sao chép" : "Sao chép email"}
            </Button>
            <Button
              size="sm"
              onClick={handleOpenGmail}
              className="bg-red-600 hover:bg-red-700 text-white gap-1.5 shadow-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Mở trên Gmail
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
