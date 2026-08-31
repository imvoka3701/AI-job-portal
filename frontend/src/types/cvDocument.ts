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

