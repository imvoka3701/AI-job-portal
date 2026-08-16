import type { User } from "./user";

/** Job type enum */
export type JobType = "full_time" | "part_time" | "internship" | "freelance" | "remote";

/** Experience level enum */
export type ExperienceLevel = "fresher" | "junior" | "middle" | "senior" | "lead";

/** Job listing */
export interface Job {
  id: number;
  title: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  job_type: JobType;
  experience_level: ExperienceLevel;
  salary_min: number | null;
  salary_max: number | null;
  location: string | null;
  is_active: boolean;
  employer_id: number;
  company_id: number | null;
  department_id: number | null;
  employer: User | null;
  category_id: number | null;
  created_at: string;
  updated_at: string;
}

/** Job creation payload */
export interface JobCreatePayload {
  title: string;
  description: string;
  requirements?: string;
  benefits?: string;
  job_type?: JobType;
  experience_level?: ExperienceLevel;
  salary_min?: number;
  salary_max?: number;
  location?: string;
  category_id?: number;
  department_id?: number;
  recruitment_request_id?: number;
}

/** Paginated job list response */
export interface JobListResponse {
  items: Job[];
  total: number;
  page: number;
  page_size: number;
}
