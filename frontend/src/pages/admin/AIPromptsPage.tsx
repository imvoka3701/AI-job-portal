import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Brain,
  Map,
  FileText,
  MessageSquare,
  Mail,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Lock,
  Pencil,
  CalendarCheck,
  ShieldAlert,
  PartyPopper,
} from "lucide-react";
import { Badge, Button, Skeleton } from "@/components/ui";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { AdminTabNavigation } from "./components/AdminTabNavigation";
import { SEOMeta } from "@/components/seo/SEOMeta";
import {
  getAIPrompts,
  updateAIPrompt,
  testAIPrompt,
  type AIFeature,
  type AIPromptConfig,
} from "@/lib/api/adminAI";

// ── Feature metadata ───────────────────────────────────────────────────────────

interface FeatureMeta {
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const FEATURE_META: Record<AIFeature, FeatureMeta> = {
  cv_evaluate: {
    label: "Đánh giá CV",
    description: "Phân tích và chấm điểm CV ứng viên so với yêu cầu công việc",
    icon: Brain,
    color: "text-purple-600",
  },
  roadmap: {
    label: "Lộ trình sự nghiệp",
    description: "Gợi ý lộ trình phát triển kỹ năng cá nhân hoá",
    icon: Map,
    color: "text-blue-600",
  },
  summarize_cv: {
    label: "Tóm tắt CV",
    description: "Tóm tắt nội dung CV thành đoạn văn ngắn gọn",
    icon: FileText,
    color: "text-primary",
  },
  interview_questions: {
    label: "Câu hỏi phỏng vấn",
    description: "Sinh tự động câu hỏi phỏng vấn phù hợp cho từng vị trí",
    icon: MessageSquare,
    color: "text-warning",
  },
  generate_email: {
    label: "Soạn email tuyển dụng",
    description: "Tạo mẫu email mời phỏng vấn, từ chối, hoặc offer chuyên nghiệp",
    icon: Mail,
    color: "text-error",
  },
};

const ORDERED_FEATURES: AIFeature[] = [
  "cv_evaluate",
  "roadmap",
  "summarize_cv",
  "interview_questions",
  "generate_email",
];

// ── Email — hardcoded type rules (mirrors EMAIL_TYPE_SYSTEM_RULES in email_generator.py)
// Display-only summaries — do NOT edit here unless the backend rule changes.
const EMAIL_TYPE_RULE_SUMMARIES: {
  type: string;
  icon: React.ElementType;
  iconColor: string;
  summary: string;
  highlight?: boolean;
}[] = [
  {
    type: "Mời phỏng vấn (invite)",
    icon: CalendarCheck,
    iconColor: "text-blue-600",
    summary:
      "Dùng placeholder [Ngày giờ], [Địa điểm/Hình thức] — không tự bịa thông tin. Kết thúc bằng lời nhắn xác nhận.",
  },
  {
    type: "Từ chối (reject)",
    icon: ShieldAlert,
    iconColor: "text-error",
    summary:
      "Không nêu lý do cụ thể, không đề cập tuổi tác/giới tính/dân tộc/tôn giáo. Giữ thiện chí, mời ứng tuyển lại.",
    highlight: true,
  },
  {
    type: "Thông báo trúng tuyển (offer)",
    icon: PartyPopper,
    iconColor: "text-primary",
    summary:
      "Giọng điệu chúc mừng. Dùng placeholder [Ngày bắt đầu], [Mức lương] — không tự bịa số liệu.",
  },
];

const EMAIL_TEST_TYPES = [
  { value: "invite", label: "Mời phỏng vấn" },
  { value: "reject", label: "Từ chối" },
  { value: "offer", label: "Thông báo trúng tuyển" },
] as const;

type EmailTestType = (typeof EMAIL_TEST_TYPES)[number]["value"];

// ── Main Page ──────────────────────────────────────────────────────────────────

export function AIPromptsPage() {
  const [prompts, setPrompts] = useState<AIPromptConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFeature, setExpandedFeature] = useState<AIFeature | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAIPrompts();
      setPrompts(data);
    } catch {
      setError("Không thể tải danh sách prompt. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = (feature: AIFeature) => {
    setExpandedFeature((prev) => (prev === feature ? null : feature));
  };

  const handleSaved = (updated: AIPromptConfig) => {
    setPrompts((prev) =>
      prev.map((p) => (p.feature === updated.feature ? updated : p)),
    );
    setExpandedFeature(null);
  };

  return (
    <>
      <SEOMeta title="Quản lý AI Prompt — Admin" description="Chỉnh sửa system prompt cho các tính năng AI" />
      <div className="min-h-screen bg-[#F8FAFC] font-sans px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-5">

          {/* Hero Header */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-7 text-white relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
            <div className="absolute -top-16 -right-16 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 border border-purple-400/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Admin · AI Engine</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Quản lý AI Prompt</h1>
                <p className="text-slate-400 text-sm mt-0.5">Chỉnh sửa system prompt cho từng tính năng AI. Hệ thống tự động dùng lại prompt gốc nếu bạn để trống.</p>
              </div>
            </div>
          </div>

          <AdminTabNavigation />

          {/* Loading */}
          {loading && (
            <div className="space-y-3" aria-label="Đang tải">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-xl" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && <ErrorState message={error} onRetry={load} />}

          {/* Empty */}
          {!loading && !error && prompts.length === 0 && (
            <EmptyState
              title="Chưa có prompt nào"
              description="Hệ thống chưa tạo cấu hình prompt. Vui lòng kiểm tra migration."
            />
          )}

          {/* Feature list */}
          {!loading && !error && prompts.length > 0 && (
            <div className="space-y-3">
              {ORDERED_FEATURES.map((feature) => {
                const prompt = prompts.find((p) => p.feature === feature);
                if (!prompt) return null;

                const meta = FEATURE_META[feature];
                const Icon = meta.icon;
                const isExpanded = expandedFeature === feature;
                const cardClass = isExpanded
                  ? "overflow-hidden border border-[#00B86B]/40 shadow-md transition-all duration-200 bg-white rounded-2xl"
                  : "overflow-hidden border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all duration-200 bg-white rounded-2xl";
                const iconWrapClass = `w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 ${meta.color}`;

                return (
                  <motion.div key={feature} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <div className={cardClass}>
                      {/* Row header — clickable */}
                      <button
                        type="button"
                        id={`prompt-toggle-${feature}`}
                        aria-expanded={isExpanded}
                        aria-controls={`prompt-body-${feature}`}
                        className="w-full text-left px-5 py-4 flex items-center gap-4 group"
                        onClick={() => handleToggle(feature)}
                      >
                        <div className={iconWrapClass}>
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">
                            {meta.label}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {meta.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {/* Email badge — persona indicator */}
                          {feature === "generate_email" && (
                            <Badge variant="info" className="text-xs gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              Persona + Quy tắc cố định
                            </Badge>
                          )}
                          <Badge
                            variant={isExpanded ? "warning" : "success"}
                            dot
                            className="text-xs"
                          >
                            {isExpanded ? "Đang chỉnh sửa" : "Đang dùng"}
                          </Badge>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                          )}
                        </div>
                      </button>

                      {/* Expanded body */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            id={`prompt-body-${feature}`}
                            role="region"
                            aria-labelledby={`prompt-toggle-${feature}`}
                            key="body"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            {feature === "generate_email" ? (
                              <EmailPromptEditForm
                                prompt={prompt}
                                onSaved={handleSaved}
                                onCancel={() => setExpandedFeature(null)}
                              />
                            ) : (
                              <PromptEditForm
                                prompt={prompt}
                                onSaved={handleSaved}
                                onCancel={() => setExpandedFeature(null)}
                              />
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── PromptEditForm — 4 feature thường ─────────────────────────────────────────

interface PromptEditFormProps {
  prompt: AIPromptConfig;
  onSaved: (updated: AIPromptConfig) => void;
  onCancel: () => void;
}

function PromptEditForm({ prompt, onSaved, onCancel }: PromptEditFormProps) {
  const [systemPrompt, setSystemPrompt] = useState(prompt.system_prompt);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testedAtLeastOnce, setTestedAtLeastOnce] = useState(false);

  const handleChange = (val: string) => {
    setSystemPrompt(val);
    setTestedAtLeastOnce(false);
    setTestResult(null);
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testAIPrompt(prompt.feature, { system_prompt: systemPrompt });
      setTestResult(result.ai_response);
      setTestedAtLeastOnce(true);
      toast.success(`Test thành công (${result.duration_ms}ms)`);
    } catch {
      toast.error("Test thất bại. Vui lòng thử lại.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await updateAIPrompt(prompt.feature, { system_prompt: systemPrompt });
      toast.success("Đã lưu prompt mới thành công!");
      onSaved(updated);
    } catch {
      toast.error("Lưu thất bại. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="border-t border-gray-100 px-5 py-4 space-y-4 bg-gray-50/50">
      <div>
        <label
          htmlFor={`textarea-${prompt.feature}`}
          className="text-xs font-medium text-gray-600 block mb-1.5"
        >
          System Prompt
        </label>
        <textarea
          id={`textarea-${prompt.feature}`}
          rows={8}
          value={systemPrompt}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Nhập system prompt..."
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        />
        <p className="text-xs text-gray-400 mt-1">
          Nếu để trống, hệ thống tự dùng lại prompt gốc đang chạy ổn định.
        </p>
      </div>

      <TestResultBox testResult={testResult} />

      <FormActions
        featureId={prompt.feature}
        isTesting={isTesting}
        isSaving={isSaving}
        testedAtLeastOnce={testedAtLeastOnce}
        disableTest={!systemPrompt.trim()}
        onTest={handleTest}
        onSave={handleSave}
        onCancel={onCancel}
      />
    </div>
  );
}

// ── EmailPromptEditForm — generate_email (Persona pattern) ────────────────────

function EmailPromptEditForm({ prompt, onSaved, onCancel }: PromptEditFormProps) {
  const [persona, setPersona] = useState(prompt.system_prompt);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testedAtLeastOnce, setTestedAtLeastOnce] = useState(false);
  const [selectedEmailType, setSelectedEmailType] = useState<EmailTestType>("invite");

  const handleChange = (val: string) => {
    setPersona(val);
    setTestedAtLeastOnce(false);
    setTestResult(null);
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      // Backend /test endpoint nhận system_prompt = Persona; loại email được gửi qua sample_input
      const result = await testAIPrompt(prompt.feature, {
        system_prompt: persona,
        // Truyền loại email qua user_prompt_template field để backend phân biệt
        user_prompt_template: selectedEmailType,
      });
      setTestResult(result.ai_response);
      setTestedAtLeastOnce(true);
      toast.success(`Test "${selectedEmailType}" thành công (${result.duration_ms}ms)`);
    } catch {
      toast.error("Test thất bại. Vui lòng thử lại.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await updateAIPrompt(prompt.feature, { system_prompt: persona });
      toast.success("Đã lưu Persona mới thành công!");
      onSaved(updated);
    } catch {
      toast.error("Lưu thất bại. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="border-t border-gray-100 px-5 py-4 space-y-5 bg-gray-50/50">

      {/* PHẦN 1 — Persona chung (Admin chỉnh được) */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Pencil className="w-3.5 h-3.5 text-primary" />
          <label
            htmlFor="textarea-generate_email-persona"
            className="text-xs font-semibold text-primary"
          >
            Persona chung — Admin chỉnh được
          </label>
        </div>
        <textarea
          id="textarea-generate_email-persona"
          rows={6}
          value={persona}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Mô tả tính cách, phong cách viết, ngôn ngữ của AI khi soạn email..."
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        />
        <p className="text-xs text-gray-400 mt-1">
          Persona kiểm soát tone, ngôn ngữ và phong cách chung. Quy tắc riêng cho từng loại email
          được gắn tự động bên dưới — không cần và không nên lặp lại ở đây.
        </p>
      </div>

      {/* PHẦN 2 — Quy tắc cố định (hardcode, không sửa qua UI) */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
          <Lock className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs font-semibold text-gray-600">
            Quy tắc riêng theo loại email — khóa cứng, không sửa qua UI
          </span>
        </div>

        {/* Rules list */}
        <div className="divide-y divide-gray-100">
          {EMAIL_TYPE_RULE_SUMMARIES.map((rule) => {
            const RuleIcon = rule.icon;
            return (
              <div
                key={rule.type}
                className={`flex gap-3 px-4 py-3 ${
                  rule.highlight
                    ? "border-l-2 border-error bg-red-50/40"
                    : "border-l-2 border-gray-200"
                }`}
              >
                <RuleIcon className={`w-4 h-4 shrink-0 mt-0.5 ${rule.iconColor}`} />
                <div className="min-w-0">
                  <p
                    className={`text-xs font-semibold mb-0.5 ${
                      rule.highlight ? "text-error" : "text-gray-700"
                    }`}
                  >
                    {rule.type}
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">{rule.summary}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legal note */}
        <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-100">
          <p className="text-xs text-amber-700 leading-relaxed">
            <span className="font-semibold">Tại sao khóa?</span>{" "}
            Đặc biệt với email từ chối — nêu lý do cụ thể hoặc đề cập đặc điểm cá nhân có thể tạo
            ra bằng chứng phân biệt đối xử trong tuyển dụng. Các quy tắc này được lưu trực tiếp
            trong mã nguồn backend để Admin không thể vô tình xóa qua giao diện.
          </p>
        </div>
      </div>

      {/* Test result */}
      <TestResultBox testResult={testResult} />

      {/* Actions — có thêm selector loại email trước nút Test */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Email type selector */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="email-test-type" className="text-xs text-gray-500 whitespace-nowrap">
              Test loại:
            </label>
            <select
              id="email-test-type"
              value={selectedEmailType}
              onChange={(e) => setSelectedEmailType(e.target.value as EmailTestType)}
              className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            >
              {EMAIL_TEST_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <Button
            id="btn-test-generate_email"
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={isTesting || !persona.trim()}
          >
            {isTesting ? "Đang test..." : "Test thử"}
          </Button>

          <Button
            id="btn-save-generate_email"
            size="sm"
            onClick={handleSave}
            disabled={!testedAtLeastOnce || isSaving}
            title={!testedAtLeastOnce ? "Hãy test thử ít nhất 1 lần trước khi lưu" : undefined}
          >
            {isSaving ? "Đang lưu..." : "Lưu Persona"}
          </Button>
        </div>

        <Button
          id="btn-cancel-generate_email"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isSaving || isTesting}
        >
          Huỷ
        </Button>
      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function TestResultBox({ testResult }: { testResult: string | null }) {
  if (!testResult) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-green-200 bg-green-50 p-3"
    >
      <p className="text-xs font-semibold text-green-700 mb-1.5 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" />
        Kết quả test thử
      </p>
      <p className="text-xs text-green-900 whitespace-pre-wrap leading-relaxed">{testResult}</p>
    </motion.div>
  );
}

interface FormActionsProps {
  featureId: string;
  isTesting: boolean;
  isSaving: boolean;
  testedAtLeastOnce: boolean;
  disableTest: boolean;
  onTest: () => void;
  onSave: () => void;
  onCancel: () => void;
}

function FormActions({
  featureId,
  isTesting,
  isSaving,
  testedAtLeastOnce,
  disableTest,
  onTest,
  onSave,
  onCancel,
}: FormActionsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <Button
          id={`btn-test-${featureId}`}
          variant="outline"
          size="sm"
          onClick={onTest}
          disabled={isTesting || disableTest}
        >
          {isTesting ? "Đang test..." : "Test thử"}
        </Button>
        <Button
          id={`btn-save-${featureId}`}
          size="sm"
          onClick={onSave}
          disabled={!testedAtLeastOnce || isSaving}
          title={!testedAtLeastOnce ? "Hãy test thử ít nhất 1 lần trước khi lưu" : undefined}
        >
          {isSaving ? "Đang lưu..." : "Lưu"}
        </Button>
      </div>
      <Button
        id={`btn-cancel-${featureId}`}
        variant="ghost"
        size="sm"
        onClick={onCancel}
        disabled={isSaving || isTesting}
      >
        Huỷ
      </Button>
    </div>
  );
}
