"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User } from "@/src/types";
import { loginApi, registerApi, getMeApi, LoginCredentials, RegisterPayload } from "@/src/services/auth";
import { getStoredToken, setStoredToken, removeStoredToken } from "@/src/lib/api";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=face";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeUser(rawUser: User): User {
  return {
    ...rawUser,
    avatar: rawUser.avatar || DEFAULT_AVATAR,
    title:
      rawUser.title ||
      (rawUser.role === "SUPER_ADMIN"
        ? "Platform Architect"
        : rawUser.role === "ADMIN"
        ? "Engineering Manager"
        : "Software Engineer"),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    removeStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setToken(null);
      return;
    }
    try {
      const profile = await getMeApi(currentToken);
      setUser(normalizeUser(profile));
      setToken(currentToken);
    } catch (err) {
      console.warn("Session validation failed:", err);
      logout();
    }
  }, [logout]);

  // Restore authenticated session using GET /api/auth/me
  useEffect(() => {
    async function restoreSession() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const profile = await getMeApi(storedToken);
        setUser(normalizeUser(profile));
        setToken(storedToken);
      } catch (err) {
        console.warn("Session restore failed, logging out:", err);
        logout();
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, [logout]);

  const login = async (credentials: LoginCredentials) => {
    const result = await loginApi(credentials);
    setStoredToken(result.token);
    setToken(result.token);
    setUser(normalizeUser(result.user));
  };

  const register = async (payload: RegisterPayload) => {
    const result = await registerApi(payload);
    if (result.token) {
      setStoredToken(result.token);
      setToken(result.token);
      setUser(normalizeUser(result.user));
    }
  };

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isAdmin = user?.role === "ADMIN" || isSuperAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        isSuperAdmin,
        isAdmin,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
