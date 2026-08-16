import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "./Button";
import { Modal } from "./Modal";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "warning" | "destructive";
  detail?: ReactNode;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  variant = "primary",
  detail,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setError(null);
  }, [isOpen]);

  const confirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch {
      setError("Không thể hoàn tất thao tác. Dữ liệu trước đó vẫn được giữ nguyên.");
    } finally {
      setSubmitting(false);
    }
  };

  const destructive = variant === "destructive";
  const Icon = variant === "primary" ? ShieldCheck : AlertTriangle;

  return (
    <Modal isOpen={isOpen} onClose={submitting ? () => undefined : onClose} title={title} size="sm">
      <div className="flex items-start gap-4">
        <div className={variant === "primary" ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary" : "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700"}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-6 text-gray-600">{description}</p>
          {detail && <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">{detail}</div>}
        </div>
      </div>
      {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={submitting}>{cancelLabel}</Button>
        <Button
          variant={destructive ? "destructive" : "primary"}
          isLoading={submitting}
          onClick={() => void confirm()}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
