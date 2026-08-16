import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Input, Modal } from "@/components/ui";
import type { RecruitmentRequest, RecruitmentRequestPayload } from "@/types/company";


const requestSchema = z.object({
  title: z.string().min(5, "Tiêu đề cần ít nhất 5 ký tự"),
  headcount: z.number().int().min(1).max(100),
  job_type: z.enum(["full_time", "part_time", "internship", "freelance", "remote"]),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  reason: z.string().min(10, "Lý do cần ít nhất 10 ký tự"),
  responsibilities: z.string().min(20, "Trách nhiệm cần ít nhất 20 ký tự"),
  requirements: z.string().min(20, "Yêu cầu cần ít nhất 20 ký tự"),
  target_start_date: z.string().optional(),
});

type FormValues = z.infer<typeof requestSchema>;

interface RecruitmentRequestFormModalProps {
  open: boolean;
  request: RecruitmentRequest | null;
  departmentName: string;
  onClose: () => void;
  onSubmit: (payload: RecruitmentRequestPayload, submitNow: boolean) => Promise<void>;
}

const defaultValues: FormValues = {
  title: "",
  headcount: 1,
  job_type: "full_time",
  priority: "normal",
  reason: "",
  responsibilities: "",
  requirements: "",
  target_start_date: "",
};

export function RecruitmentRequestFormModal({
  open,
  request,
  departmentName,
  onClose,
  onSubmit,
}: RecruitmentRequestFormModalProps) {
  const [intent, setIntent] = useState<"draft" | "submit">("draft");
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(requestSchema), defaultValues });

  useEffect(() => {
    reset(request ? {
      title: request.title,
      headcount: request.headcount,
      job_type: request.job_type,
      priority: request.priority,
      reason: request.reason,
      responsibilities: request.responsibilities,
      requirements: request.requirements,
      target_start_date: request.target_start_date ?? "",
    } : defaultValues);
    setError(null);
    setIntent("draft");
  }, [open, request, reset]);

  const persist = async (values: FormValues, submitNow: boolean) => {
    setError(null);
    try {
      await onSubmit(
        {
          ...values,
          target_start_date: values.target_start_date || undefined,
          submit: !request && submitNow,
        },
        submitNow,
      );
      onClose();
    } catch {
      setError("Không thể lưu nhu cầu tuyển dụng. Vui lòng kiểm tra dữ liệu và thử lại.");
    }
  };

  const saveDraft = handleSubmit((values) => persist(values, false));
  const sendForReview = handleSubmit((values) => persist(values, true));

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={request ? "Chỉnh sửa nhu cầu tuyển dụng" : "Tạo nhu cầu tuyển dụng"}
      size="lg"
    >
      <form className="space-y-5" onSubmit={saveDraft}>
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs font-medium uppercase text-gray-400">Phòng ban đề xuất</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{departmentName}</p>
        </div>

        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <Input label="Vị trí cần tuyển" {...register("title")} error={errors.title?.message} />
          <Input label="Số lượng" type="number" min={1} max={100} {...register("headcount", { valueAsNumber: true })} error={errors.headcount?.message} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField label="Hình thức" error={errors.job_type?.message} selectProps={register("job_type")} options={[
            ["full_time", "Full-time"], ["part_time", "Part-time"], ["internship", "Thực tập"], ["freelance", "Freelance"], ["remote", "Remote"],
          ]} />
          <SelectField label="Mức ưu tiên" error={errors.priority?.message} selectProps={register("priority")} options={[
            ["low", "Thấp"], ["normal", "Bình thường"], ["high", "Cao"], ["urgent", "Khẩn cấp"],
          ]} />
          <Input label="Ngày mong muốn nhận việc" type="date" {...register("target_start_date")} error={errors.target_start_date?.message} />
        </div>

        <TextAreaField label="Lý do tuyển dụng" hint="Nêu rõ nhu cầu tăng trưởng, thay thế hoặc năng lực còn thiếu." error={errors.reason?.message} textareaProps={register("reason")} />
        <TextAreaField label="Trách nhiệm chính" error={errors.responsibilities?.message} textareaProps={register("responsibilities")} />
        <TextAreaField label="Yêu cầu chuyên môn" error={errors.requirements?.message} textareaProps={register("requirements")} />

        <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Hủy</Button>
          <Button type="submit" variant="outline" isLoading={isSubmitting && intent === "draft"} onClick={() => setIntent("draft")}>Lưu nháp</Button>
          <Button type="button" isLoading={isSubmitting && intent === "submit"} onClick={() => { setIntent("submit"); void sendForReview(); }}>{request ? "Lưu và gửi lại" : "Gửi HR duyệt"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function SelectField({ label, options, selectProps, error }: { label: string; options: [string, string][]; selectProps: React.SelectHTMLAttributes<HTMLSelectElement>; error?: string }) {
  const fieldId = `recruitment-request-${String(selectProps.name)}`;
  const errorId = `${fieldId}-error`;
  return <div><label htmlFor={fieldId} className="mb-2 block text-sm font-medium text-gray-700">{label}</label><select {...selectProps} id={fieldId} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select>{error && <p id={errorId} className="mt-1 text-xs text-red-600">{error}</p>}</div>;
}

function TextAreaField({ label, hint, textareaProps, error }: { label: string; hint?: string; textareaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement>; error?: string }) {
  const fieldId = `recruitment-request-${String(textareaProps.name)}`;
  const descriptionId = `${fieldId}-${error ? "error" : "hint"}`;
  return <div><label htmlFor={fieldId} className="mb-2 block text-sm font-medium text-gray-700">{label}</label><textarea {...textareaProps} id={fieldId} rows={3} aria-invalid={Boolean(error)} aria-describedby={error || hint ? descriptionId : undefined} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />{hint && !error && <p id={descriptionId} className="mt-1 text-xs text-gray-400">{hint}</p>}{error && <p id={descriptionId} className="mt-1 text-xs text-red-600">{error}</p>}</div>;
}
