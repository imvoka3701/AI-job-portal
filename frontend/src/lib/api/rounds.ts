/**
 * Interview Rounds API service — manage multi-stage recruitment pipeline.
 */
import { apiClient } from "@/lib/axios";

export interface RoundItem {
  id: number;
  application_id: number;
  round_number: number;
  round_type: string;
  round_name: string | null;
  status: "pending" | "in_progress" | "passed" | "failed" | "skipped";
  scheduled_at: string | null;
  location: string | null;
  notes: string | null;
  score: number | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
}

export async function getRounds(applicationId: number): Promise<RoundItem[]> {
  const { data } = await apiClient.get<RoundItem[]>(
    `/applications/${applicationId}/rounds`,
  );
  return data;
}

export async function createRound(
  applicationId: number,
  roundType: string,
  roundName?: string,
): Promise<RoundItem> {
  const { data } = await apiClient.post<RoundItem>(
    `/applications/${applicationId}/rounds`,
    { round_type: roundType, round_name: roundName },
  );
  return data;
}

export async function updateRound(
  roundId: number,
  fields: {
    status?: string;
    scheduled_at?: string;
    location?: string;
    notes?: string;
    score?: number;
    feedback?: string;
  },
): Promise<RoundItem> {
  const { data } = await apiClient.patch<RoundItem>(
    `/applications/rounds/${roundId}`,
    fields,
  );
  return data;
}
