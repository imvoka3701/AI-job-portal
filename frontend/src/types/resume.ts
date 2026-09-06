/** Resume */
export interface Resume {
  id: number;
  title: string;
  file_url: string | null;
  parsed_skills: string | null;
  parsed_experience: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
  ai_evaluation_json?: string | null;
  is_validated: boolean;
  validated_at: string | null;
  // Structured CV metadata
  parsed_industry: string | null;
  desired_role: string | null;
  desired_location: string | null;
  parsed_experience_level: string | null;
  parsed_key_skills: string | null; // JSON array string
  industry_category_id: number | null;
}

/** Resume creation payload */
export interface ResumeCreatePayload {
  title: string;
}
