import { useEffect, useRef, useState } from "react";
import { ChevronDown, FileText, Mail, MessageSquareText, Radar } from "lucide-react";
import { Button } from "@/components/ui";
import type { EmployerApplication } from "@/types/application";
import { cn } from "@/lib/utils";

interface EmployerAIActionMenuProps {
  application: EmployerApplication | null;
  onSummarize: (app: EmployerApplication) => void;
  onGenerateQuestions: (app: EmployerApplication) => void;
  onGenerateEmail: (app: EmployerApplication) => void;
  onEvaluate: (app: EmployerApplication) => void;
  disabled?: boolean;
}

export function EmployerAIActionMenu({
  application,
  onSummarize,
  onGenerateQuestions,
  onGenerateEmail,
  onEvaluate,
  disabled = false,
}: EmployerAIActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleAction = (action: (app: EmployerApplication) => void) => {
    if (!application) return;
    setIsOpen(false);
    action(application);
  };

  return (
    <div className="relative" ref={menuRef}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        rightIcon={<ChevronDown className="w-3.5 h-3.5" />}
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={disabled || !application}
      >
        AI Actions
      </Button>

      {isOpen && application && (
        <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <button
            type="button"
            onClick={() => handleAction(onSummarize)}
            className={cn(
              "flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700",
              "hover:bg-gray-50"
            )}
          >
            <FileText className="w-4 h-4 text-primary" />
            Tóm tắt CV
          </button>
          <button
            type="button"
            onClick={() => handleAction(onGenerateQuestions)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            <MessageSquareText className="w-4 h-4 text-primary" />
            Câu hỏi phỏng vấn
          </button>
          <button
            type="button"
            onClick={() => handleAction(onGenerateEmail)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            <Mail className="w-4 h-4 text-primary" />
            Soạn email
          </button>
          <button
            type="button"
            onClick={() => handleAction(onEvaluate)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            <Radar className="w-4 h-4 text-primary" />
            Đánh giá CV
          </button>
        </div>
      )}
    </div>
  );
}
