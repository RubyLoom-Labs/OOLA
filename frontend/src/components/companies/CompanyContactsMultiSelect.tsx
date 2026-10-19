import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Users,
  ChevronDown,
  X,
  Search,
  Check,
  Loader2,
  Mail,
  Briefcase,
  AlertCircle,
} from 'lucide-react'
import { companiesApi, type CompanyContact } from '@/apis/companiesApi'

export interface CompanyContactsMultiSelectProps {
  companyId?: number | string | null
  value: number[]
  onChange: (selectedIds: number[], selectedContacts: CompanyContact[]) => void
  disabled?: boolean
  placeholder?: string
  label?: string
  required?: boolean
  error?: string | null
  initialContacts?: CompanyContact[]
}

export default function CompanyContactsMultiSelect({
  companyId,
  value = [],
  onChange,
  disabled = false,
  placeholder = 'Select company contacts...',
  label = 'Company Contact',
  required = false,
  error = null,
  initialContacts = [],
}: CompanyContactsMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [contacts, setContacts] = useState<CompanyContact[]>(initialContacts)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch contacts whenever companyId changes
  useEffect(() => {
    let isMounted = true

    if (!companyId) {
      setContacts([])
      setLoading(false)
      return
    }

    const loadContacts = async () => {
      setLoading(true)
      try {
        const res = await companiesApi.getCompanyContacts(companyId)
        if (isMounted) {
          const list = Array.isArray(res?.data) ? res.data : []
          setContacts(list)
        }
      } catch (err) {
        console.error('Failed to load company contacts:', err)
        if (isMounted) setContacts([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadContacts()

    return () => {
      isMounted = false
    }
  }, [companyId])

  // Close dropdown on outside click
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

  // Contact name formatter helper
  const getContactName = (c: CompanyContact) => {
    if (c.full_name?.trim()) return c.full_name.trim()
    if (c.name?.trim()) return c.name.trim()
    const firstLast = `${c.first_name || ''} ${c.last_name || ''}`.trim()
    if (firstLast) return firstLast
    return c.email || `Contact #${c.id}`
  }

  // Selected contacts objects
  const selectedContacts = useMemo(() => {
    return contacts.filter((c) => value.includes(c.id))
  }, [contacts, value])

  // Filtered contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts
    const q = searchQuery.toLowerCase()
    return contacts.filter((c) => {
      const name = getContactName(c).toLowerCase()
      const email = (c.email || '').toLowerCase()
      const desig = (c.designation || '').toLowerCase()
      return name.includes(q) || email.includes(q) || desig.includes(q)
    })
  }, [contacts, searchQuery])

  // Toggle selection for a single contact
  const handleToggle = (contactId: number) => {
    let nextIds: number[]
    if (value.includes(contactId)) {
      nextIds = value.filter((id) => id !== contactId)
    } else {
      nextIds = [...value, contactId]
    }
    const nextContacts = contacts.filter((c) => nextIds.includes(c.id))
    onChange(nextIds, nextContacts)
  }

  // Remove a single contact chip
  const handleRemoveOne = (e: React.MouseEvent, contactId: number) => {
    e.stopPropagation()
    const nextIds = value.filter((id) => id !== contactId)
    const nextContacts = contacts.filter((c) => nextIds.includes(c.id))
    onChange(nextIds, nextContacts)
  }

  // Clear all selections
  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([], [])
  }

  // Select all filtered contacts
  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    const allIds = Array.from(new Set([...value, ...filteredContacts.map((c) => c.id)]))
    const nextContacts = contacts.filter((c) => allIds.includes(c.id))
    onChange(allIds, nextContacts)
  }

  const isFieldDisabled = disabled || !companyId || loading

  return (
    <div className="form-group min-w-0" ref={containerRef}>
      {label && (
        <label className="form-label text-xs flex items-center justify-between">
          <span className="flex items-center gap-1">
            <span>{label}</span>
            {required && <span className="text-danger">*</span>}
          </span>
          {companyId && contacts.length > 0 && (
            <span className="text-[11px] font-normal text-slate-400">
              {contacts.length} available
            </span>
          )}
        </label>
      )}

      <div className="relative">
        {/* Trigger Box */}
        <div
          onClick={() => {
            if (!isFieldDisabled) setIsOpen(!isOpen)
          }}
          className={`form-input min-h-[34px] h-auto py-1 px-2.5 flex items-center justify-between gap-2 cursor-pointer transition-all ${
            isOpen ? 'border-primary-500 ring-1 ring-primary-500/20 bg-white' : 'bg-white'
          } ${isFieldDisabled ? 'opacity-70 cursor-not-allowed bg-slate-50' : 'hover:border-slate-300'} ${
            error ? 'input-error' : ''
          }`}
          style={{ minHeight: '34px' }}
        >
          <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0 py-0.5">
            {!companyId ? (
              <span className="text-xs text-slate-400 italic">
                Select a client organization first
              </span>
            ) : loading ? (
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin text-primary-500" />
                <span>Loading company contacts...</span>
              </span>
            ) : contacts.length === 0 ? (
              <span className="text-xs text-slate-400 italic">
                No contacts found for this company
              </span>
            ) : value.length === 0 ? (
              <span className="text-xs text-slate-400">{placeholder}</span>
            ) : (
              selectedContacts.map((contact) => (
                <span
                  key={contact.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200/80 shrink-0"
                >
                  <span className="truncate max-w-[140px]">{getContactName(contact)}</span>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveOne(e, contact.id)}
                    className="hover:bg-blue-100 rounded p-0.5 text-blue-500 hover:text-blue-700 transition-colors"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1 shrink-0 text-slate-400">
            {value.length > 0 && !isFieldDisabled && (
              <button
                type="button"
                onClick={handleClearAll}
                title="Clear all"
                className="hover:text-slate-600 p-0.5 rounded"
              >
                <X size={13} />
              </button>
            )}
            <ChevronDown
              size={14}
              className={`transition-transform duration-150 ${isOpen ? 'rotate-180 text-primary-500' : ''}`}
            />
          </div>
        </div>

        {/* Dropdown Menu */}
        {isOpen && !isFieldDisabled && (
          <div
            className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-fade-in text-xs max-h-64 flex flex-col"
            style={{ zIndex: 100 }}
          >
            {/* Search Input & Quick Actions */}
            <div className="p-2 border-b border-slate-100 space-y-1.5">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                <Search size={13} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-0 outline-none text-xs text-slate-800 placeholder-slate-400"
                  style={{ padding: 0 }}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600 flex-shrink-0 p-0.5"
                    title="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] px-1 text-slate-500">
                <span>
                  {value.length} of {contacts.length} selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Select All
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-slate-500 hover:text-slate-800"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Contacts Checkbox List */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-50 p-1">
              {filteredContacts.length === 0 ? (
                <div className="py-4 text-center text-slate-400 italic">
                  No matching contacts found
                </div>
              ) : (
                filteredContacts.map((contact) => {
                  const isChecked = value.includes(contact.id)
                  const name = getContactName(contact)

                  return (
                    <div
                      key={contact.id}
                      onClick={() => handleToggle(contact.id)}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                        isChecked ? 'bg-blue-50/70 text-blue-900 font-medium' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {/* Checkbox box */}
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check size={11} className="stroke-[3]" />}
                      </div>

                      {/* Contact Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-slate-900 truncate">
                            {name}
                          </span>
                          {contact.designation && (
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded truncate max-w-[120px]">
                              {contact.designation}
                            </span>
                          )}
                        </div>

                        {contact.email && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate mt-0.5">
                            <Mail size={10} className="shrink-0" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="field-error-msg mt-1">
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
