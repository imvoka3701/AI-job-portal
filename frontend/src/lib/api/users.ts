import { apiClient } from "../axios";
import type { User } from "@/types/user"; 

export const uploadAvatar = async (file: File): Promise<User> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<User>("/users/me/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
