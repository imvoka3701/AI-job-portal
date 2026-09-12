/**
 * SkillGapAdvisorTab — Skill Gap Analysis & Learning Recommendations
 * Persona: UI/UX Architect & Frontend Engineer
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Target,
  Sparkles,
  BookOpen,
  Award,
  ChevronRight,
  Plus,
  Check,
} from "lucide-react";
import { SkillTagPill } from "../shared/SkillTagPill";
import type { CvContent } from "@/types/cvDocument";

interface SkillGapAdvisorTabProps {
  cvContent: CvContent;
  onApplyContentUpdate?: (updater: (prev: CvContent) => CvContent) => void;
}

interface BenchmarkRole {
  id: string;
  title: string;
  category: string;
  requiredSkills: string[];
  recommendedSkills: string[];
  courses: Array<{
    title: string;
    provider: string;
    duration: string;
    level: string;
  }>;
}

const BENCHMARK_ROLES: BenchmarkRole[] = [
  {
    id: "fullstack-lead",
    title: "Full-Stack Tech Lead",
    category: "Engineering",
    requiredSkills: [
      "TypeScript",
      "React",
      "Python",
      "FastAPI",
      "PostgreSQL",
      "Docker",
      "System Design",
    ],
    recommendedSkills: ["Kubernetes", "Redis", "CI/CD", "pgvector", "GraphQL"],
    courses: [
      {
        title: "Microservices Architecture & Distributed Systems",
        provider: "Coursera",
        duration: "18 giờ",
        level: "Nâng cao",
      },
      {
        title: "High Performance PostgreSQL & Vector Databases",
        provider: "Udemy",
        duration: "12 giờ",
        level: "Chuyên sâu",
      },
    ],
  },
  {
    id: "frontend-sr",
    title: "Senior Frontend Engineer",
    category: "Frontend",
    requiredSkills: [
      "React",
      "TypeScript",
      "Tailwind CSS",
      "State Management",
      "Performance Tuning",
    ],
    recommendedSkills: ["Next.js", "Framer Motion", "Testing (Jest/Playwright)", "GraphQL"],
    courses: [
      {
        title: "Advanced React Patterns & Core Web Vitals",
        provider: "Frontend Masters",
        duration: "14 giờ",
        level: "Senior",
      },
    ],
  },
  {
    id: "ai-engineer",
    title: "AI / GenAI Application Engineer",
    category: "Artificial Intelligence",
    requiredSkills: [
      "Python",
      "FastAPI",
      "PostgreSQL",
      "LLM APIs (OpenAI/DeepSeek)",
      "RAG Architecture",
    ],
    recommendedSkills: ["pgvector", "LangChain", "Vector Search HNSW", "Docker"],
    courses: [
      {
        title: "Building Production-grade RAG Systems with pgvector",
        provider: "DeepLearning.AI",
        duration: "10 giờ",
        level: "Thực chiến",
      },
    ],
  },
];

export function SkillGapAdvisorTab({
  cvContent,
  onApplyContentUpdate,
}: SkillGapAdvisorTabProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>("fullstack-lead");
  const [addedSkills, setAddedSkills] = useState<Record<string, boolean>>({});

  const currentRole =
    BENCHMARK_ROLES.find((r) => r.id === selectedRoleId) || BENCHMARK_ROLES[0];

  // ── Compute Matched and Missing Skills ──────────────────────────────────────
  const candidateSkillsSet = new Set(
    (cvContent.skills || []).map((s) => s.toLowerCase().trim())
  );

  const matchedSkills: string[] = [];
  const missingCritical: string[] = [];
  const missingRecommended: string[] = [];

  currentRole.requiredSkills.forEach((skill) => {
    if (candidateSkillsSet.has(skill.toLowerCase().trim())) {
      matchedSkills.push(skill);
    } else {
      missingCritical.push(skill);
    }
  });

  currentRole.recommendedSkills.forEach((skill) => {
    if (candidateSkillsSet.has(skill.toLowerCase().trim())) {
      matchedSkills.push(skill);
    } else {
      missingRecommended.push(skill);
    }
  });

  const totalRequired = currentRole.requiredSkills.length;
  const matchPercent = Math.min(
    100,
    Math.round((matchedSkills.length / Math.max(1, totalRequired)) * 100)
  );

  const handleAddSkillToCV = (skillName: string) => {
    if (!onApplyContentUpdate) return;
    onApplyContentUpdate((prev) => {
      const existing = new Set(prev.skills || []);
      existing.add(skillName);
      return { ...prev, skills: Array.from(existing) };
    });
    setAddedSkills((prev) => ({ ...prev, [skillName]: true }));
  };

  return (
    <div className="space-y-6 pb-6">
      {/* ── Target Benchmark Selector ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900">
              Vị trí mục tiêu so sánh (Target Role)
            </h4>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
            AI Benchmark
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {BENCHMARK_ROLES.map((role) => {
            const isSelected = role.id === selectedRoleId;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRoleId(role.id)}
                className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-200"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="text-xs font-bold text-slate-900 truncate">
                  {role.title}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                  {role.category}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Match Progress Bar ────────────────────────────────────────── */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600">
              Độ tương thích kỹ năng với vị trí {currentRole.title}
            </span>
            <span className="font-black text-indigo-600 text-sm">
              {matchPercent}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${matchPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${
                matchPercent >= 80
                  ? "bg-emerald-500"
                  : matchPercent >= 60
                  ? "bg-indigo-500"
                  : "bg-amber-500"
              }`}
            />
          </div>
        </div>
      </div>

      {/* ── Skills Analysis Matrix ───────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Matched Skills */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              Kỹ năng đã có trong CV ({matchedSkills.length})
            </span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Khớp chuẩn
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {matchedSkills.length > 0 ? (
              matchedSkills.map((skill) => (
                <SkillTagPill key={skill} name={skill} status="matched" />
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">
                Chưa có kỹ năng nào khớp trực tiếp với yêu cầu cốt lõi.
              </p>
            )}
          </div>
        </div>

        {/* Missing Critical Skills */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-rose-600" />
              Kỹ năng trọng yếu còn thiếu ({missingCritical.length})
            </span>
            <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
              Cần bổ sung
            </span>
          </div>

          <p className="text-xs text-slate-600">
            Bấm dấu <strong>+</strong> để bổ sung kỹ năng này vào CV nếu bạn đã có kinh nghiệm:
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {missingCritical.length > 0 ? (
              missingCritical.map((skill) => (
                <SkillTagPill
                  key={skill}
                  name={skill}
                  status="missing"
                  onAdd={handleAddSkillToCV}
                  isAdded={Boolean(addedSkills[skill])}
                />
              ))
            ) : (
              <p className="text-xs text-emerald-600 font-semibold">
                Tuyệt vời! Bạn đã có đầy đủ các kỹ năng bắt buộc cho vị trí này.
              </p>
            )}
          </div>
        </div>

        {/* Recommended Extras */}
        {missingRecommended.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Kỹ năng cộng điểm nổi bật ({missingRecommended.length})
              </span>
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                Ưu tiên nâng cao
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {missingRecommended.map((skill) => (
                <SkillTagPill
                  key={skill}
                  name={skill}
                  status="recommended"
                  onAdd={handleAddSkillToCV}
                  isAdded={Boolean(addedSkills[skill])}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Learning Roadmap & Course Recommendations ────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            Lộ trình học tập & Khóa học đề xuất
          </h4>
          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            Top Rated
          </span>
        </div>

        <div className="space-y-2.5">
          {currentRole.courses.map((course, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-3 hover:border-indigo-200 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Award className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {course.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                    <span className="font-semibold text-indigo-700">
                      {course.provider}
                    </span>
                    <span>•</span>
                    <span>{course.duration}</span>
                    <span>•</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold">
                      {course.level}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shrink-0 cursor-pointer"
                title="Xem chi tiết khóa học"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
