"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import authService from "@/services/authService";
import type { LoginRequest, RegisterRequest } from "@/types/auth.types";
import { ROUTES } from "@/utils/constants";

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, error, setUser, setLoading, setError, logout: storeLogout, fetchMe } = useAuthStore();

  const login = useCallback(async (credentials: LoginRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      toast.success(`Welcome back, ${response.user.full_name.split(" ")[0]}!`);
      router.push(ROUTES.DASHBOARD);
      return response;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Login failed";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [router, setUser, setLoading, setError]);

  const register = useCallback(async (payload: RegisterRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register(payload);
      setUser(response.user);
      toast.success("Account created! Let's get started 🎉");
      router.push(ROUTES.DASHBOARD);
      return response;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Registration failed";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [router, setUser, setLoading, setError]);

  const logout = useCallback(async () => {
    await storeLogout();
    toast.success("Signed out successfully");
    router.push(ROUTES.LOGIN);
  }, [storeLogout, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    fetchMe,
  };
}
