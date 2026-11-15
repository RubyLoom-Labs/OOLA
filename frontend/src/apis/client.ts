/**
 * Global HTTP API Client
 * Centralized request handler using environment-configured base URL.
 */

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000/api/v1'

export interface ApiResponse<T = any> {
  success?: boolean
  message?: string
  data: T
  meta?: {
    current_page?: number
    last_page?: number
    per_page?: number
    total?: number
    active_count?: number
    inactive_count?: number
    company_count?: number
    [key: string]: any
  }
}

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Normalize endpoint URL
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  // If endpoint already starts with http, use it as is; otherwise prepend API_BASE_URL
  const url = cleanEndpoint.startsWith('http')
    ? cleanEndpoint
    : `${API_BASE_URL.replace(/\/$/, '')}${cleanEndpoint}`

  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token') ||
    sessionStorage.getItem('token')

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const config: RequestInit = {
    ...options,
    headers,
  }

  try {
    const response = await fetch(url, config)
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type')
    const isJson = contentType && contentType.includes('application/json')
    const data = isJson ? await response.json() : await response.text()

    if (!response.ok) {
      const errorMessage =
        (typeof data === 'object' && data?.message) ||
        (typeof data === 'object' && data?.error) ||
        `Request failed with status ${response.status}`

      const validationErrors =
        typeof data === 'object' && data?.errors ? data.errors : undefined

      throw new ApiError(errorMessage, response.status, validationErrors)
    }

    return data as T
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(error.message || 'Network error occurred', 0)
  }
}

export const apiClient = {
  get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString
      }
    }
    return request<T>(url, { method: 'GET' })
  },

  post<T = any>(endpoint: string, body?: any): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
    return request<T>(endpoint, {
      method: 'POST',
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
    })
  },

  put<T = any>(endpoint: string, body?: any): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
    return request<T>(endpoint, {
      method: 'PUT',
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
    })
  },

  patch<T = any>(endpoint: string, body?: any): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
    return request<T>(endpoint, {
      method: 'PATCH',
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
    })
  },

  delete<T = any>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'DELETE' })
  },
}

export default apiClient
