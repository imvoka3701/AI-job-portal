/**
 * Shared AI disclaimer — required on all AI-generated result displays.
 *
 * @param context - Loại output AI để hiển thị disclaimer phù hợp ngữ cảnh.
 *   - "evaluation"  : đánh giá CV tổng thể
 *   - "questions"   : câu hỏi phỏng vấn do AI gợi ý
 *   - "email"       : email nháp do AI sinh
 *   - "summary"     : tóm tắt CV theo JD
 *   - "cv"          : gợi ý nội dung CV Builder
 *   - "matching"    : điểm matching AI
 *   - undefined     : fallback chung
 */

type AIDisclaimerContext =
  | "evaluation"
  | "questions"
  | "email"
  | "summary"
  | "cv"
  | "matching";

const DISCLAIMER_MESSAGES: Record<AIDisclaimerContext, string> = {
  evaluation:
    "Đánh giá này do AI tạo ra và chỉ mang tính tham khảo. Điểm số phản ánh phân tích văn bản, không thay thế nhận xét của nhà tuyển dụng. Quyết định tuyển dụng cuối cùng do con người thực hiện.",
  questions:
    "Câu hỏi phỏng vấn được AI gợi ý dựa trên JD và CV — không phải đánh giá toàn diện về ứng viên. Người phỏng vấn cần điều chỉnh phù hợp và ra quyết định độc lập.",
  email:
    "Email này là bản nháp do AI soạn. Vui lòng đọc kỹ, chỉnh sửa nội dung và xác nhận thông tin trước khi gửi cho ứng viên. AI không gửi email thay bạn.",
  summary:
    "Tóm tắt này do AI phân tích văn bản CV và JD — có thể bỏ sót ngữ cảnh hoặc kinh nghiệm thực tế. Luôn xem xét toàn bộ hồ sơ trước khi đưa ra quyết định.",
  cv:
    "Gợi ý nội dung CV được tạo bởi AI dựa trên thông tin bạn nhập. AI không bịa thêm kinh nghiệm hay số liệu — bạn cần xem trước và xác nhận trước khi chèn vào CV.",
  matching:
    "Điểm phù hợp là kết quả so sánh văn bản tự động, chỉ mang tính tham khảo. AI không đánh giá được kinh nghiệm thực tế hay văn hóa làm việc. Quyết định tuyển dụng do con người thực hiện.",
};

const FALLBACK_MESSAGE =
  "Kết quả này được tạo bởi AI và chỉ mang tính tham khảo. Quyết định cuối cùng do con người thực hiện.";

export function AIDisclaimerBanner({
  context,
}: {
  context?: AIDisclaimerContext;
}) {
  const message = context ? DISCLAIMER_MESSAGES[context] : FALLBACK_MESSAGE;

  return (
    <div
      role="note"
      aria-label="Lưu ý về AI"
      className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700"
    >
      <svg
        className="h-4 w-4 shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}
