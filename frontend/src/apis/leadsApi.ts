/**
 * Leads Module API Service
 * Centralized endpoint management for Leads & Sales Pipeline connected to /api/v1/leads
 */

import apiClient, { type ApiResponse } from './client'

export interface LeadStageItem {
  id: number
  name: string
  slug: string
  color: string
  order_column: number
  is_won?: boolean
  is_lost?: boolean
}

export interface LeadSourceItem {
  id: number
  name: string
  slug?: string
}

export interface LeadUserItem {
  id: number
  name: string
  email?: string
  avatar?: string | null
  designation?: string | null
}

export interface LeadCustomerItem {
  id: number
  company_name: string
  customer_code?: string
  email?: string | null
  phone?: string | null
}

export interface LeadContactItem {
  id: number
  first_name?: string
  last_name?: string
  full_name?: string
  email?: string | null
  phone?: string | null
}

export interface LeadItem {
  id: number
  inquiry_id?: number | null
  lead_code: string
  lead_title: string
  requirement_name?: string | null
  requirement_details?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  contact_number?: string | null
  subject?: string | null
  message?: string | null
  customer_id?: number | null
  customer?: LeadCustomerItem | null
  contact_id?: number | null
  contact?: LeadContactItem | null
  lead_stage_id: number | null
  stage?: LeadStageItem | null
  lead_source_id?: number | null
  source?: LeadSourceItem | null
  budget_quoted: number
  currency: string
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  status: 'Active' | 'Won' | 'Lost' | 'Converted'
  next_step?: string | null
  expected_closing_date?: string | null
  lost_reason?: string | null
  lost_note?: string | null
  lost_at?: string | null
  users?: LeadUserItem[]
  tasks_count?: number
  created_at?: string
  updated_at?: string
}

export interface LeadQueryParams {
  page?: number
  per_page?: number
  search?: string
  stage_id?: number | string
  priority?: string
  status?: string
}

export interface CreateLeadPayload {
  lead_title: string
  requirement_name?: string | null
  requirement_details?: string | null
  customer_id?: number | null
  contact_id?: number | null
  lead_source_id?: number | null
  lead_stage_id?: number | null
  budget_quoted?: number
  currency?: string
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent'
  status?: 'Active' | 'Won' | 'Lost' | 'Converted'
  next_step?: string | null
  expected_closing_date?: string | null
  user_ids?: number[]
}

export interface UpdateLeadPayload extends Partial<CreateLeadPayload> {
  lost_reason?: string | null
  lost_note?: string | null
}

export interface KanbanStageColumn extends LeadStageItem {
  leads: LeadItem[]
}

export function normalizeLead(raw: any): LeadItem {
  if (!raw) return raw

  const fullName = `${raw.first_name || ''} ${raw.last_name || ''}`.trim()
  const leadTitle =
    raw.lead_title ||
    raw.subject ||
    raw.requirement_name ||
    fullName ||
    `Lead #${raw.id}`

  const stageObj: LeadStageItem | null = raw.stage
    ? {
        id: Number(raw.stage.id),
        name: raw.stage.name || 'New',
        slug: raw.stage.slug || 'new',
        color: raw.stage.color || '#3B82F6',
        order_column: Number(raw.stage.order_column ?? 1),
        is_won: Boolean(raw.stage.is_won),
        is_lost: Boolean(raw.stage.is_lost),
      }
    : null

  return {
    id: Number(raw.id),
    inquiry_id: raw.inquiry_id ? Number(raw.inquiry_id) : null,
    lead_code: raw.lead_code || `LEAD-${String(raw.id).padStart(4, '0')}`,
    lead_title: leadTitle,
    requirement_name: raw.requirement_name || null,
    requirement_details: raw.requirement_details || null,
    first_name: raw.first_name || null,
    last_name: raw.last_name || null,
    email: raw.email || null,
    contact_number: raw.contact_number || null,
    subject: raw.subject || null,
    message: raw.message || null,
    customer_id: raw.customer_id ? Number(raw.customer_id) : null,
    customer: raw.customer || null,
    contact_id: raw.contact_id ? Number(raw.contact_id) : null,
    contact: raw.contact || null,
    lead_stage_id: raw.lead_stage_id
      ? Number(raw.lead_stage_id)
      : stageObj?.id ?? null,
    stage: stageObj,
    lead_source_id: raw.lead_source_id ? Number(raw.lead_source_id) : null,
    source: raw.source || null,
    budget_quoted: Number(raw.budget_quoted ?? 0),
    currency: raw.currency || 'LKR',
    priority:
      raw.priority === 'High' ||
      raw.priority === 'Low' ||
      raw.priority === 'Urgent'
        ? raw.priority
        : 'Medium',
    status: raw.status || 'Active',
    next_step: raw.next_step || null,
    expected_closing_date: raw.expected_closing_date || null,
    lost_reason: raw.lost_reason || null,
    lost_note: raw.lost_note || null,
    lost_at: raw.lost_at || null,
    users: Array.isArray(raw.users) ? raw.users : [],
    tasks_count: Number(raw.tasks_count ?? 0),
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  }
}

export const leadsApi = {
  /**
   * GET /api/v1/leads
   * Paginated list of leads from the backend
   */
  async getLeads(params?: LeadQueryParams): Promise<ApiResponse<LeadItem[]>> {
    const query: Record<string, any> = {}
    if (params) {
      if (params.page !== undefined) query.page = params.page
      if (params.per_page !== undefined) query.per_page = params.per_page
      if (params.search && params.search.trim()) {
        query.search = params.search.trim()
      }
      if (params.stage_id !== undefined && params.stage_id !== 'all') {
        query.stage_id = params.stage_id
      }
      if (params.priority !== undefined && params.priority !== 'all') {
        query.priority = params.priority
      }
      if (params.status !== undefined && params.status !== 'all') {
        query.status = params.status
      }
    }

    const res = await apiClient.get<ApiResponse<LeadItem[]>>('/leads', query)
    const rawList = (res as any)?.data?.data || res?.data || res
    if (Array.isArray(rawList)) {
      res.data = rawList.map(normalizeLead)
    } else {
      res.data = []
    }
    return res
  },

  /**
   * GET /api/v1/leads/kanban
   * Returns all lead stages ordered by order_column with their leads array
   */
  async getKanban(): Promise<KanbanStageColumn[]> {
    const res = await apiClient.get<any>('/leads/kanban')
    const rawStages = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
    return rawStages.map((st: any) => ({
      id: Number(st.id),
      name: st.name || 'Stage',
      slug: st.slug || String(st.id),
      color: st.color || '#3B82F6',
      order_column: Number(st.order_column ?? 1),
      is_won: Boolean(st.is_won),
      is_lost: Boolean(st.is_lost),
      leads: Array.isArray(st.leads)
        ? st.leads.map((l: any) =>
            normalizeLead({
              ...l,
              stage: l.stage || {
                id: st.id,
                name: st.name,
                slug: st.slug,
                color: st.color,
                order_column: st.order_column,
                is_won: st.is_won,
                is_lost: st.is_lost,
              },
            })
          )
        : [],
    }))
  },

  /**
   * GET /api/v1/lead-stages
   * Returns all active pipeline stages
   */
  async getLeadStages(): Promise<LeadStageItem[]> {
    const res = await apiClient.get<any>('/lead-stages')
    const rawList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
    return rawList.map((st: any) => ({
      id: Number(st.id),
      name: st.name,
      slug: st.slug,
      color: st.color || '#3B82F6',
      order_column: Number(st.order_column ?? 1),
      is_won: Boolean(st.is_won),
      is_lost: Boolean(st.is_lost),
    }))
  },

  /**
   * GET /api/v1/lead-sources
   */
  async getLeadSources(): Promise<LeadSourceItem[]> {
    const res = await apiClient.get<any>('/lead-sources')
    const rawList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
    return rawList.map((src: any) => ({
      id: Number(src.id),
      name: src.name,
      slug: src.slug,
    }))
  },

  /**
   * GET /api/v1/leads/{id}
   */
  async getLead(id: number | string): Promise<LeadItem> {
    const res = await apiClient.get<any>(`/leads/${id}`)
    const rawData = res?.data?.data || res?.data || res
    return normalizeLead(rawData)
  },

  /**
   * POST /api/v1/leads
   */
  async createLead(payload: CreateLeadPayload): Promise<LeadItem> {
    const res = await apiClient.post<any>('/leads', payload)
    const rawData = res?.data?.data || res?.data || res
    return normalizeLead(rawData)
  },

  /**
   * PUT /api/v1/leads/{id}
   */
  async updateLead(
    id: number | string,
    payload: UpdateLeadPayload
  ): Promise<LeadItem> {
    const res = await apiClient.put<any>(`/leads/${id}`, payload)
    const rawData = res?.data?.data || res?.data || res
    return normalizeLead(rawData)
  },

  /**
   * POST /api/v1/leads/{id}/stage
   * Update a lead's pipeline stage (used by Kanban drag-and-drop and stage selector)
   */
  async updateLeadStage(
    id: number | string,
    leadStageId: number
  ): Promise<LeadItem> {
    const res = await apiClient.post<any>(`/leads/${id}/stage`, {
      lead_stage_id: leadStageId,
    })
    const rawData = res?.data?.data || res?.lead || res?.data || res
    return normalizeLead(rawData)
  },

  /**
   * DELETE /api/v1/leads/{id}
   */
  async deleteLead(id: number | string): Promise<void> {
    await apiClient.delete(`/leads/${id}`)
  },
}

export default leadsApi

