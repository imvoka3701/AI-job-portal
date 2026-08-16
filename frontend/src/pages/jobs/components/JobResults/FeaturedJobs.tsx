import { JobCard } from "./JobCard";
import type { Job } from "@/types/job";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, inViewport } from "../../animations";

export function FeaturedJobs({ jobs }: { jobs: Job[] }) {
  if (!jobs || jobs.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
        <h3 className="text-lg font-bold text-[#172033]">Việc làm nổi bật</h3>
      </div>
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        initial="hidden"
        whileInView="visible"
        viewport={inViewport}
        variants={staggerContainer}
      >
        {jobs.slice(0, 2).map((job) => (
          <motion.div key={job.id} variants={staggerItem}>
            <JobCard job={job} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
