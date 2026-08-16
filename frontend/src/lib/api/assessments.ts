import { apiClient } from "@/lib/axios";

export type AssessmentType = "mbti" | "mi";

export interface AssessmentQuestion {
  id: string;
  order: number;
  text: string;
  scale_min: number;
  scale_max: number;
}

export interface AssessmentQuestionnaire {
  assessment_type: AssessmentType;
  version: string;
  title: string;
  description: string;
  questions: AssessmentQuestion[];
}

export interface AssessmentResult {
  code: string;
  title: string;
  summary: string;
  strengths: string[];
  environments: string[];
  career_ctas: string[];
  dimensions: Record<string, number>;
}

export interface AssessmentAttempt {
  id: number;
  assessment_type: AssessmentType;
  questionnaire_version: string;
  answers: Record<string, number>;
  result: AssessmentResult;
  completed_at: string;
  created_at: string;
}

export async function getAssessmentQuestions(type: AssessmentType): Promise<AssessmentQuestionnaire> {
  const { data } = await apiClient.get<AssessmentQuestionnaire>(`/tools/${type}/questions`);
  return data;
}

export async function scorePublicAssessment(
  type: AssessmentType,
  questionnaireVersion: string,
  answers: Record<string, number>,
): Promise<AssessmentResult> {
  const { data } = await apiClient.post<AssessmentResult>(`/tools/${type}/score`, {
    assessment_type: type,
    questionnaire_version: questionnaireVersion,
    answers,
  });
  return data;
}

export async function saveAssessmentAttempt(
  type: AssessmentType,
  questionnaireVersion: string,
  answers: Record<string, number>,
): Promise<AssessmentAttempt> {
  const { data } = await apiClient.post<AssessmentAttempt>(`/tools/${type}/attempts`, {
    assessment_type: type,
    questionnaire_version: questionnaireVersion,
    answers,
  });
  return data;
}

export async function getMyAssessmentAttempts(type?: AssessmentType): Promise<AssessmentAttempt[]> {
  const { data } = await apiClient.get<AssessmentAttempt[]>("/tools/attempts/me", {
    params: type ? { assessment_type: type } : undefined,
  });
  return data;
}

export async function deleteAssessmentAttempt(id: number): Promise<void> {
  await apiClient.delete(`/tools/attempts/${id}`);
}
