import apiClient from './client'

export interface AuthUser {
  id: number
  name: string
  email: string
  phone?: string
  role?: string | { id?: number; name?: string; slug?: string; [key: string]: any }
  designation?: string | { id?: number; title?: string; name?: string; [key: string]: any }
  department?: string | { id?: number; name?: string; [key: string]: any }
  status?: string
  avatar?: string
  permissions?: string[]
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  message: string
  token: string
  user: AuthUser
}

export interface LogoutResponse {
  message: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ForgotPasswordResponse {
  message: string
}

export interface ResetPasswordPayload {
  email: string
  token: string
  password: string
  password_confirmation: string
}

export interface ResetPasswordResponse {
  message: string
}

export interface ResendVerificationPayload {
  email: string
}

export interface ResendVerificationResponse {
  message: string
}

export const authApi = {
  /**
   * Public Login: Authenticate user & receive Sanctum Bearer token + user profile
   */
  async login(payload: LoginPayload): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/auth/login', payload)
  },

  /**
   * Fetch current authenticated user profile
   */
  async getMe(): Promise<AuthUser> {
    return apiClient.get<AuthUser>('/auth/me')
  },

  /**
   * Revoke Sanctum Bearer token and logout
   */
  async logout(): Promise<LogoutResponse> {
    return apiClient.post<LogoutResponse>('/auth/logout')
  },

  /**
   * Request Password Reset / Forgot Password
   * POST /api/v1/auth/forgot-password
   */
  async forgotPassword(payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
    return apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', payload)
  },

  /**
   * Reset Password & Verify Account
   * POST /api/v1/auth/reset-password
   */
  async resetPassword(payload: ResetPasswordPayload): Promise<ResetPasswordResponse> {
    return apiClient.post<ResetPasswordResponse>('/auth/reset-password', payload)
  },

  /**
   * Resend Verification Email (Public)
   * POST /api/v1/auth/resend-verification
   */
  async resendVerification(payload: ResendVerificationPayload): Promise<ResendVerificationResponse> {
    return apiClient.post<ResendVerificationResponse>('/auth/resend-verification', payload)
  },
}

export default authApi
