import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquareHeart,
  X,
  Star,
  Send,
  CheckCircle2,
  Bug,
  Lightbulb,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { useUser } from "@/stores/authStore";
import { submitFeedback, type FeedbackType } from "@/lib/api/feedback";

interface UserFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId?: string;
  targetType?: string;
  initialType?: FeedbackType;
}

export function UserFeedbackModal({
  isOpen,
  onClose,
  targetId,
  targetType,
  initialType = "general",
}: UserFeedbackModalProps) {
  const user = useUser();
  const [senderName, setSenderName] = useState(user?.full_name || "");
  const [senderEmail, setSenderEmail] = useState(user?.email || "");
  const [senderPhone, setSenderPhone] = useState("");
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(initialType);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !senderEmail.trim() || !title.trim() || !content.trim()) {
      setErrorMsg("Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await submitFeedback({
        sender_name: senderName.trim(),
        sender_email: senderEmail.trim(),
        sender_phone: senderPhone.trim() || undefined,
        feedback_type: feedbackType,
        title: title.trim(),
        content: content.trim(),
        rating,
        target_id: targetId,
        target_type: targetType,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setTitle("");
        setContent("");
        onClose();
      }, 2500);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      setErrorMsg("Không thể gửi phản hồi. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#00995C]">
                <MessageSquareHeart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Đóng Góp Ý Kiến & Báo Lỗi</h3>
                <p className="text-xs text-slate-500">Phản hồi của bạn giúp AI Job Portal ngày càng hoàn thiện</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          {submitted ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-[#00995C]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-slate-900">Cảm ơn bạn đã phản hồi!</h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                Ý kiến của bạn đã được chuyển thẳng tới Ban Quản Trị để xem xét và xử lý sớm nhất.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                  {errorMsg}
                </div>
              )}

              {/* Persona Rating stars */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Đánh giá mức độ hài lòng của bạn:
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 text-slate-300 hover:text-amber-400 transition-colors"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= (hoverRating || rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">
                    {rating === 5
                      ? "Tuyệt vời ⭐⭐⭐⭐⭐"
                      : rating === 4
                      ? "Tốt ⭐⭐⭐⭐"
                      : rating === 3
                      ? "Bình thường ⭐⭐⭐"
                      : rating === 2
                      ? "Cần cải thiện ⭐⭐"
                      : "Không hài lòng ⭐"}
                  </span>
                </div>
              </div>

              {/* Feedback Category */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Loại phản hồi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "general", label: "Góp ý chung", icon: MessageSquareHeart },
                    { id: "bug_report", label: "Báo lỗi kỹ thuật", icon: Bug },
                    { id: "feature_request", label: "Đề xuất tính năng", icon: Lightbulb },
                    { id: "ai_experience", label: "Trải nghiệm AI", icon: Sparkles },
                    { id: "job_report", label: "Khiếu nại tin đăng", icon: ShieldAlert },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSel = feedbackType === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFeedbackType(cat.id as FeedbackType)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                          isSel
                            ? "border-emerald-500 bg-emerald-50 text-[#00995C] shadow-xs font-bold"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sender Name, Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Họ tên của bạn <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00B86B]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Email liên hệ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00B86B]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00B86B]/30"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tiêu đề tóm tắt <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Gợi ý CV chưa chuẩn với vị trí Senior..."
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00B86B]/30"
                />
              </div>

              {/* Content */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nội dung chi tiết <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Mô tả cụ thể trải nghiệm hoặc lỗi bạn gặp phải..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00B86B]/30"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#00B86B] hover:bg-[#00995C] shadow-xs shadow-[#00B86B]/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? "Đang gửi..." : "Gửi phản hồi"}</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
