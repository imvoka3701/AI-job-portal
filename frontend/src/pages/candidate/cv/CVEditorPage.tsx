import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  Plus,
  Printer,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button, Card, Input, Spinner } from "@/components/ui";
import { getApiErrorMessage } from "@/lib/axios";
import {
  createCvDocument,
  getCvDocument,
  updateCvDocument,
} from "@/lib/api/cvDocuments";
import {
  rewriteCvExperience,
  suggestCvSkills,
  suggestCvSummary,
} from "@/lib/api/ai";
import {
  CV_TEMPLATE_OPTIONS,
  createEmptyCvContent,
  type CvContent,
  type CvDocument,
  type CvExperience,
  type CvEducation,
  type CvProject,
} from "@/types/cvDocument";
import { CVPreview } from "./CVPreview";
import { AISuggestionPanel, type AISuggestionValue } from "./AISuggestionPanel";

const id = () => Math.random().toString(36).slice(2, 9);

function Textarea({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

export function CVEditorPage({
  previewOnly = false,
}: {
  previewOnly?: boolean;
}) {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState<CvDocument | null>(null);
  const [content, setContent] = useState<CvContent>(createEmptyCvContent());
  const [template, setTemplate] = useState(CV_TEMPLATE_OPTIONS[0].key);
  const [title, setTitle] = useState("CV của tôi");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "error">(
    "saved",
  );
  const [summaryAI, setSummaryAI] = useState<{ loading: boolean; error: string | null; suggestion: AISuggestionValue | null }>({ loading: false, error: null, suggestion: null });
  const [skillsAI, setSkillsAI] = useState<{ loading: boolean; error: string | null; suggestion: AISuggestionValue | null }>({ loading: false, error: null, suggestion: null });
  const [experienceAI, setExperienceAI] = useState<Record<string, { loading: boolean; error: string | null; suggestion: AISuggestionValue | null }>>({});
  /** Ngôn ngữ người dùng muốn AI gợi ý — vi: Tiếng Việt, en: English */
  const [aiLanguage, setAiLanguage] = useState<"vi" | "en">("vi");
  const saveTimer = useRef<number | undefined>(undefined);
  const loadedDocumentId = useRef<number | null>(null);

  useEffect(() => {
    const requestedDocumentId = routeId && routeId !== "new" ? Number(routeId) : null;
    if (requestedDocumentId && loadedDocumentId.current === requestedDocumentId) return;

    const load = async () => {
      try {
        const isNewDocument = !routeId || routeId === "new";
        const loaded = isNewDocument
          ? await createCvDocument()
          : await getCvDocument(Number(routeId));
        loadedDocumentId.current = loaded.id;
        setDocument(loaded);
        setContent(loaded.content_json);
        setTemplate(loaded.template_key);
        setTitle(loaded.title);
        if (isNewDocument) navigate(`/cv/${loaded.id}/edit`, { replace: true });
      } catch {
        setSaveState("error");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [navigate, routeId]);

  const save = async (
    nextContent = content,
    nextTemplate = template,
    nextTitle = title,
  ) => {
    if (!document) return;
    setIsSaving(true);
    setSaveState("dirty");
    try {
      const saved = await updateCvDocument(document.id, {
        title: nextTitle,
        template_key: nextTemplate,
        content_json: nextContent,
      });
      setDocument(saved);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    } finally {
      setIsSaving(false);
    }
  };

  const scheduleSave = (
    nextContent: CvContent,
    nextTemplate = template,
    nextTitle = title,
  ) => {
    setContent(nextContent);
    setSaveState("dirty");
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(
      () => save(nextContent, nextTemplate, nextTitle),
      700,
    );
  };

  const updatePersonal = (field: keyof CvContent["personal"], value: string) =>
    scheduleSave({
      ...content,
      personal: { ...content.personal, [field]: value },
    });
  const updateList = <K extends "skills" | "certifications" | "languages">(
    field: K,
    value: string,
  ) =>
    scheduleSave({
      ...content,
      [field]: value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    } as CvContent);
  const addExperience = () =>
    scheduleSave({
      ...content,
      experience: [
        ...content.experience,
        {
          id: id(),
          role: "",
          company: "",
          location: "",
          start_date: "",
          end_date: "",
          current: false,
          bullets: [""],
        },
      ],
    });
  const updateExperience = (itemId: string, patch: Partial<CvExperience>) =>
    scheduleSave({
      ...content,
      experience: content.experience.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    });
  const addEducation = () =>
    scheduleSave({
      ...content,
      education: [
        ...content.education,
        {
          id: id(),
          school: "",
          degree: "",
          start_date: "",
          end_date: "",
          details: "",
        },
      ],
    });
  const updateEducation = (itemId: string, patch: Partial<CvEducation>) =>
    scheduleSave({
      ...content,
      education: content.education.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    });
  const addProject = () =>
    scheduleSave({
      ...content,
      projects: [
        ...content.projects,
        { id: id(), name: "", description: "", url: "", technologies: [] },
      ],
    });
  const updateProject = (itemId: string, patch: Partial<CvProject>) =>
    scheduleSave({
      ...content,
      projects: content.projects.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    });
  const runSummarySuggestion = async () => {
    const role = content.personal.headline.trim();
    if (!document || !role) {
      setSummaryAI({ loading: false, error: "Nhập tiêu đề nghề nghiệp trong phần thông tin cá nhân trước.", suggestion: null });
      return;
    }
    setSummaryAI((state) => ({ ...state, loading: true, error: null }));
    try {
      const result = await suggestCvSummary(document.id, content.summary, role, aiLanguage);
      setSummaryAI({ loading: false, error: null, suggestion: { text: result.suggestion, rationale: result.rationale } });
    } catch (error) {
      setSummaryAI({ loading: false, error: getApiErrorMessage(error), suggestion: null });
    } finally {
      setSummaryAI((state) => ({ ...state, loading: false }));
    }
  };
  const runExperienceSuggestion = async (item: CvExperience) => {
    const role = content.personal.headline.trim();
    if (!document || !role) {
      setExperienceAI((state) => ({ ...state, [item.id]: { loading: false, error: "Nhập tiêu đề nghề nghiệp trước khi dùng AI.", suggestion: null } }));
      return;
    }
    const source = `${item.role} tại ${item.company}\n${item.bullets.filter(Boolean).join("\n")}`.trim();
    if (!item.role.trim() || !source) {
      setExperienceAI((state) => ({ ...state, [item.id]: { loading: false, error: "Nhập vị trí và ít nhất một nội dung kinh nghiệm trước.", suggestion: null } }));
      return;
    }
    setExperienceAI((state) => ({ ...state, [item.id]: { ...state[item.id], loading: true, error: null, suggestion: state[item.id]?.suggestion ?? null } }));
    try {
      const result = await rewriteCvExperience(document.id, source, role, aiLanguage);
      setExperienceAI((state) => ({ ...state, [item.id]: { loading: false, error: null, suggestion: { text: result.bullets.join("\n"), rationale: result.rationale } } }));
    } catch (error) {
      setExperienceAI((state) => ({ ...state, [item.id]: { loading: false, error: getApiErrorMessage(error), suggestion: null } }));
    } finally {
      setExperienceAI((state) => ({ ...state, [item.id]: { ...state[item.id], loading: false } }));
    }
  };
  const runSkillsSuggestion = async () => {
    const role = content.personal.headline.trim();
    if (!document || !role) {
      setSkillsAI({ loading: false, error: "Nhập tiêu đề nghề nghiệp trong phần thông tin cá nhân trước.", suggestion: null });
      return;
    }
    setSkillsAI((state) => ({ ...state, loading: true, error: null }));
    try {
      const result = await suggestCvSkills(document.id, content.skills, role, undefined, aiLanguage);
      setSkillsAI({ loading: false, error: null, suggestion: { text: result.skills.join(", "), rationale: result.rationale } });
    } catch (error) {
      setSkillsAI({ loading: false, error: getApiErrorMessage(error), suggestion: null });
    } finally {
      setSkillsAI((state) => ({ ...state, loading: false }));
    }
  };

  if (isLoading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" label="Đang tải CV" />
      </div>
    );
  if (!document)
    return (
      <div
        role="alert"
        className="mx-auto max-w-3xl p-8 text-center text-sm text-error"
      >
        Không thể tải CV.{" "}
        <Button variant="link" onClick={() => navigate("/cv")}>
          Quay lại
        </Button>
      </div>
    );

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          to="/cv"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Danh sách CV
        </Link>
        <div className="flex items-center gap-2">
          <span
            className={
              saveState === "error"
                ? "text-xs text-error"
                : "text-xs text-gray-500"
            }
          >
            {isSaving
              ? "Đang lưu..."
              : saveState === "saved"
                ? "Đã lưu"
                : saveState === "error"
                  ? "Lỗi lưu, thử lại"
                  : "Chưa lưu"}
          </span>
          {saveState === "error" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => save()}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Thử lại
            </Button>
          )}
          <Link to={`/cv/${document.id}/preview`}>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Eye className="h-4 w-4" />}
            >
              Xem trước
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="h-4 w-4" />}
          >
            Xuất PDF
          </Button>
        </div>
        {/* AI Language selector */}
        <div className="flex items-center gap-2 print:hidden">
          <span className="text-xs text-gray-500">Ngôn ngữ AI gợi ý:</span>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setAiLanguage("vi")}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                aiLanguage === "vi"
                  ? "bg-primary text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
              aria-pressed={aiLanguage === "vi"}
              title="Gợi ý bằng Tiếng Việt"
            >
              🇻🇳 Tiếng Việt
            </button>
            <button
              type="button"
              onClick={() => setAiLanguage("en")}
              className={`px-3 py-1 text-xs font-medium border-l border-gray-200 transition-colors ${
                aiLanguage === "en"
                  ? "bg-primary text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
              aria-pressed={aiLanguage === "en"}
              title="Gợi ý bằng English"
            >
              🇺🇸 English
            </button>
          </div>
        </div>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(420px,520px)_minmax(600px,1fr)]">
        {!previewOnly && (
          <Card className="space-y-6 p-5 print:hidden">
            <div>
              <Input
                label="Tên bản CV"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  scheduleSave(content, template, event.target.value);
                }}
              />
              <p className="mt-1 text-xs text-gray-500">
                Bản nháp được lưu tự động sau mỗi thay đổi.
              </p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Chọn mẫu</h2>
              <div className="mt-3 grid gap-2">
                {CV_TEMPLATE_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      setTemplate(option.key);
                      scheduleSave(content, option.key);
                    }}
                    className={`rounded-lg border p-3 text-left transition ${template === option.key ? "border-primary bg-primary-light" : "border-gray-200 hover:border-primary/50"}`}
                    aria-pressed={template === option.key}
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {option.name}
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-gray-900">
                Thông tin cá nhân
              </h2>
              {(
                [
                  "full_name",
                  "headline",
                  "email",
                  "phone",
                  "location",
                  "website",
                ] as const
              ).map((field) => (
                <Input
                  key={field}
                  label={
                    {
                      full_name: "Họ và tên",
                      headline: "Tiêu đề nghề nghiệp",
                      email: "Email",
                      phone: "Điện thoại",
                      location: "Địa điểm",
                      website: "Website",
                    }[field]
                  }
                  value={content.personal[field]}
                  onChange={(event) =>
                    updatePersonal(field, event.target.value)
                  }
                />
              ))}
            </section>
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">
                  Tóm tắt nghề nghiệp
                </h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={runSummarySuggestion}
                  isLoading={summaryAI.loading}
                  leftIcon={<Sparkles className="h-4 w-4" />}
                >
                  Gợi ý AI
                </Button>
              </div>
              <Textarea
                label="Tóm tắt nghề nghiệp"
                value={content.summary}
                onChange={(value) =>
                  scheduleSave({ ...content, summary: value })
                }
                placeholder="Tóm tắt ngắn gọn thế mạnh và mục tiêu của bạn"
              />
              <AISuggestionPanel
                error={summaryAI.error}
                suggestion={summaryAI.suggestion}
                onRetry={runSummarySuggestion}
                onDismiss={() => setSummaryAI((state) => ({ ...state, error: null, suggestion: null }))}
                onAccept={() => {
                  if (!summaryAI.suggestion) return;
                  scheduleSave({ ...content, summary: summaryAI.suggestion.text });
                  setSummaryAI((state) => ({ ...state, suggestion: null }));
                }}
              />
            </section>
            <section>
              <h2 className="text-sm font-semibold text-gray-900">
                Kỹ năng, ngôn ngữ, chứng chỉ
              </h2>
              <div className="mt-3 space-y-3">
                <Input
                  label="Kỹ năng (cách nhau bằng dấu phẩy)"
                  value={content.skills.join(", ")}
                  onChange={(event) => updateList("skills", event.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={runSkillsSuggestion}
                  isLoading={skillsAI.loading}
                  leftIcon={<Sparkles className="h-4 w-4" />}
                >
                  Gợi ý kỹ năng bằng AI
                </Button>
                <AISuggestionPanel
                  error={skillsAI.error}
                  suggestion={skillsAI.suggestion}
                  onRetry={runSkillsSuggestion}
                  onDismiss={() => setSkillsAI((state) => ({ ...state, error: null, suggestion: null }))}
                  onAccept={() => {
                    if (!skillsAI.suggestion) return;
                    scheduleSave({ ...content, skills: skillsAI.suggestion.text.split(",").map((item) => item.trim()).filter(Boolean) });
                    setSkillsAI((state) => ({ ...state, suggestion: null }));
                  }}
                />
                <Input
                  label="Ngôn ngữ"
                  value={content.languages.join(", ")}
                  onChange={(event) =>
                    updateList("languages", event.target.value)
                  }
                />
                <Input
                  label="Chứng chỉ"
                  value={content.certifications.join(", ")}
                  onChange={(event) =>
                    updateList("certifications", event.target.value)
                  }
                />
              </div>
            </section>
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">
                  Kinh nghiệm
                </h2>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addExperience}
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Thêm
                  </Button>
                </div>
              </div>
              <div className="mt-3 space-y-4">
                {content.experience.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-gray-200 p-3"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        label="Vị trí"
                        value={item.role}
                        onChange={(event) =>
                          updateExperience(item.id, {
                            role: event.target.value,
                          })
                        }
                      />
                      <Input
                        label="Công ty"
                        value={item.company}
                        onChange={(event) =>
                          updateExperience(item.id, {
                            company: event.target.value,
                          })
                        }
                      />
                      <Input
                        label="Bắt đầu"
                        value={item.start_date}
                        onChange={(event) =>
                          updateExperience(item.id, {
                            start_date: event.target.value,
                          })
                        }
                      />
                      <Input
                        label="Kết thúc"
                        value={item.end_date}
                        onChange={(event) =>
                          updateExperience(item.id, {
                            end_date: event.target.value,
                          })
                        }
                      />
                    </div>
                    <Textarea
                      label="Thành tựu (mỗi dòng một bullet)"
                      value={item.bullets.join("\n")}
                      onChange={(value) =>
                        updateExperience(item.id, {
                          bullets: value.split("\n"),
                        })
                      }
                      rows={3}
                    />
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runExperienceSuggestion(item)}
                        isLoading={experienceAI[item.id]?.loading}
                        leftIcon={<Sparkles className="h-4 w-4" />}
                      >
                        Viết lại bằng AI
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          scheduleSave({
                            ...content,
                            experience: content.experience.filter(
                              (entry) => entry.id !== item.id,
                            ),
                          })
                        }
                        leftIcon={<Trash2 className="h-4 w-4" />}
                      >
                        Xóa
                      </Button>
                    </div>
                    <div className="mt-3">
                      <AISuggestionPanel
                        error={experienceAI[item.id]?.error ?? null}
                        suggestion={experienceAI[item.id]?.suggestion ?? null}
                        onRetry={() => runExperienceSuggestion(item)}
                        onDismiss={() => setExperienceAI((state) => ({ ...state, [item.id]: { loading: false, error: null, suggestion: null } }))}
                        onAccept={() => {
                          const suggestion = experienceAI[item.id]?.suggestion;
                          if (!suggestion) return;
                          updateExperience(item.id, { bullets: suggestion.text.split("\n").map((bullet) => bullet.replace(/^[-•]\s*/, "").trim()).filter(Boolean) });
                          setExperienceAI((state) => ({ ...state, [item.id]: { loading: false, error: null, suggestion: null } }));
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Học vấn</h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addEducation}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Thêm
                </Button>
              </div>
              <div className="mt-3 space-y-4">
                {content.education.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-gray-200 p-3"
                  >
                    <Input
                      label="Trường"
                      value={item.school}
                      onChange={(event) =>
                        updateEducation(item.id, { school: event.target.value })
                      }
                    />
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Input
                        label="Bằng cấp"
                        value={item.degree}
                        onChange={(event) =>
                          updateEducation(item.id, {
                            degree: event.target.value,
                          })
                        }
                      />
                      <Input
                        label="Thời gian"
                        value={`${item.start_date} - ${item.end_date}`}
                        onChange={(event) =>
                          updateEducation(item.id, {
                            start_date: event.target.value,
                          })
                        }
                      />
                    </div>
                    <Textarea
                      label="Mô tả"
                      value={item.details}
                      onChange={(value) =>
                        updateEducation(item.id, { details: value })
                      }
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            </section>
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Dự án</h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addProject}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Thêm
                </Button>
              </div>
              <div className="mt-3 space-y-4">
                {content.projects.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-gray-200 p-3"
                  >
                    <Input
                      label="Tên dự án"
                      value={item.name}
                      onChange={(event) =>
                        updateProject(item.id, { name: event.target.value })
                      }
                    />
                    <Textarea
                      label="Mô tả"
                      value={item.description}
                      onChange={(value) =>
                        updateProject(item.id, { description: value })
                      }
                      rows={2}
                    />
                    <Input
                      label="Công nghệ"
                      value={item.technologies.join(", ")}
                      onChange={(event) =>
                        updateProject(item.id, {
                          technologies: event.target.value
                            .split(",")
                            .map((part) => part.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </section>
            <div className="rounded-lg border border-primary/20 bg-primary-light p-3 text-xs text-gray-700">
              <Sparkles className="mr-1 inline h-4 w-4 text-primary" />
              Nhập vị trí mục tiêu để AI gợi ý. AI chỉ tạo bản nháp, bạn quyết
              định có chèn vào CV hay không.
            </div>
          </Card>
        )}
        <div
          className={previewOnly ? "mx-auto w-full max-w-[794px]" : "min-w-0"}
        >
          <CVPreview content={content} template={template} />
        </div>
      </div>
    </div>
  );
}
