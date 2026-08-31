import { cn } from "@/lib/utils";
import type { CvContent, CvTemplateKey } from "@/types/cvDocument";
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  GraduationCap,
  Code,
  Sparkles,
  ExternalLink,
  Edit3,
} from "lucide-react";

export interface CVPreviewProps {
  content: CvContent;
  template: CvTemplateKey;
  className?: string;
  fontFamily?: "sans" | "serif" | "mono";
  accentColor?: "emerald" | "navy" | "violet" | "rose" | "slate";
  onSectionClick?: (sectionKey: string) => void;
}

const ACCENT_COLORS = {
  emerald: {
    primary: "#00B86B",
    primaryBg: "bg-emerald-50",
    primaryText: "text-[#00B86B]",
    primaryBorder: "border-[#00B86B]",
    badgeText: "text-emerald-800",
    badgeBorder: "border-emerald-200",
  },
  navy: {
    primary: "#1E40AF",
    primaryBg: "bg-blue-50",
    primaryText: "text-blue-700",
    primaryBorder: "border-blue-700",
    badgeText: "text-blue-800",
    badgeBorder: "border-blue-200",
  },
  violet: {
    primary: "#7C3AED",
    primaryBg: "bg-purple-50",
    primaryText: "text-purple-700",
    primaryBorder: "border-purple-700",
    badgeText: "text-purple-800",
    badgeBorder: "border-purple-200",
  },
  rose: {
    primary: "#E11D48",
    primaryBg: "bg-rose-50",
    primaryText: "text-rose-600",
    primaryBorder: "border-rose-600",
    badgeText: "text-rose-800",
    badgeBorder: "border-rose-200",
  },
  slate: {
    primary: "#334155",
    primaryBg: "bg-slate-100",
    primaryText: "text-slate-800",
    primaryBorder: "border-slate-800",
    badgeText: "text-slate-800",
    badgeBorder: "border-slate-300",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. JAKE'S RESUME (LaTeX SWE Standard — Overleaf / Reddit r/EngineeringResumes)
// ─────────────────────────────────────────────────────────────────────────────
function JakesResumeTemplate({
  content,
  className,
  onSectionClick,
}: {
  content: CvContent;
  className?: string;
  onSectionClick?: (sectionKey: string) => void;
}) {
  const p = content.personal;
  return (
    <div
      className={cn(
        "cv-paper min-h-[1050px] w-full max-w-[794px] bg-white p-8 sm:p-10 text-[12px] leading-snug shadow-xl border border-slate-300 rounded-none font-sans text-black print:shadow-none print:border-none print:p-0 select-text",
        className
      )}
    >
      {/* Header — Centered Name & Single-Line Contacts */}
      <header
        onClick={() => onSectionClick?.("personal")}
        className="text-center pb-2 border-b border-black cursor-pointer hover:bg-slate-50/80 rounded p-1 transition-colors relative group"
        title="Nhấp để chỉnh sửa Thông tin cá nhân"
      >
        <span className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 flex items-center gap-0.5 print:hidden">
          <Edit3 size={10} /> Sửa
        </span>
        <h1 className="text-2xl font-bold tracking-tight uppercase text-black">
          {p.full_name || "TÊN ỨNG VIÊN"}
        </h1>
        {p.headline && (
          <p className="text-[13px] font-semibold text-slate-800 mt-0.5">
            {p.headline}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-x-2 text-[11px] text-slate-700 mt-1">
          {p.phone && <span>{p.phone}</span>}
          {p.phone && p.email && <span>•</span>}
          {p.email && <span className="underline">{p.email}</span>}
          {p.location && <span>•</span>}
          {p.location && <span>{p.location}</span>}
          {p.website && <span>•</span>}
          {p.website && (
            <a href={p.website} target="_blank" rel="noreferrer" className="underline text-black">
              {p.website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
      </header>

      {/* Summary */}
      {content.summary && (
        <section
          onClick={() => onSectionClick?.("summary")}
          className="mt-3 cursor-pointer hover:bg-slate-50/80 rounded p-1 transition-colors relative group"
          title="Nhấp để chỉnh sửa Giới thiệu bản thân"
        >
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 flex items-center justify-between">
            <span>Tóm Tắt Chuyên Môn</span>
            <span className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 font-normal print:hidden">
              <Edit3 size={10} className="inline" /> Sửa
            </span>
          </h2>
          <p className="mt-1 text-[11.5px] text-slate-900 leading-relaxed text-justify">
            {content.summary}
          </p>
        </section>
      )}

      {/* Technical Skills */}
      {content.skills && content.skills.length > 0 && (
        <section
          onClick={() => onSectionClick?.("skills")}
          className="mt-3 cursor-pointer hover:bg-slate-50/80 rounded p-1 transition-colors relative group"
          title="Nhấp để chỉnh sửa Kỹ năng"
        >
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 flex items-center justify-between">
            <span>Kỹ Năng Kỹ Thuật (Technical Skills)</span>
            <span className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 font-normal print:hidden">
              <Edit3 size={10} className="inline" /> Sửa
            </span>
          </h2>
          <div className="mt-1 text-[11.5px] text-slate-900 space-y-0.5">
            <p>
              <strong className="font-bold">Công nghệ & Ngôn ngữ: </strong>
              <span>{content.skills.filter(Boolean).join(", ")}</span>
            </p>
            {content.languages && content.languages.length > 0 && (
              <p>
                <strong className="font-bold">Ngoại ngữ: </strong>
                <span>{content.languages.filter(Boolean).join(", ")}</span>
              </p>
            )}
            {content.certifications && content.certifications.length > 0 && (
              <p>
                <strong className="font-bold">Chứng chỉ: </strong>
                <span>{content.certifications.filter(Boolean).join(", ")}</span>
              </p>
            )}
          </div>
        </section>
      )}

      {/* Work Experience */}
      {content.experience && content.experience.length > 0 && (
        <section
          onClick={() => onSectionClick?.("experience")}
          className="mt-3 cursor-pointer hover:bg-slate-50/80 rounded p-1 transition-colors relative group"
          title="Nhấp để chỉnh sửa Kinh nghiệm"
        >
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 flex items-center justify-between">
            <span>Kinh Nghiệm Làm Việc (Experience)</span>
            <span className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 font-normal print:hidden">
              <Edit3 size={10} className="inline" /> Sửa
            </span>
          </h2>
          <div className="mt-1.5 space-y-2.5">
            {content.experience.map((item) => (
              <article key={item.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-[12px]">
                  <h3 className="font-bold text-black">
                    {item.role || "Vị trí"} <span className="font-normal text-slate-700">| {item.company || "Công ty"}</span>
                  </h3>
                  <span className="text-[11px] font-medium text-slate-800 text-right">
                    {item.start_date || "Bắt đầu"} – {item.current ? "Hiện tại" : item.end_date || "Kết thúc"}
                    {item.location ? ` | ${item.location}` : ""}
                  </span>
                </div>
                <ul className="list-disc pl-4 text-[11.5px] text-slate-900 space-y-0.5 leading-relaxed">
                  {item.bullets.filter(Boolean).map((bullet, idx) => (
                    <li key={`${item.id}-${idx}`}>{bullet}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {content.projects && content.projects.length > 0 && (
        <section
          onClick={() => onSectionClick?.("projects")}
          className="mt-3 cursor-pointer hover:bg-slate-50/80 rounded p-1 transition-colors relative group"
          title="Nhấp để chỉnh sửa Dự án"
        >
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 flex items-center justify-between">
            <span>Dự Án Tiêu Biểu (Projects)</span>
            <span className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 font-normal print:hidden">
              <Edit3 size={10} className="inline" /> Sửa
            </span>
          </h2>
          <div className="mt-1.5 space-y-2">
            {content.projects.map((proj) => (
              <article key={proj.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-[12px]">
                  <h3 className="font-bold text-black">
                    {proj.name || "Tên Dự Án"}{" "}
                    {proj.technologies && proj.technologies.length > 0 && (
                      <span className="font-normal text-slate-700 italic text-[11px]">
                        | {proj.technologies.join(", ")}
                      </span>
                    )}
                  </h3>
                  {proj.url && (
                    <a
                      href={proj.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] underline text-slate-800 hover:text-black"
                    >
                      Code / Demo ↗
                    </a>
                  )}
                </div>
                <p className="text-[11.5px] text-slate-900 leading-relaxed">{proj.description}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {content.education && content.education.length > 0 && (
        <section
          onClick={() => onSectionClick?.("education")}
          className="mt-3 cursor-pointer hover:bg-slate-50/80 rounded p-1 transition-colors relative group"
          title="Nhấp để chỉnh sửa Học vấn"
        >
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 flex items-center justify-between">
            <span>Học Vấn (Education)</span>
            <span className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 font-normal print:hidden">
              <Edit3 size={10} className="inline" /> Sửa
            </span>
          </h2>
          <div className="mt-1.5 space-y-1.5">
            {content.education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline text-[12px]">
                <div>
                  <span className="font-bold text-black">{edu.school || "Trường Đại học"}</span>
                  <p className="text-[11.5px] text-slate-800">{edu.degree || "Bằng cấp"}</p>
                  {edu.details && <p className="text-[11px] text-slate-600">{edu.details}</p>}
                </div>
                <span className="text-[11px] font-medium text-slate-800">
                  {edu.start_date} – {edu.end_date}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. HARVARD PRESTIGE CLASSIC (Ivy League Standard for Management & Consulting)
// ─────────────────────────────────────────────────────────────────────────────
function HarvardPrestigeTemplate({
  content,
  className,
  onSectionClick,
}: {
  content: CvContent;
  className?: string;
  onSectionClick?: (sectionKey: string) => void;
}) {
  const p = content.personal;
  return (
    <div
      className={cn(
        "cv-paper min-h-[1050px] w-full max-w-[794px] bg-white p-8 sm:p-10 text-[12.5px] leading-relaxed shadow-xl border border-slate-200 rounded-none font-serif text-slate-900 print:shadow-none print:border-none print:p-0 select-text",
        className
      )}
    >
      {/* Header — Classic Prestige */}
      <header
        onClick={() => onSectionClick?.("personal")}
        className="text-center border-b-2 border-slate-900 pb-3 space-y-1 cursor-pointer hover:bg-slate-50/80 p-1 rounded transition-colors group relative"
      >
        <h1 className="text-2xl font-bold tracking-widest uppercase text-slate-900">
          {p.full_name || "HỌ VÀ TÊN"}
        </h1>
        {p.headline && (
          <p className="text-xs italic tracking-wider font-semibold text-slate-700">
            {p.headline}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-x-3 text-xs text-slate-600 font-sans pt-0.5">
          {p.location && <span>{p.location}</span>}
          {p.phone && <span>• {p.phone}</span>}
          {p.email && <span>• {p.email}</span>}
          {p.website && <span>• {p.website}</span>}
        </div>
      </header>

      {/* Executive Summary */}
      {content.summary && (
        <section
          onClick={() => onSectionClick?.("summary")}
          className="mt-4 space-y-1 cursor-pointer hover:bg-slate-50/80 p-1 rounded transition-colors"
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-0.5">
            Executive Summary
          </h2>
          <p className="text-xs leading-relaxed text-justify text-slate-800">
            {content.summary}
          </p>
        </section>
      )}

      {/* Professional Experience */}
      {content.experience && content.experience.length > 0 && (
        <section
          onClick={() => onSectionClick?.("experience")}
          className="mt-4 space-y-2 cursor-pointer hover:bg-slate-50/80 p-1 rounded transition-colors"
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-0.5">
            Professional Experience
          </h2>
          <div className="space-y-3 pt-1">
            {content.experience.map((item) => (
              <article key={item.id} className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <div>
                    <h3 className="font-bold text-slate-900 text-[13px]">{item.company || "Công ty"}</h3>
                    <p className="italic text-xs text-slate-700">{item.role || "Chức danh"}</p>
                  </div>
                  <span className="text-xs font-sans text-slate-600 font-medium">
                    {item.start_date} – {item.current ? "Present" : item.end_date}
                    {item.location ? ` | ${item.location}` : ""}
                  </span>
                </div>
                <ul className="list-disc pl-4 text-xs space-y-1 text-slate-800 leading-normal">
                  {item.bullets.filter(Boolean).map((bullet, idx) => (
                    <li key={`${item.id}-${idx}`}>{bullet}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {content.education && content.education.length > 0 && (
        <section
          onClick={() => onSectionClick?.("education")}
          className="mt-4 space-y-1.5 cursor-pointer hover:bg-slate-50/80 p-1 rounded transition-colors"
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-0.5">
            Education & Credentials
          </h2>
          <div className="space-y-2 pt-1">
            {content.education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs">{edu.school || "Trường học"}</h3>
                  <p className="italic text-xs text-slate-700">{edu.degree || "Bằng cấp"}</p>
                  {edu.details && <p className="text-xs text-slate-600">{edu.details}</p>}
                </div>
                <span className="text-xs font-sans text-slate-600 font-medium">
                  {edu.start_date} – {edu.end_date}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Core Competencies & Skills */}
      {content.skills && content.skills.length > 0 && (
        <section
          onClick={() => onSectionClick?.("skills")}
          className="mt-4 space-y-1 cursor-pointer hover:bg-slate-50/80 p-1 rounded transition-colors"
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-0.5">
            Core Competencies & Skills
          </h2>
          <p className="text-xs text-slate-800 pt-1">
            <strong>Chuyên môn: </strong>{content.skills.filter(Boolean).join(" • ")}
          </p>
          {content.certifications && content.certifications.length > 0 && (
            <p className="text-xs text-slate-800">
              <strong>Chứng chỉ: </strong>{content.certifications.filter(Boolean).join(" • ")}
            </p>
          )}
        </section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SILICON VALLEY TECH LEAD (Tech Stack Tags, Live Demos & Modern Accents)
// ─────────────────────────────────────────────────────────────────────────────
function SiliconValleyTemplate({
  content,
  className,
  accent = "emerald",
  onSectionClick,
}: {
  content: CvContent;
  className?: string;
  accent?: keyof typeof ACCENT_COLORS;
  onSectionClick?: (sectionKey: string) => void;
}) {
  const p = content.personal;
  const theme = ACCENT_COLORS[accent] || ACCENT_COLORS.emerald;
  const hasAvatar = p.show_avatar !== false && !!p.avatar_url;

  return (
    <div
      className={cn(
        "cv-paper min-h-[1050px] w-full max-w-[794px] bg-white p-8 sm:p-10 text-[12.5px] leading-relaxed shadow-xl border border-slate-200/90 rounded-2xl font-sans text-slate-900 print:shadow-none print:border-none print:p-0 select-text",
        className
      )}
    >
      {/* Modern Tech Header with optional Avatar */}
      <header
        onClick={() => onSectionClick?.("personal")}
        className="border-b border-slate-200 pb-4 space-y-2 cursor-pointer hover:bg-slate-50/80 p-2 rounded-xl transition-colors relative group"
        title="Nhấp để chỉnh sửa Thông tin cá nhân"
      >
        <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 flex items-center gap-0.5 print:hidden">
          <Edit3 size={10} /> Sửa
        </span>

        <div className="flex items-center gap-4">
          {hasAvatar && (
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm shrink-0">
              <img src={p.avatar_url} alt={p.full_name} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {p.full_name || "Họ và Tên"}
            </h1>
            <p className={cn("text-xs font-black uppercase tracking-wider mt-0.5", theme.primaryText)}>
              {p.headline || "Tech Lead / Software Engineer"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-semibold pt-1">
          {p.email && (
            <span className="flex items-center gap-1">
              <Mail size={12} style={{ color: theme.primary }} /> {p.email}
            </span>
          )}
          {p.phone && (
            <span className="flex items-center gap-1">
              <Phone size={12} style={{ color: theme.primary }} /> {p.phone}
            </span>
          )}
          {p.location && (
            <span className="flex items-center gap-1">
              <MapPin size={12} style={{ color: theme.primary }} /> {p.location}
            </span>
          )}
          {p.website && (
            <a href={p.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 underline" style={{ color: theme.primary }}>
              <Globe size={12} /> {p.website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
      </header>

      {/* Summary */}
      {content.summary && (
        <section
          onClick={() => onSectionClick?.("summary")}
          className="mt-4 space-y-1.5 cursor-pointer hover:bg-slate-50/80 p-2 rounded-xl transition-colors"
          title="Nhấp để chỉnh sửa Tóm tắt"
        >
          <h2 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            <Sparkles size={13} style={{ color: theme.primary }} />
            <span>Tóm Tắt Năng Lực</span>
          </h2>
          <p className="text-xs leading-relaxed text-slate-600 font-medium">
            {content.summary}
          </p>
        </section>
      )}

      {/* Tech Stack Chips Matrix */}
      {content.skills && content.skills.length > 0 && (
        <section
          onClick={() => onSectionClick?.("skills")}
          className="mt-4 space-y-2 cursor-pointer hover:bg-slate-50/80 p-2 rounded-xl transition-colors"
          title="Nhấp để chỉnh sửa Kỹ năng"
        >
          <h2 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            <Code size={13} style={{ color: theme.primary }} />
            <span>Kỹ Năng Chuyên Môn & Tech Stack</span>
          </h2>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {content.skills.filter(Boolean).map((skill) => (
              <span
                key={skill}
                className="text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200/80 px-2.5 py-0.5 rounded-lg"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {content.experience && content.experience.length > 0 && (
        <section
          onClick={() => onSectionClick?.("experience")}
          className="mt-4 space-y-2.5 cursor-pointer hover:bg-slate-50/80 p-2 rounded-xl transition-colors"
          title="Nhấp để chỉnh sửa Kinh nghiệm"
        >
          <h2 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            <Briefcase size={13} style={{ color: theme.primary }} />
            <span>Kinh Nghiệm Làm Việc</span>
          </h2>
          <div className="space-y-3.5">
            {content.experience.map((item) => (
              <article key={item.id} className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                    {item.role || "Vị trí"}{" "}
                    <span className="font-bold" style={{ color: theme.primary }}>@ {item.company || "Công ty"}</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {item.start_date} – {item.current ? "Hiện tại" : item.end_date}
                  </span>
                </div>
                <ul className="list-disc pl-4 text-xs text-slate-600 space-y-1 leading-relaxed font-medium">
                  {item.bullets.filter(Boolean).map((bullet, idx) => (
                    <li key={`${item.id}-${idx}`}>{bullet}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {content.projects && content.projects.length > 0 && (
        <section
          onClick={() => onSectionClick?.("projects")}
          className="mt-4 space-y-2 cursor-pointer hover:bg-slate-50/80 p-2 rounded-xl transition-colors"
          title="Nhấp để chỉnh sửa Dự án"
        >
          <h2 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            <ExternalLink size={13} style={{ color: theme.primary }} />
            <span>Dự Án Tiêu Biểu</span>
          </h2>
          <div className="space-y-2.5">
            {content.projects.map((proj) => (
              <article key={proj.id} className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-slate-900 text-xs">{proj.name}</h3>
                  {proj.url && (
                    <a href={proj.url} target="_blank" rel="noreferrer" className="text-[11px] font-bold underline" style={{ color: theme.primary }}>
                      Xem Demo ↗
                    </a>
                  )}
                </div>
                <p className="text-xs text-slate-600">{proj.description}</p>
                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {proj.technologies.map((t) => (
                      <span key={t} className={cn("text-[10px] px-2 py-0.2 rounded font-bold border", theme.primaryBg, theme.badgeText, theme.badgeBorder)}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {content.education && content.education.length > 0 && (
        <section
          onClick={() => onSectionClick?.("education")}
          className="mt-4 space-y-1.5 cursor-pointer hover:bg-slate-50/80 p-2 rounded-xl transition-colors"
          title="Nhấp để chỉnh sửa Học vấn"
        >
          <h2 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            <GraduationCap size={13} style={{ color: theme.primary }} />
            <span>Học Vấn & Bằng Cấp</span>
          </h2>
          <div className="space-y-1.5">
            {content.education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline text-xs">
                <div>
                  <span className="font-bold text-slate-900">{edu.school}</span>
                  <p className="text-slate-600">{edu.degree}</p>
                </div>
                <span className="text-[11px] text-slate-500">{edu.start_date} – {edu.end_date}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. TOPCV B2B MODERN TWO-COLUMN (Popular Standard in Vietnam & Asia)
// ─────────────────────────────────────────────────────────────────────────────
function TopCvTwoColumnTemplate({
  content,
  className,
  accent = "emerald",
  onSectionClick,
}: {
  content: CvContent;
  className?: string;
  accent?: keyof typeof ACCENT_COLORS;
  onSectionClick?: (sectionKey: string) => void;
}) {
  const p = content.personal;
  const theme = ACCENT_COLORS[accent] || ACCENT_COLORS.emerald;
  const hasAvatar = p.show_avatar !== false && !!p.avatar_url;

  return (
    <div
      className={cn(
        "cv-paper min-h-[1050px] w-full max-w-[794px] bg-white shadow-xl border border-slate-200/90 rounded-2xl overflow-hidden font-sans text-slate-900 print:shadow-none print:border-none select-text",
        className
      )}
    >
      <div className="grid grid-cols-[250px_1fr] min-h-[1050px]">
        {/* Left Column (Sidebar) */}
        <aside className="bg-slate-50 p-6 border-r border-slate-200 space-y-5 text-xs">
          {/* Avatar / Name initial */}
          <div
            onClick={() => onSectionClick?.("personal")}
            className="space-y-2 text-center pb-4 border-b border-slate-200 cursor-pointer hover:bg-slate-100/80 p-2 rounded-xl transition-colors relative group"
            title="Nhấp để chỉnh sửa Thông tin & Avatar"
          >
            {hasAvatar ? (
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md mx-auto ring-2 ring-emerald-400/30">
                <img src={p.avatar_url} alt={p.full_name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div
                className="w-20 h-20 rounded-2xl text-white font-black text-3xl flex items-center justify-center mx-auto shadow-md"
                style={{ backgroundColor: theme.primary }}
              >
                {p.full_name ? p.full_name.charAt(0).toUpperCase() : "A"}
              </div>
            )}
            <h1 className="font-black text-base text-slate-900 leading-tight">
              {p.full_name || "Họ và Tên"}
            </h1>
            <p className={cn("text-[11px] font-bold uppercase", theme.primaryText)}>
              {p.headline || "Vị trí ứng tuyển"}
            </p>
          </div>

          {/* Contact Details */}
          <div
            onClick={() => onSectionClick?.("personal")}
            className="space-y-2 cursor-pointer hover:bg-slate-100/80 p-1.5 rounded-lg transition-colors"
          >
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
              Liên Hệ
            </h2>
            <div className="space-y-1.5 text-[11px] text-slate-600 font-medium">
              {p.email && (
                <p className="flex items-center gap-1.5 truncate">
                  <Mail size={12} style={{ color: theme.primary }} className="shrink-0" /> {p.email}
                </p>
              )}
              {p.phone && (
                <p className="flex items-center gap-1.5">
                  <Phone size={12} style={{ color: theme.primary }} className="shrink-0" /> {p.phone}
                </p>
              )}
              {p.location && (
                <p className="flex items-center gap-1.5">
                  <MapPin size={12} style={{ color: theme.primary }} className="shrink-0" /> {p.location}
                </p>
              )}
              {p.website && (
                <p className="flex items-center gap-1.5 truncate">
                  <Globe size={12} style={{ color: theme.primary }} className="shrink-0" /> {p.website}
                </p>
              )}
            </div>
          </div>

          {/* Skills */}
          {content.skills && content.skills.length > 0 && (
            <div
              onClick={() => onSectionClick?.("skills")}
              className="space-y-2 cursor-pointer hover:bg-slate-100/80 p-1.5 rounded-lg transition-colors"
            >
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
                Kỹ Năng
              </h2>
              <div className="flex flex-wrap gap-1 pt-1">
                {content.skills.filter(Boolean).map((skill) => (
                  <span
                    key={skill}
                    className="text-[10px] font-bold bg-white text-slate-800 border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {content.languages && content.languages.length > 0 && (
            <div
              onClick={() => onSectionClick?.("education")}
              className="space-y-2 cursor-pointer hover:bg-slate-100/80 p-1.5 rounded-lg transition-colors"
            >
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
                Ngoại Ngữ
              </h2>
              <div className="space-y-1 text-[11px] text-slate-600">
                {content.languages.filter(Boolean).map((lang) => (
                  <p key={lang}>• {lang}</p>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {content.certifications && content.certifications.length > 0 && (
            <div
              onClick={() => onSectionClick?.("education")}
              className="space-y-2 cursor-pointer hover:bg-slate-100/80 p-1.5 rounded-lg transition-colors"
            >
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
                Chứng Chỉ
              </h2>
              <div className="space-y-1 text-[11px] text-slate-600">
                {content.certifications.filter(Boolean).map((cert) => (
                  <p key={cert}>• {cert}</p>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Right Column (Main Experience & Projects) */}
        <main className="p-6 sm:p-8 space-y-5 text-xs">
          {/* Objective / Summary */}
          {content.summary && (
            <section
              onClick={() => onSectionClick?.("summary")}
              className="space-y-1.5 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors"
            >
              <h2
                className="text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 pb-1 inline-block"
                style={{ borderColor: theme.primary }}
              >
                Mục Tiêu Nghề Nghiệp
              </h2>
              <p className="text-xs leading-relaxed text-slate-600 font-medium">
                {content.summary}
              </p>
            </section>
          )}

          {/* Experience */}
          {content.experience && content.experience.length > 0 && (
            <section
              onClick={() => onSectionClick?.("experience")}
              className="space-y-2.5 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors"
            >
              <h2
                className="text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 pb-1 inline-block"
                style={{ borderColor: theme.primary }}
              >
                Kinh Nghiệm Làm Việc
              </h2>
              <div className="space-y-3">
                {content.experience.map((item) => (
                  <article key={item.id} className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-bold text-slate-900 text-xs">
                        {item.role || "Vị trí"} – <span className="font-bold" style={{ color: theme.primary }}>{item.company}</span>
                      </h3>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {item.start_date} – {item.current ? "Hiện tại" : item.end_date}
                      </span>
                    </div>
                    <ul className="list-disc pl-4 text-xs text-slate-600 space-y-0.5 leading-relaxed">
                      {item.bullets.filter(Boolean).map((bullet, idx) => (
                        <li key={`${item.id}-${idx}`}>{bullet}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {content.projects && content.projects.length > 0 && (
            <section
              onClick={() => onSectionClick?.("projects")}
              className="space-y-2 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors"
            >
              <h2
                className="text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 pb-1 inline-block"
                style={{ borderColor: theme.primary }}
              >
                Dự Án Nổi Bật
              </h2>
              <div className="space-y-2">
                {content.projects.map((proj) => (
                  <article key={proj.id} className="space-y-0.5">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-bold text-slate-900 text-xs">{proj.name}</h3>
                      {proj.url && (
                        <a href={proj.url} target="_blank" rel="noreferrer" className="text-[10px] underline" style={{ color: theme.primary }}>
                          Link ↗
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600">{proj.description}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {content.education && content.education.length > 0 && (
            <section
              onClick={() => onSectionClick?.("education")}
              className="space-y-1.5 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors"
            >
              <h2
                className="text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 pb-1 inline-block"
                style={{ borderColor: theme.primary }}
              >
                Học Vấn
              </h2>
              <div className="space-y-1.5">
                {content.education.map((edu) => (
                  <div key={edu.id} className="flex justify-between items-baseline text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{edu.school}</span>
                      <p className="text-slate-500 text-[11px]">{edu.degree}</p>
                    </div>
                    <span className="text-[10px] text-slate-400">{edu.start_date} – {edu.end_date}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CV PREVIEW EXPORT ROUTER
// ─────────────────────────────────────────────────────────────────────────────
export function CVPreview({
  content,
  template,
  className,
  accentColor = "emerald",
  onSectionClick,
}: CVPreviewProps) {
  if (template === "ats-minimal") {
    return <JakesResumeTemplate content={content} className={className} onSectionClick={onSectionClick} />;
  }
  if (template === "executive") {
    return <HarvardPrestigeTemplate content={content} className={className} onSectionClick={onSectionClick} />;
  }
  if (template === "professional-blue") {
    return <SiliconValleyTemplate content={content} className={className} accent={accentColor} onSectionClick={onSectionClick} />;
  }
  if (template === "modern-two-column") {
    return <TopCvTwoColumnTemplate content={content} className={className} accent={accentColor} onSectionClick={onSectionClick} />;
  }
  // creative-clean (Default modern minimalist)
  return <SiliconValleyTemplate content={content} className={className} accent={accentColor} onSectionClick={onSectionClick} />;
}
