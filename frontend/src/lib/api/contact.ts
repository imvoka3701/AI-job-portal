import { apiClient } from "@/lib/axios";

export interface ContactLeadPayload {
  full_name: string;
  email: string;
  phone: string;
  company_name: string;
  location: string;
  service_package?: string;
  notes?: string;
}

export interface ContactLeadResponse {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  company_name: string;
  location: string;
  service_package: string;
  status: string;
  notes?: string | null;
  created_at: string;
}

export const contactApi = {
  submitLead: async (payload: ContactLeadPayload): Promise<ContactLeadResponse> => {
    const { data } = await apiClient.post<ContactLeadResponse>("/contact/leads", payload);
    return data;
  },
};
