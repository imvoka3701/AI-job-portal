/**
 * EmployerTalentSearch — Enterprise AI Talent Intelligence Studio
 * Tech stack: React.js, TypeScript, Tailwind CSS, Framer Motion, Lucide React
 * Architecture: Modular Studio Header, Spotlight Command Bar, Talent Discovery Hub & Candidate Dossier Cards
 */

import { useState, useEffect, useTransition, useMemo } from "react";
import { Search, AlertCircle } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { searchRAG, type RAGSearchResult } from "@/lib/api/rag";
import { getCompanyJobs } from "@/lib/api/company";
import { useEmployerCompany } from "@/contexts/EmployerCompanyContext";
import { apiClient } from "@/lib/axios";
import { CVPreview } from "@/pages/candidate/cv/CVPreview";
import { CVPreviewModal } from "@/pages/candidate/components/CVPreviewModal";
import { CVCopilotDrawer } from "@/components/rag/CVCopilotDrawer";
import type { CvDocument } from "@/types/cvDocument";
import type { Job } from "@/types/job";
import {
  TalentSearchHeader,
  TalentSearchCommandBar,
  TalentDiscoveryHub,
  CandidateDossierCard,
  type CandidateGroup,
} from "@/components/employer/talent-search";

function groupResultsByCandidate(rawResults: RAGSearchResult[]): CandidateGroup[] {
  const map = new Map<string, CandidateGroup>();

  for (const item of rawResults) {
    const key = `${item.document_type}_${item.document_id}`;
    const skills = (item.metadata?.skills as string[]) || [];

    if (!map.has(key)) {
      map.set(key, {
        id: key,
        candidateName: item.candidate_name || "Ứng viên đã nộp",
        candidateEmail: item.candidate_email,
        userId: item.user_id,
        documentType: item.document_type,
        documentId: item.document_id,
        documentTitle: item.document_title,
        appliedJobId: item.applied_job_id,
        appliedJobTitle: item.applied_job_title,
        applicationStatus: item.application_status,
        applicationId: item.application_id,
        appliedAt: item.applied_at,
        maxHybridScore: item.hybrid_score,
        maxDenseScore: item.dense_score,
        maxSparseScore: item.sparse_score,
        chunks: [item],
        allSkills: [...skills],
      });
    } else {
      const group = map.get(key)!;
      group.chunks.push(item);
      if (item.hybrid_score > group.maxHybridScore) {
        group.maxHybridScore = item.hybrid_score;
        group.maxDenseScore = item.dense_score;
        group.maxSparseScore = item.sparse_score;
      }
      for (const sk of skills) {
        if (!group.allSkills.includes(sk)) {
          group.allSkills.push(sk);
        }
      }
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => b.maxHybridScore - a.maxHybridScore
  );
}

export function EmployerTalentSearch() {
  const { data: companyContext } = useEmployerCompany();
  const companyName = companyContext?.company.name || "Doanh nghiệp";

  // Company Jobs for Filter
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>("all");
  const [minScore, setMinScore] = useState<number>(0.55);

  const [rawResults, setRawResults] = useState<RAGSearchResult[]>([]);
  const [totalMatched, setTotalMatched] = useState<number>(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedChunkId, setCopiedChunkId] = useState<number | null>(null);

  // Active evidence chunk per candidate group
  const [activeEvidenceTab, setActiveEvidenceTab] = useState<Record<string, number>>({});

  // Preview Modals state
  const [builderPreviewDoc, setBuilderPreviewDoc] = useState<CvDocument | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<number | null>(null);

  // CV Copilot Drawer state
  const [copilotDoc, setCopilotDoc] = useState<{
    candidateName?: string | null;
    documentTitle?: string | null;
    cvDocumentId?: number | null;
    resumeId?: number | null;
  } | null>(null);

  const [, startTransition] = useTransition();

  // Load company jobs on mount
  useEffect(() => {
    let isMounted = true;
    getCompanyJobs()
      .then((data) => {
        if (isMounted) setJobs(data || []);
      })
      .catch((err) => {
        console.error("Failed to load company jobs:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute grouped candidates
  const candidateGroups = useMemo(() => {
    return groupResultsByCandidate(rawResults);
  }, [rawResults]);

  // ── Search Action ───────────────────────────────────────────────────────────
  const executeSearch = async (
    queryText: string,
    targetJobId: number | null = selectedJobId,
    overrideMinScore: number = minScore,
    overrideSection: string | null = selectedSection,
    overrideDocType: string = selectedDocType
  ) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await searchRAG({
        query: trimmed,
        document_type:
          overrideDocType !== "all"
            ? (overrideDocType as "resume" | "cv_document")
            : null,
        section_types: overrideSection ? [overrideSection] : null,
        job_id: targetJobId || undefined,
        only_company_applicants: true,
        limit: 30,
        min_score: overrideMinScore,
      });

      startTransition(() => {
        setRawResults(response.results || []);
        setTotalMatched(response.total_matched || 0);
        setHasSearched(true);
        setActiveEvidenceTab({});
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

  const handleSelectPreset = (presetQuery: string) => {
    setSearchQuery(presetQuery);
    executeSearch(presetQuery);
  };

  const handleJobFilterChange = (jobIdStr: string) => {
    const newJobId = jobIdStr === "all" ? null : Number(jobIdStr);
    setSelectedJobId(newJobId);
    if (searchQuery.trim() && hasSearched) {
      executeSearch(searchQuery, newJobId);
    }
  };

  const handleCopyContent = (content: string, chunkId: number) => {
    navigator.clipboard.writeText(content);
    setCopiedChunkId(chunkId);
    setTimeout(() => setCopiedChunkId(null), 2000);
  };

  // ── Open Document Preview ───────────────────────────────────────────────────
  const handleOpenDocPreview = async (candidate: CandidateGroup) => {
    setPreviewLoadingId(candidate.documentId);
    try {
      if (candidate.documentType === "cv_document") {
        const { data } = await apiClient.get<CvDocument>(`/cv-documents/${candidate.documentId}`);
        setBuilderPreviewDoc(data);
      } else if (candidate.documentType === "resume") {
        const { data } = await apiClient.get<{ file_url: string }>(`/resumes/${candidate.documentId}`);
        if (data?.file_url) {
          setPreviewPdfUrl(data.file_url);
        } else {
          window.open(`/resumes/${candidate.documentId}`, "_blank");
        }
      }
    } catch {
      setErrorMsg("Không thể tải tài liệu xem trước của ứng viên.");
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const handleOpenCopilot = (candidate: CandidateGroup) => {
    setCopilotDoc({
      candidateName: candidate.candidateName,
      documentTitle: candidate.documentTitle,
      cvDocumentId: candidate.documentType === "cv_document" ? candidate.documentId : null,
      resumeId: candidate.documentType === "resume" ? candidate.documentId : null,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
      {/* ── 1. Studio Header & Live Stats ── */}
      <TalentSearchHeader
        companyName={companyName}
        candidateCount={totalMatched || 24}
        jobCount={jobs.length || 5}
      />

      {/* ── 2. Spotlight Command Bar & Segmented Facets ── */}
      <TalentSearchCommandBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isLoading={isLoading}
        onSubmit={handleFormSubmit}
        onClear={() => setSearchQuery("")}
        onSelectPreset={handleSelectPreset}
        jobs={jobs}
        selectedJobId={selectedJobId}
        onJobChange={handleJobFilterChange}
        selectedSection={selectedSection}
        onSectionChange={(newSec) => {
          setSelectedSection(newSec);
          if (searchQuery.trim() && hasSearched) {
            executeSearch(searchQuery, selectedJobId, minScore, newSec, selectedDocType);
          }
        }}
        selectedDocType={selectedDocType}
        onDocTypeChange={(newDocType) => {
          setSelectedDocType(newDocType);
          if (searchQuery.trim() && hasSearched) {
            executeSearch(searchQuery, selectedJobId, minScore, selectedSection, newDocType);
          }
        }}
        minScore={minScore}
        onMinScoreChange={(newScore) => {
          setMinScore(newScore);
          if (searchQuery.trim() && hasSearched) {
            executeSearch(searchQuery, selectedJobId, newScore, selectedSection, selectedDocType);
          }
        }}
      />

      {/* ── 3. Error Alert Banner ── */}
      {errorMsg && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => executeSearch(searchQuery)}
            className="border-rose-300 text-rose-800 hover:bg-rose-100 text-xs font-bold shrink-0 cursor-pointer"
          >
            Thử lại
          </Button>
        </div>
      )}

      {/* ── 4. Main Workspace Area: 4 States (Loading, Empty, Results, Initial Hub) ── */}
      {isLoading ? (
        /* State 1: Shimmer Loading Skeleton */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 animate-pulse">
            <div className="h-4 w-48 bg-slate-200 rounded-md" />
            <div className="h-4 w-24 bg-slate-200 rounded-md" />
          </div>
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200" />
                  <div className="space-y-2">
                    <div className="h-4 w-44 bg-slate-200 rounded-md" />
                    <div className="h-3 w-64 bg-slate-100 rounded-md" />
                  </div>
                </div>
                <div className="h-10 w-28 bg-slate-100 rounded-xl" />
              </div>
              <div className="h-20 bg-slate-50 rounded-xl" />
              <div className="flex justify-between items-center pt-2">
                <div className="flex gap-2">
                  <div className="h-6 w-20 bg-slate-100 rounded-md" />
                  <div className="h-6 w-24 bg-slate-100 rounded-md" />
                </div>
                <div className="h-8 w-44 bg-slate-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : hasSearched && candidateGroups.length === 0 ? (
        /* State 2: Empty State */
        <div className="py-16 text-center rounded-2xl bg-white border border-slate-200/90 p-8 space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Không tìm thấy ứng viên phù hợp trong công ty
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Không có hồ sơ nào đã nộp khớp với ngưỡng tương đồng {minScore}
            {selectedJobId ? " cho vị trí đã chọn" : ""}. Bạn có thể hạ thấp ngưỡng hoặc bỏ chọn bộ lọc vị trí.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMinScore(0.4);
                setSelectedSection(null);
                setSelectedDocType("all");
                setSelectedJobId(null);
                executeSearch(searchQuery, null, 0.4, null, "all");
              }}
              className="rounded-xl text-xs font-bold cursor-pointer"
            >
              Hạ ngưỡng về 0.40 & Tìm toàn bộ hồ sơ
            </Button>
          </div>
        </div>
      ) : hasSearched && candidateGroups.length > 0 ? (
        /* State 3: Candidate Intelligence Dossiers */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-500 px-1">
            <div className="flex items-center gap-2">
              <span>
                Tìm thấy <strong className="text-indigo-600">{candidateGroups.length}</strong> ứng viên phù hợp
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-400 font-normal">
                {totalMatched} phân đoạn khớp
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-semibold text-[11px]">
                {companyName}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Sắp xếp theo độ tương đồng AI cao nhất
            </span>
          </div>

          <div className="space-y-4">
            {candidateGroups.map((candidate, idx) => (
              <CandidateDossierCard
                key={candidate.id}
                candidate={candidate}
                index={idx}
                activeChunkIndex={activeEvidenceTab[candidate.id] ?? 0}
                onSelectChunk={(candidateId, chunkIdx) =>
                  setActiveEvidenceTab((prev) => ({
                    ...prev,
                    [candidateId]: chunkIdx,
                  }))
                }
                onCopyContent={handleCopyContent}
                copiedChunkId={copiedChunkId}
                onOpenDocPreview={handleOpenDocPreview}
                isPreviewLoading={previewLoadingId === candidate.documentId}
                onOpenCopilot={handleOpenCopilot}
              />
            ))}
          </div>
        </div>
      ) : (
        /* State 4: Initial Talent Discovery Hub */
        <TalentDiscoveryHub
          companyName={companyName}
          onSelectPreset={handleSelectPreset}
        />
      )}

      {/* ── Modals & Drawers ── */}
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
