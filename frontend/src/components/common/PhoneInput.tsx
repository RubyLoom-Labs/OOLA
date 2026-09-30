import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, Check, AlertCircle } from 'lucide-react'

export interface CountryDialCode {
  code: string       // e.g. "+94"
  iso: string        // e.g. "lk"  ← lowercase for flag-icons
  isoUpper: string   // e.g. "LK"
  name: string       // e.g. "Sri Lanka"
  pattern: RegExp
  placeholder: string
  maxLen: number
}

export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { code: '+94',  iso: 'lk', isoUpper: 'LK', name: 'Sri Lanka',              pattern: /^\d{9}$/,       placeholder: '77 987 6543',   maxLen: 10 },
  { code: '+1',   iso: 'us', isoUpper: 'US', name: 'United States',          pattern: /^\d{10}$/,      placeholder: '415 555 0123',  maxLen: 10 },
  { code: '+44',  iso: 'gb', isoUpper: 'GB', name: 'United Kingdom',         pattern: /^\d{10}$/,      placeholder: '20 7946 0958',  maxLen: 11 },
  { code: '+61',  iso: 'au', isoUpper: 'AU', name: 'Australia',              pattern: /^\d{9}$/,       placeholder: '4 1234 5678',   maxLen: 10 },
  { code: '+971', iso: 'ae', isoUpper: 'AE', name: 'United Arab Emirates',   pattern: /^\d{9}$/,       placeholder: '50 123 4567',   maxLen: 9  },
  { code: '+65',  iso: 'sg', isoUpper: 'SG', name: 'Singapore',              pattern: /^\d{8}$/,       placeholder: '8123 4567',     maxLen: 8  },
  { code: '+49',  iso: 'de', isoUpper: 'DE', name: 'Germany',                pattern: /^\d{10,11}$/,   placeholder: '30 123 45678',  maxLen: 12 },
  { code: '+91',  iso: 'in', isoUpper: 'IN', name: 'India',                  pattern: /^\d{10}$/,      placeholder: '98765 43210',   maxLen: 10 },
  { code: '+33',  iso: 'fr', isoUpper: 'FR', name: 'France',                 pattern: /^\d{9}$/,       placeholder: '6 12 34 56 78', maxLen: 10 },
  { code: '+81',  iso: 'jp', isoUpper: 'JP', name: 'Japan',                  pattern: /^\d{10,11}$/,   placeholder: '90 1234 5678',  maxLen: 11 },
  { code: '+86',  iso: 'cn', isoUpper: 'CN', name: 'China',                  pattern: /^\d{11}$/,      placeholder: '131 2345 6789', maxLen: 11 },
  { code: '+60',  iso: 'my', isoUpper: 'MY', name: 'Malaysia',               pattern: /^\d{9,10}$/,    placeholder: '12 3456789',    maxLen: 10 },
  { code: '+63',  iso: 'ph', isoUpper: 'PH', name: 'Philippines',            pattern: /^\d{10}$/,      placeholder: '917 123 4567',  maxLen: 10 },
  { code: '+66',  iso: 'th', isoUpper: 'TH', name: 'Thailand',               pattern: /^\d{9}$/,       placeholder: '81 234 5678',   maxLen: 9  },
  { code: '+92',  iso: 'pk', isoUpper: 'PK', name: 'Pakistan',               pattern: /^\d{10}$/,      placeholder: '301 234 5678',  maxLen: 10 },
  { code: '+880', iso: 'bd', isoUpper: 'BD', name: 'Bangladesh',             pattern: /^\d{10}$/,      placeholder: '171 234 5678',  maxLen: 10 },
  { code: '+966', iso: 'sa', isoUpper: 'SA', name: 'Saudi Arabia',           pattern: /^\d{9}$/,       placeholder: '50 123 4567',   maxLen: 9  },
  { code: '+20',  iso: 'eg', isoUpper: 'EG', name: 'Egypt',                  pattern: /^\d{10}$/,      placeholder: '10 1234 5678',  maxLen: 10 },
  { code: '+1',   iso: 'ca', isoUpper: 'CA', name: 'Canada',                 pattern: /^\d{10}$/,      placeholder: '604 555 0123',  maxLen: 10 },
  { code: '+64',  iso: 'nz', isoUpper: 'NZ', name: 'New Zealand',            pattern: /^\d{9}$/,       placeholder: '21 123 4567',   maxLen: 9  },
]

// Deduplicate by code+iso (e.g. Canada vs US both use +1)
const UNIQUE_COUNTRIES = COUNTRY_DIAL_CODES.filter(
  (c, i, arr) => arr.findIndex((x) => x.iso === c.iso) === i
)

export function getDialCode(code: string): CountryDialCode {
  return COUNTRY_DIAL_CODES.find((c) => c.code === code) ?? COUNTRY_DIAL_CODES[0]
}

export function validatePhone(rawNumber: string, dialCode: string): string | null {
  const nums = rawNumber.replace(/[\s\-().]/g, '')
  if (!nums) return 'Phone number is required'
  const country = getDialCode(dialCode)
  if (!country.pattern.test(nums)) {
    return `Invalid ${country.name} number — e.g. ${country.placeholder}`
  }
  return null
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email address is required'
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(email.trim())) return 'Enter a valid email (e.g. name@company.com)'
  return null
}

// Renders a flag image using flag-icons library (proper SVG sprites, works on Windows)
function FlagIcon({ iso, size = 20 }: { iso: string; size?: number }) {
  return (
    <span
      className={`fi fi-${iso.toLowerCase()}`}
      style={{
        width: size,
        height: size * 0.75,
        borderRadius: 3,
        display: 'inline-block',
        backgroundSize: 'cover',
        flexShrink: 0,
        boxShadow: '0 0 0 1px rgba(0,0,0,0.08)',
      }}
    />
  )
}

interface PhoneInputProps {
  dialCode: string
  number: string
  onDialCodeChange: (code: string) => void
  onNumberChange: (number: string) => void
  onBlur?: () => void
  required?: boolean
  disabled?: boolean
  size?: 'sm' | 'md'
  showError?: boolean
  error?: string | null
}

export default function PhoneInput({
  dialCode,
  number,
  onDialCodeChange,
  onNumberChange,
  onBlur,
  required = false,
  disabled = false,
  size = 'md',
  showError = false,
  error = null,
}: PhoneInputProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selected = getDialCode(dialCode)
  const isSm = size === 'sm'
  const hasError = showError && error

  const filtered = search.trim()
    ? UNIQUE_COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.includes(search) ||
          c.isoUpper.toLowerCase().includes(search.toLowerCase())
      )
    : UNIQUE_COUNTRIES

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
        setSearch('')
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  const toggle = () => {
    if (disabled) return
    setDropdownOpen((p) => !p)
    if (!dropdownOpen) {
      setSearch('')
      setTimeout(() => searchRef.current?.focus(), 60)
    }
  }

  const select = (c: CountryDialCode) => {
    onDialCodeChange(c.code)
    setDropdownOpen(false)
    setSearch('')
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onNumberChange(e.target.value.replace(/[^0-9\s\-().]/g, ''))
  }

  const btnHeight = isSm ? 34 : 40

  return (
    <div
      className={`pi-wrapper${isSm ? ' pi-sm' : ''}`}
      ref={wrapperRef}
      style={{ position: 'relative', display: 'flex', gap: 0 }}
    >
      {/* ── Dial Code Trigger Button ── */}
      <button
        type="button"
        disabled={disabled}
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={dropdownOpen}
        className={`pi-trigger${hasError ? ' pi-trigger-err' : ''}${dropdownOpen ? ' pi-trigger-open' : ''}`}
        style={{ height: btnHeight }}
      >
        <FlagIcon iso={selected.iso} size={isSm ? 16 : 20} />
        <span className="pi-code">{selected.code}</span>
        <ChevronDown
          size={12}
          className="pi-chevron"
          style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* ── Number Input ── */}
      <input
        type="tel"
        required={required}
        disabled={disabled}
        placeholder={selected.placeholder}
        value={number}
        onChange={handleNumberChange}
        onBlur={onBlur}
        maxLength={selected.maxLen + 4}
        autoComplete="tel-national"
        className={`pi-number-input${hasError ? ' pi-number-err' : ''}${isSm ? ' pi-number-sm' : ''}`}
        style={{ height: btnHeight }}
      />

      {/* ── Country Dropdown ── */}
      {dropdownOpen && (
        <div className="pi-dropdown" role="listbox">
          <div className="pi-search-row">
            <Search size={13} className="pi-search-icon" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search country or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="pi-search-input"
            />
          </div>
          <div className="pi-list">
            {filtered.length === 0 ? (
              <div className="pi-empty">No countries found</div>
            ) : (
              filtered.map((c) => {
                const isSelected = dialCode === c.code && selected.iso === c.iso
                return (
                  <button
                    key={c.iso}
                    type="button"
                    className={`pi-option${isSelected ? ' pi-option-active' : ''}`}
                    onClick={() => select(c)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <FlagIcon iso={c.iso} size={18} />
                    <span className="pi-opt-name">{c.name}</span>
                    <span className="pi-opt-code">{c.code}</span>
                    {isSelected && <Check size={12} className="pi-opt-check" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ── Inline Error ── */}
      {hasError && (
        <div className="pi-error" role="alert">
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
