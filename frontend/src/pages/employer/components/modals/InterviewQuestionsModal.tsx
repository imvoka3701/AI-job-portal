/**
 * InterviewQuestionsModal — tách từ EmployerCandidatesPage để dễ bảo trì.
 *
 * Tính năng:
 * - Chọn kỹ năng cần đánh giá (multi-select badge)
 * - Giữ lại kỹ năng đã chọn khi đóng modal (chỉ clear result, không clear skills)
 * - Kết quả hiển thị grouped theo từng kỹ năng
 * - Copy all, Tạo lại, Retry
 */
import { useCallback } from "react";
import { Clipboard, RefreshCw } from "lucide-react";
import { AIDisclaimerBanner, Badge, Button, Modal, Spinner } from "@/components/ui";
import type { InterviewQuestionsResult } from "@/types/api";

interface InterviewQuestionsModalProps {
  /** null = modal đóng */
  target: { candidateName: string; resumeId: number; jobId: number } | null;
  /** Kỹ năng trích từ JD của job đang chọn */
  extractedSkills: string[];
  /** Kỹ năng người dùng đang chọn — được giữ lại khi đóng/mở lại */
  selectedSkills: string[];
  onSkillToggle: (skill: string) => void;
  result: InterviewQuestionsResult | null;
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
  /** Chỉ clear result & error, KHÔNG clear selectedSkills */
  onClose: () => void;
}

/** Group câu hỏi theo skill_related */
function groupBySkill(
  questions: InterviewQuestionsResult["questions"],
): Map<string, InterviewQuestionsResult["questions"]> {
  const map = new Map<string, InterviewQuestionsResult["questions"]>();
  for (const q of questions) {
    const list = map.get(q.skill_related) ?? [];
    list.push(q);
    map.set(q.skill_related, list);
  }
  return map;
}

export function InterviewQuestionsModal({
  target,
  extractedSkills,
  selectedSkills,
  onSkillToggle,
  result,
  loading,
  error,
  onGenerate,
  onClose,
}: InterviewQuestionsModalProps) {
  const copyAll = useCallback(async () => {
    if (!result) return;
    const text = result.questions
      .map(
        (q, i) =>
          `${i + 1}. ${q.question}\n   Kỹ năng: ${q.skill_related}\n   Mục đích: ${q.purpose}`,
      )
      .join("\n\n");
    await navigator.clipboard.writeText(text);
  }, [result]);

  const grouped = result ? groupBySkill(result.questions) : null;

  return (
    <Modal
      isOpen={target !== null}
      onClose={onClose}
      title={`Chuẩn bị câu hỏi phỏng vấn — ${target?.candidateName ?? ""}`}
    >
      <AIDisclaimerBanner context="questions" />

      <div className="mt-4 space-y-4">
        {/* ── Bước 1: chọn kỹ năng ── */}
        {!loading && !error && !result && (
          <>
            <p className="text-sm text-gray-600">
              Chọn các kỹ năng bạn muốn đánh giá khi phỏng vấn ứng viên.
            </p>
            {extractedSkills.length === 0 ? (
              <p className="text-sm text-gray-500">
                Không tìm thấy kỹ năng nào trong mô tả công việc.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {extractedSkills.map((skill) => (
                  <label
                    key={skill}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedSkills.includes(skill)
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selectedSkills.includes(skill)}
                      onChange={() => onSkillToggle(skill)}
                    />
                    {skill}
                  </label>
                ))}
              </div>
            )}
            <Button
              variant="primary"
              size="sm"
              disabled={selectedSkills.length === 0}
              onClick={onGenerate}
            >
              Tạo câu hỏi ({selectedSkills.length} kỹ năng được chọn)
            </Button>
          </>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <Spinner size="lg" color="blue" label="AI đang tạo câu hỏi..." />
            <span className="text-sm text-gray-500">
              AI đang tạo câu hỏi phỏng vấn, có thể mất 10-15 giây...
            </span>
          </div>
        )}

        {/* ── Error + Retry ── */}
        {!loading && error && (
          <div className="space-y-3">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
            {/* Hiện lại skill selector để người dùng có thể điều chỉnh rồi retry */}
            <div className="flex flex-wrap gap-2">
              {extractedSkills.map((skill) => (
                <label
                  key={skill}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedSkills.includes(skill)
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selectedSkills.includes(skill)}
                    onChange={() => onSkillToggle(skill)}
                  />
                  {skill}
                </label>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onGenerate}
              disabled={selectedSkills.length === 0}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Thử lại
            </Button>
          </div>
        )}

        {/* ── Kết quả — grouped by skill ── */}
        {!loading && !error && result && grouped && (
          <div className="space-y-3">
            {/* Actions bar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-gray-500">
                {result.questions.length} câu hỏi ·{" "}
                {selectedSkills.length} kỹ năng
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onGenerate}
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                >
                  Tạo lại
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={copyAll}
                  leftIcon={<Clipboard className="h-4 w-4" />}
                >
                  Copy tất cả
                </Button>
              </div>
            </div>

            {/* Grouped question cards */}
            <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
              {[...grouped.entries()].map(([skill, questions]) => (
                <div key={skill}>
                  {/* Skill group header */}
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="primary" size="sm">
                      {skill}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {questions.length} câu
                    </span>
                  </div>

                  {/* Questions in this skill */}
                  <div className="space-y-2 pl-1">
                    {questions.map((q, qIdx) => (
                      <div
                        key={qIdx}
                        className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                            {qIdx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 leading-relaxed">
                              {q.question}
                            </p>
                            <div className="mt-2 flex items-start gap-1.5">
                              <span className="shrink-0 text-xs font-medium text-gray-400">
                                Mục đích:
                              </span>
                              <span className="text-xs text-gray-500 leading-relaxed">
                                {q.purpose}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end border-t border-gray-100 pt-4">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </Modal>
  );
}
