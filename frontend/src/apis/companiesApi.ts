/**
 * Companies Module API Service
 * Centralized endpoint management for Companies CRUD operations connected directly to /api/v1/companies
 */

import apiClient, { type ApiResponse } from './client'
import { capitalizeWords, getCompanyLogoUrl } from '@/lib/utils'

export interface CompanyLookupItem {
  id: number
  company_name: string
  company_code: string
}

export interface CompanyTypeItem {
  id: number
  name: string
  status?: boolean
  created_at?: string
  updated_at?: string
}

export interface CompanySizeItem {
  id: number
  name: string
  status?: boolean
  created_at?: string
  updated_at?: string
}

export interface CompanyContact {
  id: number
  company_id?: number
  company_name?: string
  first_name?: string
  last_name?: string
  full_name?: string
  name?: string
  email: string
  mobile_no?: string
  phone_number?: string
  phone?: string
  designation?: string
  avatar?: string | null
  avatar_url?: string | null
  status?: boolean | string
  address?: string | null
  birthday?: string | null
  created_at?: string
  updated_at?: string
}

export interface Company {
  id: number
  company_code: string
  company_name: string
  company_type_id: number
  company_type?: CompanyTypeItem | string
  email: string
  phone_number?: string | null
  phone?: string | null
  industry?: string | null
  company_size_id?: number | null
  company_size?: CompanySizeItem | null
  status: boolean | 'Active' | 'Inactive' | string
  status_bool?: boolean
  company_description?: string | null
  website?: string | null
  logo?: string | null
  logo_url?: string | null
  owner_name?: string | null
  owner_birthday?: string | null
  address_line_1?: string | null
  address_line_2?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string | null
  contacts_count?: number
  leads_count?: number
  projects_count?: number
  quotations_count?: number
  payments_count?: number
  contacts?: CompanyContact[]
  created_at?: string
  updated_at?: string
  // Computed / alias helpers
  address?: string
  designation?: string
}

// Backward-compatibility alias
export type CompanyDetails = Company

export interface CompanyQueryParams {
  page?: number
  per_page?: number
  search?: string
  status?: string | number | boolean
  company_type_id?: number
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
}

export interface CompanyLookupParams {
  search?: string
  q?: string
  name?: string
  code?: string
  limit?: number
}

export interface CreateCompanyPayload {
  company_name: string
  company_type_id: number
  email: string
  phone_number?: string
  phone?: string
  phone_numbers?: Array<{
    id?: number
    phone_number: string
    type?: string
    is_primary?: boolean
    is_whatsapp?: boolean
    notes?: string
  }>
  website?: string
  industry?: string
  company_description?: string
  logo?: File | string | null
  owner_name?: string
  owner_birthday?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  company_size_id?: number | null
  address?: string
  company_type?: string
  status?: boolean | number | string
}

export interface UpdateCompanyPayload extends Partial<CreateCompanyPayload> {
  id?: number
}

export function normalizeCompany(c: Company): Company {
  if (!c) return c

  const compName = capitalizeWords(c.company_name) || ''
  const companyCode = c.company_code || ''

  // Uniform status parsing (backend provides status: boolean)
  let statusBool = true
  let statusDisplay: 'Active' | 'Inactive' = 'Active'
  if (typeof c.status === 'boolean') {
    statusBool = c.status
    statusDisplay = c.status ? 'Active' : 'Inactive'
  } else if (typeof c.status === 'number') {
    statusBool = c.status === 1
    statusDisplay = c.status === 1 ? 'Active' : 'Inactive'
  } else if (typeof c.status === 'string') {
    const s = c.status.toLowerCase().trim()
    statusBool = s === 'active' || s === '1' || s === 'true'
    statusDisplay = statusBool ? 'Active' : 'Inactive'
  }

  const primaryPhone = c.phone_number || c.phone || ''

  const addressParts = [
    c.address_line_1,
    c.address_line_2,
    c.city,
    c.state,
    c.postal_code,
    c.country,
  ].filter(Boolean)
  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : c.address || ''

  // Normalize contacts list if provided (e.g. from /companies/{id})
  const normalizedContacts: CompanyContact[] = Array.isArray(c.contacts)
    ? c.contacts.map((contact) => {
        const rawName =
          contact.name ||
          contact.full_name ||
          `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
        const contactName = capitalizeWords(rawName) || 'Contact'
        return {
          ...contact,
          name: contactName,
          full_name: contactName,
          designation: capitalizeWords(contact.designation) || undefined,
          phone_number: contact.phone_number || contact.mobile_no || contact.phone,
          mobile_no: contact.mobile_no || contact.phone_number || contact.phone,
        }
      })
    : []

  const resolvedTypeId =
    c.company_type_id ||
    (typeof c.company_type === 'object' && c.company_type ? c.company_type.id : 1)

  const resolvedSizeId =
    c.company_size_id ||
    (typeof c.company_size === 'object' && c.company_size ? c.company_size.id : undefined)

  const resolvedLogoUrl = getCompanyLogoUrl(c.logo, c.logo_url)

  return {
    ...c,
    company_name: compName,
    company_code: companyCode,
    company_type_id: resolvedTypeId,
    company_size_id: resolvedSizeId,
    email: (c.email || '').trim(),
    phone_number: primaryPhone,
    phone: primaryPhone,
    industry: capitalizeWords(c.industry) || undefined,
    city: capitalizeWords(c.city) || undefined,
    state: capitalizeWords(c.state) || undefined,
    country: capitalizeWords(c.country) || 'Sri Lanka',
    address: fullAddress,
    status: statusDisplay,
    status_bool: statusBool,
    logo: c.logo || null,
    logo_url: resolvedLogoUrl || c.logo_url || null,
    contacts: normalizedContacts,
    contacts_count: c.contacts_count ?? normalizedContacts.length,
    leads_count: c.leads_count ?? 0,
    projects_count: c.projects_count ?? 0,
  }
}

export const companiesApi = {
  /**
   * GET /api/v1/companies/lookup (or /api/v1/companies/active-list)
   * Lightweight search for active companies
   */
  async getLookup(params?: CompanyLookupParams): Promise<ApiResponse<CompanyLookupItem[]>> {
    const query: Record<string, any> = {}
    if (params) {
      if (params.search && params.search.trim()) {
        query.search = params.search.trim()
        query.q = params.search.trim()
      }
      if (params.name) query.name = params.name
      if (params.code) query.code = params.code
      if (params.limit) query.limit = params.limit
    }

    try {
      const res = await apiClient.get<ApiResponse<CompanyLookupItem[]>>('/companies/lookup', query)
      return res
    } catch {
      // Fallback to active-list if lookup endpoint name differs
      return await apiClient.get<ApiResponse<CompanyLookupItem[]>>('/companies/active-list', query)
    }
  },

  /**
   * GET /api/v1/companies
   * Paginated list of companies with search, status and pagination support
   */
  async getCompanies(params?: CompanyQueryParams): Promise<ApiResponse<Company[]>> {
    const query: Record<string, any> = {}
    if (params) {
      if (params.page !== undefined) query.page = params.page
      if (params.per_page !== undefined) query.per_page = params.per_page
      if (params.status !== undefined && params.status !== 'all') {
        if (params.status === 'Active' || params.status === true || params.status === 1) {
          query.status = 1
        } else if (params.status === 'Inactive' || params.status === false || params.status === 0) {
          query.status = 0
        } else {
          query.status = params.status
        }
      }
      if (params.search && params.search.trim()) {
        query.search = params.search.trim()
      }
      if (params.company_type_id !== undefined) {
        query.company_type_id = params.company_type_id
      }
      if (params.sort_by) query.sort_by = params.sort_by
      if (params.sort_dir) query.sort_dir = params.sort_dir
    }

    const res = await apiClient.get<ApiResponse<Company[]>>('/companies', query)
    const rawList = (res as any)?.data?.data || res?.data
    if (Array.isArray(rawList)) {
      res.data = rawList.map(normalizeCompany)
    }
    return res
  },

  /**
   * GET /api/v1/companies/{id}
   * Full company details including associated contacts list
   */
  async getCompany(id: number | string): Promise<ApiResponse<Company>> {
    const res = await apiClient.get<ApiResponse<Company>>(`/companies/${id}`)
    const rawData = (res as any)?.data?.data || res?.data
    if (rawData) {
      res.data = normalizeCompany(rawData)
    }
    return res
  },

  /**
   * POST /api/v1/companies
   * Create new company
   */
  async createCompany(
    payload: CreateCompanyPayload | FormData
  ): Promise<ApiResponse<Company>> {
    let body: any = payload
    if (typeof FormData !== 'undefined' && !(payload instanceof FormData)) {
      const p = payload as CreateCompanyPayload
      if (p.logo instanceof File) {
        const formData = new FormData()
        Object.entries(p).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === 'status') {
              formData.append(key, value ? '1' : '0')
            } else if (value instanceof File) {
              formData.append(key, value)
            } else {
              formData.append(key, String(value))
            }
          }
        })
        body = formData
      } else {
        const cleanPayload: Record<string, any> = {}
        Object.entries(p).forEach(([key, val]) => {
          if (val !== undefined && val !== null) {
            if (key === 'status') {
              cleanPayload[key] = typeof val === 'boolean' ? val : val === 'Active' || val === 1 || val === '1'
            } else if (key === 'company_type_id' || key === 'company_size_id') {
              cleanPayload[key] = val !== '' ? Number(val) : null
            } else if (key === 'phone' && !p.phone_number) {
              cleanPayload['phone_number'] = typeof val === 'string' ? val.trim() : val
            } else if (key === 'logo') {
              cleanPayload[key] = val
            } else if (typeof val === 'string') {
              cleanPayload[key] = val.trim()
            } else {
              cleanPayload[key] = val
            }
          }
        })
        body = cleanPayload
      }
    }

    const res = await apiClient.post<ApiResponse<Company>>('/companies', body)
    const rawData = (res as any)?.data?.data || res?.data
    if (rawData) {
      res.data = normalizeCompany(rawData)
    }
    return res
  },

  /**
   * PATCH /api/v1/companies/{id}
   * Update company details
   */
  async updateCompany(
    id: number | string,
    payload: UpdateCompanyPayload | FormData
  ): Promise<ApiResponse<Company>> {
    let res: any

    // If FormData, use POST with _method=PATCH to support multipart/form-data on PHP backend
    if (typeof FormData !== 'undefined' && payload instanceof FormData) {
      if (!payload.has('_method')) {
        payload.append('_method', 'PATCH')
      }
      res = await apiClient.post<ApiResponse<Company>>(`/companies/${id}`, payload)
    } else {
      // Build clean JSON payload matching PATCH specification
      const updateData = payload as UpdateCompanyPayload
      const cleanPayload: Record<string, any> = {}
      Object.entries(updateData).forEach(([key, val]) => {
        if (val !== undefined && key !== 'id') {
          if (key === 'status') {
            // Backend expects boolean true/false
            cleanPayload[key] = typeof val === 'boolean' ? val : val === 'Active' || val === 1 || val === '1'
          } else if (key === 'company_type_id' || key === 'company_size_id') {
            cleanPayload[key] = val !== null && val !== '' ? Number(val) : null
          } else if (key === 'phone' && !updateData.phone_number) {
            cleanPayload['phone_number'] = typeof val === 'string' ? val.trim() : val
          } else if (key === 'logo') {
            // Supports base64 Data URL string or null
            cleanPayload[key] = val
          } else if (typeof val === 'string') {
            cleanPayload[key] = val.trim()
          } else {
            cleanPayload[key] = val
          }
        }
      })

      try {
        res = await apiClient.patch<ApiResponse<Company>>(`/companies/${id}`, cleanPayload)
      } catch (err: any) {
        // Fallback to PUT if environment only supports PUT for full/partial update
        if (err?.status === 405 || err?.status === 404) {
          res = await apiClient.put<ApiResponse<Company>>(`/companies/${id}`, cleanPayload)
        } else {
          throw err
        }
      }
    }

    const rawData = (res as any)?.data?.data || res?.data
    if (rawData) {
      res.data = normalizeCompany(rawData)
    }
    return res
  },

  /** Alias for updateCompany */
  async patchCompany(
    id: number | string,
    payload: UpdateCompanyPayload | FormData
  ): Promise<ApiResponse<Company>> {
    return this.updateCompany(id, payload)
  },

  /**
   * GET /api/v1/companies/{id}/contacts
   * Retrieve all contacts belonging to a specific company
   */
  async getCompanyContacts(companyId: number | string): Promise<ApiResponse<CompanyContact[]>> {
    try {
      const res = await apiClient.get<ApiResponse<CompanyContact[]>>(`/companies/${companyId}/contacts`)
      const rawList = (res as any)?.data?.data || res?.data
      return {
        ...res,
        data: Array.isArray(rawList) ? rawList : [],
      }
    } catch (err) {
      console.warn(`Failed to fetch contacts for company ${companyId}:`, err)
      return { data: [] }
    }
  },

  /**
   * DELETE /api/v1/companies/{id}
   * Archive / delete company
   */
  async deleteCompany(id: number | string): Promise<ApiResponse<{ message: string }>> {
    return await apiClient.delete<ApiResponse<{ message: string }>>(`/companies/${id}`)
  },

  /**
   * GET /api/v1/company-types
   */
  async getCompanyTypes(): Promise<ApiResponse<CompanyTypeItem[]>> {
    try {
      const res = await apiClient.get<ApiResponse<CompanyTypeItem[]>>('/company-types')
      const rawTypes = (res as any)?.data?.data || res?.data
      return { data: Array.isArray(rawTypes) ? rawTypes : [] }
    } catch {
      return { data: [] }
    }
  },

  /**
   * GET /api/v1/company-sizes
   */
  async getCompanySizes(): Promise<ApiResponse<CompanySizeItem[]>> {
    try {
      const res = await apiClient.get<ApiResponse<CompanySizeItem[]>>('/company-sizes')
      const rawSizes = (res as any)?.data?.data || res?.data
      return { data: Array.isArray(rawSizes) ? rawSizes : [] }
    } catch {
      return { data: [] }
    }
  },
}

export default companiesApi
