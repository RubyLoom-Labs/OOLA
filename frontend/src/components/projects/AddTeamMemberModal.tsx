import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Users,
  UserPlus,
  Search,
  X,
  Check,
  Loader2,
  AlertCircle,
  Save,
} from 'lucide-react'
import {
  usersApi,
  type ProjectUser,
  getUserRoleName,
} from '@/apis/usersApi'
import { getUserColor, getUserInitials } from '@/components/users/UserSelect'
import { capitalizeWords } from '@/lib/utils'

export interface AddTeamMemberModalProps {
  isOpen: boolean
  onClose: () => void
  existingUserIds: number[]
  existingUsers?: ProjectUser[]
  projectTitle: string
  projectCode: string
  onSave: (newlySelectedUserIds: number[], newlySelectedUsers: ProjectUser[]) => Promise<void> | void
}

export default function AddTeamMemberModal({
  isOpen,
  onClose,
  existingUserIds = [],
  projectTitle,
  projectCode,
  onSave,
}: AddTeamMemberModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [users, setUsers] = useState<ProjectUser[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Newly selected users to be added to the project
  const [selectedNewUserIds, setSelectedNewUserIds] = useState<number[]>([])
  const [selectedNewUsersMap, setSelectedNewUsersMap] = useState<Map<number, ProjectUser>>(
    new Map()
  )

  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Reset modal state when opened/closed
  useEffect(() => {
    if (isOpen) {
      setSelectedNewUserIds([])
      setSelectedNewUsersMap(new Map())
      setSearchQuery('')
      setDebouncedSearch('')
      setError(null)
      setPage(1)
      fetchUsers(1, '', true)
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    } else {
      setSelectedNewUserIds([])
      setSelectedNewUsersMap(new Map())
      setError(null)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !saving) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, saving, onClose])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Trigger search when debouncedSearch changes
  useEffect(() => {
    if (isOpen) {
      setPage(1)
      fetchUsers(1, debouncedSearch, true)
    }
  }, [debouncedSearch])

  // Fetch users from API (20 records per page, employees only)
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

        if (meta && typeof meta.current_page === 'number' && typeof meta.last_page === 'number') {
          setHasMore(meta.current_page < meta.last_page)
        } else {
          setHasMore(newUsers.length === 20)
        }
      } catch (err) {
        console.error('Failed to load users for project team assignment:', err)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    []
  )

  // Infinite scroll lazy loading inside users list
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

  // Toggle selection of a new user
  const handleToggleUser = (user: ProjectUser) => {
    if (existingUserIds.includes(user.id)) return

    const isSelected = selectedNewUserIds.includes(user.id)
    if (isSelected) {
      setSelectedNewUserIds((prev) => prev.filter((id) => id !== user.id))
      setSelectedNewUsersMap((prev) => {
        const next = new Map(prev)
        next.delete(user.id)
        return next
      })
    } else {
      setSelectedNewUserIds((prev) => [...prev, user.id])
      setSelectedNewUsersMap((prev) => new Map(prev).set(user.id, user))
    }
  }

  // Remove a newly selected user from selection
  const handleRemoveSelected = (userId: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSelectedNewUserIds((prev) => prev.filter((id) => id !== userId))
    setSelectedNewUsersMap((prev) => {
      const next = new Map(prev)
      next.delete(userId)
      return next
    })
  }

  // Handle Save
  const handleSave = async () => {
    if (selectedNewUserIds.length === 0) {
      setError('Please select at least one user to assign to this project.')
      return
    }

    setError(null)
    setSaving(true)

    try {
      const selectedUsersList = selectedNewUserIds.map(
        (id) => selectedNewUsersMap.get(id) || ({ id, name: `User #${id}` } as ProjectUser)
      )
      await onSave(selectedNewUserIds, selectedUsersList)
      onClose()
    } catch (err: any) {
      console.error('Failed to assign team members:', err)
      setError(err?.response?.data?.message || err?.message || 'Failed to assign team members.')
    } finally {
      setSaving(false)
    }
  }

  // Filter out already selected project members so ONLY other users are listed
  const otherUsers = users.filter((u) => !existingUserIds.includes(u.id))

  // List of selected new users to display
  const selectedNewUsersList: ProjectUser[] = selectedNewUserIds.map(
    (id) => selectedNewUsersMap.get(id) || ({ id, name: `User #${id}` } as ProjectUser)
  )

  if (!isOpen) return null

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
      style={{ zIndex: 1200 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) {
          onClose()
        }
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-xl overflow-hidden animate-scale-up flex flex-col"
        style={{ height: '640px', minHeight: '560px', maxHeight: '92vh' }}
      >
        {/* Modal Header */}
        <div className="p-4 pb-3 flex items-start justify-between border-b border-slate-100 bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Assign Team Members</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Add team members to{' '}
                <span className="font-semibold text-slate-700">{projectTitle}</span>{' '}
                <span className="font-mono text-[11px] text-blue-600 font-bold">
                  ({projectCode})
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
            onClick={onClose}
            disabled={saving}
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-3.5 overflow-y-auto flex-1 custom-scrollbar flex flex-col min-h-0">
          {/* User Selection Section: In-flow container with search and user list */}
          <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between shrink-0">
              <label className="block text-xs font-bold text-slate-800">
                Select Users to Assign <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {selectedNewUserIds.length} user{selectedNewUserIds.length === 1 ? '' : 's'} selected
              </span>
            </div>

            {/* In-flow Search & User List Box */}
            <div className="border border-slate-200/90 rounded-xl overflow-hidden flex flex-col flex-1 min-h-[220px] bg-white shadow-2xs">
              {/* Search Header */}
              <div className="p-2 border-b border-slate-100 bg-slate-50/70 shrink-0">
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
                  <Search size={14} className="text-slate-400 shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search available employee users by name, role, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-xs text-slate-800 placeholder-slate-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* List of OTHER users (excluding already assigned) */}
              <div
                ref={listRef}
                onScroll={handleScroll}
                className="overflow-y-auto flex-1 p-1.5 space-y-1 custom-scrollbar min-h-0"
              >
                {loading ? (
                  <div className="flex items-center justify-center py-10 text-slate-400 text-xs gap-2">
                    <Loader2 size={16} className="animate-spin text-blue-600" />
                    <span>Loading available employee users...</span>
                  </div>
                ) : otherUsers.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-xs space-y-1.5">
                    <Users size={24} className="mx-auto text-slate-300" />
                    {searchQuery ? (
                      <p>No available employee users found matching &ldquo;{searchQuery}&rdquo;</p>
                    ) : (
                      <p className="font-medium text-slate-500">
                        All active employee users are already assigned to this project.
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {otherUsers.map((u) => {
                      const isSelected = selectedNewUserIds.includes(u.id)
                      const roleName = getUserRoleName(u)
                      const empCode = u.employee?.employee_code

                      return (
                        <div
                          key={u.id}
                          onClick={() => handleToggleUser(u)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-all border ${isSelected
                              ? 'bg-blue-50/80 border-blue-200 text-blue-900 shadow-2xs font-medium'
                              : 'bg-white border-transparent text-slate-700 hover:bg-slate-50 hover:border-slate-200'
                            }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                              />
                            ) : (
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs ${getUserColor(
                                  u.id
                                )}`}
                              >
                                {getUserInitials(u.name)}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 truncate text-xs">
                                  {capitalizeWords(u.name)}
                                </span>
                                {empCode && (
                                  <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium shrink-0">
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

                          <div className="shrink-0 ml-3">
                            <div
                              className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${isSelected
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                                  : 'border-slate-300 bg-white hover:border-blue-400'
                                }`}
                            >
                              {isSelected && <Check size={13} strokeWidth={3} />}
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Loading more indicator */}
                    {loadingMore && (
                      <div className="flex items-center justify-center py-2 text-slate-400 text-xs gap-1.5">
                        <Loader2 size={13} className="animate-spin text-blue-600" />
                        <span>Loading next users...</span>
                      </div>
                    )}

                    {!hasMore && otherUsers.length >= 20 && (
                      <div className="py-2 text-center text-[11px] text-slate-400 border-t border-slate-100">
                        All available users loaded
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Selected New Members To Add Chips Box */}
          {selectedNewUsersList.length > 0 && (
            <div className="bg-blue-50/70 rounded-xl border border-blue-200/90 p-3 space-y-2 shrink-0 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-blue-900 font-medium">
                <span className="font-semibold flex items-center gap-1.5">
                  <UserPlus size={13} className="text-blue-600" />
                  Selected to Add ({selectedNewUsersList.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNewUserIds([])
                    setSelectedNewUsersMap(new Map())
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium"
                >
                  Clear all
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                {selectedNewUsersList.map((u) => (
                  <span
                    key={u.id}
                    className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg bg-white border border-blue-200 text-slate-800 text-xs font-semibold shadow-2xs"
                  >
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${getUserColor(
                        u.id
                      )}`}
                    >
                      {getUserInitials(u.name)}
                    </span>
                    <span className="truncate max-w-[130px]">{capitalizeWords(u.name)}</span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveSelected(u.id, e)}
                      className="w-4 h-4 rounded-full hover:bg-slate-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors ml-0.5"
                      title="Remove"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-2 shrink-0">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">

          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-2xs"
              onClick={handleSave}
              disabled={saving || selectedNewUserIds.length === 0}
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              <span>
                {selectedNewUserIds.length > 0
                  ? `Assign ${selectedNewUserIds.length} Member${selectedNewUserIds.length === 1 ? '' : 's'
                  }`
                  : 'Assign Members'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}
