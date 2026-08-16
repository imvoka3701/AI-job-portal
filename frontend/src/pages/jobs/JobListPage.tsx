import { useEffect } from "react";
import { Header } from "@/pages/jobs/components/Header";
import { SearchHero } from "./components/SearchHero";
import { AIMatchBanner } from "./components/AIMatchBanner";
import { FilterSidebar } from "./components/FilterSidebar";
import { JobResults } from "./components/JobResults";
import { AIAssistant } from "./components/AIAssistant";
import { TopIndustries } from "./components/TopIndustries";
import { CVBuilderPromo } from "./components/CVBuilderPromo";
import { PlatformStats } from "./components/PlatformStats";
import { Footer } from "./components/Footer";
import { useJobStore, useJobsError } from "@/stores/jobStore";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X } from "lucide-react";
import { SEOMeta } from "@/components/seo/SEOMeta";

export function JobListPage() {
  const fetchJobs = useJobStore((s) => s.fetchJobs);
  const clearError = useJobStore((s) => s.clearError);
  const error = useJobsError();

  // Fetch jobs on first mount — filters changes are handled inside setFilters()
  useEffect(() => {
    fetchJobs(1);
  }, [fetchJobs]);

  return (
    <div className="min-h-screen bg-page-bg bg-ambient-pattern font-sans text-[#0F172A]">
      <SEOMeta 
        title="Tìm việc làm IT chất lượng cao | AI Job Portal"
        description="Nền tảng tuyển dụng bằng AI hàng đầu. Tối ưu CV, kết nối đúng việc làm phù hợp cho ứng viên IT, Software Engineer, Manager."
        canonicalUrl="https://ai-job-portal.com/jobs"
        schemaMarkup={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "url": "https://ai-job-portal.com/",
          "name": "AI Job Portal",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://ai-job-portal.com/jobs?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        }}
      />
      {/* 1. Header */}
      <Header />

      {/* 2. Global error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-red-600 text-white px-5 py-3 rounded-xl shadow-2xl max-w-sm"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-[14px] font-medium">{error}</span>
            <button onClick={clearError} className="ml-2 hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Main layout */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 w-full py-8">
        {/* Search Hero — connected to store */}
        <SearchHero />

        {/* AI Matching Banner */}
        <AIMatchBanner />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar — connected to store */}
          <div className="w-full lg:w-[280px] shrink-0">
            <FilterSidebar />
          </div>

          {/* Right Content — fetches from store */}
          <div className="flex-1 min-w-0">
            <JobResults />
          </div>
        </div>

        {/* Top Industries */}
        <TopIndustries />

        {/* CV Builder Promo */}
        <CVBuilderPromo />
      </div>

      {/* Platform Statistics (Full width) */}
      <PlatformStats />

      {/* Footer (Full width) */}
      <Footer />

      {/* Floating AI Assistant */}
      <AIAssistant />
    </div>
  );
}
