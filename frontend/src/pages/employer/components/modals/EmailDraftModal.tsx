import { useEffect, useRef, useState } from "react";
import { Check, Clipboard, RefreshCw, RotateCcw } from "lucide-react";
import { AIDisclaimerBanner, Button, Input, Modal, Spinner } from "@/components/ui";
import type { GenerateEmailResult } from "@/types/api";

interface EmailDraftModalProps {
  candidateName: string;
  isOpen: boolean;
  result: GenerateEmailResult | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onClose: () => void;
}

export function EmailDraftModal({
  candidateName,
  isOpen,
  result,
  loading,
  error,
  onRetry,
  onClose,
}: EmailDraftModalProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSubject(result?.subject ?? "");
    setBody(result?.body ?? "");
    setCopied(false);
    setCopyError(null);
  }, [result]);

  useEffect(() => () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);

  const resetDraft = () => {
    setSubject(result?.subject ?? "");
    setBody(result?.body ?? "");
    setCopied(false);
    setCopyError(null);
  };

  const copyDraft = async () => {
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(`Tiêu đề: ${subject}\n\n${body}`);
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      setCopyError("Không thể sao chép tự động. Vui lòng chọn và sao chép nội dung thủ công.");
    }
  };

  const hasChanges = result !== null && (subject !== result.subject || body !== result.body);
  const canCopy = subject.trim().length > 0 && body.trim().length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Soạn email — ${candidateName}`}
      size="lg"
    >
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
          <Spinner size="lg" color="blue" label="AI đang soạn email..." />
          <span className="text-sm text-gray-500">AI đang tạo bản nháp, có thể mất 10-15 giây...</span>
        </div>
      )}

      {!loading && error && (
        <div className="space-y-4">
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
          <Button variant="outline" onClick={onRetry} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Thử lại
          </Button>
        </div>
      )}

      {!loading && !error && result && (
        <div className="space-y-5">
          <AIDisclaimerBanner context="email" />

          <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
              <Clipboard className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Bản nháp chưa được gửi</p>
              <p className="mt-0.5 text-xs text-gray-500">
                Kiểm tra thời gian, địa điểm và cách xưng hô trước khi dùng nội dung này.
              </p>
            </div>
          </div>

          <Input
            id="ai-email-subject"
            label="Tiêu đề email"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            maxLength={255}
            hint={`${subject.length}/255 ký tự`}
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="ai-email-body" className="text-sm font-medium text-gray-700">
                Nội dung email
              </label>
              <span className="text-xs text-gray-400">{body.length} ký tự</span>
            </div>
            <textarea
              id="ai-email-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={9}
              className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm leading-6 text-gray-900 transition-colors placeholder:text-gray-400 hover:border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {copyError && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {copyError}
            </p>
          )}

          <div className="sticky bottom-[-16px] z-10 -mx-6 -mb-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-white px-6 pb-4 pt-4 shadow-sm">
            <p className="text-xs text-gray-500">
              {hasChanges ? "Bạn đang dùng phiên bản đã chỉnh sửa." : "Nội dung đang giữ nguyên bản AI."}
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>Đóng</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={resetDraft}
                disabled={!hasChanges}
                leftIcon={<RotateCcw className="h-4 w-4" />}
              >
                Khôi phục bản AI
              </Button>
              <Button
                type="button"
                onClick={() => void copyDraft()}
                disabled={!canCopy}
                leftIcon={copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
              >
                {copied ? "Đã sao chép" : "Sao chép email"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && !result && (
        <div className="space-y-4">
          <AIDisclaimerBanner context="email" />
          <p className="text-sm text-gray-600">Chưa có bản nháp. Hãy thử tạo lại nội dung email.</p>
          <Button variant="outline" onClick={onRetry} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Tạo bản nháp
          </Button>
        </div>
      )}
    </Modal>
  );
}
