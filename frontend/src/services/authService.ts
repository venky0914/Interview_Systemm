import Cookies from "js-cookie";
import api from "./api";
import type { LoginRequest, RegisterRequest, AuthResponse, GoogleAuthRequest } from "@/types/auth.types";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/utils/constants";

const COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  expires: 7, // days
};

const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/login", credentials);
    authService.saveTokens(data.tokens.access_token, data.tokens.refresh_token);
    return data;
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    authService.saveTokens(data.tokens.access_token, data.tokens.refresh_token);
    return data;
  },

  async googleLogin(payload: GoogleAuthRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/google", payload);
    authService.saveTokens(data.tokens.access_token, data.tokens.refresh_token);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } finally {
      authService.clearTokens();
    }
  },

  async getMe() {
    const { data } = await api.get("/auth/me");
    return data;
  },

  saveTokens(accessToken: string, refreshToken: string) {
    Cookies.set(ACCESS_TOKEN_KEY, accessToken, COOKIE_OPTIONS);
    Cookies.set(REFRESH_TOKEN_KEY, refreshToken, COOKIE_OPTIONS);
  },

  clearTokens() {
    Cookies.remove(ACCESS_TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
  },

  getAccessToken(): string | null {
    return Cookies.get(ACCESS_TOKEN_KEY) ?? null;
  },

  isAuthenticated(): boolean {
    return !!authService.getAccessToken();
  },
};

export default authService;
