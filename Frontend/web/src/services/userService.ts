import { apiClient } from "@/src/lib/api";
import { User } from "@/src/types";

interface UsersResponse {
  success: boolean;
  data: {
    users: User[];
  };
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const response = await apiClient.get<UsersResponse>("/users");
    return response.data?.users || [];
  } catch (err) {
    console.error("Failed to fetch users:", err);
    return [];
  }
}
