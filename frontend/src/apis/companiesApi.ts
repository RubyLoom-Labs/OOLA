import apiClient, { type ApiResponse } from './client'

export interface CompanyLookupItem {
  id: number
  company_name: string
  company_code: string
}

export interface CompanyTypeItem {
  id: number
  name: string
  status?: boolean
}

export interface CompanySizeItem {
  id: number
  name: string
  status?: boolean
}

export interface CompanyDetails {
  id: number
  company_code?: string
  company_name: string
  company_type_id?: number
  company_type?: CompanyTypeItem
  email?: string
  industry?: string
  company_size_id?: number
  company_size?: CompanySizeItem
  status?: boolean | string
  website?: string
  city?: string
  state?: string
  country?: string
  address?: string
  phone?: string
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
  company_code?: string
  email?: string
  phone?: string
  website?: string
  industry?: string
  city?: string
  state?: string
  country?: string
  company_type_id?: number
  company_size_id?: number
  address?: string
  status?: boolean | number | string
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
   * GET /api/v1/companies/{id}
   * Full company details
   */
  async getCompany(id: number | string): Promise<ApiResponse<CompanyDetails>> {
    return await apiClient.get<ApiResponse<CompanyDetails>>(`/companies/${id}`)
  },

  /**
   * POST /api/v1/companies
   * Create new company
   */
  async createCompany(payload: CreateCompanyPayload): Promise<ApiResponse<CompanyDetails | CompanyLookupItem>> {
    return await apiClient.post<ApiResponse<CompanyDetails | CompanyLookupItem>>('/companies', payload)
  },

  /**
   * GET /api/v1/company-types or /api/v1/company-sizes if available
   */
  async getCompanyTypes(): Promise<ApiResponse<CompanyTypeItem[]>> {
    try {
      return await apiClient.get<ApiResponse<CompanyTypeItem[]>>('/company-types')
    } catch {
      return { data: [] }
    }
  },

  async getCompanySizes(): Promise<ApiResponse<CompanySizeItem[]>> {
    try {
      return await apiClient.get<ApiResponse<CompanySizeItem[]>>('/company-sizes')
    } catch {
      return { data: [] }
    }
  },
}

export default companiesApi
