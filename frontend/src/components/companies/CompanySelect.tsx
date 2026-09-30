import React, { useState, useEffect, useRef } from 'react'
import {
  Building2,
  Search,
  ChevronDown,
  X,
  Plus,
  Check,
  Loader2,
} from 'lucide-react'
import {
  companiesApi,
  type CompanyLookupItem,
} from '@/apis/companiesApi'
import CreateCompanyModal from './CreateCompanyModal'
import { capitalizeWords } from '@/lib/utils'

interface CompanySelectProps {
  value?: number | string // can be company_id (number) or company name (string)
  companyName?: string
  onChange: (companyId: number | undefined, company: CompanyLookupItem | null) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export default function CompanySelect({
  value,
  companyName,
  onChange,
  placeholder = 'Select or search company...',
  required = false,
  disabled = false,
  className = '',
}: CompanySelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [companies, setCompanies] = useState<CompanyLookupItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<CompanyLookupItem | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Fetch companies lookup
  const fetchCompanies = async (query: string = '') => {
    setLoading(true)
    try {
      const res = await companiesApi.getLookup({
        search: query.trim() || undefined,
        limit: 50,
      })
      if (res && Array.isArray(res.data)) {
        setCompanies(res.data)
      } else {
        setCompanies([])
      }
    } catch (err) {
      console.error('Failed to load companies lookup:', err)
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }

  // Load initial list on mount or when opening
  useEffect(() => {
    fetchCompanies('')
  }, [])

  // Sync selected company from props
  useEffect(() => {
    if (value && typeof value === 'number') {
      const match = companies.find((c) => c.id === value)
      if (match) {
        setSelectedCompany(match)
      } else if (companyName) {
        setSelectedCompany({
          id: value,
          company_name: companyName,
          company_code: '',
        })
      }
    } else if (companyName) {
      const match = companies.find(
        (c) => c.company_name.toLowerCase() === companyName.toLowerCase()
      )
      if (match) {
        setSelectedCompany(match)
      } else {
        setSelectedCompany({
          id: typeof value === 'number' ? value : 0,
          company_name: companyName,
          company_code: '',
        })
      }
    } else if (!value) {
      setSelectedCompany(null)
    }
  }, [value, companyName, companies])

  // Debounced search when query changes
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => {
      fetchCompanies(searchQuery)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery, isOpen])

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen])

  const handleToggle = () => {
    if (disabled) return
    const nextState = !isOpen
    setIsOpen(nextState)
    if (nextState) {
      setSearchQuery('')
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }

  const handleSelect = (comp: CompanyLookupItem) => {
    setSelectedCompany(comp)
    onChange(comp.id, comp)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedCompany(null)
    onChange(undefined, null)
  }

  const handleCompanyCreated = (newCompany: CompanyLookupItem) => {
    setCompanies((prev) => [newCompany, ...prev.filter((c) => c.id !== newCompany.id)])
    setSelectedCompany(newCompany)
    onChange(newCompany.id, newCompany)
    setIsCreateModalOpen(false)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Box */}
      <div
        onClick={handleToggle}
        className={`form-input flex items-center justify-between cursor-pointer select-none transition-all ${
          isOpen ? 'ring-2 ring-primary-500/20 border-primary-500' : ''
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'bg-white'}`}
        style={{
          minHeight: 38,
          padding: '6px 12px',
        }}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
          <Building2 size={15} className="text-gray-400 flex-shrink-0" />
          {selectedCompany ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-medium text-gray-900 text-sm truncate">
                {capitalizeWords(selectedCompany.company_name)}
              </span>
              {selectedCompany.company_code && (
                <span
                  style={{
                    fontSize: 11,
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: '#f1f5f9',
                    color: '#475569',
                    fontWeight: 600,
                  }}
                  className="flex-shrink-0"
                >
                  {selectedCompany.company_code}
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-400 text-sm">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedCompany && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              title="Clear selection"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={15}
            className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Hidden input for HTML form validation */}
      {required && (
        <input
          type="text"
          required
          tabIndex={-1}
          value={selectedCompany ? selectedCompany.id : ''}
          onChange={() => {}}
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
            bottom: 0,
            left: 10,
            height: 1,
            width: 1,
          }}
        />
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="dropdown-menu animate-fade-in shadow-xl"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1050,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: 6,
            maxHeight: 320,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search Box */}
          <div
            className="flex items-center gap-2 px-2.5 py-1.5 mb-1 rounded-md"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
          >
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search companies by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full text-gray-800 placeholder-gray-400"
              onClick={(e) => e.stopPropagation()}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* "+ Create New Company" Quick Action */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsCreateModalOpen(true)
            }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 mb-1 text-xs font-semibold text-primary-600 bg-primary-50/70 hover:bg-primary-50 rounded-md transition-colors border border-dashed border-primary-200"
          >
            <Plus size={13} />
            <span>Create New Company</span>
          </button>

          {/* Options List */}
          <div
            className="overflow-y-auto flex-1 space-y-0.5 custom-scrollbar"
            style={{ maxHeight: 210 }}
          >
            {loading ? (
              <div className="flex items-center justify-center py-6 text-gray-400 text-xs gap-2">
                <Loader2 size={14} className="animate-spin text-primary-500" />
                <span>Searching companies...</span>
              </div>
            ) : companies.length === 0 ? (
              <div className="py-5 text-center text-gray-400 text-xs">
                <p>No active companies found matching &ldquo;{searchQuery}&rdquo;</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsCreateModalOpen(true)
                  }}
                  className="mt-2 text-primary-600 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <Plus size={12} />
                  <span>Add as &ldquo;{searchQuery || 'New Company'}&rdquo;</span>
                </button>
              </div>
            ) : (
              companies.map((comp) => {
                const isSelected = selectedCompany?.id === comp.id
                return (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => handleSelect(comp)}
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between text-xs transition-colors ${
                      isSelected
                        ? 'bg-primary-50 text-primary-900 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2
                        size={13}
                        className={isSelected ? 'text-primary-600' : 'text-gray-400'}
                      />
                      <span className="truncate">{capitalizeWords(comp.company_name)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {comp.company_code && (
                        <span
                          style={{
                            fontSize: 10.5,
                            padding: '1px 5px',
                            borderRadius: 4,
                            background: isSelected ? '#dbeafe' : '#f1f5f9',
                            color: isSelected ? '#1d4ed8' : '#64748b',
                            fontWeight: 600,
                          }}
                        >
                          {comp.company_code}
                        </span>
                      )}
                      {isSelected && <Check size={14} className="text-primary-600" />}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Inline Create Company Modal */}
      <CreateCompanyModal
        isOpen={isCreateModalOpen}
        initialName={searchQuery}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCompanyCreated}
      />
    </div>
  )
}
