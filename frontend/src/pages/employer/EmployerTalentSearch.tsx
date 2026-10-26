/**
 * EmployerTalentSearch — Enterprise AI Talent Intelligence Studio
 * Tech stack: React.js, TypeScript, Tailwind CSS, Framer Motion, Lucide React
 * Architecture: Modular Studio Header, Spotlight Command Bar, Dual-Pane Split Workspace & Talent Discovery Hub
 */

import { useState, useEffect, useTransition, useMemo } from "react";
import { Search, AlertCircle, Users } from "lucide-react";
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
  TALENT_ARCHETYPES,
  CandidateDossierCard,
  TalentStreamFeed,
  TalentDossierInspector,
  type CandidateGroup,
} from "@/components/employer/talent-search";

const DEFAULT_INITIAL_QUERY = "Frontend React Developer TypeScript";

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

  // Search & Filter state — Pre-loaded with default search to make workspace active immediately
  const [searchQuery, setSearchQuery] = useState(DEFAULT_INITIAL_QUERY);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>("all");
  const [minScore, setMinScore] = useState<number>(0.35);

  // Workspace View Mode: 'split' (2-column productivity board) or 'grid' (classic cards)
  const [viewMode, setViewMode] = useState<"split" | "grid">("split");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

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

  // Load company jobs & pre-fetch talent workspace on mount
  useEffect(() => {
    let isMounted = true;
    getCompanyJobs()
      .then((data) => {
        if (isMounted) setJobs(data || []);
      })
      .catch((err) => {
        console.error("Failed to load company jobs:", err);
      });

    // Auto-fetch default candidates on mount so the workspace board is immediately live
    executeSearch(DEFAULT_INITIAL_QUERY, null, 0.35, null, "all");

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute grouped candidates
  const candidateGroups = useMemo(() => {
    return groupResultsByCandidate(rawResults);
  }, [rawResults]);

  // Keep selected candidate in sync
  useEffect(() => {
    if (candidateGroups.length > 0) {
      setSelectedCandidateId((prev) => {
        const exists = candidateGroups.some((c) => c.id === prev);
        return exists ? prev : candidateGroups[0].id;
      });
    } else {
      setSelectedCandidateId(null);
    }
  }, [candidateGroups]);

  const selectedCandidate = useMemo(() => {
    if (!selectedCandidateId) return candidateGroups[0] || null;
    return candidateGroups.find((c) => c.id === selectedCandidateId) || candidateGroups[0] || null;
  }, [candidateGroups, selectedCandidateId]);

  // Keyboard navigation for Split View (ArrowUp / ArrowDown)
  useEffect(() => {
    if (viewMode !== "split" || candidateGroups.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const currentIdx = candidateGroups.findIndex((c) => c.id === selectedCandidateId);
        if (currentIdx < candidateGroups.length - 1) {
          setSelectedCandidateId(candidateGroups[currentIdx + 1].id);
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const currentIdx = candidateGroups.findIndex((c) => c.id === selectedCandidateId);
        if (currentIdx > 0) {
          setSelectedCandidateId(candidateGroups[currentIdx - 1].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, candidateGroups, selectedCandidateId]);

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
    if (searchQuery.trim()) {
      executeSearch(searchQuery, newJobId);
    }
  };

  const handleResetFilters = () => {
    setSelectedJobId(null);
    setSelectedSection(null);
    setSelectedDocType("all");
    setMinScore(0.35);
    executeSearch(DEFAULT_INITIAL_QUERY, null, 0.35, null, "all");
    setSearchQuery(DEFAULT_INITIAL_QUERY);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
      {/* ── 1. Studio Header & Live Metrics ── */}
      <TalentSearchHeader
        companyName={companyName}
        candidateCount={totalMatched || 24}
        jobCount={jobs.length || 5}
      />

      {/* ── 2. Unified Command Bar & Filter Ribbon ── */}
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
          if (searchQuery.trim()) {
            executeSearch(searchQuery, selectedJobId, minScore, newSec, selectedDocType);
          }
        }}
        selectedDocType={selectedDocType}
        onDocTypeChange={(newDocType) => {
          setSelectedDocType(newDocType);
          if (searchQuery.trim()) {
            executeSearch(searchQuery, selectedJobId, minScore, selectedSection, newDocType);
          }
        }}
        minScore={minScore}
        onMinScoreChange={(newScore) => {
          setMinScore(newScore);
          if (searchQuery.trim()) {
            executeSearch(searchQuery, selectedJobId, newScore, selectedSection, selectedDocType);
          }
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onResetFilters={handleResetFilters}
      />

      {/* ── 3. Quick Talent Archetypes Selector Ribbon ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 shrink-0">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-3.5 h-3.5" />
          </div>
          <span>Chân dung nhân tài (Archetypes):</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {TALENT_ARCHETYPES.map((arch) => {
            const Icon = arch.icon;
            const isMatch = searchQuery === arch.query;
            return (
              <button
                key={arch.role}
                type="button"
                onClick={() => handleSelectPreset(arch.query)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isMatch
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border-slate-200/80"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{arch.role}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isMatch ? "bg-indigo-700 text-indigo-100" : "bg-white text-slate-500"
                  }`}
                >
                  {arch.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. Error Alert Banner ── */}
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

      {/* ── 5. Main Active Workspace Board (Dual-Pane Split vs Grid) ── */}
      {isLoading ? (
        /* State 1: Shimmer Loading Skeleton */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 animate-pulse">
            <div className="h-4 w-48 bg-slate-200 rounded-md" />
            <div className="h-4 w-24 bg-slate-200 rounded-md" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-xl bg-white border border-slate-200 animate-pulse space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 w-32 bg-slate-200 rounded" />
                      <div className="h-2.5 w-44 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="h-5 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
            <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-slate-200 animate-pulse space-y-4">
              <div className="h-6 w-56 bg-slate-200 rounded" />
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-40 bg-slate-50 rounded-xl" />
            </div>
          </div>
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
                setMinScore(0.25);
                setSelectedSection(null);
                setSelectedDocType("all");
                setSelectedJobId(null);
                executeSearch(searchQuery, null, 0.25, null, "all");
              }}
              className="rounded-xl text-xs font-bold cursor-pointer"
            >
              Hạ ngưỡng về 0.25 & Tìm toàn bộ hồ sơ
            </Button>
          </div>
        </div>
      ) : candidateGroups.length > 0 ? (
        /* State 3: Candidates Found — Workspace Switcher (Split Board vs Grid) */
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

            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              <span>Sắp xếp theo độ tương đồng AI</span>
              {viewMode === "split" && (
                <span className="hidden md:inline bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono text-[10px]">
                  Phím ↑ / ↓ để chọn
                </span>
              )}
            </div>
          </div>

          {viewMode === "split" ? (
            /* ── Split Workspace: Left Feed + Right Deep Inspector ── */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-5 xl:col-span-5">
                <TalentStreamFeed
                  candidates={candidateGroups}
                  selectedCandidateId={selectedCandidateId}
                  onSelectCandidate={(cand) => setSelectedCandidateId(cand.id)}
                />
              </div>

              <div className="lg:col-span-7 xl:col-span-7">
                <TalentDossierInspector
                  candidate={selectedCandidate}
                  activeChunkIndex={
                    selectedCandidate ? (activeEvidenceTab[selectedCandidate.id] ?? 0) : 0
                  }
                  onSelectChunk={(chunkIdx) => {
                    if (selectedCandidate) {
                      setActiveEvidenceTab((prev) => ({
                        ...prev,
                        [selectedCandidate.id]: chunkIdx,
                      }));
                    }
                  }}
                  onCopyContent={handleCopyContent}
                  copiedChunkId={copiedChunkId}
                  onOpenDocPreview={handleOpenDocPreview}
                  isPreviewLoading={previewLoadingId === selectedCandidate?.documentId}
                  onOpenCopilot={handleOpenCopilot}
                />
              </div>
            </div>
          ) : (
            /* ── Grid Board: Multi-card layout ── */
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
          )}
        </div>
      ) : (
        /* State 4: Fallback Hub */
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
