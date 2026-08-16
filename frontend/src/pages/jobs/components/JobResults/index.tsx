import { useJobStore, useJobs, useJobsLoading, useViewMode, useSortMode } from "@/stores/jobStore";
import { useMemo } from "react";
import { JobCard } from "./JobCard";
import { JobCardSkeleton, EmptyJobsState } from "./JobUIHelpers";
import { JobResultHeader } from "./JobResultHeader";
import { Pagination } from "./Pagination";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, inViewport } from "../../animations";

export function JobResults() {
  const jobs = useJobs();
  const isLoading = useJobsLoading();
  const pagination = useJobStore((s) => s.pagination);
  const viewMode = useViewMode();
  const sortMode = useSortMode();

  const sortedJobs = useMemo(() => {
    if (!jobs) return [];
    if (sortMode === "relevant") return jobs; // Typically sorted by backend

    return [...jobs].sort((a, b) => {
      if (sortMode === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortMode === "salary_desc") {
        const maxA = a.salary_max || a.salary_min || 0;
        const maxB = b.salary_max || b.salary_min || 0;
        return maxB - maxA;
      }
      return 0;
    });
  }, [jobs, sortMode]);

  const containerClass = viewMode === "grid" 
    ? "grid grid-cols-1 lg:grid-cols-2 gap-4" 
    : "flex flex-col gap-4";

  return (
    <div className="w-full">
      <JobResultHeader totalCount={pagination.total || jobs.length} />

      {/* Loading skeletons */}
      {isLoading && (
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={containerClass}
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </motion.div>
      )}

      {/* Empty state */}
      {!isLoading && jobs.length === 0 && <EmptyJobsState />}

      {/* Job list — staggered scroll reveal */}
      {!isLoading && jobs.length > 0 && (
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={containerClass}
          initial="hidden"
          whileInView="visible"
          viewport={inViewport}
          variants={staggerContainer}
        >
          {sortedJobs.map((job) => (
            <motion.div layout transition={{ type: "spring", stiffness: 400, damping: 30 }} key={job.id} variants={staggerItem} className="h-full">
              <JobCard job={job} viewMode={viewMode} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {!isLoading && jobs.length > 0 && <Pagination />}
    </div>
  );
}

