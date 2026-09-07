import { apiClient } from "@/lib/axios";

export interface ForgotPasswordResponse {
  message: string;
  email: string;
}

export const authApi = {
  forgotPassword: async (email: string): Promise<ForgotPasswordResponse> => {
    const { data } = await apiClient.post<ForgotPasswordResponse>("/auth/forgot-password", { email });
    return data;
  },
};
