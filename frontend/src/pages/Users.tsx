import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Users as UsersIcon,
  Plus,
  Search,
  LayoutGrid,
  List,
  CheckCircle,
  Clock,
  IdCard,
  Shield,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import StatCard from '@/components/common/StatCard'
import Breadcrumb from '@/components/ui/Breadcrumb'
import DataTable, { type Column } from '@/components/common/DataTable'
import ActionDropdown from '@/components/common/ActionDropdown'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import {
  usersApi,
  type ProjectUser,
  type UserRole,
  type GetUsersParams,
  type CreateUserPayload,
  type UpdateUserPayload,
  getUserRoleName,
} from '@/apis/usersApi'
import { getUserColor, getUserInitials } from '@/components/users/UserSelect'
import UserViewDrawer from '@/components/users/UserViewDrawer'
import UserFormDrawer from '@/components/users/UserFormDrawer'

interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  active_count?: number
  inactive_count?: number
  employee_count?: number
}

export default function Users() {
  const [users, setUsers] = useState<ProjectUser[]>([])
  const [roles, setRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [employeeFilter, setEmployeeFilter] = useState<'all' | 'employee' | 'system'>('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Pagination state (default 20 matching GET /api/v1/users?page=1&per_page=20)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
    active_count: 0,
    inactive_count: 0,
    employee_count: 0,
  })

  // Drawer / Modal states
  const [viewingUser, setViewingUser] = useState<ProjectUser | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  const [editingUser, setEditingUser] = useState<ProjectUser | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Confirmation Modal state
  const [userToDelete, setUserToDelete] = useState<ProjectUser | null>(null)

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Load roles once on mount
  useEffect(() => {
    usersApi
      .getRoles()
      .then((r) => setRoles(r))
      .catch((err) => console.warn('Failed to load roles list:', err))
  }, [])

  // Debounce search input
  useEffect(() => {
    if (searchQuery === debouncedSearch) return
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, debouncedSearch])

  // Fetch Users from GET /api/v1/users?page=1&per_page=20
  const fetchUsersList = useCallback(async () => {
    setLoading(true)
    try {
      const params: GetUsersParams = {
        page: currentPage,
        per_page: perPage,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        role_id: roleFilter === 'all' ? undefined : Number(roleFilter),
        is_employee:
          employeeFilter === 'employee'
            ? true
            : employeeFilter === 'system'
            ? false
            : undefined,
      }

      const res = await usersApi.getUsers(params)
      const dataList: ProjectUser[] = Array.isArray(res.data) ? res.data : []
      setUsers(dataList)

      // Calculate or extract meta counts
      const activeCount = dataList.filter((u) => u.status?.toLowerCase() === 'active').length
      const inactiveCount = dataList.filter((u) => u.status?.toLowerCase() === 'inactive').length
      const empCount = dataList.filter((u) => u.is_employee).length

      if (res.meta) {
        setMeta({
          current_page: res.meta.current_page || currentPage,
          last_page: res.meta.last_page || 1,
          per_page: res.meta.per_page || perPage,
          total: res.meta.total ?? dataList.length,
          active_count: res.meta.active_count ?? activeCount,
          inactive_count: res.meta.inactive_count ?? inactiveCount,
          employee_count: res.meta.employee_count ?? empCount,
        })
      } else {
        setMeta({
          current_page: currentPage,
          last_page: 1,
          per_page: perPage,
          total: dataList.length,
          active_count: activeCount,
          inactive_count: inactiveCount,
          employee_count: empCount,
        })
      }
    } catch (err) {
      console.error('Error fetching users from API:', err)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [currentPage, perPage, debouncedSearch, statusFilter, roleFilter, employeeFilter])

  useEffect(() => {
    fetchUsersList()
  }, [fetchUsersList])

  // Multi-selection Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(users.map((u) => u.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Open Create Drawer
  const handleOpenCreate = () => {
    setEditingUser(null)
    setIsFormOpen(true)
  }

  // Open Edit Drawer
  const handleOpenEdit = (user: ProjectUser) => {
    setEditingUser(user)
    setIsViewOpen(false)
    setIsFormOpen(true)
  }

  // Open View Drawer
  const handleOpenView = (user: ProjectUser) => {
    setViewingUser(user)
    setIsViewOpen(true)
  }

  // Handle Form Submit (Create or Update)
  const handleFormSubmit = async (
    payload: CreateUserPayload | UpdateUserPayload,
    isEdit: boolean
  ) => {
    if (isEdit && editingUser) {
      await usersApi.updateUser(editingUser.id, payload as UpdateUserPayload)
      showToast(`User "${payload.name || editingUser.name}" updated successfully.`)
    } else {
      await usersApi.createUser(payload as CreateUserPayload)
      showToast(`User "${payload.name}" created successfully.`)
    }
    fetchUsersList()
  }

  // Handle Delete Confirmation
  const handleDeleteClick = (userOrId: ProjectUser | number) => {
    const target =
      typeof userOrId === 'number'
        ? users.find((u) => u.id === userOrId) || viewingUser
        : userOrId
    if (target) {
      setUserToDelete(target)
      setIsViewOpen(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return
    const id = userToDelete.id
    const userName = userToDelete.name
    try {
      await usersApi.deleteUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
      showToast(`User "${userName}" deleted successfully.`)
      setUserToDelete(null)
      fetchUsersList()
    } catch (err: any) {
      console.error('Failed to delete user:', err)
      showToast(err?.response?.data?.message || err?.message || 'Failed to delete user.')
    }
  }

  // Table Columns Definition matching Contacts table
  const userColumns: Column<ProjectUser>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'User',
        sortable: true,
        render: (_val, user) => {
          return (
            <div className="flex items-center gap-3">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-9 h-9 rounded-xl object-cover shrink-0 ring-1 ring-slate-100"
                />
              ) : (
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ring-1 ring-white ${getUserColor(
                    user.id
                  )}`}
                >
                  {getUserInitials(user.name)}
                </div>
              )}
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                  {user.name}
                </div>
                <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
              </div>
            </div>
          )
        },
      },
      {
        key: 'role',
        header: 'Role',
        sortable: true,
        render: (_val, user) => {
          const roleName = getUserRoleName(user) || 'User'
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              <Shield size={12} className="shrink-0" />
              <span>{roleName}</span>
            </span>
          )
        },
      },
      {
        key: 'employee',
        header: 'Employee Link',
        render: (_val, user) => {
          if (user.is_employee && user.employee) {
            return (
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  <IdCard size={11} className="shrink-0" />
                  <span>{user.employee.employee_code || `EMP-${user.employee.id}`}</span>
                </span>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                  {user.employee.designation?.title || user.employee.department?.name || 'Linked'}
                </div>
              </div>
            )
          }
          return (
            <span className="text-xs text-slate-400 font-medium italic">
              Standalone User
            </span>
          )
        },
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (status) => {
          const s = String(status || 'Active').toLowerCase()
          return (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                s === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {s === 'active' ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              )}
              {status || 'Active'}
            </span>
          )
        },
      },
      {
        key: 'created_at',
        header: 'Joined Date',
        sortable: true,
        render: (date) => {
          if (!date) return <span className="text-slate-400 text-xs">—</span>
          return (
            <span className="text-xs text-slate-600">
              {new Date(date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          )
        },
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (_val, user) => (
          <div onClick={(e) => e.stopPropagation()}>
            <ActionDropdown
              items={[
                {
                  label: 'View Details',
                  icon: <Eye size={14} />,
                  onClick: () => handleOpenView(user),
                },
                {
                  label: 'Edit User',
                  icon: <Edit2 size={14} />,
                  onClick: () => handleOpenEdit(user),
                },
                {
                  label: 'Delete User',
                  icon: <Trash2 size={14} />,
                  danger: true,
                  onClick: () => handleDeleteClick(user),
                },
              ]}
            />
          </div>
        ),
      },
    ],
    []
  )

  return (
    <div className="contacts-module-container animate-fade-in">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="module-toast animate-slide-up">
          <CheckCircle size={16} className="text-success-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Users' }]} />

      {/* Module Page Header */}
      <PageHeader
        icon={<UsersIcon size={24} />}
        title="Users"
        description="Manage platform users, system roles, security privileges, and employee connections."
        actions={
          <div className="flex items-center gap-2">
            <button
              className="btn btn-primary shadow-sm flex items-center gap-1.5"
              onClick={handleOpenCreate}
            >
              <Plus size={16} />
              <span>Add User</span>
            </button>
          </div>
        }
      />

      {/* Stat Cards Summary Row */}
      <div className="contacts-stats-grid">
        <StatCard
          label="Total Users"
          value={meta.total}
          icon={<UsersIcon size={20} />}
          variant="blue"
          active={statusFilter === 'all' && employeeFilter === 'all'}
          onClick={() => {
            setStatusFilter('all')
            setEmployeeFilter('all')
            setCurrentPage(1)
          }}
        />
        <StatCard
          label="Active Users"
          value={meta.active_count ?? 0}
          icon={<CheckCircle size={20} />}
          variant="green"
          active={statusFilter === 'Active'}
          onClick={() => {
            setStatusFilter('Active')
            setCurrentPage(1)
          }}
        />
        <StatCard
          label="Inactive Users"
          value={meta.inactive_count ?? 0}
          icon={<Clock size={20} />}
          variant="amber"
          active={statusFilter === 'Inactive'}
          onClick={() => {
            setStatusFilter('Inactive')
            setCurrentPage(1)
          }}
        />
        <StatCard
          label="Linked Employees"
          value={meta.employee_count ?? 0}
          icon={<IdCard size={20} />}
          variant="purple"
          active={employeeFilter === 'employee'}
          onClick={() => {
            setEmployeeFilter('employee')
            setCurrentPage(1)
          }}
        />
      </div>

      {/* Filter & Search Toolbar */}
      <div className="contacts-filter-bar">
        <div className="contacts-filter-left">
          {/* Status Dropdown Selector */}
          <div className="relative">
            <select
              className="form-select contacts-status-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any)
                setCurrentPage(1)
              }}
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Role Dropdown Selector */}
          <div className="relative">
            <select
              className="form-select contacts-status-select"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="all">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Employee Linkage Selector */}
          <div className="relative">
            <select
              className="form-select contacts-status-select"
              value={employeeFilter}
              onChange={(e) => {
                setEmployeeFilter(e.target.value as any)
                setCurrentPage(1)
              }}
            >
              <option value="all">All Users</option>
              <option value="employee">Employees Only</option>
              <option value="system">Standalone Only</option>
            </select>
          </div>

          {/* Search Users Bar */}
          <div className="contacts-search-box">
            <Search size={16} className="contacts-search-icon" />
            <input
              type="text"
              className="contacts-search-input"
              placeholder="Search by name, email, role, employee code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="contacts-filter-right">
          {/* Per Page Selector */}
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span>Show:</span>
            <select
              className="form-select form-input-xs py-1"
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="view-mode-toggle-box">
            <button
              className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <List size={15} />
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Users View (Table or Grid) */}
      {viewMode === 'table' ? (
        <DataTable<ProjectUser>
          data={users}
          columns={userColumns}
          loading={loading}
          loadingMessage="Loading users from server..."
          emptyMessage="No users found matching your criteria."
          selectable
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectRow={(id) => handleSelectOne(Number(id))}
          onRowClick={(user) => handleOpenView(user)}
          pagination={{
            currentPage,
            total: meta.total,
            perPage,
            lastPage: meta.last_page,
            onPageChange: setCurrentPage,
            itemName: 'users',
          }}
        />
      ) : (
        /* Grid View Mode */
        <div className="contacts-cards-grid">
          {users.map((user) => {
            const roleName = getUserRoleName(user) || 'User'
            return (
              <div
                key={user.id}
                className="contact-grid-card"
                onClick={() => handleOpenView(user)}
              >
                <div className="contact-grid-card-header">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="contact-grid-avatar"
                    />
                  ) : (
                    <div
                      className={`contact-grid-avatar flex items-center justify-center font-bold text-xs ring-2 ring-white ${getUserColor(
                        user.id
                      )}`}
                    >
                      {getUserInitials(user.name)}
                    </div>
                  )}
                  <span
                    className={`contact-status-pill ${
                      user.status?.toLowerCase() === 'active'
                        ? 'status-active'
                        : 'status-inactive'
                    }`}
                  >
                    {user.status || 'Active'}
                  </span>
                </div>
                <div className="contact-grid-name">{user.name}</div>
                <div className="contact-grid-title flex items-center gap-1.5 flex-wrap">
                  <span className="text-blue-600 font-semibold">{roleName}</span>
                  {user.is_employee && user.employee && (
                    <span className="text-slate-400 font-mono text-[11px]">
                      • {user.employee.employee_code}
                    </span>
                  )}
                </div>
                <div className="contact-grid-meta">
                  <div className="truncate">{user.email || '—'}</div>
                  <div>
                    {user.is_employee && user.employee
                      ? user.employee.designation?.title || user.employee.department?.name || 'Employee'
                      : 'Standalone Platform User'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Slide Drawer: View User Details */}
      <UserViewDrawer
        user={viewingUser}
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteClick}
      />

      {/* Slide Drawer: Create / Edit User */}
      <UserFormDrawer
        user={editingUser}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Global Confirmation Modal for User Deletion */}
      <ConfirmationModal
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
        variant="danger"
        title="Delete User"
        itemName={userToDelete?.name}
        message="Are you sure you want to permanently delete this user? This will revoke their platform access and remove their user account."
        confirmText="Delete User"
        cancelText="Cancel"
      />
    </div>
  )
}
