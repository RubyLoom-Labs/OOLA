import apiClient from './client'

export interface AuthUser {
  id: number
  name: string
  email: string
  phone?: string
  role?: string
  designation?: string
  department?: string
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
}

export default authApi
