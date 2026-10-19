import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Capitalizes the first letter of each word in a string (Title Case).
 * Supports spaces, underscores, and hyphens.
 * Example: "sarah connor" -> "Sarah Connor"
 * Example: "chief_operations_officer" -> "Chief Operations Officer"
 * Example: "active" -> "Active"
 */
export function capitalizeWords(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (!word) return ''
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

/**
 * Capitalizes only the first letter of a string/sentence.
 */
export function capitalizeFirstLetter(str: string | null | undefined): string {
  if (!str) return ''
  const trimmed = str.trim()
  if (!trimmed) return ''
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

/**
 * Alias for capitalizeWords
 */
export const titleCase = capitalizeWords

/**
 * Helper to capitalize specific string fields on any model/object.
 * Useful for normalizing incoming and upcoming model objects.
 */
export function capitalizeObjectFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T {
  if (!obj || typeof obj !== 'object') return obj
  const cloned = { ...obj }
  fields.forEach((field) => {
    if (typeof cloned[field] === 'string') {
      cloned[field] = capitalizeWords(cloned[field] as string) as any
    }
  })
  return cloned
}

export function timeAgo(date: Date | string): string {
  const now = new Date()
  const past = new Date(date)
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`

  return past.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'

/**
 * Normalizes contact/user avatar URLs.
 * Ensures relative storage paths or backend endpoints properly include the '/storage/' part:
 * e.g., 'contact_avatars/avatar_6acfc653dfe74_1792001619.jpg' -> 'http://localhost:8000/storage/contact_avatars/avatar_6acfc653dfe74_1792001619.jpg'
 */
export function getAvatarUrl(avatar?: string | null, fallback = DEFAULT_AVATAR): string {
  if (!avatar || typeof avatar !== 'string' || !avatar.trim()) {
    return fallback
  }

  const trimmed = avatar.trim()

  // Base64 Data URI or Blob URI from client-side file picker preview
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed
  }

  const apiBase =
    (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000/api/v1'
  const backendBase = apiBase.replace(/\/api(\/v\d+)?\/?$/, '')

  // Full HTTP/HTTPS URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // If it already contains /storage/, it is complete
    if (trimmed.includes('/storage/')) {
      return trimmed
    }
    // If it points to the backend server but lacks /storage/
    if (trimmed.startsWith(backendBase)) {
      const rest = trimmed.slice(backendBase.length).replace(/^\/+/, '')
      return `${backendBase}/storage/${rest}`
    }
    // External images (Unsplash, Dicebear, Google, etc.)
    return trimmed
  }

  // Relative storage path from backend (e.g. contact_avatars/xxx or storage/contact_avatars/xxx)
  const clean = trimmed.replace(/^\/+/, '')

  if (clean.startsWith('storage/')) {
    return `${backendBase}/${clean}`
  }

  if (clean.startsWith('contact_avatars/')) {
    return `${backendBase}/storage/${clean}`
  }

  // If only filename was stored (e.g. avatar_6acfc653dfe74_1792001619.jpg)
  return `${backendBase}/storage/contact_avatars/${clean}`
}

/**
 * Normalizes company logo URLs from backend responses (logo path or logo_url).
 * Handles base64 data URIs, absolute URLs, and relative storage paths.
 */
export function getCompanyLogoUrl(logo?: string | null, logoUrl?: string | null): string {
  // If logo is a base64 Data URL or blob URL (e.g. from file picker preview)
  if (logo && typeof logo === 'string') {
    const trimmedLogo = logo.trim()
    if (trimmedLogo.startsWith('data:') || trimmedLogo.startsWith('blob:')) {
      return trimmedLogo
    }
    if (trimmedLogo.startsWith('http://') || trimmedLogo.startsWith('https://')) {
      return trimmedLogo
    }
  }

  // If logoUrl is a valid http/https URL
  if (logoUrl && typeof logoUrl === 'string' && logoUrl.trim()) {
    const trimmedUrl = logoUrl.trim()
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      return trimmedUrl
    }
  }

  // If logo is a relative backend storage path like 'company_logos/xxx' or 'storage/company_logos/xxx'
  if (logo && typeof logo === 'string' && logo.trim()) {
    const apiBase =
      (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000/api/v1'
    const backendBase = apiBase.replace(/\/api(\/v\d+)?\/?$/, '')
    const clean = logo.trim().replace(/^\/+/, '')

    if (clean.startsWith('storage/')) {
      return `${backendBase}/${clean}`
    }
    return `${backendBase}/storage/${clean}`
  }

  return ''
}

/**
 * Converts a browser File to base64 Data URL string (data:image/...;base64,...)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })
}

