/** Generic API response wrapper */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/** API error response */
export interface ApiError {
  detail: string;
  status_code: number;
}

/** Auth token response */
export interface TokenResponse {
  access_token: string;
  token_type: string;
}

/** Login payload */
export interface LoginPayload {
  email: string;
  password: string;
}

/** AI Match response */
export interface AIMatchResult {
  score: number;
  explanation: string;
  strengths: string[];
  gaps: string[];
}

/** CV Evaluation response */
export interface CVEvaluationResult {
  overall_score: number;
  summary: string;
  suggestions: string[];
  skill_analysis: Record<string, unknown>;
}

/** Career Roadmap step */
export interface RoadmapStep {
  order: number;
  title: string;
  description: string;
  skills_to_learn: string[];
  resources: string[];
}

/** Career Roadmap response */
export interface RoadmapResult {
  target_role: string;
  current_level: string;
  steps: RoadmapStep[];
  estimated_months: number;
}

/** CV Summarize (CV vs Job) response */
export interface CVSummarizeResult {
  fit_points: string[];
  questions: string[];
  summary: string;
}

/** Interview question item */
export interface InterviewQuestion {
  question: string;
  purpose: string;
  skill_related: string;
}

/** Interview questions response */
export interface InterviewQuestionsResult {
  questions: InterviewQuestion[];
}

/** Email generation response */
export interface GenerateEmailResult {
  subject: string;
  body: string;
}
