import { apiClient } from "@/src/lib/api";
import { User } from "@/src/types";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: "SUPER_ADMIN" | "ADMIN" | "DEVELOPER";
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface ProfileResponse {
  success: boolean;
  data: {
    user: User;
  };
}

export async function registerApi(payload: RegisterPayload): Promise<{ user: User; token: string }> {
  const response = await apiClient.post<AuthResponse>("/auth/register", payload);
  return response.data;
}

export async function loginApi(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
  const response = await apiClient.post<AuthResponse>("/auth/login", credentials);
  return response.data;
}

export async function getMeApi(token?: string): Promise<User> {
  const response = await apiClient.get<ProfileResponse>("/auth/me", { token });
  return response.data.user;
}
