import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Plus, Trash2, Clock3, Copy } from "lucide-react";
import { Button, Card, CardContent, Skeleton } from "@/components/ui";
import { createCvDocument, deleteCvDocument, getCvDocuments } from "@/lib/api/cvDocuments";
import { CV_TEMPLATE_OPTIONS, type CvDocument } from "@/types/cvDocument";

export function CVListPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<CvDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => { getCvDocuments().then(setDocuments).catch(() => setError("Không thể tải danh sách CV.")).finally(() => setIsLoading(false)); }, []);

  const create = async () => {
    setIsCreating(true); setError(null);
    try { const document = await createCvDocument(); navigate(`/cv/${document.id}/edit`); }
    catch { setError("Không thể tạo CV mới. Vui lòng thử lại."); }
    finally { setIsCreating(false); }
  };

  const remove = async (document: CvDocument) => {
    if (!window.confirm(`Xóa ${document.title}?`)) return;
    try { await deleteCvDocument(document.id); setDocuments((items) => items.filter((item) => item.id !== document.id)); }
    catch { setError("Không thể xóa CV này."); }
  };

  const duplicate = async (source: CvDocument) => {
    setIsCreating(true); setError(null);
    try {
      const copy = await createCvDocument({ title: `${source.title} - Bản sao`, template_key: source.template_key, content_json: source.content_json });
      setDocuments((items) => [copy, ...items]);
    } catch { setError("Không thể nhân bản CV này. Vui lòng thử lại."); }
    finally { setIsCreating(false); }
  };

  return <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-emerald-600">CV Builder</p><h1 className="text-3xl font-semibold text-gray-900">CV cá nhân của bạn</h1><p className="mt-2 text-sm text-gray-600">Tạo CV chuyên nghiệp, lưu bản nháp và xuất PDF khi sẵn sàng.</p></div><Button onClick={create} isLoading={isCreating} leftIcon={<Plus className="h-4 w-4" />}>Tạo CV mới</Button></div>
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {isLoading ? <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-48" />)}</div> : documents.length === 0 ? <Card><CardContent className="flex flex-col items-center py-16 text-center"><FileText className="h-12 w-12 text-gray-300" /><h2 className="mt-4 text-lg font-semibold text-gray-900">Bạn chưa có CV nào</h2><p className="mt-2 max-w-md text-sm text-gray-500">Bắt đầu với một mẫu CV và hoàn thiện từng phần theo kinh nghiệm của bạn.</p><Button className="mt-5" onClick={create} leftIcon={<Plus className="h-4 w-4" />}>Tạo CV đầu tiên</Button></CardContent></Card> : <Card noPadding><div className="divide-y divide-gray-100">{documents.map((document) => <div key={document.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light"><FileText className="h-5 w-5 text-primary" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-sm font-semibold text-gray-900">{document.title}</h2><span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{document.status === "draft" ? "Bản nháp" : "Đã xuất bản"}</span></div><p className="mt-1 flex items-center gap-1 text-xs text-gray-500"><span>{CV_TEMPLATE_OPTIONS.find((item) => item.key === document.template_key)?.name ?? document.template_key}</span><span aria-hidden="true">·</span><Clock3 className="h-3 w-3" />{new Date(document.updated_at).toLocaleDateString("vi-VN")}</p></div></div><div className="flex shrink-0 items-center gap-2"><Link to={`/cv/${document.id}/edit`}><Button size="sm">Chỉnh sửa</Button></Link><Link to={`/cv/${document.id}/preview`}><Button size="sm" variant="outline">Xem trước</Button></Link><Button size="sm" variant="ghost" aria-label={`Nhân bản ${document.title}`} onClick={() => duplicate(document)} leftIcon={<Copy className="h-4 w-4" />} /><Button size="sm" variant="ghost" aria-label={`Xóa ${document.title}`} onClick={() => remove(document)} leftIcon={<Trash2 className="h-4 w-4" />} /></div></div>)}</div></Card>}
  </div>;
}
