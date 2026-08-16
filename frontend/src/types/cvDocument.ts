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

export const CV_TEMPLATE_OPTIONS: Array<{ key: CvTemplateKey; name: string; description: string }> = [
  { key: "ats-minimal", name: "ATS Minimal", description: "Một cột, rõ ràng và thân thiện với hệ thống tuyển dụng." },
  { key: "modern-two-column", name: "Modern Two Column", description: "Sidebar gọn gàng cho kỹ năng và thông tin cá nhân." },
  { key: "professional-blue", name: "Professional Blue", description: "Điểm nhấn xanh chuyên nghiệp cho nhóm văn phòng và kỹ thuật." },
  { key: "executive", name: "Executive", description: "Typography trang trọng cho vị trí senior và quản lý." },
  { key: "creative-clean", name: "Creative Clean", description: "Màu nhấn nhẹ, hiện đại nhưng vẫn dễ đọc khi in." },
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

