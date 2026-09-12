/**
 * CandidateCVCopilotDrawer — Master AI Copilot & Career Advisor Drawer
 * Persona: UI/UX Architect & Frontend Engineer
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Maximize2,
  Minimize2,
  FileCheck2,
  Target,
  HelpCircle,
  Cpu,
} from "lucide-react";
import { ATSScoreTab } from "./tabs/ATSScoreTab";
import { SkillGapAdvisorTab } from "./tabs/SkillGapAdvisorTab";
import { MockInterviewTab } from "./tabs/MockInterviewTab";
import type { CandidateCVCopilotDrawerProps, CopilotTab } from "./types";

export function CandidateCVCopilotDrawer({
  isOpen,
  onClose,
  cvContent,
  documentTitle = "Hồ sơ ứng viên",
  onApplyContentUpdate,
}: CandidateCVCopilotDrawerProps) {
  const [activeTab, setActiveTab] = useState<CopilotTab>("ats");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Container */}
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-6">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className={`w-screen bg-slate-50 flex flex-col shadow-2xl border-l border-slate-200 transition-all duration-300 ${
                isExpanded ? "max-w-3xl" : "max-w-lg"
              }`}
            >
              {/* ── Header ───────────────────────────────────────────────── */}
              <div className="bg-white border-b border-slate-200 px-5 py-4 shrink-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          AI CV Copilot & Career Advisor
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Cpu className="w-3 h-3" />
                          RAG Powered
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate max-w-xs mt-0.5">
                        Đang phân tích: {documentTitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Expand/Collapse width */}
                    <button
                      type="button"
                      onClick={() => setIsExpanded(!isExpanded)}
                      title={isExpanded ? "Thu hẹp" : "Mở rộng"}
                      className="hidden sm:inline-flex p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {isExpanded ? (
                        <Minimize2 className="w-4 h-4" />
                      ) : (
                        <Maximize2 className="w-4 h-4" />
                      )}
                    </button>

                    {/* Close */}
                    <button
                      type="button"
                      onClick={onClose}
                      title="Đóng Copilot"
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* ── Tabs Navigation ─────────────────────────────────────── */}
                <div className="flex items-center gap-2 mt-4 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveTab("ats")}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === "ats"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Điểm chuẩn ATS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("skill_gap")}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === "skill_gap"
                        ? "bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Target className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Khoảng cách kỹ năng</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("mock_interview")}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === "mock_interview"
                        ? "bg-purple-50 text-purple-800 border border-purple-200 shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                    <span>Phỏng vấn thử</span>
                  </button>
                </div>
              </div>

              {/* ── Content Area ─────────────────────────────────────────── */}
              <div className="flex-1 overflow-y-auto px-5 pt-5">
                {activeTab === "ats" && (
                  <ATSScoreTab
                    cvContent={cvContent}
                    onApplyContentUpdate={onApplyContentUpdate}
                  />
                )}

                {activeTab === "skill_gap" && (
                  <SkillGapAdvisorTab
                    cvContent={cvContent}
                    onApplyContentUpdate={onApplyContentUpdate}
                  />
                )}

                {activeTab === "mock_interview" && (
                  <MockInterviewTab cvContent={cvContent} />
                )}
              </div>

              {/* ── Bottom Status Bar ────────────────────────────────────── */}
              <div className="bg-white border-t border-slate-200 px-5 py-3 shrink-0 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Đồng bộ trực tiếp với CV Editor
                </span>
                <span className="font-semibold text-slate-600">
                  AI Job Portal Pro
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
