/** Application status enum */
export type ApplicationStatus =
  | "pending"
  | "reviewed"
  | "shortlisted"
  | "interview"
  | "accepted"
  | "rejected";

/** Application */
export interface Application {
  id: number;
  cover_letter: string | null;
  status: ApplicationStatus;
  ai_matching_score: number | null;
  ai_feedback: string | null;
  candidate_id: number;
  job_id: number;
  job?: {
    id: number;
    title: string;
    employer?: {
      id: number;
      full_name: string;
      company_name: string | null;
    } | null;
  };
  resume_id: number | null;
  cv_document_id: number | null;
  applied_at: string;
  updated_at: string;
}

/** Application creation payload */
export interface ApplicationCreatePayload {
  job_id: number;
  cover_letter?: string;
  resume_id?: number;
  cv_document_id?: number;
}

/** Employer's view of an application — includes candidate info + AI match score */
export interface EmployerApplication {
  id: number;
  status: ApplicationStatus;
  ai_matching_score: number | null;
  ai_feedback: string | null;
  hiring_recommendation: "recommended" | "not_recommended" | "needs_more_review" | null;
  recommendation_note: string | null;
  recommendation_by_id: number | null;
  recommended_at: string | null;
  decision_by_id: number | null;
  decided_at: string | null;
  decision_reason: string | null;
  candidate: {
    id: number;
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  job_id: number;
  resume_id: number | null;
  resume: {
    file_url: string | null;
    parsed_skills?: string | null;
    ai_evaluation_json?: string | null;
  } | null;
  cv_document_id: number | null;
  cv_document: import("@/types/cvDocument").CvDocument | null;
  cover_letter: string | null;
  applied_at: string;
}
