import { Bot, Sparkles } from "lucide-react";
import { JobCard } from "./JobCard";
import type { Job } from "@/types/job";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem, inViewport } from "../../animations";

export function AIRecommendedJobs({ jobs }: { jobs: Job[] }) {
  if (!jobs || jobs.length === 0) return null;

  return (
    <motion.div
      className="my-10 relative overflow-hidden rounded-2xl border border-emerald-100/60"
      initial="hidden"
      whileInView="visible"
      viewport={inViewport}
      variants={fadeInUp}
    >
      {/* Tech-grid pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] bg-white pointer-events-none" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-100/40 to-transparent rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />

      <div className="relative z-10 p-6">
        <motion.div className="flex items-center gap-3 mb-6" variants={fadeInUp}>
          <motion.div
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Bot className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h3 className="text-lg font-bold text-[#172033] flex items-center gap-2">
              AI đề xuất cho bạn
              <motion.span
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="w-4 h-4 text-emerald-500" />
              </motion.span>
            </h3>
            <p className="text-[14px] text-[#64748B] mt-0.5">
              Dựa trên kỹ năng, kinh nghiệm và những công việc bạn quan tâm.
            </p>
          </div>
        </motion.div>

        <motion.div className="grid grid-cols-1 gap-4" variants={staggerContainer}>
          {jobs.map((job) => (
            <motion.div key={job.id} variants={staggerItem}>
              <JobCard job={job} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
