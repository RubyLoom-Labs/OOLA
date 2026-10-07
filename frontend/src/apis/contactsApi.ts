/**
 * Contacts Module API Service
 * Centralized endpoint management for all Contacts CRUD operations, relations, owners, and projects.
 */

import apiClient, { type ApiResponse } from './client'
import { capitalizeWords } from '@/lib/utils'

export interface ContactSite {
  id?: number
  company_id?: number
  customer_id?: number
  contact_id?: number
  name: string
  url: string
  status?: boolean
  is_delete?: boolean
  created_at?: string
  updated_at?: string
}

export interface ContactPhoneNumber {
  id?: number
  company_id?: number
  customer_id?: number
  contact_id?: number
  country_code: string
  number?: string
  phone_number: string
  type: string
  is_primary?: boolean
  is_whatsapp?: boolean
  notes?: string
  is_delete?: boolean
  created_at?: string
  updated_at?: string
}

export interface ContactOwner {
  id: number
  name: string
  email?: string
  phone?: string
  residence?: string
  avatar?: string
  role?: string
}

export interface ContactDocument {
  id: string | number
  name: string
  size: string
  type: string
  url?: string
  uploaded_at?: string
}

export interface ContactProject {
  id: number
  project_code?: string
  project_title?: string
  name?: string
  status: 'In Progress' | 'Completed' | 'Planning' | 'On Hold' | string
  stage?: string
  budget?: string | number
  quoted_amount?: string | number
  start_date?: string
  expected_end_date?: string
  end_date?: string
  lead_name?: string
  role?: string
  created_at?: string
}

export interface ContactCompany {
  id: number
  company_code?: string
  company_name: string
  company_type_id?: number
  company_type?: {
    id: number
    name: string
    status?: boolean
  }
  email?: string
  industry?: string
  company_size_id?: number
  company_size?: {
    id: number
    name: string
    status?: boolean
  }
  status?: boolean | string
  website?: string
  city?: string
  state?: string
  country?: string
  address?: string
}

export interface ContactLead {
  id: number
  title: string
  stage: string
  value: string | number
}

export interface ContactDeal {
  id: number
  title: string
  stage: string
  amount: string | number
}

export interface ContactTask {
  id: number
  title: string
  due_date: string
  status: 'Pending' | 'Completed' | 'In Progress'
}

export interface Contact {
  id: number
  company_id?: number
  customer_id?: number
  company_name?: string
  company?: string | ContactCompany | any
  first_name: string
  last_name: string
  full_name?: string
  name?: string
  email: string
  phone?: string
  phone_country_code?: string
  phone_numbers?: ContactPhoneNumber[]
  primary_phone_number?: ContactPhoneNumber
  sites?: ContactSite[]
  designation?: string
  company_type?: string
  company_web?: string
  website?: string
  address?: string
  state?: string
  country?: string
  birthday?: string
  date_of_birth?: string
  status: 'Active' | 'Inactive' | 'Archived' | string
  avatar?: string
  notes?: string
  tags?: string[]
  owners?: ContactOwner[]
  owner_phone?: string
  owner_residence?: string
  documents?: ContactDocument[]
  projects?: ContactProject[]
  leads_count?: number
  projects_count?: number
  deals_count?: number
  tasks_count?: number
  last_activity?: {
    action: string
    by: string
    timestamp: string
  }
  deleted_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface ContactQueryParams {
  page?: number
  per_page?: number
  company_id?: number
  search?: string
  status?: string
  sort_by?: 'id' | 'company' | 'first_name' | 'last_name' | 'designation' | 'email' | 'status' | 'created_at' | string
  sort_dir?: 'asc' | 'desc'
  sort_order?: 'asc' | 'desc'
  include_deleted?: boolean
}

export interface CreateContactPayload {
  company_id?: number
  customer_id?: number
  company?: string
  company_name?: string
  first_name: string
  last_name: string
  designation?: string
  email: string
  address?: string
  birthday?: string
  date_of_birth?: string
  status?: boolean | 'Active' | 'Inactive'
  sites?: ContactSite[]
  phone_numbers?: ContactPhoneNumber[]
  phone?: string
  phone_country_code?: string
  avatar?: string
  notes?: string
  tags?: string[]
  owner_ids?: number[]
  owners?: ContactOwner[]
  owner_phone?: string
  owner_residence?: string
  documents?: ContactDocument[]
}

export interface UpdateContactPayload extends Partial<CreateContactPayload> {
  id?: number
}

export interface AddOwnerPayload {
  name: string
  email?: string
  phone?: string
  residence?: string
  role?: string
}

export interface ContactStats {
  total_contacts: number
  active_contacts: number
  inactive_contacts: number
  total_companies: number
}

/**
 * Normalizes Contact data so word capitalization & phone/status structures are uniform across all models and features.
 */
export function normalizeContact(c: Contact): Contact {
  if (!c) return c
  const firstName = capitalizeWords(c.first_name)
  const lastName = capitalizeWords(c.last_name)
  const rawFullName = c.full_name || c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim()
  const fullName = capitalizeWords(rawFullName)

  let companyDisplay = ''
  if (typeof c.company === 'string') {
    companyDisplay = capitalizeWords(c.company)
  } else if (c.company && typeof c.company === 'object' && c.company.company_name) {
    companyDisplay = capitalizeWords(c.company.company_name)
  } else if (c.company_name) {
    companyDisplay = capitalizeWords(c.company_name)
  }

  let statusDisplay = 'Active'
  if (typeof c.status === 'boolean') {
    statusDisplay = c.status ? 'Active' : 'Inactive'
  } else if (c.status) {
    statusDisplay = capitalizeWords(c.status as string) || 'Active'
  }

  let primaryPhone = c.phone || ''
  if (c.phone_numbers && c.phone_numbers.length > 0) {
    const primaryObj = c.phone_numbers.find((p) => p.is_primary) || c.phone_numbers[0]
    if (primaryObj) {
      primaryPhone = `${primaryObj.country_code || ''} ${primaryObj.phone_number || ''}`.trim()
    }
  }

  return {
    ...c,
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    name: fullName,
    company_name: companyDisplay,
    company: companyDisplay || c.company,
    designation: capitalizeWords(c.designation),
    status: statusDisplay,
    birthday: c.birthday || c.date_of_birth,
    date_of_birth: c.date_of_birth || c.birthday,
    phone: primaryPhone,
    country: capitalizeWords(c.country),
    company_type: capitalizeWords(c.company_type),
    tags: Array.isArray(c.tags) ? c.tags.map(capitalizeWords) : c.tags,
  }
}

// ── Contact API Methods ──

export const contactsApi = {
  /**
   * GET /api/v1/contacts
   * List contacts with filtering, parameterized search & pagination
   */
  async getContacts(params?: ContactQueryParams): Promise<ApiResponse<Contact[]>> {
    const query: Record<string, any> = {}
    if (params) {
      if (params.page !== undefined) query.page = params.page
      if (params.per_page !== undefined) query.per_page = params.per_page
      if (params.company_id !== undefined) query.company_id = params.company_id
      if (params.status && params.status !== 'all') query.status = params.status
      if (params.search && params.search.trim()) query.search = params.search.trim()
      if (params.sort_by) query.sort_by = params.sort_by
      if (params.sort_dir) query.sort_dir = params.sort_dir
      else if (params.sort_order) query.sort_dir = params.sort_order
    }
    const res = await apiClient.get<ApiResponse<Contact[]>>('/contacts', query)
    if (res && Array.isArray(res.data)) {
      res.data = res.data.map(normalizeContact)
    }
    return res
  },

  /**
   * GET /api/v1/contacts/{id}
   * View contact details with relations
   */
  async getContact(id: number | string): Promise<ApiResponse<Contact>> {
    const res = await apiClient.get<ApiResponse<Contact>>(`/contacts/${id}`)
    if (res && res.data) {
      res.data = normalizeContact(res.data)
    }
    return res
  },

  /**
   * POST /api/v1/contacts
   * Create contact with multiple owners & phone numbers
   */
  async createContact(payload: CreateContactPayload): Promise<ApiResponse<Contact>> {
    const res = await apiClient.post<ApiResponse<Contact>>('/contacts', payload)
    if (res && res.data) {
      res.data = normalizeContact(res.data)
    }
    return res
  },

  /**
   * PUT/PATCH /api/v1/contacts/{id}
   * Update contact
   */
  async updateContact(
    id: number | string,
    payload: UpdateContactPayload
  ): Promise<ApiResponse<Contact>> {
    const res = await apiClient.put<ApiResponse<Contact>>(`/contacts/${id}`, payload)
    if (res && res.data) {
      res.data = normalizeContact(res.data)
    }
    return res
  },

  /**
   * DELETE /api/v1/contacts/{id}
   * Logical delete
   */
  async deleteContact(id: number | string): Promise<ApiResponse<{ id: number; message: string }>> {
    return await apiClient.delete<ApiResponse<{ id: number; message: string }>>(`/contacts/${id}`)
  },

  /**
   * POST /api/v1/contacts/{id}/restore
   * Restore logically deleted contact
   */
  async restoreContact(id: number | string): Promise<ApiResponse<Contact>> {
    const res = await apiClient.post<ApiResponse<Contact>>(`/contacts/${id}/restore`)
    if (res && res.data) {
      res.data = normalizeContact(res.data)
    }
    return res
  },

  /**
   * GET /api/v1/contacts/{id}/projects
   * Fetch project counts & full history
   */
  async getContactProjects(
    id: number | string
  ): Promise<ApiResponse<{ total_projects: number; active_projects: number; projects: ContactProject[] }>> {
    return await apiClient.get<
      ApiResponse<{ total_projects: number; active_projects: number; projects: ContactProject[] }>
    >(`/contacts/${id}/projects`)
  },

  /**
   * POST /api/v1/contacts/{id}/owners
   * Add an additional owner to the contact
   */
  async addContactOwner(
    id: number | string,
    payload: AddOwnerPayload
  ): Promise<ApiResponse<{ contact_id: number; owner: ContactOwner }>> {
    return await apiClient.post<ApiResponse<{ contact_id: number; owner: ContactOwner }>>(
      `/contacts/${id}/owners`,
      payload
    )
  },
}

