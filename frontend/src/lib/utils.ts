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

