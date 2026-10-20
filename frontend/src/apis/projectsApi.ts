/**
 * Projects Module API Service
 * Centralized endpoint management for Projects CRUD operations, stages, team members, and budgets.
 */

import apiClient, { type ApiResponse } from './client'
import { capitalizeWords } from '@/lib/utils'

export interface ProjectStage {
  id: number
  name: string
  slug?: string
  color: string
  order_column?: number
  is_completed?: boolean
  is_delete?: boolean
  created_at?: string
  updated_at?: string
}

export type ProjectStatus = ProjectStage

export interface ProjectStatusItem {
  id: number
  name: string
  order_column?: number
  is_delete?: boolean
  created_at?: string
  updated_at?: string
}

export interface ProjectPriorityItem {
  id: number
  name: string
  order_column?: number
  is_delete?: boolean
  created_at?: string
  updated_at?: string
}

import type { ProjectUser, UserRole, UserEmployee } from './usersApi'
export type { ProjectUser, UserRole, UserEmployee }

export type ProjectManager = ProjectUser

export interface ProjectCompany {
  id: number
  customer_code?: string
  company_code?: string
  company_name: string
  email?: string
  phone?: string
  status?: string
}

export interface Project {
  id: number
  project_code: string
  project_title: string
  description?: string | null
  customer_id: number
  customer?: ProjectCompany
  lead_id?: number | null
  lead?: ProjectUser | null
  project_manager_id?: number | null
  manager?: ProjectManager | null
  stage_id?: number | null
  stage?: ProjectStage | null
  project_type?: string | null
  priority: 'Low' | 'Medium' | 'High' | 'Urgent' | string
  status: 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled' | string
  start_date?: string | null
  expected_end_date?: string | null
  actual_end_date?: string | null
  budget?: number | null
  quoted_amount?: number | null
  cost?: number | null
  revenue?: number | null
  profit?: number | null
  users?: ProjectUser[]
  tasks_count?: number | null
  payments_count?: number | null
  created_at?: string
  updated_at?: string
}

export interface CreateProjectPayload {
  project_title: string
  customer_id: number
  description?: string
  lead_id?: number
  project_manager_id?: number
  stage_id?: number
  project_type?: string
  priority?: string
  status?: string
  start_date?: string
  expected_end_date?: string
  budget?: number
  quoted_amount?: number
  cost?: number
  user_ids?: number[]
  contact_ids?: number[]
}

export interface UpdateProjectPayload {
  project_title?: string
  customer_id?: number
  description?: string
  lead_id?: number
  project_manager_id?: number
  stage_id?: number
  project_type?: string
  priority?: string
  status?: string
  start_date?: string
  expected_end_date?: string
  actual_end_date?: string
  budget?: number
  quoted_amount?: number
  cost?: number
  revenue?: number
  profit?: number
  user_ids?: number[]
  contact_ids?: number[]
}

export interface ProjectQueryParams {
  page?: number
  per_page?: number
  search?: string
  status?: string
  stage_id?: number
  customer_id?: number
  priority?: string
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
}

export interface ProjectStats {
  total: number
  in_progress: number
  completed: number
  total_budget: number
}

export function normalizeProject(p: Project): Project {
  if (!p) return p

  const title = capitalizeWords(p.project_title) || p.project_title || ''
  const companyName = p.customer?.company_name
    ? capitalizeWords(p.customer.company_name)
    : p.customer?.company_name || 'Client Organization'

  const normalizedCustomer: ProjectCompany | undefined = p.customer
    ? {
        ...p.customer,
        company_name: companyName,
      }
    : undefined

  const normalizedManager: ProjectManager | null = p.manager
    ? {
        ...p.manager,
        name: capitalizeWords(p.manager.name) || p.manager.name,
        designation: capitalizeWords(p.manager.designation) || p.manager.designation,
      }
    : null

  const normalizedUsers: ProjectUser[] = Array.isArray(p.users)
    ? p.users.map((u) => ({
        ...u,
        name: capitalizeWords(u.name) || u.name,
        designation: capitalizeWords(u.designation) || u.designation,
      }))
    : []

  return {
    ...p,
    project_title: title,
    customer: normalizedCustomer,
    manager: normalizedManager,
    users: normalizedUsers,
    budget: p.budget !== null && p.budget !== undefined ? Number(p.budget) : 0,
    quoted_amount: p.quoted_amount !== null && p.quoted_amount !== undefined ? Number(p.quoted_amount) : 0,
    cost: p.cost !== null && p.cost !== undefined ? Number(p.cost) : 0,
    revenue: p.revenue !== null && p.revenue !== undefined ? Number(p.revenue) : 0,
    profit: p.profit !== null && p.profit !== undefined ? Number(p.profit) : 0,
  }
}

export const projectsApi = {
  /**
   * GET /api/v1/projects
   * Retrieve list of projects with pagination & filters
   */
  async getProjects(params?: ProjectQueryParams): Promise<ApiResponse<Project[]>> {
    const query: Record<string, any> = {}
    if (params) {
      if (params.page !== undefined) query.page = params.page
      if (params.per_page !== undefined) query.per_page = params.per_page
      if (params.search && params.search.trim()) query.search = params.search.trim()
      if (params.status && params.status !== 'all') query.status = params.status
      if (params.stage_id !== undefined) query.stage_id = params.stage_id
      if (params.customer_id !== undefined) query.customer_id = params.customer_id
      if (params.priority && params.priority !== 'all') query.priority = params.priority
      if (params.sort_by) query.sort_by = params.sort_by
      if (params.sort_dir) query.sort_dir = params.sort_dir
    }

    const res = await apiClient.get<ApiResponse<Project[]>>('/projects', query)
    const rawList = (res as any)?.data?.data || res?.data
    if (Array.isArray(rawList)) {
      res.data = rawList.map(normalizeProject)
    }
    return res
  },

  /**
   * GET /api/v1/projects/{id}
   * Full project details including manager, client, stage, users, tasks, payments
   */
  async getProject(id: number | string): Promise<ApiResponse<Project>> {
    const res = await apiClient.get<ApiResponse<Project>>(`/projects/${id}`)
    const rawData = (res as any)?.data?.data || res?.data
    if (rawData) {
      res.data = normalizeProject(rawData)
    }
    return res
  },

  /**
   * POST /api/v1/projects
   * Create new project
   */
  async createProject(payload: CreateProjectPayload): Promise<ApiResponse<Project>> {
    const cleanPayload: Record<string, any> = {}
    Object.entries(payload).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        if (['budget', 'quoted_amount', 'cost'].includes(key)) {
          cleanPayload[key] = Number(val)
        } else if (['customer_id', 'lead_id', 'project_manager_id', 'stage_id'].includes(key)) {
          cleanPayload[key] = Number(val)
        } else {
          cleanPayload[key] = val
        }
      }
    })

    const res = await apiClient.post<ApiResponse<Project>>('/projects', cleanPayload)
    const rawData = (res as any)?.data?.data || res?.data
    if (rawData) {
      res.data = normalizeProject(rawData)
    }
    return res
  },

  /**
   * PATCH /api/v1/projects/{id}
   * Update existing project
   */
  async updateProject(
    id: number | string,
    payload: UpdateProjectPayload
  ): Promise<ApiResponse<Project>> {
    const cleanPayload: Record<string, any> = {}
    Object.entries(payload).forEach(([key, val]) => {
      if (val !== undefined) {
        if (['budget', 'quoted_amount', 'cost', 'revenue', 'profit'].includes(key)) {
          cleanPayload[key] = val !== null && val !== '' ? Number(val) : 0
        } else if (['customer_id', 'lead_id', 'project_manager_id', 'stage_id'].includes(key)) {
          cleanPayload[key] = val !== null && val !== '' ? Number(val) : null
        } else {
          cleanPayload[key] = val
        }
      }
    })

    let res: any
    try {
      res = await apiClient.patch<ApiResponse<Project>>(`/projects/${id}`, cleanPayload)
    } catch (err: any) {
      // Fallback to PUT if server requires PUT
      if (err?.status === 405) {
        res = await apiClient.put<ApiResponse<Project>>(`/projects/${id}`, cleanPayload)
      } else {
        throw err
      }
    }

    const rawData = (res as any)?.data?.data || res?.data
    if (rawData) {
      res.data = normalizeProject(rawData)
    }
    return res
  },

  /**
   * DELETE /api/v1/projects/{id}
   * Archive / delete project
   */
  async deleteProject(id: number | string): Promise<ApiResponse<{ message: string }>> {
    return await apiClient.delete<ApiResponse<{ message: string }>>(`/projects/${id}`)
  },

  /**
   * GET /api/v1/project-stages
   * Retrieve dynamic project stages list
   */
  async getStages(): Promise<ApiResponse<ProjectStage[]>> {
    try {
      const res = await apiClient.get<any>('/project-stages')
      const rawList = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : []

      const activeStages: ProjectStage[] = rawList
        .filter((s: any) => !s.is_delete)
        .sort((a: any, b: any) => (a.order_column ?? a.id ?? 0) - (b.order_column ?? b.id ?? 0))

      return { data: activeStages }
    } catch (err) {
      console.error('Failed to load project stages:', err)
      return { data: [] }
    }
  },

  /**
   * GET /api/v1/project-statuses
   * Retrieve dynamic project statuses list
   */
  async getProjectStatuses(): Promise<ApiResponse<ProjectStatusItem[]>> {
    try {
      const res = await apiClient.get<any>('/project-statuses')
      const rawList = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : []

      const activeStatuses: ProjectStatusItem[] = rawList
        .filter((s: any) => !s.is_delete)
        .sort((a: any, b: any) => (a.order_column ?? a.id ?? 0) - (b.order_column ?? b.id ?? 0))

      return { data: activeStatuses }
    } catch (err) {
      console.error('Failed to load project statuses:', err)
      return { data: [] }
    }
  },

  /**
   * GET /api/v1/project-priorities
   * Retrieve dynamic project priorities list
   */
  async getProjectPriorities(): Promise<ApiResponse<ProjectPriorityItem[]>> {
    try {
      const res = await apiClient.get<any>('/project-priorities')
      const rawList = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : []

      const activePriorities: ProjectPriorityItem[] = rawList
        .filter((p: any) => !p.is_delete)
        .sort((a: any, b: any) => (a.order_column ?? a.id ?? 0) - (b.order_column ?? b.id ?? 0))

      return { data: activePriorities }
    } catch (err) {
      console.error('Failed to load project priorities:', err)
      return { data: [] }
    }
  },

  /**
   * GET /api/v1/users
   * Retrieve users for project manager & team assignment
   */
  async getUsers(): Promise<ApiResponse<ProjectUser[]>> {
    try {
      const res = await apiClient.get<ApiResponse<ProjectUser[]>>('/users')
      const rawList = (res as any)?.data?.data || res?.data || []
      return { data: Array.isArray(rawList) ? rawList : [] }
    } catch (err) {
      console.error('Failed to load users:', err)
      return { data: [] }
    }
  },

  /**
   * GET /api/v1/leads
   * Retrieve leads for project linkage
   */
  async getLeads(): Promise<ApiResponse<any[]>> {
    try {
      const res = await apiClient.get<ApiResponse<any[]>>('/leads')
      const rawList = (res as any)?.data?.data || res?.data || []
      return { data: Array.isArray(rawList) ? rawList : [] }
    } catch (err) {
      console.error('Failed to load leads:', err)
      return { data: [] }
    }
  },
}

export default projectsApi
