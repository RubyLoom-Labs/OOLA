import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Users,
  Search,
  ChevronDown,
  X,
  Check,
  Loader2,
  UserPlus,
  UserCheck,
} from 'lucide-react'
import {
  usersApi,
  type ProjectUser,
  getUserRoleName,
} from '@/apis/usersApi'
import { getUserColor, getUserInitials } from '@/components/users/UserSelect'

interface TeamMembersAllocationProps {
  selectedUserIds: number[]
  onChange: (userIds: number[], users: ProjectUser[]) => void
  initialUsers?: ProjectUser[]
  disabled?: boolean
  className?: string
}

export default function TeamMembersAllocation({
  selectedUserIds = [],
  onChange,
  initialUsers = [],
  disabled = false,
  className = '',
}: TeamMembersAllocationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [users, setUsers] = useState<ProjectUser[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  // Map of allocated users to display full details
  const [allocatedUsersMap, setAllocatedUsersMap] = useState<Map<number, ProjectUser>>(() => {
    const map = new Map<number, ProjectUser>()
    initialUsers.forEach((u) => {
      if (u?.id) map.set(u.id, u)
    })
    return map
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Sync initialUsers into map when changed
  useEffect(() => {
    if (initialUsers && initialUsers.length > 0) {
      setAllocatedUsersMap((prev) => {
        const next = new Map(prev)
        initialUsers.forEach((u) => {
          if (u?.id) next.set(u.id, u)
        })
        return next
      })
    }
  }, [initialUsers])

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
          status: 'Active',
          is_employee: true,
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

        // Also add loaded users to allocatedUsersMap cache if they are selected
        setAllocatedUsersMap((prev) => {
          const next = new Map(prev)
          newUsers.forEach((u) => {
            if (selectedUserIds.includes(u.id) && !next.has(u.id)) {
              next.set(u.id, u)
            }
          })
          return next
        })

        if (meta && typeof meta.current_page === 'number' && typeof meta.last_page === 'number') {
          setHasMore(meta.current_page < meta.last_page)
        } else {
          setHasMore(newUsers.length === 20)
        }
      } catch (err) {
        console.error('Failed to load users for team allocation:', err)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [selectedUserIds]
  )

  // Trigger search or initial load when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setPage(1)
      fetchUsers(1, debouncedSearch, true)
    }
  }, [isOpen, debouncedSearch, fetchUsers])

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

  // Infinite scroll lazy loading
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

  // Toggle user allocation
  const handleToggleUser = (user: ProjectUser) => {
    const isAllocated = selectedUserIds.includes(user.id)
    let newIds: number[]

    if (isAllocated) {
      newIds = selectedUserIds.filter((id) => id !== user.id)
    } else {
      newIds = [...selectedUserIds, user.id]
      setAllocatedUsersMap((prev) => new Map(prev).set(user.id, user))
    }

    const updatedUserList = newIds.map((id) => {
      return (
        allocatedUsersMap.get(id) ||
        users.find((u) => u.id === id) ||
        ({ id, name: `User #${id}`, email: '', status: 'Active' } as ProjectUser)
      )
    })

    onChange(newIds, updatedUserList)
  }

  // Remove member directly from allocated list
  const handleRemoveMember = (userId: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const newIds = selectedUserIds.filter((id) => id !== userId)
    const updatedUserList = newIds.map((id) => {
      return (
        allocatedUsersMap.get(id) ||
        users.find((u) => u.id === id) ||
        ({ id, name: `User #${id}`, email: '', status: 'Active' } as ProjectUser)
      )
    })
    onChange(newIds, updatedUserList)
  }

  // Get array of allocated users to render
  const allocatedList: ProjectUser[] = selectedUserIds.map((id) => {
    return (
      allocatedUsersMap.get(id) ||
      users.find((u) => u.id === id) ||
      ({ id, name: `User #${id}`, email: '', status: 'Active' } as ProjectUser)
    )
  })

  return (
    <div className={`space-y-3 ${className}`} ref={containerRef}>
      {/* Search & Add User Dropdown Trigger */}
      <div className="relative">
        <div
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={`form-input form-input-sm flex items-center justify-between cursor-pointer transition-all bg-white hover:border-blue-400 ${
            disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''
          }`}
          style={{ minHeight: '34px', padding: '4px 10px' }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 text-slate-500 text-xs">
            <UserPlus size={14} className="text-blue-600 shrink-0" />
            <span className="truncate">
              {isOpen ? 'Select user to add to team...' : 'Click to search & add team member...'}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              {selectedUserIds.length} Allocated
            </span>
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col animate-fade-in"
            style={{ maxHeight: 310 }}
          >
            {/* Search Input */}
            <div className="p-2 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
                <Search size={13} className="text-slate-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search users to allocate (20 per page, scroll for more)..."
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

            {/* User List with Infinite Scroll (20 users per page) */}
            <div
              ref={listRef}
              onScroll={handleScroll}
              className="overflow-y-auto flex-1 p-1 space-y-0.5 custom-scrollbar"
              style={{ maxHeight: 220 }}
            >
              {loading ? (
                <div className="flex items-center justify-center py-6 text-slate-400 text-xs gap-2">
                  <Loader2 size={14} className="animate-spin text-blue-600" />
                  <span>Loading team users...</span>
                </div>
              ) : users.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs space-y-1">
                  <Users size={20} className="mx-auto text-slate-300" />
                  <p>No users found matching &ldquo;{searchQuery}&rdquo;</p>
                </div>
              ) : (
                <>
                  {users.map((u) => {
                    const isAllocated = selectedUserIds.includes(u.id)
                    const roleName = getUserRoleName(u)
                    const empCode = u.employee?.employee_code

                    return (
                      <div
                        key={u.id}
                        onClick={() => handleToggleUser(u)}
                        className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          isAllocated
                            ? 'bg-blue-50 text-blue-900 font-medium'
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
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                              isAllocated
                                ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                                : 'border-slate-300 bg-white hover:border-blue-400'
                            }`}
                          >
                            {isAllocated && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Loading Next 20 records indicator */}
                  {loadingMore && (
                    <div className="flex items-center justify-center py-2 text-slate-400 text-xs gap-1.5">
                      <Loader2 size={13} className="animate-spin text-blue-600" />
                      <span>Loading next 20 records...</span>
                    </div>
                  )}

                  {/* End of list */}
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

      {/* Allocated Team Members List Section */}
      <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-2.5 space-y-2">
        <div className="flex items-center justify-between text-xs px-1 text-slate-600 font-medium">
          <span className="flex items-center gap-1.5">
            <Users size={13} className="text-blue-600" />
            <span>Allocated Members ({allocatedList.length})</span>
          </span>
          {allocatedList.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([], [])}
              className="text-[11px] text-red-500 hover:text-red-700 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>

        {allocatedList.length === 0 ? (
          <div className="py-4 px-3 text-center rounded-lg border border-dashed border-slate-200 bg-white text-xs text-slate-400 space-y-1">
            <UserCheck size={18} className="mx-auto text-slate-300" />
            <p>No team members allocated yet.</p>
            <p className="text-[11px] text-slate-400">
              Use the dropdown above to search and allocate developers or engineers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto custom-scrollbar pr-0.5">
            {allocatedList.map((member) => {
              const roleName = getUserRoleName(member)
              const empCode = member.employee?.employee_code

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all text-xs group"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-6 h-6 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getUserColor(
                          member.id
                        )}`}
                      >
                        {getUserInitials(member.name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-800 truncate leading-tight">
                        {member.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 truncate mt-0.5">
                        {roleName && <span className="text-blue-600 font-medium truncate">{roleName}</span>}
                        {roleName && empCode && <span>•</span>}
                        {empCode && <span className="font-mono text-slate-400">{empCode}</span>}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleRemoveMember(member.id, e)}
                    className="p-1 rounded text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                    title={`Remove ${member.name}`}
                  >
                    <X size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
