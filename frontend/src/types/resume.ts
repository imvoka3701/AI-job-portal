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
}

/** Resume creation payload */
export interface ResumeCreatePayload {
  title: string;
}
