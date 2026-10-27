import React, { useState } from "react";
import {
  FlaskConical,
  Play,
  AlertTriangle,
  FileText,
  Briefcase,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import {
  simulateAdminRAGChunking,
  type SimulateChunkingResponse,
} from "@/lib/api/adminRAG";

const SAMPLE_CV_BUILDER = {
  personal: {
    full_name: "Trần Anh Tuấn",
    headline: "Senior Cloud & AI Engineer",
    summary: "Hơn 6 năm kinh nghiệm kiến trúc hệ thống RAG quy mô lớn, microservices FastAPI và pgvector.",
    location: "TP. Hồ Chí Minh",
  },
  skills: ["Python", "FastAPI", "PostgreSQL", "pgvector", "Docker", "PyTorch", "Kubernetes"],
  experience: [
    {
      role: "Lead Platform Engineer",
      company: "Fintech VN Group",
      start_date: "2021",
      end_date: "Hiện tại",
      description: "Xây dựng hạ tầng tìm kiếm vector phân tán chịu tải 3 triệu queries/ngày với p99 latency dưới 35ms.",
    },
    {
      role: "Backend Developer",
      company: "NextGen Software",
      start_date: "2018",
      end_date: "2021",
      description: "Tối ưu hóa cơ sở dữ liệu quan hệ và xây dựng RESTful APIs hiệu năng cao.",
    },
  ],
  projects: [
    {
      name: "AI Talent Search Engine",
      role: "Tech Lead",
      tech_stack: ["FastAPI", "pgvector", "OpenAI"],
      description: "Hệ thống gợi ý ứng viên thông minh kết hợp Hybrid Search (BM25 + Cosine Similarity).",
    },
  ],
  education: [
    {
      school: "Đại học Bách Khoa TP.HCM",
      major: "Khoa học Máy tính",
      start_year: "2014",
      end_year: "2018",
    },
  ],
};

const SAMPLE_RESUME_TEXT = `Hồ sơ: Kỹ sư Lập trình Python & Cloud AWS
Vị trí mong muốn: Senior Python Developer
Kỹ năng: Python, FastAPI, Docker, Kubernetes, PostgreSQL, Redis, Celery, Vector DB.
Kinh nghiệm làm việc: Tech Lead tại VNPAY từ 2020 đến nay. Phát triển cổng thanh toán điện tử xử lý hàng triệu giao dịch an toàn mỗi ngày.
Dự án: Cổng đối soát tự động xử lý 10,000 giao dịch/giây không gián đoạn.
Học vấn: Cử nhân Công nghệ Thông tin - Đại học Bách Khoa.`;

const SAMPLE_JOB_TEXT = `Tuyển dụng Senior AI/ML Engineer
Mô tả công việc: Chịu trách nhiệm thiết kế và triển khai mô hình RAG Hybrid Search cho nền tảng tuyển dụng.
Yêu cầu chuyên môn:
- Ít nhất 3 năm kinh nghiệm với Python, PyTorch hoặc Transformers.
- Hiểu biết sâu về Vector Databases (pgvector, Milvus hoặc Qdrant).
- Khả năng tối ưu hóa truy vấn SQL và băm nhỏ tài liệu (Chunking strategies).
Quyền lợi: Lương $2,500 - $4,000, bảo hiểm chăm sóc sức khỏe cao cấp, thưởng quý theo KPI.`;

export const RAGChunkSimulatorCard: React.FC = () => {
  const [docType, setDocType] = useState<"cv_document" | "resume" | "job">("cv_document");
  const [inputText, setInputText] = useState<string>("");
  const [chunkSize, setChunkSize] = useState<number>(1200);
  const [chunkOverlap, setChunkOverlap] = useState<number>(120);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SimulateChunkingResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoadSample = () => {
    if (docType === "cv_document") {
      setInputText(JSON.stringify(SAMPLE_CV_BUILDER, null, 2));
    } else if (docType === "resume") {
      setInputText(SAMPLE_RESUME_TEXT);
    } else {
      setInputText(SAMPLE_JOB_TEXT);
    }
  };

  const handleSimulate = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let contentJson: Record<string, any> | undefined = undefined;
      let rawText: string | undefined = inputText.trim();

      if (docType === "cv_document") {
        if (rawText.startsWith("{")) {
          try {
            contentJson = JSON.parse(rawText);
            rawText = undefined;
          } catch {
            setErrorMsg("Định dạng JSON CV Builder không hợp lệ. Vui lòng kiểm tra lại cú pháp.");
            setLoading(false);
            return;
          }
        }
      }

      const res = await simulateAdminRAGChunking({
        document_type: docType,
        text: rawText,
        content_json: contentJson,
        chunk_size: chunkSize,
        chunk_overlap: chunkOverlap,
      });
      setResult(res);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || "Lỗi mô phỏng phân mảnh. Vui lòng kiểm tra dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Live Chunking Simulator & Sandbox
            </h3>
            <p className="text-xs text-slate-500">
              Thử nghiệm băm nhỏ tài liệu thời gian thực theo cấu hình tùy chọn mà không ghi vào cơ sở dữ liệu
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLoadSample}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 rounded-xl border border-indigo-200/80 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Tải Mẫu Dữ Liệu {docType === "cv_document" ? "CV Builder" : docType === "resume" ? "File CV" : "Job"}
        </button>
      </div>

      <div className="space-y-4">
        {/* Document Type Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Loại tài liệu thử nghiệm:
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: "cv_document", label: "CV Builder", icon: Layers, desc: "JSON cấu trúc web" },
              { id: "resume", label: "File CV đính kèm", icon: FileText, desc: "Văn bản trích xuất PDF/DOCX" },
              { id: "job", label: "Tin tuyển dụng", icon: Briefcase, desc: "Tiêu chí & Mô tả JD" },
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = docType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setDocType(t.id as any);
                    setResult(null);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 ${isSelected ? "text-indigo-600" : "text-slate-400"}`} />
                  <div>
                    <div className="text-xs font-bold text-slate-900">{t.label}</div>
                    <div className="text-[11px] text-slate-600">{t.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Text / JSON */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {docType === "cv_document" ? "Nội dung JSON hoặc văn bản hồ sơ:" : "Nội dung văn bản thử nghiệm:"}
          </label>
          <textarea
            rows={5}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              docType === "cv_document"
                ? "Dán chuỗi JSON của CV Builder hoặc bấm 'Tải Mẫu Dữ Liệu' ở trên..."
                : "Dán văn bản CV hoặc JD vào đây..."
            }
            className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Slider Overrides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-slate-700">Chunk Size thử nghiệm:</label>
              <span className="text-xs font-mono font-bold text-indigo-700">{chunkSize} ký tự</span>
            </div>
            <input
              type="range"
              min="200"
              max="3000"
              step="50"
              value={chunkSize}
              onChange={(e) => setChunkSize(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-slate-700">Chunk Overlap thử nghiệm:</label>
              <span className="text-xs font-mono font-bold text-indigo-700">{chunkOverlap} ký tự</span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={chunkOverlap}
              onChange={(e) => setChunkOverlap(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleSimulate}
            disabled={loading || !inputText.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            <span>{loading ? "Đang phân tích..." : "Chạy Mô Phỏng Phân Mảnh"}</span>
          </button>
        </div>

        {/* Simulation Output */}
        {result && (
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-4">
            {/* Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <div className="text-[11px] text-slate-500">Số lượng Chunks</div>
                <div className="text-lg font-bold text-indigo-700 mt-0.5">{result.total_chunks}</div>
              </div>
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <div className="text-[11px] text-slate-500">Độ dài trung bình</div>
                <div className="text-lg font-bold text-indigo-700 mt-0.5">{result.average_chunk_size} ký tự</div>
              </div>
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <div className="text-[11px] text-slate-500">Chunk Size áp dụng</div>
                <div className="text-lg font-bold text-indigo-700 mt-0.5">{result.effective_chunk_size}</div>
              </div>
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <div className="text-[11px] text-slate-500">Overlap áp dụng</div>
                <div className="text-lg font-bold text-indigo-700 mt-0.5">{result.effective_chunk_overlap}</div>
              </div>
            </div>

            {/* Warnings if any */}
            {result.warnings && result.warnings.length > 0 && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Cảnh báo Tiền kiểm RAG:</span>
                </div>
                {result.warnings.map((w, idx) => (
                  <p key={idx} className="text-xs text-amber-700 pl-6">• {w}</p>
                ))}
              </div>
            )}

            {/* Chunks List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Danh sách {result.chunks.length} Chunks được phân đoạn:
                </span>
                <span className="text-[11px] text-slate-600">
                  Semantic Section Preservation
                </span>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {result.chunks.map((c) => (
                  <div
                    key={c.chunk_index}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white transition-colors space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded">
                          #{c.chunk_index + 1}
                        </span>
                        <span className="font-semibold text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded uppercase text-[10px]">
                          {c.section_type}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-600 font-mono">
                        {c.char_count} ký tự • {c.word_count} từ
                      </span>
                    </div>

                    <p className="text-slate-800 font-normal leading-relaxed whitespace-pre-wrap bg-white p-2.5 rounded-lg border border-slate-100">
                      {c.content}
                    </p>

                    {c.metadata && Object.keys(c.metadata).length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">Metadata: {JSON.stringify(c.metadata)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
