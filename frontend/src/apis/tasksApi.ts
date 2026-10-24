/**
 * Tasks API Service
 * Centralized endpoint management for Tasks CRUD operations, stages, assignments, and reminders.
 */

import apiClient, { type ApiResponse } from './client'

export interface ApiTask {
  id: number | string
  task_code?: string
  title: string
  description?: string
  task_type?: 'General' | 'Bug' | 'Feature' | 'Task' | string
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent' | string
  task_stage_id?: number
  stage?: string
  status?: string
  taskable_type?: string
  taskable_id?: number
  start_date?: string
  due_date?: string
  estimated_minutes?: number
  reminder?: string
  user_ids?: number[]
  users?: Array<{
    id: number
    name: string
    email?: string
    avatar?: string
    designation?: string
  }>
  subtasks?: any[]
  subtasks_count?: number
  created_at?: string
  updated_at?: string
}

export interface CreateTaskPayload {
  title: string
  description?: string
  task_type?: string
  priority?: string
  stage?: string
  task_stage_id?: number
  status?: string
  taskable_type?: string
  taskable_id?: number
  start_date?: string
  due_date?: string
  estimated_minutes?: number
  reminder?: string
  user_ids?: number[]
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {}

export const tasksApi = {
  /**
   * GET /api/v1/tasks
   * Retrieve list of tasks with filters
   */
  async getTasks(params?: {
    taskable_type?: string
    taskable_id?: number | string
    stage_id?: number
    status?: string
    priority?: string
    search?: string
    per_page?: number
    page?: number
  }): Promise<ApiResponse<ApiTask[]>> {
    return await apiClient.get<ApiResponse<ApiTask[]>>('/tasks', params)
  },

  /**
   * GET /api/v1/tasks/kanban
   * Retrieve tasks grouped by Kanban stages
   */
  async getKanban(
    taskableType?: string,
    taskableId?: number | string
  ): Promise<any> {
    return await apiClient.get('/tasks/kanban', {
      taskable_type: taskableType,
      taskable_id: taskableId,
    })
  },

  /**
   * POST /api/v1/tasks
   * Create new task
   */
  async createTask(payload: CreateTaskPayload): Promise<ApiResponse<ApiTask>> {
    return await apiClient.post<ApiResponse<ApiTask>>('/tasks', payload)
  },

  /**
   * GET /api/v1/tasks/{id}
   * Get single task
   */
  async getTask(id: number | string): Promise<ApiResponse<ApiTask>> {
    return await apiClient.get<ApiResponse<ApiTask>>(`/tasks/${id}`)
  },

  /**
   * PUT /api/v1/tasks/{id}
   * Update task
   */
  async updateTask(
    id: number | string,
    payload: UpdateTaskPayload
  ): Promise<ApiResponse<ApiTask>> {
    return await apiClient.put<ApiResponse<ApiTask>>(`/tasks/${id}`, payload)
  },

  /**
   * POST /api/v1/tasks/{id}/stage
   * Update task stage
   */
  async updateStage(
    id: number | string,
    stageId: number
  ): Promise<ApiResponse<ApiTask>> {
    return await apiClient.post<ApiResponse<ApiTask>>(`/tasks/${id}/stage`, {
      stage_id: stageId,
    })
  },

  /**
   * DELETE /api/v1/tasks/{id}
   * Archive / soft-delete task
   */
  async deleteTask(id: number | string): Promise<ApiResponse<{ message: string }>> {
    return await apiClient.delete<ApiResponse<{ message: string }>>(`/tasks/${id}`)
  },
}
