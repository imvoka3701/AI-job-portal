/**
 * EmployerTalentSearch — B2B Semantic Talent Search powered by RAG Hybrid Retrieval
 * Implements Chapter 7: "Thiết kế hệ thống và dữ liệu cho ứng dụng AI tạo sinh"
 * Persona: UI/UX Architect & Frontend Engineer (B2B SaaS Style - TopCV/Stripe/Vercel)
 *
 * Tính năng:
 * - Tìm kiếm ứng viên bằng ngôn ngữ tự nhiên (Dense Vector Cosine + Sparse BM25 lexical)
 * - Lọc theo Section: Kinh nghiệm, Dự án, Kỹ năng, Học vấn, Tóm tắt
 * - Lọc theo Loại hồ sơ: Tất cả, CV Builder, File đính kèm (PDF)
 * - Điều chỉnh ngưỡng tương đồng (Min Score threshold)
 * - Thẻ ứng viên với Hybrid Score gauge, Dense/Sparse breakdown, và Skills tags
 * - Xem nhanh CV Builder (CVPreview) hoặc File đính kèm (CVPreviewModal)
 * - Sao chép trích dẫn năng lực ứng viên
 * - Đủ 4 trạng thái: Ideal, Loading Skeleton, Empty State, Error State
 */

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Sparkles,
  Briefcase,
  Code2,
  GraduationCap,
  Wrench,
  FileText,
  Copy,
  Check,
  SlidersHorizontal,
  X,
  AlertCircle,
  Eye,
  TrendingUp,
  Bot,
} from "lucide-react";
import { Button, Modal, Spinner } from "@/components/ui";
import { searchRAG, type RAGSearchResult } from "@/lib/api/rag";
import { apiClient } from "@/lib/axios";
import { CVPreview } from "@/pages/candidate/cv/CVPreview";
import { CVPreviewModal } from "@/pages/candidate/components/CVPreviewModal";
import { CVCopilotDrawer } from "@/components/rag/CVCopilotDrawer";
import type { CvDocument } from "@/types/cvDocument";
import { cn } from "@/lib/utils";

// ─── Query Suggestions & Config ───────────────────────────────────────────────
const SUGGESTED_QUERIES = [
  "Frontend Engineer có kinh nghiệm React, TypeScript và Tailwind CSS",
  "Backend Developer thành thạo Python, FastAPI, PostgreSQL và kiến trúc Microservices",
  "DevOps Engineer chuyên sâu Kubernetes, Docker và CI/CD pipeline",
  "Data Engineer triển khai ETL, PostgreSQL pgvector và pipeline dữ liệu lớn",
  "Tech Lead có khả năng thiết kế hệ thống và dẫn dắt đội ngũ kỹ sư",
];

const SECTION_OPTIONS: Array<{
  id: string | null;
  label: string;
  icon: typeof Briefcase;
}> = [
  { id: null, label: "Tất cả phần", icon: FileText },
  { id: "experience", label: "Kinh nghiệm làm việc", icon: Briefcase },
  { id: "project", label: "Dự án thực tế", icon: Code2 },
  { id: "skills", label: "Kỹ năng chuyên môn", icon: Wrench },
  { id: "summary", label: "Tóm tắt & Mục tiêu", icon: FileText },
  { id: "education", label: "Học vấn", icon: GraduationCap },
];

const DOC_TYPE_OPTIONS = [
  { id: "all", label: "Tất cả nguồn" },
  { id: "cv_document", label: "CV Builder" },
  { id: "resume", label: "File đính kèm (PDF)" },
];

const SCORE_THRESHOLDS = [
  { value: 0.4, label: "0.40 (Mở rộng)" },
  { value: 0.55, label: "0.55 (Khuyến nghị)" },
  { value: 0.7, label: "0.70 (Chính xác cao)" },
];

export function EmployerTalentSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>("all");
  const [minScore, setMinScore] = useState<number>(0.55);

  const [results, setResults] = useState<RAGSearchResult[]>([]);
  const [totalMatched, setTotalMatched] = useState<number>(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedChunkId, setCopiedChunkId] = useState<number | null>(null);

  // Preview Modals state
  const [builderPreviewDoc, setBuilderPreviewDoc] = useState<CvDocument | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<number | null>(null);

  const [, startTransition] = useTransition();

  // ── Search Action ───────────────────────────────────────────────────────────
  const executeSearch = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await searchRAG({
        query: trimmed,
        document_type: selectedDocType !== "all" ? (selectedDocType as "resume" | "cv_document") : null,
        section_types: selectedSection ? [selectedSection] : null,
        limit: 20,
        min_score: minScore,
      });

      startTransition(() => {
        setResults(response.results || []);
        setTotalMatched(response.total_matched || 0);
        setHasSearched(true);
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setErrorMsg(
        error?.response?.data?.detail ||
          "Không thể thực hiện tìm kiếm ngữ nghĩa. Vui lòng thử lại sau giây lát."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const handleSelectSuggested = (query: string) => {
    setSearchQuery(query);
    executeSearch(query);
  };

  const handleCopyContent = (content: string, chunkId: number) => {
    navigator.clipboard.writeText(content);
    setCopiedChunkId(chunkId);
    setTimeout(() => setCopiedChunkId(null), 2000);
  };

  // ── Open Document Preview ───────────────────────────────────────────────────
  const handleOpenDocPreview = async (result: RAGSearchResult) => {
    setPreviewLoadingId(result.chunk_id);
    try {
      if (result.document_type === "cv_document") {
        const { data } = await apiClient.get<CvDocument>(`/cv-documents/${result.document_id}`);
        setBuilderPreviewDoc(data);
      } else if (result.document_type === "resume") {
        const { data } = await apiClient.get<{ file_url: string }>(`/resumes/${result.document_id}`);
        if (data?.file_url) {
          setPreviewPdfUrl(data.file_url);
        } else {
          window.open(`/resumes/${result.document_id}`, "_blank");
        }
      }
    } catch {
      setErrorMsg("Không thể tải tài liệu xem trước của ứng viên.");
    } finally {
      setPreviewLoadingId(null);
    }
  };

  // ── Open CV Copilot ────────────────────────────────────────────────────────
  const [copilotDoc, setCopilotDoc] = useState<{
    candidateName?: string | null;
    documentTitle?: string | null;
    cvDocumentId?: number | null;
    resumeId?: number | null;
  } | null>(null);

  const handleOpenCopilot = (result: RAGSearchResult) => {
    setCopilotDoc({
      candidateName: result.candidate_name,
      documentTitle: result.document_title,
      cvDocumentId: result.document_type === "cv_document" ? result.document_id : null,
      resumeId: result.document_type === "resume" ? result.document_id : null,
    });
  };

  // ── Section Icon Helper ─────────────────────────────────────────────────────
  const getSectionBadge = (sectionType: string) => {
    switch (sectionType) {
      case "experience":
        return { label: "Kinh nghiệm làm việc", icon: Briefcase, color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "project":
        return { label: "Dự án thực tế", icon: Code2, color: "bg-purple-50 text-purple-700 border-purple-200" };
      case "skills":
        return { label: "Kỹ năng chuyên môn", icon: Wrench, color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "education":
        return { label: "Học vấn", icon: GraduationCap, color: "bg-amber-50 text-amber-700 border-amber-200" };
      case "summary":
        return { label: "Tóm tắt & Mục tiêu", icon: FileText, color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      default:
        return { label: sectionType, icon: FileText, color: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Tìm Kiếm Nhân Tài Bằng AI (Talent Search)
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-2xs">
              <Sparkles className="w-3 h-3 text-amber-300" />
              AI RAG Hybrid
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Ứng dụng kiến trúc Hybrid Retrieval (Dense Vector Cosine + Sparse BM25 Lexical) theo Chapter 7 để
            tìm kiếm chính xác kinh nghiệm, kỹ năng và dự án thực tế trong kho hồ sơ ứng viên.
          </p>
        </div>
      </div>

      {/* ── Search Bar Box ── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleFormSubmit} className="relative">
          <div className="relative flex items-center">
            <div className="absolute left-4 pointer-events-none text-slate-400">
              <Search className="w-5 h-5 text-indigo-600" />
            </div>
            <input
              type="text"
              placeholder="Nhập yêu cầu nhân tài (Ví dụ: Kỹ sư Fullstack thành thạo React, TypeScript, FastAPI và có kinh nghiệm tối ưu SQL)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-13 pl-12 pr-32 rounded-xl border border-slate-200 bg-slate-50/60 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-28 p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <Button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              className="absolute right-2 h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-xs"
            >
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <Spinner size="sm" className="text-white" />
                  <span>Đang tìm...</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Tìm kiếm AI</span>
                </span>
              )}
            </Button>
          </div>
        </form>

        {/* Suggested Queries Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Gợi ý:
          </span>
          {SUGGESTED_QUERIES.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSuggested(q)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-100/80 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200/60 text-slate-600 font-medium transition-all cursor-pointer text-left"
            >
              {q}
            </button>
          ))}
        </div>

        {/* ── Filters Bar ── */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          {/* Section Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" /> Phân đoạn:
            </span>
            {SECTION_OPTIONS.map((sec) => {
              const Icon = sec.icon;
              const isSelected = selectedSection === sec.id;
              return (
                <button
                  key={sec.id ?? "all"}
                  type="button"
                  onClick={() => setSelectedSection(sec.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    isSelected
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>

          {/* Doc Type & Min Score Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Doc Type */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
              {DOC_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedDocType(opt.id)}
                  className={cn(
                    "px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer",
                    selectedDocType === opt.id
                      ? "bg-white text-indigo-700 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Min Score Threshold */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 font-medium">Độ khớp:</span>
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                {SCORE_THRESHOLDS.map((thresh) => (
                  <button
                    key={thresh.value}
                    type="button"
                    onClick={() => setMinScore(thresh.value)}
                    className={cn(
                      "px-2 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer",
                      minScore === thresh.value
                        ? "bg-indigo-600 text-white shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    {thresh.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => executeSearch(searchQuery)}
            className="h-7 text-xs border-rose-200 text-rose-800 hover:bg-rose-100"
          >
            Thử lại
          </Button>
        </div>
      )}

      {/* ── Search Results List ── */}
      {isLoading ? (
        /* Loading Skeleton */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 animate-pulse">
            <div className="h-4 w-48 bg-slate-200 rounded-md" />
            <div className="h-4 w-24 bg-slate-200 rounded-md" />
          </div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-36 bg-slate-200 rounded-md" />
                    <div className="h-3 w-48 bg-slate-100 rounded-md" />
                  </div>
                </div>
                <div className="h-7 w-24 bg-slate-100 rounded-lg" />
              </div>
              <div className="h-16 bg-slate-50 rounded-xl" />
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-slate-100 rounded-md" />
                <div className="h-5 w-20 bg-slate-100 rounded-md" />
                <div className="h-5 w-24 bg-slate-100 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : hasSearched && results.length === 0 ? (
        /* Empty State */
        <div className="py-16 text-center rounded-2xl bg-white border border-slate-200 p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Không tìm thấy phân đoạn hồ sơ phù hợp
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Không có ứng viên nào khớp với ngưỡng tương đồng {minScore}. Thử hạ thấp ngưỡng tương đồng về{" "}
            <strong>0.40</strong> hoặc mở rộng phạm vi từ khóa tìm kiếm.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMinScore(0.4);
              setSelectedSection(null);
              setSelectedDocType("all");
              executeSearch(searchQuery);
            }}
            className="rounded-xl mt-2 text-xs font-bold"
          >
            Hạ ngưỡng tương đồng và tìm lại
          </Button>
        </div>
      ) : hasSearched && results.length > 0 ? (
        /* Ideal Results State */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
            <span>
              Tìm thấy <strong className="text-indigo-600">{totalMatched}</strong> phân đoạn năng lực phù hợp
            </span>
            <span className="text-[11px] text-slate-400">
              Sắp xếp theo Hybrid Score (Dense Cosine 70% + BM25 Sparse 30%)
            </span>
          </div>

          <div className="space-y-3.5">
            {results.map((item, idx) => {
              const secBadge = getSectionBadge(item.section_type);
              const SecIcon = secBadge.icon;
              const isPdf = item.document_type === "resume";
              const candidateName = item.candidate_name || "Ứng viên ẩn danh";
              const initials = candidateName
                .split(" ")
                .filter(Boolean)
                .slice(-2)
                .map((w) => w[0]?.toUpperCase())
                .join("") || "UV";

              const skills = (item.metadata?.skills as string[]) || [];

              return (
                <motion.div
                  key={item.chunk_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-200 shadow-xs hover:shadow-sm transition-all space-y-3.5 group"
                >
                  {/* Top Bar: Candidate Info & Hybrid Score Gauge */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar initials */}
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xs text-white bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xs">
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {candidateName}
                          </h4>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                              isPdf
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-teal-50 text-teal-800 border-teal-200"
                            )}
                          >
                            {isPdf ? "PDF Đính kèm" : "CV Builder"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {item.document_title || (isPdf ? `Resume #${item.document_id}` : `CV Profile #${item.document_id}`)}
                          {item.metadata?.role ? ` • ${String(item.metadata.role)}` : ""}
                          {item.metadata?.company_name ? ` @ ${String(item.metadata.company_name)}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Hybrid Score Ring Badge */}
                    <div className="flex items-center gap-2.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Độ phù hợp</p>
                        <p className="text-sm font-black text-slate-900 leading-none">
                          {Math.round(item.hybrid_score * 100)}%
                        </p>
                      </div>
                      <div className="flex flex-col gap-0.5 text-[9px] text-slate-400 border-l border-slate-200 pl-2">
                        <span>Dense: {Math.round(item.dense_score * 100)}%</span>
                        <span>BM25: {Math.round(item.sparse_score * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Section Badge & Preview content */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border",
                          secBadge.color
                        )}
                      >
                        <SecIcon className="w-3 h-3" />
                        {secBadge.label}
                      </span>
                      {item.metadata?.period && (
                        <span className="text-xs text-slate-400 font-medium">
                          • Thời gian: {String(item.metadata.period)}
                        </span>
                      )}
                    </div>

                    {/* Chunk Snippet Box */}
                    <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-line group-hover:bg-indigo-50/20 group-hover:border-indigo-100 transition-colors">
                      {item.content}
                    </div>
                  </div>

                  {/* Skills tags & Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    {/* Skills pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {skills.slice(0, 6).map((sk, skIdx) => (
                        <span
                          key={skIdx}
                          className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyContent(item.content, item.chunk_id)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-all cursor-pointer"
                      >
                        {copiedChunkId === item.chunk_id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>Trích dẫn</span>
                          </>
                        )}
                      </button>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleOpenCopilot(item)}
                        className="h-7 text-xs font-bold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                      >
                        <Bot className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                        Hỏi Copilot
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={previewLoadingId === item.chunk_id}
                        onClick={() => handleOpenDocPreview(item)}
                        className="h-7 text-xs font-bold rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      >
                        {previewLoadingId === item.chunk_id ? (
                          <Spinner size="sm" className="text-indigo-600" />
                        ) : (
                          <>
                            <Eye className="w-3 h-3 mr-1" /> Xem toàn bộ CV
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Initial Landing Guide State */
        <div className="p-8 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 border border-indigo-100/80 shadow-xs space-y-6">
          <div className="max-w-2xl space-y-2">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Cách Thức Hoạt Động Của Hệ Thống AI Semantic Search (Chapter 7)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Khác với tìm kiếm từ khóa SQL truyền thống (LIKE %keyword%) thường bỏ sót các ứng viên dùng từ đồng nghĩa,
              hệ thống kết hợp cả 2 trường phái:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                1
              </div>
              <h4 className="text-xs font-black text-slate-900">Dense Vector Cosine (70%)</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Biểu diễn ngữ nghĩa câu hỏi và hồ sơ trong không gian vector đa chiều (PostgreSQL pgvector),
                bắt trọn ngữ cảnh dù ứng viên dùng từ khác biệt.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                2
              </div>
              <h4 className="text-xs font-black text-slate-900">Sparse BM25 Lexical (30%)</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tìm kiếm chính xác các từ khóa công nghệ đặc thù (như tên framework, chứng chỉ, công cụ) thông qua
                GIN tsvector.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
              <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">
                3
              </div>
              <h4 className="text-xs font-black text-slate-900">Section-based Granular Chunks</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hồ sơ được chia theo từng công việc, dự án và bộ kỹ năng độc lập, trích xuất chính xác vị trí kinh nghiệm
                phù hợp nhất.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Document Preview Modals ── */}
      <Modal
        isOpen={builderPreviewDoc !== null}
        onClose={() => setBuilderPreviewDoc(null)}
        title={`Chi tiết CV Builder — ${builderPreviewDoc?.title ?? ""}`}
        size="2xl"
      >
        {builderPreviewDoc && (
          <div className="max-h-[80vh] overflow-y-auto pr-1">
            <CVPreview
              content={builderPreviewDoc.content_json}
              template={builderPreviewDoc.template_key}
            />
          </div>
        )}
      </Modal>

      <CVPreviewModal
        url={previewPdfUrl}
        onClose={() => setPreviewPdfUrl(null)}
      />

      {/* ── CV Copilot Grounded Chat Drawer ── */}
      <CVCopilotDrawer
        isOpen={Boolean(copilotDoc)}
        onClose={() => setCopilotDoc(null)}
        candidateName={copilotDoc?.candidateName}
        documentTitle={copilotDoc?.documentTitle}
        cvDocumentId={copilotDoc?.cvDocumentId}
        resumeId={copilotDoc?.resumeId}
      />
    </div>
  );
}
