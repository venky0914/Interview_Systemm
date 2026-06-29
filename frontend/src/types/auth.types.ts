export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface GoogleAuthRequest {
  token: string; // Google ID token
}

export type AuthError =
  | "INVALID_CREDENTIALS"
  | "EMAIL_TAKEN"
  | "WEAK_PASSWORD"
  | "USER_NOT_FOUND"
  | "TOKEN_EXPIRED"
  | "SERVER_ERROR";
