import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  User as UserIcon,
  Search,
  ChevronDown,
  X,
  Check,
  Loader2,
} from 'lucide-react'
import {
  usersApi,
  type ProjectUser,
  getUserRoleName,
} from '@/apis/usersApi'

interface UserSelectProps {
  id?: string
  value?: number | '' | null
  initialUser?: ProjectUser | null
  onChange: (userId: number | '', user: ProjectUser | null) => void
  placeholder?: string
  label?: string
  required?: boolean
  disabled?: boolean
  className?: string
  error?: string | null
  status?: string
}

const AVATAR_COLORS = [
  'bg-blue-500 text-white',
  'bg-indigo-500 text-white',
  'bg-emerald-500 text-white',
  'bg-purple-500 text-white',
  'bg-amber-500 text-white',
  'bg-rose-500 text-white',
  'bg-cyan-500 text-white',
  'bg-teal-500 text-white',
]

export function getUserColor(id?: number | string): string {
  const num = typeof id === 'number' ? id : typeof id === 'string' ? id.charCodeAt(0) || 0 : 0
  return AVATAR_COLORS[num % AVATAR_COLORS.length]
}

export function getUserInitials(name?: string): string {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export default function UserSelect({
  id,
  value,
  initialUser,
  onChange,
  placeholder = 'Select User...',
  label,
  required = false,
  disabled = false,
  className = '',
  error = null,
  status = 'Active',
}: UserSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [users, setUsers] = useState<ProjectUser[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedUser, setSelectedUser] = useState<ProjectUser | null>(initialUser || null)

  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch users from API (20 records per page)
  const fetchUsers = useCallback(
    async (pageNumber: number, search: string, isInitialOrSearch: boolean) => {
      if (isInitialOrSearch) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      try {
        const res = await usersApi.getUsers({
          page: pageNumber,
          per_page: 20,
          search: search.trim() || undefined,
          status,
        })

        const newUsers = Array.isArray(res.data) ? res.data : []
        const meta = res.meta

        setUsers((prev) => {
          if (pageNumber === 1) {
            return newUsers
          }
          const existingIds = new Set(prev.map((u) => u.id))
          const filtered = newUsers.filter((u) => !existingIds.has(u.id))
          return [...prev, ...filtered]
        })

        if (meta && typeof meta.current_page === 'number' && typeof meta.last_page === 'number') {
          setHasMore(meta.current_page < meta.last_page)
        } else {
          setHasMore(newUsers.length === 20)
        }
      } catch (err) {
        console.error('Failed to fetch users:', err)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [status]
  )

  // Trigger search or initial load
  useEffect(() => {
    if (isOpen) {
      setPage(1)
      fetchUsers(1, debouncedSearch, true)
    }
  }, [isOpen, debouncedSearch, fetchUsers])

  // Sync selected user when value changes or when initialUser is passed
  useEffect(() => {
    if (value && typeof value === 'number') {
      const match = users.find((u) => u.id === value)
      if (match) {
        setSelectedUser(match)
      } else if (initialUser && initialUser.id === value) {
        setSelectedUser(initialUser)
      } else if (!selectedUser || selectedUser.id !== value) {
        // Fetch specific user if not in current loaded batch
        usersApi.getUser(value).then((res) => {
          if (res?.data) {
            setSelectedUser(res.data)
          }
        })
      }
    } else {
      setSelectedUser(null)
    }
  }, [value, users, initialUser])

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

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    } else {
      setSearchQuery('')
      setDebouncedSearch('')
    }
  }, [isOpen])

  // Handle infinite scroll lazy loading
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop - clientHeight < 40) {
      if (!loading && !loadingMore && hasMore) {
        const nextPage = page + 1
        setPage(nextPage)
        fetchUsers(nextPage, debouncedSearch, false)
      }
    }
  }

  const handleSelect = (user: ProjectUser) => {
    setSelectedUser(user)
    onChange(user.id, user)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedUser(null)
    onChange('', null)
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="form-label text-xs mb-1 block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <div
        id={id}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`form-input form-input-sm flex items-center justify-between cursor-pointer transition-all ${
          disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : 'bg-white hover:border-blue-400'
        } ${error ? 'border-red-400 focus:border-red-500 ring-1 ring-red-200' : ''}`}
        style={{ minHeight: '34px', padding: '4px 8px' }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedUser ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {selectedUser.avatar ? (
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                />
              ) : (
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getUserColor(
                    selectedUser.id
                  )}`}
                >
                  {getUserInitials(selectedUser.name)}
                </div>
              )}
              <span className="text-xs font-medium text-slate-800 truncate">
                {selectedUser.name}
              </span>
              {getUserRoleName(selectedUser) && (
                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 font-normal">
                  {getUserRoleName(selectedUser)}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-400 truncate flex items-center gap-1.5">
              <UserIcon size={13} className="text-slate-400 shrink-0" />
              <span>{placeholder}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {selectedUser && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
              title="Clear selection"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {error && <p className="text-[11px] text-red-500 mt-0.5">{error}</p>}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col animate-fade-in"
          style={{ maxHeight: 300 }}
        >
          {/* Search Bar */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
              <Search size={13} className="text-slate-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search users by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-xs text-slate-800 placeholder-slate-400"
                onClick={(e) => e.stopPropagation()}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* User List with Infinite Scroll (20 items per page) */}
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="overflow-y-auto flex-1 p-1 space-y-0.5 custom-scrollbar"
            style={{ maxHeight: 220 }}
          >
            {loading ? (
              <div className="flex items-center justify-center py-6 text-slate-400 text-xs gap-2">
                <Loader2 size={14} className="animate-spin text-blue-600" />
                <span>Loading users...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs space-y-1">
                <UserIcon size={20} className="mx-auto text-slate-300" />
                <p>No users found matching &ldquo;{searchQuery}&rdquo;</p>
              </div>
            ) : (
              <>
                {users.map((u) => {
                  const isSelected = selectedUser?.id === u.id
                  const roleName = getUserRoleName(u)
                  const empCode = u.employee?.employee_code

                  return (
                    <div
                      key={u.id}
                      onClick={() => handleSelect(u)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/80 text-blue-900 font-medium'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getUserColor(
                              u.id
                            )}`}
                          >
                            {getUserInitials(u.name)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800 truncate">{u.name}</span>
                            {empCode && (
                              <span className="font-mono text-[10px] text-slate-400 shrink-0">
                                {empCode}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 truncate">
                            {roleName && (
                              <span className="text-slate-600 font-medium shrink-0">
                                {roleName}
                              </span>
                            )}
                            {roleName && u.email && <span>•</span>}
                            {u.email && <span className="truncate">{u.email}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Loading More Spinner on Scroll */}
                {loadingMore && (
                  <div className="flex items-center justify-center py-2 text-slate-400 text-xs gap-1.5">
                    <Loader2 size={13} className="animate-spin text-blue-600" />
                    <span>Loading next 20 records...</span>
                  </div>
                )}

                {/* All Loaded Indicator */}
                {!hasMore && users.length >= 20 && (
                  <div className="py-2 text-center text-[11px] text-slate-400 border-t border-slate-100">
                    All {users.length} users loaded
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
