import { apiClient } from "@/lib/axios";
import type { CvDocument, CvDocumentPayload } from "@/types/cvDocument";

export async function createCvDocument(payload: CvDocumentPayload = {}): Promise<CvDocument> {
  const { data } = await apiClient.post<CvDocument>("/cv-documents", payload);
  return data;
}

export async function getCvDocuments(): Promise<CvDocument[]> {
  const { data } = await apiClient.get<CvDocument[]>("/cv-documents/me");
  return data;
}

export async function getCvDocument(id: number): Promise<CvDocument> {
  const { data } = await apiClient.get<CvDocument>(`/cv-documents/${id}`);
  return data;
}

export async function updateCvDocument(id: number, payload: CvDocumentPayload): Promise<CvDocument> {
  const { data } = await apiClient.patch<CvDocument>(`/cv-documents/${id}`, payload);
  return data;
}

export async function deleteCvDocument(id: number): Promise<void> {
  await apiClient.delete(`/cv-documents/${id}`);
}

