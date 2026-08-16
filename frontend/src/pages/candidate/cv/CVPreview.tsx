import { cn } from "@/lib/utils";
import type { CvContent, CvTemplateKey } from "@/types/cvDocument";

interface CVPreviewProps {
  content: CvContent;
  template: CvTemplateKey;
  className?: string;
}

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("mt-5", className)}>
      <h2 className="border-b border-current/20 pb-1 text-xs font-bold uppercase tracking-[0.14em]">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function MainSections({ content, accent = "text-gray-900" }: { content: CvContent; accent?: string }) {
  return (
    <div className={cn("text-gray-700", accent)}>
      {content.summary && <Section title="Tóm tắt"><p className="text-sm leading-relaxed text-gray-700">{content.summary}</p></Section>}
      {content.experience.length > 0 && <Section title="Kinh nghiệm">
        <div className="space-y-4">{content.experience.map((item) => (
          <article key={item.id}>
            <div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold text-gray-900">{item.role || "Vị trí"}</h3><span className="text-xs text-gray-500">{item.start_date} - {item.current ? "Hiện tại" : item.end_date}</span></div>
            <p className="text-sm text-gray-600">{item.company}{item.location ? ` · ${item.location}` : ""}</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{item.bullets.filter(Boolean).map((bullet, index) => <li key={`${item.id}-${index}`}>{bullet}</li>)}</ul>
          </article>
        ))}</div>
      </Section>}
      {content.education.length > 0 && <Section title="Học vấn"><div className="space-y-3">{content.education.map((item) => <article key={item.id}><div className="flex justify-between gap-2"><h3 className="font-semibold text-gray-900">{item.degree || "Chương trình học"}</h3><span className="text-xs text-gray-500">{item.start_date} - {item.end_date}</span></div><p className="text-sm text-gray-600">{item.school}</p>{item.details && <p className="mt-1 text-sm">{item.details}</p>}</article>)}</div></Section>}
      {content.projects.length > 0 && <Section title="Dự án"><div className="space-y-3">{content.projects.map((item) => <article key={item.id}><h3 className="font-semibold text-gray-900">{item.name || "Dự án"}</h3><p className="text-sm leading-relaxed">{item.description}</p>{item.technologies.length > 0 && <p className="mt-1 text-xs text-gray-500">{item.technologies.join(" · ")}</p>}</article>)}</div></Section>}
    </div>
  );
}

function SidebarSections({ content }: { content: CvContent }) {
  return <aside className="space-y-4 text-sm text-gray-700">
    {content.skills.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-[0.14em] text-gray-900">Kỹ năng</h2><div className="mt-2 flex flex-wrap gap-1.5">{content.skills.filter(Boolean).map((skill) => <span key={skill} className="rounded-full bg-gray-100 px-2 py-1 text-xs">{skill}</span>)}</div></div>}
    {content.languages.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-[0.14em] text-gray-900">Ngôn ngữ</h2><p className="mt-2">{content.languages.join(" · ")}</p></div>}
    {content.certifications.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-[0.14em] text-gray-900">Chứng chỉ</h2><ul className="mt-2 list-disc pl-4">{content.certifications.filter(Boolean).map((item) => <li key={item}>{item}</li>)}</ul></div>}
  </aside>;
}

export function CVPreview({ content, template, className }: CVPreviewProps) {
  const header = <header className="border-b border-gray-200 pb-4"><h1 className="text-2xl font-bold text-gray-900">{content.personal.full_name || "Tên của bạn"}</h1><p className="mt-1 text-sm font-medium text-gray-600">{content.personal.headline || "Vị trí mong muốn"}</p><p className="mt-2 text-xs text-gray-500">{[content.personal.email, content.personal.phone, content.personal.location, content.personal.website].filter(Boolean).join(" · ") || "Email · Điện thoại · Thành phố"}</p></header>;
  const base = "cv-paper min-h-[1120px] w-full max-w-[794px] bg-white p-8 text-[13px] leading-relaxed shadow-sm print:shadow-none";

  if (template === "modern-two-column") return <div className={cn(base, "grid grid-cols-[180px_1fr] gap-7 border-l-8 border-primary", className)}><div className="space-y-6"><div>{header}</div><SidebarSections content={content} /></div><MainSections content={content} /></div>;
  if (template === "professional-blue") return <div className={cn(base, "border-t-8 border-primary", className)}>{header}<MainSections content={content} accent="text-primary" /><SidebarSections content={content} /></div>;
  if (template === "executive") return <div className={cn(base, "font-serif", className)}>{header}<MainSections content={content} /><SidebarSections content={content} /></div>;
  if (template === "creative-clean") return <div className={cn(base, "border-l-8 border-success", className)}>{header}<div className="grid gap-7 md:grid-cols-[1fr_180px]"><MainSections content={content} accent="text-success" /><SidebarSections content={content} /></div></div>;
  return <div className={cn(base, className)}>{header}<MainSections content={content} /><SidebarSections content={content} /></div>;
}

