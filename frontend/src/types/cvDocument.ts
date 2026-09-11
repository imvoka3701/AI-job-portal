export type CvTemplateKey =
  | "ats-minimal"
  | "modern-two-column"
  | "professional-blue"
  | "executive"
  | "creative-clean";

export type CvDocumentStatus = "draft" | "published";

export interface CvPersonalInfo {
  full_name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  avatar_url?: string;
  show_avatar?: boolean;
}

export interface CvExperience {
  id: string;
  role: string;
  company: string;
  location: string;
  start_date: string;
  end_date: string;
  current: boolean;
  bullets: string[];
}

export interface CvEducation {
  id: string;
  school: string;
  degree: string;
  start_date: string;
  end_date: string;
  details: string;
}

export interface CvProject {
  id: string;
  name: string;
  description: string;
  url: string;
  technologies: string[];
}

export interface CvDesignSettings {
  font_family?: "sans" | "serif" | "mono";
  accent_color?: "emerald" | "navy" | "violet" | "rose" | "slate";
  spacing?: "compact" | "normal" | "spacious";
}

export interface CvContent {
  version: number;
  personal: CvPersonalInfo;
  summary: string;
  skills: string[];
  experience: CvExperience[];
  education: CvEducation[];
  projects: CvProject[];
  certifications: string[];
  languages: string[];
  links: { github: string; linkedin: string; portfolio: string };
  design?: CvDesignSettings;
}

export interface CvDocument {
  id: number;
  user_id: number;
  title: string;
  template_key: CvTemplateKey;
  status: CvDocumentStatus;
  content_json: CvContent;
  created_at: string;
  updated_at: string;
}

export interface CvDocumentPayload {
  title?: string;
  template_key?: CvTemplateKey;
  status?: CvDocumentStatus;
  content_json?: CvContent;
}

export const CV_TEMPLATE_OPTIONS: Array<{ key: CvTemplateKey; name: string; tag: string; description: string }> = [
  {
    key: "ats-minimal",
    name: "Jake's LaTeX SWE (Chuẩn 1 cột)",
    tag: "Reddit #1 & Overleaf",
    description: "Mẫu 1 cột tối ưu cho Software Engineer, mật độ thông tin cao, tỷ lệ parse ATS 100%.",
  },
  {
    key: "executive",
    name: "Harvard Prestige (Quản lý & Doanh nghiệp)",
    tag: "Ivy League Standard",
    description: "Typography cổ điển trang trọng, phân cấp thông tin rõ ràng cho Senior, Lead & Manager.",
  },
  {
    key: "professional-blue",
    name: "Silicon Valley Tech Lead",
    tag: "Startups & Big Tech",
    description: "Điểm nhấn xanh công nghệ, làm nổi bật Tech Stack tags, GitHub repo và Demo links.",
  },
  {
    key: "modern-two-column",
    name: "TopCV B2B Modern Two-Column",
    tag: "Chuẩn Doanh nghiệp VN",
    description: "Bố cục 2 cột thanh lịch: Cột phụ làm nổi bật kỹ năng/chứng chỉ, cột chính trình bày kinh nghiệm.",
  },
  {
    key: "creative-clean",
    name: "Linear Minimalist Clean",
    tag: "SaaS & Product Design",
    description: "Thiết kế tối giản hiện đại với đường viền mảnh tinh tế và khoảng cách thoáng đãng.",
  },
];

export function createEmptyCvContent(): CvContent {
  return {
    version: 1,
    personal: { full_name: "", headline: "", email: "", phone: "", location: "", website: "" },
    summary: "",
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    languages: [],
    links: { github: "", linkedin: "", portfolio: "" },
  };
}

/**
 * Chuẩn hóa dữ liệu JSON của CV từ bất kỳ nguồn nào (Database, Seed data, AI generation, Parse PDF).
 * Đảm bảo 100% không bao giờ bị undefined ở các mảng danh sách (experience, education, skills, projects...),
 * đồng thời tương thích ngược với các schema cũ (như `experiences`, `educations`, `title`, `description`).
 */
export function normalizeCvContent(raw: unknown): CvContent {
  const empty = createEmptyCvContent();
  if (!raw || typeof raw !== "object") return empty;

  const data = raw as Record<string, any>;
  const personalRaw = data.personal && typeof data.personal === "object" ? data.personal : {};

  // 1. Personal
  const personal: CvPersonalInfo = {
    full_name: String(personalRaw.full_name || personalRaw.name || ""),
    headline: String(personalRaw.headline || personalRaw.title || personalRaw.role || ""),
    email: String(personalRaw.email || ""),
    phone: String(personalRaw.phone || ""),
    location: String(personalRaw.location || personalRaw.address || ""),
    website: String(personalRaw.website || ""),
    avatar_url: personalRaw.avatar_url ? String(personalRaw.avatar_url) : undefined,
    show_avatar: Boolean(personalRaw.show_avatar),
  };

  // 2. Summary
  const summary = String(data.summary || personalRaw.summary || "");

  // 3. Experience (hỗ trợ cả data.experience và data.experiences)
  const expListRaw = Array.isArray(data.experience)
    ? data.experience
    : Array.isArray(data.experiences)
    ? data.experiences
    : [];

  const experience: CvExperience[] = expListRaw.map((exp: any, idx: number) => {
    let bullets: string[] = [];
    if (Array.isArray(exp?.bullets)) {
      bullets = exp.bullets.map((b: any) => String(b ?? ""));
    } else if (typeof exp?.description === "string" && exp.description.trim()) {
      bullets = exp.description
        .split("\n")
        .map((s: string) => s.replace(/^[•\-*\s]+/, "").trim())
        .filter(Boolean);
    }
    if (bullets.length === 0) bullets = [""];

    return {
      id: String(exp?.id || `exp_${idx}_${Math.random().toString(36).substring(2, 7)}`),
      role: String(exp?.role || exp?.position || exp?.title || ""),
      company: String(exp?.company || exp?.organization || ""),
      location: String(exp?.location || ""),
      start_date: String(exp?.start_date || ""),
      end_date: String(exp?.end_date || ""),
      current: Boolean(exp?.current),
      bullets,
    };
  });

  // 4. Education (hỗ trợ cả data.education và data.educations)
  const eduListRaw = Array.isArray(data.education)
    ? data.education
    : Array.isArray(data.educations)
    ? data.educations
    : [];

  const education: CvEducation[] = eduListRaw.map((edu: any, idx: number) => ({
    id: String(edu?.id || `edu_${idx}_${Math.random().toString(36).substring(2, 7)}`),
    school: String(edu?.school || edu?.institution || edu?.university || ""),
    degree: String(edu?.degree || edu?.major || ""),
    start_date: String(edu?.start_date || ""),
    end_date: String(edu?.end_date || ""),
    details: String(edu?.details || edu?.description || ""),
  }));

  // 5. Skills
  const skillsRaw = Array.isArray(data.skills) ? data.skills : [];
  const skills: string[] = skillsRaw
    .map((s: any) => (typeof s === "string" ? s.trim() : typeof s?.name === "string" ? s.name.trim() : ""))
    .filter(Boolean);

  // 6. Projects
  const projListRaw = Array.isArray(data.projects) ? data.projects : [];
  const projects: CvProject[] = projListRaw.map((p: any, idx: number) => ({
    id: String(p?.id || `proj_${idx}_${Math.random().toString(36).substring(2, 7)}`),
    name: String(p?.name || p?.title || ""),
    description: String(p?.description || ""),
    url: String(p?.url || p?.link || ""),
    technologies: Array.isArray(p?.technologies)
      ? p.technologies.map((t: any) => String(t ?? ""))
      : [],
  }));

  // 7. Certifications & Languages
  const certifications: string[] = Array.isArray(data.certifications)
    ? data.certifications.map((c: any) => String(c ?? "")).filter(Boolean)
    : [];

  const languages: string[] = Array.isArray(data.languages)
    ? data.languages.map((l: any) => String(l ?? "")).filter(Boolean)
    : [];

  // 8. Links
  const linksRaw = data.links && typeof data.links === "object" ? data.links : {};
  const links = {
    github: String(linksRaw.github || ""),
    linkedin: String(linksRaw.linkedin || ""),
    portfolio: String(linksRaw.portfolio || ""),
  };

  // 9. Design
  const design = data.design && typeof data.design === "object" ? data.design : undefined;

  return {
    version: Number(data.version) || 1,
    personal,
    summary,
    skills,
    experience,
    education,
    projects,
    certifications,
    languages,
    links,
    design,
  };
}


