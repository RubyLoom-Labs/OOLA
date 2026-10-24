/**
 * Notifications API Service
 * Manages fetching in-app notifications, unread counts, and real-time streaming.
 */

import apiClient, { type ApiResponse } from './client'

export interface CrmNotificationItem {
  id: number
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'danger' | 'task' | 'lead' | 'project' | 'payment' | string
  action_url?: string | null
  is_read: boolean
  read_at?: string | null
  created_at: string
}

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000/api/v1'

export const notificationsApi = {
  /**
   * GET /api/v1/notifications
   * Retrieve list of notifications for currently logged in user
   */
  async getNotifications(params?: {
    page?: number
    per_page?: number
  }): Promise<ApiResponse<CrmNotificationItem[]>> {
    const res = await apiClient.get<ApiResponse<CrmNotificationItem[]>>('/notifications', params)
    return res
  },

  /**
   * GET /api/v1/notifications/unread-count
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const res = await apiClient.get<{ unread_count: number }>('/notifications/unread-count')
      return res?.unread_count ?? 0
    } catch {
      return 0
    }
  },

  /**
   * POST /api/v1/notifications/{id}/read
   * Mark single notification as read
   */
  async markAsRead(id: number): Promise<void> {
    await apiClient.post(`/notifications/${id}/read`)
  },

  /**
   * POST /api/v1/notifications/mark-all-read
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await apiClient.post('/notifications/mark-all-read')
  },

  /**
   * POST /api/v1/notifications/check-reminders
   * Trigger processing of any due reminders
   */
  async checkReminders(): Promise<{ processed_count: number }> {
    try {
      return await apiClient.post<{ message: string; processed_count: number }>(
        '/notifications/check-reminders'
      )
    } catch {
      return { processed_count: 0 }
    }
  },

  /**
   * Build EventSource SSE stream URL
   */
  getStreamUrl(token?: string | null): string {
    const cleanBase = API_BASE_URL.replace(/\/$/, '')
    const activeToken = token || localStorage.getItem('token') || localStorage.getItem('auth_token')
    return `${cleanBase}/notifications/stream${activeToken ? `?token=${encodeURIComponent(activeToken)}` : ''}`
  },
}
