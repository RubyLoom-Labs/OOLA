/**
 * Website Inquiries Module API Service
 * Centralized endpoint management for Website Inquiries connected to /api/v1/inquiries
 */

import apiClient, { type ApiResponse } from './client'

export interface Inquiry {
  id: number
  first_name: string
  last_name: string
  firstname?: string
  lastname?: string
  full_name?: string
  email: string
  contact_number: string
  subject?: string | null
  message?: string | null
  status?: boolean | string
  created_at?: string
  updated_at?: string
}

export interface InquiryQueryParams {
  page?: number
  per_page?: number
  search?: string
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
}

export interface CreateInquiryPayload {
  first_name: string
  last_name: string
  email: string
  contact_number: string
  subject?: string
  message?: string
}

export function normalizeInquiry(item: any): Inquiry {
  if (!item) return item

  const firstName = (item.first_name ?? item.firstname ?? item.first ?? '').trim()
  const lastName = (item.last_name ?? item.lastname ?? item.last ?? '').trim()
  const fullName =
    item.full_name || `${firstName} ${lastName}`.trim() || 'Website Visitor'
  const contactNumber = (
    item.contact_number ??
    item.contactNumber ??
    item.phone_number ??
    item.phone ??
    ''
  ).trim()

  return {
    ...item,
    id: Number(item.id),
    first_name: firstName,
    last_name: lastName,
    firstname: firstName,
    lastname: lastName,
    full_name: fullName,
    email: (item.email || '').trim(),
    contact_number: contactNumber,
    subject: item.subject || '',
    message: item.message || '',
    status: item.status ?? true,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }
}

export const inquiriesApi = {
  /**
   * GET /api/v1/inquiries
   * Paginated list of website inquiries with search and sorting support
   */
  async getInquiries(params?: InquiryQueryParams): Promise<ApiResponse<Inquiry[]>> {
    const query: Record<string, any> = {}
    if (params) {
      if (params.page !== undefined) query.page = params.page
      if (params.per_page !== undefined) query.per_page = params.per_page
      if (params.search && params.search.trim()) {
        query.search = params.search.trim()
      }
      if (params.sort_by) query.sort_by = params.sort_by
      if (params.sort_dir) query.sort_dir = params.sort_dir
    }

    const res = await apiClient.get<ApiResponse<Inquiry[]>>('/inquiries', query)
    const rawList = (res as any)?.data?.data || res?.data
    if (Array.isArray(rawList)) {
      res.data = rawList.map(normalizeInquiry)
    } else {
      res.data = []
    }
    return res
  },

  /**
   * GET /api/v1/inquiries/{id}
   * Retrieve single inquiry details
   */
  async getInquiry(id: number | string): Promise<ApiResponse<Inquiry>> {
    const res = await apiClient.get<ApiResponse<Inquiry>>(`/inquiries/${id}`)
    const rawData = (res as any)?.data?.data || res?.data
    if (rawData) {
      res.data = normalizeInquiry(rawData)
    }
    return res
  },

  /**
   * POST /api/v1/inquiries
   * Submit a website inquiry
   */
  async createInquiry(payload: CreateInquiryPayload): Promise<ApiResponse<Inquiry>> {
    const res = await apiClient.post<ApiResponse<Inquiry>>('/inquiries', payload)
    const rawData = (res as any)?.data?.data || res?.data
    if (rawData) {
      res.data = normalizeInquiry(rawData)
    }
    return res
  },
}

export default inquiriesApi

