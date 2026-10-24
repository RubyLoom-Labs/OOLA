/**
 * Users Module API Service
 * Centralized endpoint management for Users lookup, pagination, CRUD, and assignment.
 */

import apiClient, { type ApiResponse } from './client'

export interface UserPermission {
  id: number
  name: string
  slug: string
}

export interface UserRole {
  id: number
  name: string
  slug: string
  description?: string | null
  is_system?: boolean
  permissions?: UserPermission[]
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
  department?: { id: number; name: string } | null
  designation?: { id: number; title: string } | null
  created_at?: string
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

export interface CreateUserPayload {
  name: string
  email: string
  role_id: number
  is_employee: boolean
  employee_id: number | null
}

export interface UpdateUserPayload {
  name?: string
  role_id?: number
  status?: string
  is_employee?: boolean
  employee_id?: number | null
}

export interface PaginatedUsersResponse {
  data: ProjectUser[]
  meta?: {
    current_page?: number
    last_page?: number
    per_page?: number
    total?: number
    active_count?: number
    inactive_count?: number
    employee_count?: number
  }
  links?: {
    first?: string | null
    last?: string | null
    prev?: string | null
    next?: string | null
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
      const data: ProjectUser[] = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res)
        ? res
        : []
      const meta = res?.meta || res?.data?.meta || undefined
      const links = res?.links || res?.data?.links || undefined
      return { data, meta, links }
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

  /**
   * POST /api/v1/users
   * Create new platform user
   */
  async createUser(payload: CreateUserPayload): Promise<ApiResponse<ProjectUser>> {
    return apiClient.post<ApiResponse<ProjectUser>>('/users', payload)
  },

  /**
   * PATCH /api/v1/users/:id
   * Update existing user details
   */
  async updateUser(id: number | string, payload: UpdateUserPayload): Promise<ApiResponse<ProjectUser>> {
    return apiClient.patch<ApiResponse<ProjectUser>>(`/users/${id}`, payload)
  },

  /**
   * DELETE /api/v1/users/:id
   * Delete platform user
   */
  async deleteUser(id: number | string): Promise<ApiResponse<any>> {
    return apiClient.delete<ApiResponse<any>>(`/users/${id}`)
  },

  /**
   * GET /api/v1/roles
   * Retrieve all platform roles for user assignment
   */
  async getRoles(): Promise<UserRole[]> {
    try {
      const res = await apiClient.get<any>('/roles')
      const roles: UserRole[] = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : []
      return roles
    } catch (err) {
      console.error('Failed to fetch roles:', err)
      return []
    }
  },

  /**
   * GET /api/v1/employees
   * Retrieve employees list for user linking
   */
  async getEmployees(): Promise<UserEmployee[]> {
    try {
      const res = await apiClient.get<any>('/employees', { per_page: 100 })
      const emps: UserEmployee[] = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res)
        ? res
        : []
      return emps
    } catch (err) {
      console.error('Failed to fetch employees:', err)
      return []
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
