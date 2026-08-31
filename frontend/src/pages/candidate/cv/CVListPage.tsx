import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  Trash2,
  Clock3,
  Copy,
  Sparkles,
  Zap,
  Edit3,
} from "lucide-react";
import { Button, Card, Skeleton } from "@/components/ui";
import { createCvDocument, deleteCvDocument, getCvDocuments } from "@/lib/api/cvDocuments";
import { CV_TEMPLATE_OPTIONS, type CvDocument } from "@/types/cvDocument";

export function CVListPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<CvDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    getCvDocuments()
      .then(setDocuments)
      .catch(() => setError("Không thể tải danh sách CV."))
      .finally(() => setIsLoading(false));
  }, []);

  const create = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const document = await createCvDocument();
      navigate(`/cv/${document.id}/edit`);
    } catch {
      setError("Không thể tạo CV mới. Vui lòng thử lại.");
    } finally {
      setIsCreating(false);
    }
  };

  const remove = async (document: CvDocument) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa "${document.title}"?`)) return;
    try {
      await deleteCvDocument(document.id);
      setDocuments((items) => items.filter((item) => item.id !== document.id));
    } catch {
      setError("Không thể xóa CV này.");
    }
  };

  const duplicate = async (source: CvDocument) => {
    setIsCreating(true);
    setError(null);
    try {
      const copy = await createCvDocument({
        title: `${source.title} (Bản sao)`,
        template_key: source.template_key,
        content_json: source.content_json,
      });
      setDocuments((items) => [copy, ...items]);
    } catch {
      setError("Không thể nhân bản CV này. Vui lòng thử lại.");
    } finally {
      setIsCreating(false);
    }
  };

  // Compute a quick ATS Score estimate from content_json
  const getDocumentAtsScore = (doc: CvDocument) => {
    const c = doc.content_json;
    if (!c) return 50;
    let score = 0;
    if (c.personal?.full_name && c.personal?.email && c.personal?.headline) score += 20;
    if ((c.summary?.length || 0) >= 40) score += 20;
    if (c.experience && c.experience.length > 0) score += 25;
    if (c.skills && c.skills.length >= 4) score += 20;
    if (c.education && c.education.length > 0) score += 15;
    return Math.max(score, 40);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB] font-sans pb-16 text-slate-900 selection:bg-emerald-500 selection:text-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* ── HERO BANNER ───────────────────────────────────────────── */}
        <section className="rounded-[32px] bg-white border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-4 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Sparkles size={13} className="text-[#00B86B]" />
                  AI CV Builder Studio 2026
                </span>
                <span className="text-xs text-slate-400">({documents.length} bản CV)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Quản Lý Hồ Sơ CV Của Bạn
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Tạo CV chuẩn ATS, tối ưu nội dung với công thức Google XYZ và xuất file PDF sắc nét.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={create}
                isLoading={isCreating}
                className="bg-gradient-to-r from-[#00B86B] to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-full px-5 py-2.5 shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={15} />
                <span>Tạo CV Mới Với AI</span>
              </Button>
            </div>
          </div>
        </section>

        {error && (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
            {error}
          </div>
        )}

        {/* ── CV LIST BENTO GRID ────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-56 rounded-3xl" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <Card className="rounded-[32px] border-slate-200/90 p-12 text-center bg-white shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#00B86B] flex items-center justify-center mx-auto border border-emerald-200">
              <FileText size={32} />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900">Bạn chưa có bản CV nào</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Bắt đầu tạo hồ sơ đầu tiên của bạn với các mẫu CV chuẩn quốc tế và nhận gợi ý từ khóa thông minh từ AI.
              </p>
            </div>
            <div className="pt-2">
              <Button
                onClick={create}
                isLoading={isCreating}
                className="bg-[#00B86B] hover:bg-[#00995C] text-white font-bold text-xs rounded-full px-6 py-2.5 shadow-sm"
              >
                <Plus size={15} className="mr-1" />
                Tạo CV Đầu Tiên
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => {
              const atsScore = getDocumentAtsScore(doc);
              const templateInfo = CV_TEMPLATE_OPTIONS.find((t) => t.key === doc.template_key);

              return (
                <motion.div
                  key={doc.id}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between space-y-5 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#00B86B] flex items-center justify-center border border-emerald-200 font-black shrink-0 group-hover:scale-105 transition-transform">
                        <FileText size={20} />
                      </div>
                      
                      {/* ATS Score Badge */}
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                        atsScore >= 80
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}>
                        <Zap size={11} className={atsScore >= 80 ? "text-[#00B86B]" : "text-amber-500"} />
                        <span>ATS: {atsScore}%</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="font-black text-base text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                        {doc.content_json.personal?.headline || "Chưa đặt chức danh"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-semibold pt-1 border-t border-slate-100">
                      <span>Mẫu: {templateInfo?.name || doc.template_key}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock3 size={11} /> {new Date(doc.updated_at).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                    <Link to={`/cv/${doc.id}/edit`} className="flex-1">
                      <Button
                        size="sm"
                        className="w-full bg-[#00B86B] hover:bg-[#00995C] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1"
                      >
                        <Edit3 size={13} />
                        <span>Chỉnh sửa</span>
                      </Button>
                    </Link>

                    <button
                      onClick={() => duplicate(doc)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Nhân bản CV này"
                    >
                      <Copy size={15} />
                    </button>

                    <button
                      onClick={() => remove(doc)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Xóa CV này"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
