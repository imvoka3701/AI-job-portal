/**
 * TypeScript Types for Candidate AI CV Copilot & Career Advisor
 * Persona: UI/UX Architect & Frontend Engineer
 */

import type { CvContent } from "@/types/cvDocument";

export type CopilotTab = "ats" | "skill_gap" | "mock_interview";

export interface ATSSuggestion {
  id: string;
  category: "wording" | "quantifiable" | "structure" | "keywords";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  actionType: "enhance_summary" | "add_bullet" | "add_skill" | "rewrite_bullet";
  targetSection?: string;
  suggestedText?: string;
  suggestedItems?: string[];
}

export interface SkillGapAnalysisResult {
  targetJobTitle: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: Array<{
    name: string;
    importance: "critical" | "recommended" | "nice_to_have";
    learningHours?: number;
  }>;
  industryBenchmark: {
    averageMatch: number;
    recommendedYearsExp: number;
  };
  recommendedCourses: Array<{
    title: string;
    provider: string;
    badge: string;
    duration: string;
  }>;
}

export interface MockInterviewQuestionItem {
  id: string;
  question: string;
  context: string; // Grounded reference from CV e.g. "Dự án AI-Powered Job Portal"
  category: "technical" | "behavioral" | "system_design";
  difficulty: "junior" | "mid" | "senior";
  userAnswer?: string;
  aiScore?: number; // 1 to 10
  aiFeedback?: {
    strengths: string[];
    improvements: string[];
    starBreakdown?: {
      situation: string;
      task: string;
      action: string;
      result: string;
    };
    suggestedBetterAnswer?: string;
  };
}

export interface CandidateCVCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cvContent: CvContent;
  cvDocumentId?: number | null;
  documentTitle?: string;
  onApplyContentUpdate?: (updater: (prev: CvContent) => CvContent) => void;
}
