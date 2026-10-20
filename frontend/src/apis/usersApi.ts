/**
 * Users Module API Service
 * Centralized endpoint management for Users lookup, pagination, and assignment.
 */

import apiClient, { type ApiResponse } from './client'

export interface UserRole {
  id: number
  name: string
  slug: string
  description?: string | null
  is_system?: boolean
}

export interface UserEmployee {
  id: number
  employee_code?: string | null
  user_id?: number
  department_id?: number | null
  designation_id?: number | null
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  joining_date?: string
  salary?: number
  skills?: string
  status?: string
}

export interface ProjectUser {
  id: number
  name: string
  email: string
  avatar?: string | null
  status: string
  role_id?: number
  role?: UserRole | string | null
  is_employee?: boolean
  employee_id?: number | null
  employee?: UserEmployee | null
  designation?: string
  department?: string
  created_at?: string
}

export interface GetUsersParams {
  page?: number
  per_page?: number
  search?: string
  status?: string
  role_id?: number
  is_employee?: boolean
}

export interface PaginatedUsersResponse {
  data: ProjectUser[]
  meta?: {
    current_page?: number
    last_page?: number
    per_page?: number
    total?: number
  }
}

export const usersApi = {
  /**
   * GET /api/v1/users
   * Retrieve paginated users list with search & status filters
   */
  async getUsers(params?: GetUsersParams): Promise<PaginatedUsersResponse> {
    try {
      const res = await apiClient.get<any>('/users', params)
      const data = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res)
        ? res
        : []
      const meta = res?.meta || res?.data?.meta || undefined
      return { data, meta }
    } catch (err) {
      console.error('Failed to load users:', err)
      return { data: [] }
    }
  },

  /**
   * GET /api/v1/users/:id
   * Retrieve single user details
   */
  async getUser(id: number | string): Promise<ApiResponse<ProjectUser | null>> {
    try {
      const res = await apiClient.get<any>(`/users/${id}`)
      const data = res?.data || res
      return { data }
    } catch (err) {
      console.error(`Failed to load user ${id}:`, err)
      return { data: null }
    }
  },
}

export function getUserRoleName(user: ProjectUser | null | undefined): string {
  if (!user) return ''
  if (typeof user.role === 'string') return user.role
  if (user.role && typeof user.role === 'object' && user.role.name) return user.role.name
  if (user.designation) return user.designation
  return ''
}

export default usersApi
