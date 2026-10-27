import React, { useState } from "react";
import {
  Search,
  RotateCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  Tag,
  Clock,
  Layers,
} from "lucide-react";
import {
  getAdminRAGDocumentChunks,
  reindexAdminRAGDocument,
  purgeAdminRAGDocumentChunks,
  type DocumentChunksResponse,
} from "@/lib/api/adminRAG";

export const RAGDocumentSurgeryCard: React.FC = () => {
  const [docType, setDocType] = useState<string>("cv_document");
  const [docId, setDocId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [operating, setOperating] = useState<boolean>(false);
  const [docData, setDocData] = useState<DocumentChunksResponse | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const idNum = parseInt(docId.trim(), 10);
    if (!idNum || isNaN(idNum)) {
      setFeedbackMsg({ type: "error", text: "Vui lòng nhập ID hợp lệ (số nguyên dương)." });
      return;
    }

    setLoading(true);
    setFeedbackMsg(null);
    try {
      const data = await getAdminRAGDocumentChunks(docType, idNum);
      setDocData(data);
    } catch (err: any) {
      setDocData(null);
      setFeedbackMsg({
        type: "error",
        text: err?.response?.data?.detail || `Không tìm thấy ${docType} mang ID #${idNum}.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSurgicalReindex = async () => {
    if (!docData) return;
    setOperating(true);
    setFeedbackMsg(null);
    try {
      const res = await reindexAdminRAGDocument(docData.document_type, docData.document_id);
      setFeedbackMsg({
        type: "success",
        text: `Đã tái lập chỉ mục thành công! Sinh mới ${res.indexed_chunks_count} vector chunks vào pgvector.`,
      });
      // Refresh list
      const refreshed = await getAdminRAGDocumentChunks(docData.document_type, docData.document_id);
      setDocData(refreshed);
    } catch (err: any) {
      setFeedbackMsg({
        type: "error",
        text: err?.response?.data?.detail || "Lỗi khi tái lập chỉ mục tài liệu.",
      });
    } finally {
      setOperating(false);
    }
  };

  const handlePurgeChunks = async () => {
    if (!docData) return;
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn thu hồi toàn bộ vector chunks của ${docData.document_type} #${docData.document_id}? Tài liệu sẽ tạm thời không thể tìm kiếm qua AI RAG cho đến khi được re-index.`
    );
    if (!confirmed) return;

    setOperating(true);
    setFeedbackMsg(null);
    try {
      const res = await purgeAdminRAGDocumentChunks(docData.document_type, docData.document_id);
      setFeedbackMsg({
        type: "success",
        text: `Đã thu hồi thành công ${res.chunks_deleted} vector chunks khỏi cơ sở dữ liệu.`,
      });
      // Refresh list
      const refreshed = await getAdminRAGDocumentChunks(docData.document_type, docData.document_id);
      setDocData(refreshed);
    } catch (err: any) {
      setFeedbackMsg({
        type: "error",
        text: err?.response?.data?.detail || "Lỗi khi thu hồi chunks của tài liệu.",
      });
    } finally {
      setOperating(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Granular Document Inspection & Surgery
          </h3>
          <p className="text-xs text-slate-500">
            Soi chiếu trực tiếp từng vector chunks trong pgvector và can thiệp Re-index / Thu hồi đơn lẻ theo Document ID
          </p>
        </div>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
        <select
          value={docType}
          onChange={(e) => {
            setDocType(e.target.value);
            setDocData(null);
            setFeedbackMsg(null);
          }}
          className="px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="cv_document">CV Builder (Hồ sơ tạo trên web)</option>
          <option value="resume">File CV đính kèm (PDF/DOCX)</option>
          <option value="job">Tin tuyển dụng (JD)</option>
        </select>

        <div className="relative flex-1">
          <input
            type="number"
            min="1"
            value={docId}
            onChange={(e) => setDocId(e.target.value)}
            placeholder="Nhập mã định danh tài liệu (Document ID)..."
            className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        <button
          type="submit"
          disabled={loading || !docId.trim()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all disabled:opacity-50"
        >
          <span>{loading ? "Đang tra cứu..." : "Tra Cứu Vector"}</span>
        </button>
      </form>

      {feedbackMsg && (
        <div
          className={`mt-4 p-3.5 rounded-xl border flex items-center gap-2 text-xs font-medium ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {feedbackMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Document Details & Surgical Actions */}
      {docData && (
        <div className="mt-6 pt-5 border-t border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                  #{docData.document_id}
                </span>
                <h4 className="text-sm font-bold text-slate-900">{docData.document_title}</h4>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
                {docData.owner_email && (
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    Chủ sở hữu: <strong className="text-slate-700">{docData.owner_email}</strong>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Tiền kiểm RAG:{" "}
                  {docData.is_validated ? (
                    <span className="text-emerald-700 font-semibold bg-emerald-100/80 px-2 py-0.5 rounded text-[10px]">
                      HỢP LỆ
                    </span>
                  ) : (
                    <span className="text-amber-700 font-semibold bg-amber-100/80 px-2 py-0.5 rounded text-[10px]">
                      CHƯA ĐẠT CHUẨN
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Đang lập chỉ mục: <strong className="text-slate-700">{docData.total_chunks} chunks</strong>
                </span>
              </div>
            </div>

            {/* Surgery Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSurgicalReindex}
                disabled={operating}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${operating ? "animate-spin" : ""}`} />
                <span>Phẫu Thuật Re-index</span>
              </button>

              <button
                type="button"
                onClick={handlePurgeChunks}
                disabled={operating || docData.total_chunks === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Thu Hồi Chunks</span>
              </button>
            </div>
          </div>

          {/* Granular Chunks View */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Các phân mảnh vector trong CSDL ({docData.chunks.length} chunks):
              </span>
            </div>

            {docData.chunks.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-500">
                  Tài liệu này hiện chưa có vector chunk nào trong pgvector (hoặc đã bị thu hồi).
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Bấm nút "Phẫu Thuật Re-index" ở trên để băm nhỏ và sinh vector nạp vào kho.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                {docData.chunks.map((ch) => (
                  <div
                    key={ch.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          Chunk #{ch.chunk_index + 1} (DB ID #{ch.id})
                        </span>
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px] uppercase">
                          {ch.section_type}
                        </span>
                        {ch.has_embedding && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            ✓ Vector pgvector 1536-dim
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        {ch.created_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(ch.created_at).toLocaleTimeString("vi-VN")}
                          </span>
                        )}
                        <span className="font-mono text-slate-500">{ch.char_count} ký tự</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-800 leading-relaxed font-normal whitespace-pre-wrap">
                      {ch.content}
                    </div>

                    {ch.metadata && Object.keys(ch.metadata).length > 0 && (
                      <div className="text-[11px] text-slate-500 font-mono">
                        Metadata: {JSON.stringify(ch.metadata)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
