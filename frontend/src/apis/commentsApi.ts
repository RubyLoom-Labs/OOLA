/**
 * Website Comments Module API Service
 * Centralized endpoint management for Website Comments connected to /api/v1/comments
 */

import apiClient, { type ApiResponse } from './client'
import { getCompanyLogoUrl } from '@/lib/utils'

/**
 * 0 = Pending, 1 = Approved
 */
export type CommentStatus = 0 | 1

/**
 * 0 = Not Display, 1 = Display
 */
export type CommentDisplayStatus = 0 | 1

export interface CommentItem {
  id: number
  name: string
  company?: string | null
  title?: string | null
  comment: string
  image?: string | null
  image_url?: string | null
  status: CommentStatus
  display_status: CommentDisplayStatus
  is_delete?: 0 | 1 | boolean
  created_at?: string
  updated_at?: string
}

export interface CommentQueryParams {
  page?: number
  per_page?: number
  search?: string
  status?: string | number
  display_status?: string | number
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
}

export interface CreateCommentPayload {
  name: string
  company?: string
  title?: string
  comment: string
  image?: string | null
}

export function normalizeCommentStatus(raw: any): CommentStatus {
  if (raw === 1 || raw === true || raw === '1') return 1
  const s = String(raw ?? '0').toLowerCase().trim()
  if (s === 'approved' || s === 'approve' || s === 'true') {
    return 1
  }
  return 0
}

export function normalizeCommentDisplayStatus(rawDisplay: any): CommentDisplayStatus {
  if (rawDisplay === 1 || rawDisplay === true || rawDisplay === '1') return 1
  const d = String(rawDisplay ?? '0').toLowerCase().trim()
  if (d === 'display' || d === 'show' || d === 'true' || d === 'yes') {
    return 1
  }
  return 0
}

export function getCommentStatusLabel(status: CommentStatus | number | boolean): string {
  return Number(status) === 1 ? 'Approved' : 'Pending'
}

export function getCommentDisplayStatusLabel(
  displayStatus: CommentDisplayStatus | number | boolean
): string {
  return Number(displayStatus) === 1 ? 'Display' : 'Not Display'
}

export function getCommentImageUrl(
  image?: string | null,
  imageUrl?: string | null
): string {
  return getCompanyLogoUrl(image, imageUrl)
}

export function normalizeComment(item: any): CommentItem {
  if (!item) return item

  const name =
    (
      item.name ??
      item.your_name ??
      item.full_name ??
      `${item.first_name || ''} ${item.last_name || ''}`
    ).trim() || 'Website Visitor'

  const company = (item.company ?? item.company_name ?? '').trim()
  const title = (item.title ?? item.subject ?? '').trim()
  const commentText = (item.comment ?? item.message ?? '').trim()
  const resolvedImageUrl = getCommentImageUrl(item.image, item.image_url)

  return {
    ...item,
    id: Number(item.id),
    name,
    company: company || null,
    title: title || null,
    comment: commentText,
    image: item.image || null,
    image_url: resolvedImageUrl || null,
    status: normalizeCommentStatus(item.status),
    display_status: normalizeCommentDisplayStatus(item.display_status),
    is_delete: item.is_delete ? 1 : 0,
    created_at: item.created_at,
    updated_at: item.created_at ? item.updated_at : undefined,
  }
}

export const commentsApi = {
  /**
   * GET /api/v1/comments
   * Paginated list of website comments with search, status filter, and sorting
   */
  async getComments(params?: CommentQueryParams): Promise<ApiResponse<CommentItem[]>> {
    const query: Record<string, any> = {}
    if (params) {
      if (params.page !== undefined) query.page = params.page
      if (params.per_page !== undefined) query.per_page = params.per_page
      if (params.status !== undefined && params.status !== 'all') {
        query.status = params.status
      }
      if (params.display_status !== undefined && params.display_status !== 'all') {
        query.display_status = params.display_status
      }
      if (params.search && params.search.trim()) {
        query.search = params.search.trim()
      }
      if (params.sort_by) query.sort_by = params.sort_by
      if (params.sort_dir) query.sort_dir = params.sort_dir
    }

    const res = await apiClient.get<ApiResponse<CommentItem[]>>('/comments', query)
    const rawList = (res as any)?.data?.data || res?.data
    if (Array.isArray(rawList)) {
      res.data = rawList.map(normalizeComment)
    } else {
      res.data = []
    }
    return res
  },

  /**
   * GET /api/v1/comments/display
   * Returns only comments where status = 1, display_status = 1, and is_delete = 0
   */
  async getDisplayComments(params?: {
    page?: number
    per_page?: number
  }): Promise<ApiResponse<CommentItem[]>> {
    const res = await apiClient.get<ApiResponse<CommentItem[]>>(
      '/comments/display',
      params
    )
    const rawList = (res as any)?.data?.data || res?.data
    if (Array.isArray(rawList)) {
      res.data = rawList.map(normalizeComment)
    } else {
      res.data = []
    }
    return res
  },

  /**
   * GET /api/v1/comments/approved
   * Returns only comments where status = 1 and is_delete = 0
   */
  async getApprovedComments(params?: {
    page?: number
    per_page?: number
  }): Promise<ApiResponse<CommentItem[]>> {
    const res = await apiClient.get<ApiResponse<CommentItem[]>>(
      '/comments/approved',
      params
    )
    const rawList = (res as any)?.data?.data || res?.data
    if (Array.isArray(rawList)) {
      res.data = rawList.map(normalizeComment)
    } else {
      res.data = []
    }
    return res
  },

  /**
   * GET /api/v1/comments/{id}
   */
  async getComment(id: number | string): Promise<ApiResponse<CommentItem>> {
    const res = await apiClient.get<ApiResponse<CommentItem>>(`/comments/${id}`)
    const rawData = (res as any)?.data?.data || res?.data
    if (rawData) {
      res.data = normalizeComment(rawData)
    }
    return res
  },

  /**
   * POST /api/v1/comments
   */
  async createComment(payload: CreateCommentPayload): Promise<ApiResponse<CommentItem>> {
    const res = await apiClient.post<ApiResponse<CommentItem>>('/comments', payload)
    const rawData = (res as any)?.data?.data || res?.data
    if (rawData) {
      res.data = normalizeComment(rawData)
    }
    return res
  },

  /**
   * POST /api/v1/comments/{id}/image
   * Upload, update, or remove image for a comment
   */
  async uploadCommentImage(
    id: number | string,
    image: string | null
  ): Promise<ApiResponse<CommentItem>> {
    const res = await apiClient.post<ApiResponse<CommentItem>>(`/comments/${id}/image`, {
      image,
    })
    const rawData = (res as any)?.data?.data || res?.data
    if (rawData) {
      res.data = normalizeComment(rawData)
    }
    return res
  },

  /**
   * POST /api/v1/comments/{id}/approve
   * Approve a pending comment -> status = 1, display_status = 1
   */
  async approveComment(id: number | string): Promise<ApiResponse<CommentItem>> {
    const res = await apiClient.post<ApiResponse<CommentItem>>(`/comments/${id}/approve`)
    const rawData = (res as any)?.data?.data || res?.data
    if (rawData) {
      res.data = normalizeComment(rawData)
    }
    return res
  },

  /**
   * PATCH /api/v1/comments/{id}/status
   * Update comment home page display_status (1 = Display, 0 = Not Display)
   */
  async updateCommentStatus(
    id: number | string,
    displayStatus: CommentDisplayStatus
  ): Promise<ApiResponse<CommentItem>> {
    const res = await apiClient.patch<ApiResponse<CommentItem>>(`/comments/${id}/status`, {
      display_status: displayStatus,
    })
    const rawData = (res as any)?.data?.data || res?.data
    if (rawData) {
      res.data = normalizeComment(rawData)
    }
    return res
  },

  /**
   * DELETE /api/v1/comments/{id}
   * Logically delete a comment (sets is_delete = 1)
   */
  async deleteComment(id: number | string): Promise<ApiResponse<{ message: string }>> {
    return await apiClient.delete<ApiResponse<{ message: string }>>(`/comments/${id}`)
  },
}

export default commentsApi
