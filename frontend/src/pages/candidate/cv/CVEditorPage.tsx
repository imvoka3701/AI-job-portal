import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Printer,
  Sparkles,
  Trash2,
  CheckCircle,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Code,
  User,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Zap,
  Globe,
  LayoutTemplate,
  Copy,
  Flame,
  Check,
  Camera,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Palette,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button, Input, Spinner } from "@/components/ui";
import { getApiErrorMessage } from "@/lib/axios";
import { useUser } from "@/stores/authStore";
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
  type CvTemplateKey,
} from "@/types/cvDocument";
import { CVPreview } from "./CVPreview";
import { AISuggestionPanel, type AISuggestionValue } from "./AISuggestionPanel";
import { TagInput } from "./components/TagInput";

const id = () => Math.random().toString(36).slice(2, 9);

// Professional Sample CV Data (Senior Fullstack / AI Engineer)
const SAMPLE_TECH_CV: CvContent = {
  version: 1,
  personal: {
    full_name: "Nguyễn Đức Trọng",
    headline: "Senior Full-Stack & AI Engineer",
    email: "ductrong.dev@gmail.com",
    phone: "+84 987 654 321",
    location: "Hà Nội, Việt Nam",
    website: "https://github.com/ductrong-tech",
    avatar_url: "",
    show_avatar: true,
  },
  summary:
    "Kỹ sư phần mềm 4+ năm kinh nghiệm chuyên sâu về React 19, TypeScript, Python FastAPI và kiến trúc Microservices. Đã dẫn dắt xây dựng hệ thống AI Matching xử lý 50,000+ hồ sơ/tháng với độ trễ < 200ms bằng PostgreSQL pgvector. Đam mê tối ưu hiệu năng web, hệ thống phân tán và ứng dụng LLM trong tuyển dụng thực tế.",
  skills: [
    "React 19 / Next.js",
    "TypeScript",
    "Tailwind CSS",
    "Python FastAPI",
    "PostgreSQL / pgvector",
    "Docker & Kubernetes",
    "Redis Cache",
    "DeepSeek / OpenAI APIs",
    "CI/CD GitHub Actions",
    "System Design",
  ],
  experience: [
    {
      id: "exp-1",
      role: "Lead Full-Stack Engineer",
      company: "AI Talent Tech Solutions",
      location: "Hà Nội",
      start_date: "03/2023",
      end_date: "",
      current: true,
      bullets: [
        "Thiết kế và triển khai kiến trúc nền tảng tuyển dụng thông minh bằng FastAPI và React 19, phục vụ hơn 120,000 người dùng hàng tháng.",
        "Tích hợp thuật toán AI Semantic Matching (pgvector HNSW Cosine Similarity), tăng tỷ lệ hồ sơ ứng viên đạt vòng phỏng vấn lên 42%.",
        "Tối ưu hóa bundle và caching Redis giúp giảm thời gian phản hồi API từ 850ms xuống 180ms dưới tải cao 5,000 CCU.",
        "Dẫn dắt đội ngũ kỹ sư 6 thành viên, áp dụng quy chuẩn TypeScript Strict và Clean Architecture.",
      ],
    },
    {
      id: "exp-2",
      role: "Senior Frontend Engineer",
      company: "Fintech Global VN",
      location: "Hà Nội",
      start_date: "06/2021",
      end_date: "02/2023",
      current: false,
      bullets: [
        "Xây dựng hệ thống giao dịch tài chính thời gian thực với React, Zustand và WebSockets xử lý 10,000+ giao dịch/ngày.",
        "Cải thiện chỉ số Core Web Vitals (LCP < 1.2s, CLS 0.01), nâng điểm Google Lighthouse từ 68 lên 98/100.",
        "Thiết kế thư viện UI Component chuẩn Design System dùng chung cho 4 dự án nội bộ của doanh nghiệp.",
      ],
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "AI-Powered Job Portal Platform",
      description:
        "Nền tảng tuyển dụng thế hệ mới tích hợp AI CV Builder, ATS Real-time Scorer, và Lộ trình nghề nghiệp tự động hóa.",
      url: "https://github.com/imvoka3701/AI-job-portal",
      technologies: ["React 19", "FastAPI", "pgvector", "Docker", "Tailwind CSS"],
    },
  ],
  education: [
    {
      id: "edu-1",
      school: "Đại học Bách Khoa Hà Nội",
      degree: "Cử nhân Kỹ thuật Phần mềm (Loại Giỏi - GPA 3.6/4.0)",
      start_date: "2018",
      end_date: "2022",
      details: "Giải Ba Cuộc thi Lập trình Sinh viên ICPC Quốc gia 2021",
    },
  ],
  certifications: [
    "AWS Certified Solutions Architect – Associate (2024)",
    "Meta Certified Front-End Developer (2023)",
  ],
  languages: ["Tiếng Việt (Bản ngữ)", "Tiếng Anh (IELTS 7.5)"],
  links: {
    github: "https://github.com/ductrong-tech",
    linkedin: "https://linkedin.com/in/ductrong",
    portfolio: "https://ductrong.dev",
  },
  design: {
    accent_color: "emerald",
    font_family: "sans",
    spacing: "normal",
  },
};

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
    <label className="block text-xs font-bold text-slate-700">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-[#00B86B] focus:ring-2 focus:ring-emerald-500/20 leading-relaxed"
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
  const currentUser = useUser();
  const [document, setDocument] = useState<CvDocument | null>(null);
  const [content, setContent] = useState<CvContent>(createEmptyCvContent());
  const [template, setTemplate] = useState<CvTemplateKey>(CV_TEMPLATE_OPTIONS[0].key);
  const [title, setTitle] = useState("CV của tôi");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "error">("saved");
  const [copiedText, setCopiedText] = useState(false);
  
  // Interactive preview controls
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [accentColor, setAccentColor] = useState<"emerald" | "navy" | "violet" | "rose" | "slate">("emerald");
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);

  // Accordion section open states
  const [openSections, setOpenSections] = useState({
    personal: true,
    summary: true,
    experience: true,
    skills: true,
    projects: false,
    education: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Jump from A4 preview to section in editor
  const handleJumpToSection = (sectionKey: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionKey]: true }));
    setHighlightedSection(sectionKey);
    setTimeout(() => {
      const el = window.document.getElementById(`section-${sectionKey}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
    setTimeout(() => setHighlightedSection(null), 1500);
  };

  // AI Suggestions
  const [summaryAI, setSummaryAI] = useState<{ loading: boolean; error: string | null; suggestion: AISuggestionValue | null }>({ loading: false, error: null, suggestion: null });
  const [skillsAI, setSkillsAI] = useState<{ loading: boolean; error: string | null; suggestion: AISuggestionValue | null }>({ loading: false, error: null, suggestion: null });
  const [experienceAI, setExperienceAI] = useState<Record<string, { loading: boolean; error: string | null; suggestion: AISuggestionValue | null }>>({});
  
  /** Ngôn ngữ người dùng muốn AI gợi ý — vi: Tiếng Việt, en: English */
  const [aiLanguage, setAiLanguage] = useState<"vi" | "en">("vi");
  const [showAtsAudit, setShowAtsAudit] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const saveTimer = useRef<number | undefined>(undefined);
  const loadedDocumentId = useRef<number | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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
        if (loaded.content_json.design?.accent_color) {
          setAccentColor(loaded.content_json.design.accent_color);
        }
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

  // Avatar handler
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file hình ảnh (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert("Dung lượng ảnh tối đa 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const next = {
        ...content,
        personal: {
          ...content.personal,
          avatar_url: base64,
          show_avatar: true,
        },
      };
      scheduleSave(next);
    };
    reader.readAsDataURL(file);
  };

  // Pre-fill sample data
  const handleLoadSampleData = () => {
    if (window.confirm("Điền dữ liệu mẫu chuẩn Software Engineer / Tech Lead vào CV này?")) {
      const sampleWithUserAvatar = {
        ...SAMPLE_TECH_CV,
        personal: {
          ...SAMPLE_TECH_CV.personal,
          avatar_url: currentUser?.avatar_url || "",
        },
      };
      scheduleSave(sampleWithUserAvatar, template, "CV Kỹ Sư Công Nghệ Chuẩn ATS");
      setTitle("CV Kỹ Sư Công Nghệ Chuẩn ATS");
    }
  };

  // Copy CV as plain text for ATS application forms
  const handleCopyAsPlainText = () => {
    const lines = [
      content.personal.full_name,
      content.personal.headline,
      `${content.personal.email} | ${content.personal.phone} | ${content.personal.location}`,
      "",
      "--- TÓM TẮT CHUYÊN MÔN ---",
      content.summary,
      "",
      "--- KỸ NĂNG CÔNG NGHỆ ---",
      content.skills.join(", "),
      "",
      "--- KINH NGHIỆM LÀM VIỆC ---",
      ...content.experience.map((e) => `${e.role} @ ${e.company} (${e.start_date} - ${e.current ? "Hiện tại" : e.end_date})\n${e.bullets.map((b) => `• ${b}`).join("\n")}`),
      "",
      "--- HỌC VẤN ---",
      ...content.education.map((edu) => `${edu.degree} - ${edu.school} (${edu.start_date} - ${edu.end_date})`),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // ─── Real-time ATS Readiness Score Calculation ──────────────────────────
  const atsAudit = useMemo(() => {
    const items = [
      {
        title: "Thông tin cá nhân & Tiêu đề",
        weight: 20,
        passed: !!(content.personal.full_name && content.personal.email && content.personal.headline),
        detail: "Họ tên, Email và Vị trí mong muốn giúp ATS nhận diện ứng viên.",
      },
      {
        title: "Tóm tắt chuyên môn",
        weight: 20,
        passed: (content.summary?.trim().length || 0) >= 40,
        detail: "Tóm tắt tối thiểu 40 ký tự nêu bật kinh nghiệm và mục tiêu.",
      },
      {
        title: "Kinh nghiệm làm việc chi tiết",
        weight: 25,
        passed: content.experience.length > 0 && content.experience.some((e) => e.bullets.filter(Boolean).length >= 2),
        detail: "Ít nhất 1 vị trí có 2+ dòng thành tựu cụ thể.",
      },
      {
        title: "Kỹ năng chuyên môn cốt lõi",
        weight: 20,
        passed: content.skills.filter(Boolean).length >= 4,
        detail: "Có từ 4 kỹ năng công nghệ/chuyên môn để bộ lọc ATS quét từ khóa.",
      },
      {
        title: "Học vấn hoặc Dự án nổi bật",
        weight: 15,
        passed: content.education.length > 0 || (content.projects && content.projects.length > 0),
        detail: "Bổ sung quá trình đào tạo hoặc dự án thực tế để tăng uy tín.",
      },
    ];

    const score = items.reduce((acc, item) => (item.passed ? acc + item.weight : acc), 0);
    return { score, items };
  }, [content]);

  // ─── Handlers ───────────────────────────────────────────────────────────
  const updatePersonal = (field: keyof CvContent["personal"], value: any) =>
    scheduleSave({
      ...content,
      personal: { ...content.personal, [field]: value },
    });

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

  const removeExperience = (itemId: string) =>
    scheduleSave({
      ...content,
      experience: content.experience.filter((item) => item.id !== itemId),
    });

  const moveExperience = (index: number, direction: "up" | "down") => {
    const list = [...content.experience];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    scheduleSave({ ...content, experience: list });
  };

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

  const removeEducation = (itemId: string) =>
    scheduleSave({
      ...content,
      education: content.education.filter((item) => item.id !== itemId),
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

  const removeProject = (itemId: string) =>
    scheduleSave({
      ...content,
      projects: content.projects.filter((item) => item.id !== itemId),
    });

  // ─── AI Suggestion Triggers ─────────────────────────────────────────────
  const runSummarySuggestion = async () => {
    const role = content.personal.headline.trim();
    if (!document || !role) {
      setSummaryAI({ loading: false, error: "Vui lòng nhập Vị trí ứng tuyển ở mục Thông tin cá nhân trước.", suggestion: null });
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
      setExperienceAI((state) => ({ ...state, [item.id]: { loading: false, error: "Vui lòng nhập Vị trí ứng tuyển trước khi dùng AI.", suggestion: null } }));
      return;
    }
    const source = `${item.role} tại ${item.company}\n${item.bullets.filter(Boolean).join("\n")}`.trim();
    if (!item.role.trim() || !source) {
      setExperienceAI((state) => ({ ...state, [item.id]: { loading: false, error: "Vui lòng nhập Vị trí và ít nhất một dòng kinh nghiệm trước.", suggestion: null } }));
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
      setSkillsAI({ loading: false, error: "Vui lòng nhập Vị trí ứng tuyển ở mục Thông tin cá nhân trước.", suggestion: null });
      return;
    }
    setSkillsAI((state) => ({ ...state, loading: true, error: null }));
    try {
      const result = await suggestCvSkills(document.id, content.skills, role, undefined, aiLanguage);
      const newSkills = result.skills;
      setSkillsAI({ loading: false, error: null, suggestion: { text: newSkills.join(", "), rationale: result.rationale } });
    } catch (error) {
      setSkillsAI({ loading: false, error: getApiErrorMessage(error), suggestion: null });
    } finally {
      setSkillsAI((state) => ({ ...state, loading: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spinner size="lg" label="Đang nạp dữ liệu CV Studio..." />
      </div>
    );
  }

  if (!document) {
    return (
      <div role="alert" className="mx-auto max-w-xl p-12 text-center text-rose-600 bg-white rounded-3xl border border-rose-200 mt-12 shadow-sm space-y-4">
        <AlertCircle className="w-12 h-12 mx-auto text-rose-500" />
        <h2 className="text-lg font-black text-slate-900">Không thể tải hồ sơ CV</h2>
        <p className="text-xs text-slate-500">Hồ sơ không tồn tại hoặc bạn không có quyền truy cập.</p>
        <div>
          <Button onClick={() => navigate("/cv")} className="bg-[#00B86B] hover:bg-[#00995C] text-white rounded-full font-bold text-xs px-6">
            Quay lại danh sách CV
          </Button>
        </div>
      </div>
    );
  }

  const currentTemplateObj = CV_TEMPLATE_OPTIONS.find((t) => t.key === template) || CV_TEMPLATE_OPTIONS[0];

  return (
    <div className="min-h-screen bg-[#F8FAFB] font-sans pb-16 text-slate-900 selection:bg-emerald-500 selection:text-white">
      
      {/* ── TOP STICKY COMMAND BAR ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3 print:hidden shadow-xs">
        <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Left: Back + Editable Title */}
          <div className="flex items-center gap-3">
            <Link
              to="/cv"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors shrink-0"
              title="Quay lại danh sách CV"
            >
              <ArrowLeft size={16} />
            </Link>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  scheduleSave(content, template, e.target.value);
                }}
                className="font-black text-base sm:text-lg text-slate-900 bg-transparent border-b border-dashed border-slate-300 hover:border-[#00B86B] focus:border-[#00B86B] focus:outline-none px-1 py-0.5 max-w-[200px] sm:max-w-[280px] truncate"
                placeholder="Tên bản CV..."
              />
              
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                saveState === "saved"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : saveState === "dirty"
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}>
                {isSaving ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    Đang lưu...
                  </>
                ) : saveState === "saved" ? (
                  <>
                    <CheckCircle2 size={11} className="text-[#00B86B]" />
                    Đã lưu
                  </>
                ) : (
                  "Chưa lưu"
                )}
              </span>
            </div>
          </div>

          {/* Right: Actions, Template Switcher & AI Language */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Sample Data Pre-fill Button */}
            <button
              onClick={handleLoadSampleData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition-all cursor-pointer"
              title="Điền dữ liệu mẫu chuẩn Tech Lead / Software Engineer"
            >
              <Flame size={13} className="text-[#00B86B]" />
              <span>Nạp Mẫu IT Chuẩn</span>
            </button>

            {/* Real-time ATS Score Badge Button */}
            <button
              onClick={() => setShowAtsAudit(!showAtsAudit)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-black transition-all cursor-pointer"
            >
              <Zap size={13} className="text-amber-500" />
              <span>ATS:</span>
              <span className={`font-black ${
                atsAudit.score >= 80 ? "text-[#00B86B]" : atsAudit.score >= 50 ? "text-amber-600" : "text-rose-600"
              }`}>
                {atsAudit.score}%
              </span>
            </button>

            {/* Template Selector Button */}
            <button
              onClick={() => setShowTemplateModal(!showTemplateModal)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer shadow-2xs"
            >
              <LayoutTemplate size={13} className="text-[#00B86B]" />
              <span>Mẫu: <strong>{currentTemplateObj.name.split("(")[0]}</strong></span>
              <ChevronDown size={13} className="text-slate-400" />
            </button>

            {/* AI Language Picker */}
            <div className="flex rounded-full border border-slate-200 bg-slate-100 p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAiLanguage("vi")}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  aiLanguage === "vi" ? "bg-white text-slate-900 shadow-xs font-black" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                🇻🇳 TV
              </button>
              <button
                type="button"
                onClick={() => setAiLanguage("en")}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  aiLanguage === "en" ? "bg-white text-slate-900 shadow-xs font-black" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                🇺🇸 EN
              </button>
            </div>

            {/* Copy Plain Text for Form Apply */}
            <button
              onClick={handleCopyAsPlainText}
              className="p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Sao chép toàn bộ nội dung CV dạng văn bản"
            >
              {copiedText ? <Check size={14} className="text-[#00B86B]" /> : <Copy size={14} />}
            </button>

            {/* Print / Export PDF */}
            <Button
              size="sm"
              onClick={() => window.print()}
              className="bg-gradient-to-r from-[#00B86B] to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-full px-4 shadow-sm shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
            >
              <Printer size={13} />
              <span>Xuất PDF</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── TEMPLATE CHOOSER MODAL / DRAWER ────────────────────────────── */}
      {showTemplateModal && (
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-5 print:hidden">
          <div className="max-w-[1700px] mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Chọn Bản Mẫu CV Chuẩn Mực Quốc Tế</h3>
                <p className="text-xs text-slate-500">Mỗi mẫu được thiết kế chuẩn mực theo tiêu chuẩn tuyển dụng chuyên ngành</p>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-xs text-slate-500 hover:text-slate-900 font-bold cursor-pointer"
              >
                Đóng ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
              {CV_TEMPLATE_OPTIONS.map((tpl) => {
                const isSelected = template === tpl.key;
                return (
                  <div
                    key={tpl.key}
                    onClick={() => {
                      setTemplate(tpl.key);
                      scheduleSave(content, tpl.key, title);
                      setShowTemplateModal(false);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white border-[#00B86B] shadow-md ring-2 ring-[#00B86B]/20"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {tpl.tag}
                      </span>
                      {isSelected && <CheckCircle2 size={14} className="text-[#00B86B]" />}
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{tpl.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── ATS AUDIT POPUP BAR (EXPANDABLE) ────────────────────────────── */}
      {showAtsAudit && (
        <section className="bg-slate-900 text-white px-4 sm:px-6 lg:px-8 py-5 border-b border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200 print:hidden">
          <div className="max-w-[1700px] mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-black">
                  <Zap size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Thước Đo Chuẩn ATS Thời Gian Thực 2026</h3>
                  <p className="text-xs text-slate-400">Hệ thống phân tích tự động cấu trúc CV dựa trên thuật toán lọc ATS quốc tế</p>
                </div>
              </div>
              <button
                onClick={() => setShowAtsAudit(false)}
                className="text-xs text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                Đóng ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
              {atsAudit.items.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    item.passed
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                      : "bg-slate-800/80 border-slate-700 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold truncate">{item.title}</span>
                    {item.passed ? (
                      <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                    ) : (
                      <span className="text-[10px] font-bold text-amber-400 uppercase">+{item.weight}đ</span>
                    )}
                  </div>
                  <p className="text-[11px] leading-snug opacity-80">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── MAIN 2-COLUMN SPLIT-SCREEN WORKSPACE ───────────────────────── */}
      <main className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid items-start gap-8 xl:grid-cols-[560px_1fr]">
          
          {/* ── LEFT COLUMN: SMART ACCORDION FORM ──────────────────────── */}
          {!previewOnly && (
            <div className="space-y-4 print:hidden">
              
              {/* 1. THÔNG TIN CÁ NHÂN & AVATAR */}
              <div
                id="section-personal"
                className={`rounded-3xl border bg-white shadow-xs overflow-hidden transition-all duration-300 ${
                  highlightedSection === "personal" ? "ring-2 ring-[#00B86B] border-[#00B86B]" : "border-slate-200/90"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleSection("personal")}
                  className="w-full p-5 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors text-left cursor-pointer border-b border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#00B86B] flex items-center justify-center font-bold">
                      <User size={16} />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-900">1. Thông Tin Cá Nhân & Ảnh Đại Diện</h2>
                      <p className="text-[11px] text-slate-500 font-medium">Họ tên, vị trí ứng tuyển, email, ảnh CV</p>
                    </div>
                  </div>
                  {openSections.personal ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>

                {openSections.personal && (
                  <div className="p-5 sm:p-6 space-y-5">
                    
                    {/* Avatar Upload Area */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center gap-4">
                      <div className="relative group w-20 h-20 shrink-0">
                        <div className="w-full h-full rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shadow-xs">
                          {content.personal.avatar_url ? (
                            <img
                              src={content.personal.avatar_url}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center text-slate-400">
                              <Camera size={20} className="mx-auto mb-1 text-slate-400" />
                              <span className="text-[9px] font-bold block">Chưa có ảnh</span>
                            </div>
                          )}
                        </div>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarFileChange}
                        />
                      </div>

                      <div className="flex-1 space-y-2 text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => avatarInputRef.current?.click()}
                            className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold rounded-xl shadow-2xs"
                          >
                            <Camera size={13} className="mr-1 text-[#00B86B]" />
                            Tải Ảnh Mới
                          </Button>

                          {currentUser?.avatar_url && !content.personal.avatar_url && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updatePersonal("avatar_url", currentUser.avatar_url)
                              }
                              className="text-xs font-bold rounded-xl"
                            >
                              Dùng Avatar Hồ Sơ
                            </Button>
                          )}

                          {content.personal.avatar_url && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => updatePersonal("avatar_url", "")}
                              className="text-xs font-bold text-rose-600 hover:bg-rose-50"
                            >
                              Gỡ ảnh
                            </Button>
                          )}
                        </div>

                        <label className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-slate-700 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={content.personal.show_avatar !== false}
                            onChange={(e) =>
                              updatePersonal("show_avatar", e.target.checked)
                            }
                            className="rounded text-[#00B86B] focus:ring-emerald-500"
                          />
                          <span>Hiển thị ảnh đại diện trên CV</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Họ và Tên *"
                        value={content.personal.full_name}
                        onChange={(e) => updatePersonal("full_name", e.target.value)}
                        placeholder="VD: Nguyễn Văn A"
                      />
                      <Input
                        label="Vị Trí Ứng Tuyển *"
                        value={content.personal.headline}
                        onChange={(e) => updatePersonal("headline", e.target.value)}
                        placeholder="VD: Senior Frontend Engineer"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Email Liên Hệ *"
                        value={content.personal.email}
                        onChange={(e) => updatePersonal("email", e.target.value)}
                        placeholder="VD: email@example.com"
                      />
                      <Input
                        label="Số Điện Thoại *"
                        value={content.personal.phone}
                        onChange={(e) => updatePersonal("phone", e.target.value)}
                        placeholder="VD: 0987 654 321"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Địa Điểm / Thành Phố"
                        value={content.personal.location}
                        onChange={(e) => updatePersonal("location", e.target.value)}
                        placeholder="VD: Hà Nội, Việt Nam"
                      />
                      <Input
                        label="Website / Portfolio / LinkedIn"
                        value={content.personal.website}
                        onChange={(e) => updatePersonal("website", e.target.value)}
                        placeholder="VD: https://linkedin.com/in/..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 2. TÓM TẮT BẢN THÂN (SUMMARY) */}
              <div
                id="section-summary"
                className={`rounded-3xl border bg-white shadow-xs overflow-hidden transition-all duration-300 ${
                  highlightedSection === "summary" ? "ring-2 ring-[#00B86B] border-[#00B86B]" : "border-slate-200/90"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleSection("summary")}
                  className="w-full p-5 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors text-left cursor-pointer border-b border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-900">2. Giới Thiệu Bản Thân (Summary)</h2>
                      <p className="text-[11px] text-slate-500 font-medium">Tóm tắt định hướng nghề nghiệp và thế mạnh nổi bật</p>
                    </div>
                  </div>
                  {openSections.summary ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>

                {openSections.summary && (
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Mô tả mục tiêu nghề nghiệp:</span>
                      <Button
                        type="button"
                        size="sm"
                        onClick={runSummarySuggestion}
                        isLoading={summaryAI.loading}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-full px-3.5 py-1 cursor-pointer flex items-center gap-1.5 shadow-none"
                      >
                        <Sparkles size={13} className="text-[#00B86B]" />
                        <span>AI Viết Giúp ({aiLanguage.toUpperCase()})</span>
                      </Button>
                    </div>

                    <Textarea
                      label=""
                      value={content.summary}
                      onChange={(value) => scheduleSave({ ...content, summary: value })}
                      placeholder="Mô tả ngắn gọn kinh nghiệm, kỹ năng cốt lõi và mục tiêu nghề nghiệp của bạn..."
                      rows={4}
                    />

                    <AISuggestionPanel
                      error={summaryAI.error}
                      suggestion={summaryAI.suggestion}
                      onAccept={() => {
                        if (summaryAI.suggestion) {
                          scheduleSave({ ...content, summary: summaryAI.suggestion.text });
                          setSummaryAI({ loading: false, error: null, suggestion: null });
                        }
                      }}
                      onDismiss={() => setSummaryAI({ loading: false, error: null, suggestion: null })}
                      onRetry={runSummarySuggestion}
                    />
                  </div>
                )}
              </div>

              {/* 3. KINH NGHIỆM LÀM VIỆC (EXPERIENCE) */}
              <div
                id="section-experience"
                className={`rounded-3xl border bg-white shadow-xs overflow-hidden transition-all duration-300 ${
                  highlightedSection === "experience" ? "ring-2 ring-[#00B86B] border-[#00B86B]" : "border-slate-200/90"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleSection("experience")}
                  className="w-full p-5 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors text-left cursor-pointer border-b border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <Briefcase size={16} />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-900">3. Kinh Nghiệm Làm Việc ({content.experience.length})</h2>
                      <p className="text-[11px] text-slate-500 font-medium">Tối ưu theo công thức Google XYZ Formula</p>
                    </div>
                  </div>
                  {openSections.experience ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>

                {openSections.experience && (
                  <div className="p-5 sm:p-6 space-y-6">
                    {content.experience.map((item, index) => (
                      <div
                        key={item.id}
                        className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 relative group"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <span className="text-xs font-black text-slate-800">
                            #{index + 1}. {item.role || "Vị trí mới"} {item.company ? `tại ${item.company}` : ""}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => moveExperience(index, "up")}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                                title="Di chuyển lên"
                              >
                                <ArrowUp size={14} />
                              </button>
                            )}
                            {index < content.experience.length - 1 && (
                              <button
                                type="button"
                                onClick={() => moveExperience(index, "down")}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                                title="Di chuyển xuống"
                              >
                                <ArrowDown size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeExperience(item.id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1 ml-1"
                              title="Xoá vị trí này"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            label="Vị Trí / Chức Danh"
                            value={item.role}
                            onChange={(e) => updateExperience(item.id, { role: e.target.value })}
                            placeholder="VD: Senior React Developer"
                          />
                          <Input
                            label="Tên Công Ty"
                            value={item.company}
                            onChange={(e) => updateExperience(item.id, { company: e.target.value })}
                            placeholder="VD: VNG Corporation"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Input
                            label="Thời Gian Bắt Đầu"
                            value={item.start_date}
                            onChange={(e) => updateExperience(item.id, { start_date: e.target.value })}
                            placeholder="VD: 01/2023"
                          />
                          <Input
                            label="Thời Gian Kết Thúc"
                            value={item.end_date}
                            onChange={(e) => updateExperience(item.id, { end_date: e.target.value })}
                            placeholder={item.current ? "Hiện tại" : "VD: 12/2025"}
                            disabled={item.current}
                          />
                          <div className="flex items-center pt-6">
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.current}
                                onChange={(e) => updateExperience(item.id, { current: e.target.checked })}
                                className="rounded text-[#00B86B] focus:ring-emerald-500"
                              />
                              <span>Đang làm việc tại đây</span>
                            </label>
                          </div>
                        </div>

                        {/* Bullets */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700">Các thành tựu & công việc nổi bật:</label>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => runExperienceSuggestion(item)}
                              isLoading={experienceAI[item.id]?.loading}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold rounded-full px-3 py-0.5 cursor-pointer flex items-center gap-1 shadow-none"
                            >
                              <Sparkles size={12} className="text-[#00B86B]" />
                              <span>Tối ưu Google XYZ AI</span>
                            </Button>
                          </div>

                          <Textarea
                            label=""
                            value={item.bullets.join("\n")}
                            onChange={(val) => updateExperience(item.id, { bullets: val.split("\n") })}
                            placeholder="Nhập mỗi thành tựu trên một dòng (Ví dụ: Tối ưu hiệu năng ứng dụng React giúp giảm 40% thời gian tải trang...)"
                            rows={3}
                          />

                          <AISuggestionPanel
                            error={experienceAI[item.id]?.error ?? null}
                            suggestion={experienceAI[item.id]?.suggestion ?? null}
                            onAccept={() => {
                              const sug = experienceAI[item.id]?.suggestion;
                              if (sug) {
                                updateExperience(item.id, { bullets: sug.text.split("\n") });
                                setExperienceAI((st) => ({ ...st, [item.id]: { loading: false, error: null, suggestion: null } }));
                              }
                            }}
                            onDismiss={() => setExperienceAI((st) => ({ ...st, [item.id]: { loading: false, error: null, suggestion: null } }))}
                            onRetry={() => runExperienceSuggestion(item)}
                          />
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addExperience}
                      className="w-full rounded-2xl border-dashed border-slate-300 hover:border-[#00B86B] text-slate-700 hover:text-emerald-700 text-xs font-bold py-3 flex items-center justify-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>Thêm Vị Trí Kinh Nghiệm</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* 4. KỸ NĂNG CHUYÊN MÔN (SKILLS WITH TAGINPUT) */}
              <div
                id="section-skills"
                className={`rounded-3xl border bg-white shadow-xs overflow-hidden transition-all duration-300 ${
                  highlightedSection === "skills" ? "ring-2 ring-[#00B86B] border-[#00B86B]" : "border-slate-200/90"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleSection("skills")}
                  className="w-full p-5 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors text-left cursor-pointer border-b border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <Code size={16} />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-900">4. Kỹ Năng Chuyên Môn ({content.skills.length})</h2>
                      <p className="text-[11px] text-slate-500 font-medium">Gõ từ khóa có dấu cách tự do, nhấn Enter để thêm tag</p>
                    </div>
                  </div>
                  {openSections.skills ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>

                {openSections.skills && (
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Danh sách thẻ kỹ năng:</span>
                      <Button
                        type="button"
                        size="sm"
                        onClick={runSkillsSuggestion}
                        isLoading={skillsAI.loading}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-full px-3.5 py-1 cursor-pointer flex items-center gap-1.5 shadow-none"
                      >
                        <Sparkles size={13} className="text-[#00B86B]" />
                        <span>AI Gợi Ý Kỹ Năng 2026</span>
                      </Button>
                    </div>

                    <TagInput
                      tags={content.skills}
                      onChange={(newTags) => scheduleSave({ ...content, skills: newTags })}
                      placeholder="Nhập kỹ năng (VD: React 19, TypeScript, System Design...) và nhấn Enter"
                      suggestedTags={[
                        "React 19",
                        "TypeScript",
                        "FastAPI",
                        "PostgreSQL",
                        "Tailwind CSS",
                        "Docker",
                        "Redis",
                        "Kubernetes",
                        "AWS",
                        "Node.js",
                        "GraphQL",
                        "CI/CD",
                      ]}
                      helperText="Mẹo: Bạn có thể gõ dấu cách và chữ có dấu thoải mái. Nhấn Enter hoặc phím phẩy (,) để tạo tag."
                    />

                    <AISuggestionPanel
                      error={skillsAI.error}
                      suggestion={skillsAI.suggestion}
                      onAccept={() => {
                        if (skillsAI.suggestion) {
                          const additional = skillsAI.suggestion.text.split(",").map((s) => s.trim()).filter(Boolean);
                          const merged = Array.from(new Set([...content.skills, ...additional]));
                          scheduleSave({ ...content, skills: merged });
                          setSkillsAI({ loading: false, error: null, suggestion: null });
                        }
                      }}
                      onDismiss={() => setSkillsAI({ loading: false, error: null, suggestion: null })}
                      onRetry={runSkillsSuggestion}
                    />
                  </div>
                )}
              </div>

              {/* 5. DỰ ÁN TIÊU BIỂU (PROJECTS) */}
              <div
                id="section-projects"
                className={`rounded-3xl border bg-white shadow-xs overflow-hidden transition-all duration-300 ${
                  highlightedSection === "projects" ? "ring-2 ring-[#00B86B] border-[#00B86B]" : "border-slate-200/90"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleSection("projects")}
                  className="w-full p-5 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors text-left cursor-pointer border-b border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                      <Globe size={16} />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-900">5. Dự Án Tiêu Biểu ({content.projects?.length || 0})</h2>
                      <p className="text-[11px] text-slate-500 font-medium">Chứng minh năng lực qua sản phẩm thực tế</p>
                    </div>
                  </div>
                  {openSections.projects ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>

                {openSections.projects && (
                  <div className="p-5 sm:p-6 space-y-4">
                    {(content.projects || []).map((proj, idx) => (
                      <div key={proj.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                          <span className="text-xs font-bold text-slate-800">#{idx + 1}. {proj.name || "Dự án mới"}</span>
                          <button
                            type="button"
                            onClick={() => removeProject(proj.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            label="Tên Dự Án"
                            value={proj.name}
                            onChange={(e) => updateProject(proj.id, { name: e.target.value })}
                            placeholder="VD: AI Job Portal Platform"
                          />
                          <Input
                            label="Link Demo / Repo"
                            value={proj.url}
                            onChange={(e) => updateProject(proj.id, { url: e.target.value })}
                            placeholder="VD: https://github.com/..."
                          />
                        </div>
                        <Textarea
                          label="Mô tả dự án & kết quả đạt được"
                          value={proj.description}
                          onChange={(val) => updateProject(proj.id, { description: val })}
                          placeholder="Mô tả bài toán, giải pháp và kết quả..."
                          rows={2}
                        />
                        
                        <TagInput
                          label="Công nghệ sử dụng trong dự án"
                          tags={proj.technologies || []}
                          onChange={(techs) => updateProject(proj.id, { technologies: techs })}
                          placeholder="Nhập công nghệ (React, Docker...) và Enter"
                        />
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addProject}
                      className="w-full rounded-2xl border-dashed border-slate-300 hover:border-[#00B86B] text-slate-700 hover:text-emerald-700 text-xs font-bold py-3 flex items-center justify-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>Thêm Dự Án Mới</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* 6. HỌC VẤN, CHỨNG CHỈ & NGÔN NGỮ */}
              <div
                id="section-education"
                className={`rounded-3xl border bg-white shadow-xs overflow-hidden transition-all duration-300 ${
                  highlightedSection === "education" ? "ring-2 ring-[#00B86B] border-[#00B86B]" : "border-slate-200/90"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleSection("education")}
                  className="w-full p-5 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors text-left cursor-pointer border-b border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <GraduationCap size={16} />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-900">6. Học Vấn, Chứng Chỉ & Ngôn Ngữ</h2>
                      <p className="text-[11px] text-slate-500 font-medium">Bằng cấp, chứng chỉ quốc tế và ngoại ngữ</p>
                    </div>
                  </div>
                  {openSections.education ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>

                {openSections.education && (
                  <div className="p-5 sm:p-6 space-y-5">
                    {content.education.map((edu, idx) => (
                      <div key={edu.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                          <span className="text-xs font-bold text-slate-800">#{idx + 1}. {edu.school || "Trường học"}</span>
                          <button
                            type="button"
                            onClick={() => removeEducation(edu.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            label="Tên Trường / Cơ Sở Đào Tạo"
                            value={edu.school}
                            onChange={(e) => updateEducation(edu.id, { school: e.target.value })}
                            placeholder="VD: Đại học Bách Khoa Hà Nội"
                          />
                          <Input
                            label="Chuyên Ngành / Bằng Cấp"
                            value={edu.degree}
                            onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                            placeholder="VD: Cử nhân Công nghệ Thông tin"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            label="Năm Bắt Đầu"
                            value={edu.start_date}
                            onChange={(e) => updateEducation(edu.id, { start_date: e.target.value })}
                            placeholder="VD: 2018"
                          />
                          <Input
                            label="Năm Tốt Nghiệp"
                            value={edu.end_date}
                            onChange={(e) => updateEducation(edu.id, { end_date: e.target.value })}
                            placeholder="VD: 2022"
                          />
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addEducation}
                      className="w-full rounded-2xl border-dashed border-slate-300 hover:border-[#00B86B] text-slate-700 hover:text-emerald-700 text-xs font-bold py-2.5 flex items-center justify-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>Thêm Học Vấn</span>
                    </Button>

                    <div className="pt-3 border-t border-slate-200 space-y-4">
                      <TagInput
                        label="Chứng chỉ & Bằng cấp quốc tế"
                        tags={content.certifications || []}
                        onChange={(certs) => scheduleSave({ ...content, certifications: certs })}
                        placeholder="Nhập chứng chỉ (AWS, IELTS...) và Enter"
                        suggestedTags={["AWS Solutions Architect", "IELTS 7.5", "PMP", "CKA Kubernetes", "TOEIC 900"]}
                      />

                      <TagInput
                        label="Ngoại ngữ sử dụng"
                        tags={content.languages || []}
                        onChange={(langs) => scheduleSave({ ...content, languages: langs })}
                        placeholder="Nhập ngoại ngữ (Tiếng Anh, Tiếng Nhật...) và Enter"
                        suggestedTags={["Tiếng Việt (Bản ngữ)", "Tiếng Anh (Thành thạo)", "Tiếng Nhật (N2)", "Tiếng Trung (HSK5)"]}
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ── RIGHT COLUMN: LIVE INTERACTIVE A4 PREVIEW ──────────────── */}
          <div className="sticky top-16 space-y-3">
            
            {/* Interactive Preview Control Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-slate-500 uppercase flex items-center gap-1">
                  <Palette size={12} className="text-[#00B86B]" /> Màu sắc:
                </span>
                <div className="flex items-center gap-1.5">
                  {[
                    { key: "emerald", color: "#00B86B", title: "Emerald Green" },
                    { key: "navy", color: "#1E40AF", title: "Classic Navy" },
                    { key: "violet", color: "#7C3AED", title: "Tech Violet" },
                    { key: "rose", color: "#E11D48", title: "Crimson Rose" },
                    { key: "slate", color: "#334155", title: "Slate Charcoal" },
                  ].map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setAccentColor(c.key as any)}
                      className={`w-5 h-5 rounded-full border-2 transition-all cursor-pointer ${
                        accentColor === c.key ? "scale-125 border-slate-900 shadow-xs" : "border-white hover:scale-110"
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.title}
                    />
                  ))}
                </div>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
                  className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Thu nhỏ"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="min-w-[40px] text-center text-[11px] font-black">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
                  className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Phóng to"
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  onClick={() => setZoomLevel(100)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors ml-1"
                  title="Mặc định 100%"
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>

            {/* A4 Paper Workspace */}
            <div className="flex justify-center overflow-x-auto py-2">
              <div
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: "top center",
                  transition: "transform 0.15s ease",
                }}
              >
                <CVPreview
                  content={content}
                  template={template}
                  accentColor={accentColor}
                  onSectionClick={handleJumpToSection}
                />
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
