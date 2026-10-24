import React, { useState, useEffect } from 'react'
import {
  Edit2,
  Trash2,
  Mail,
  Shield,
  ShieldCheck,
  UserCheck,
  Building2,
  Briefcase,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  KeyRound,
  IdCard,
  Loader2,
} from 'lucide-react'
import SlideDrawer from '@/components/common/SlideDrawer'
import {
  usersApi,
  type ProjectUser,
  getUserRoleName,
} from '@/apis/usersApi'
import { getUserColor, getUserInitials } from './UserSelect'

interface UserViewDrawerProps {
  user: ProjectUser | null
  isOpen: boolean
  onClose: () => void
  onEdit: (user: ProjectUser) => void
  onDelete: (user: ProjectUser) => void
}

export default function UserViewDrawer({
  user,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: UserViewDrawerProps) {
  const [userDetails, setUserDetails] = useState<ProjectUser | null>(user)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'permissions' | 'employee'>('overview')

  useEffect(() => {
    if (!isOpen || !user) {
      setUserDetails(null)
      return
    }

    setUserDetails(user)
    // Fetch full details (includes permissions & latest relations)
    setLoading(true)
    usersApi
      .getUser(user.id)
      .then((res) => {
        if (res.data) {
          setUserDetails(res.data)
        }
      })
      .catch((err) => {
        console.warn('Could not fetch full user details:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [isOpen, user])

  if (!user && !userDetails) return null

  const displayUser = userDetails || user!
  const roleName = getUserRoleName(displayUser) || 'User'
  const isSystemRole = Boolean(
    typeof displayUser.role === 'object' && displayUser.role?.is_system
  )
  const permissions =
    typeof displayUser.role === 'object' && Array.isArray(displayUser.role?.permissions)
      ? displayUser.role.permissions
      : []

  const employee = displayUser.employee

  return (
    <SlideDrawer
      isOpen={isOpen}
      onClose={onClose}
      width="600px"
      hideHeader
      bodyClassName="p-0"
    >
      <div className="flex flex-col h-full bg-slate-50">
        {/* Drawer Header with Banner */}
        <div className="bg-white border-b border-slate-200/80 px-6 pt-6 pb-5 shadow-xs relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {/* Avatar */}
              {displayUser.avatar ? (
                <img
                  src={displayUser.avatar}
                  alt={displayUser.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-100 shadow-sm shrink-0"
                />
              ) : (
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl shadow-xs shrink-0 ring-2 ring-white ${getUserColor(
                    displayUser.id
                  )}`}
                >
                  {getUserInitials(displayUser.name)}
                </div>
              )}

              {/* Title & Email */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-900 truncate">
                    {displayUser.name}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      displayUser.status?.toLowerCase() === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {displayUser.status?.toLowerCase() === 'active' ? (
                      <CheckCircle2 size={11} />
                    ) : (
                      <XCircle size={11} />
                    )}
                    {displayUser.status || 'Active'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 truncate">
                  <Mail size={13} className="shrink-0 text-slate-400" />
                  <span className="truncate">{displayUser.email}</span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    <Shield size={12} />
                    {roleName}
                  </span>
                  {displayUser.is_employee && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      <IdCard size={11} />
                      {employee?.employee_code || 'Employee'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                className="btn btn-outline btn-sm text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-slate-700 hover:text-blue-600 hover:border-blue-200"
                onClick={() => onEdit(displayUser)}
                title="Edit User"
              >
                <Edit2 size={13} />
                <span>Edit</span>
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                onClick={() => onDelete(displayUser)}
                title="Delete User"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-6 mt-6 border-b border-slate-100 -mb-5 px-1">
            <button
              type="button"
              className={`pb-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              <UserCheck size={14} />
              <span>Overview</span>
            </button>

            <button
              type="button"
              className={`pb-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'permissions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
              onClick={() => setActiveTab('permissions')}
            >
              <KeyRound size={14} />
              <span>Role & Permissions</span>
              {permissions.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
                  {permissions.length}
                </span>
              )}
            </button>

            <button
              type="button"
              className={`pb-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'employee'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
              onClick={() => setActiveTab('employee')}
            >
              <IdCard size={14} />
              <span>Employee Link</span>
            </button>
          </div>
        </div>

        {/* Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {loading && (
            <div className="flex items-center justify-center py-4 text-xs text-slate-400 gap-2">
              <Loader2 size={15} className="animate-spin text-blue-600" />
              <span>Syncing user details...</span>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Account Details Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <UserCheck size={14} className="text-blue-500" />
                  <span>Account Information</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">User ID</label>
                    <div className="font-semibold text-slate-800">#{displayUser.id}</div>
                  </div>

                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Full Name</label>
                    <div className="font-semibold text-slate-800">{displayUser.name}</div>
                  </div>

                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Email Address</label>
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Mail size={13} className="text-slate-400" />
                      <span>{displayUser.email}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Status</label>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
                        displayUser.status?.toLowerCase() === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {displayUser.status || 'Active'}
                    </span>
                  </div>

                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Created Date</label>
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      <span>
                        {displayUser.created_at
                          ? new Date(displayUser.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Account Type</label>
                    <div className="font-semibold text-slate-800">
                      {displayUser.is_employee ? 'Internal Employee User' : 'Standalone Platform User'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Role Summary Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-indigo-500" />
                    <span>Role Assignment</span>
                  </h3>
                  {isSystemRole && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      System Role
                    </span>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-slate-900">{roleName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {typeof displayUser.role === 'object' && displayUser.role?.description
                        ? displayUser.role.description
                        : `Assigned platform role #${displayUser.role_id || (displayUser.role as any)?.id || ''}`}
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-100/80 text-blue-700">
                    Role ID: {displayUser.role_id || (displayUser.role as any)?.id || '—'}
                  </span>
                </div>
              </div>

              {/* Linked Employee Summary */}
              {displayUser.is_employee && employee ? (
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <IdCard size={14} className="text-purple-500" />
                    <span>Linked Employee Summary</span>
                  </h3>

                  <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100/80 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-bold text-xs text-indigo-950">
                        {employee.first_name} {employee.last_name} ({employee.employee_code})
                      </div>
                      <div className="text-xs text-indigo-700">
                        {employee.designation?.title || employee.department?.name || 'Employee Profile'}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
                      onClick={() => setActiveTab('employee')}
                    >
                      View Full &rarr;
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200 text-slate-600 text-xs flex items-center gap-3">
                  <IdCard size={18} className="text-slate-400 shrink-0" />
                  <span>
                    This account is not linked to an employee profile. You can link it by editing the user.
                  </span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{roleName} Permissions</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Permissions are assigned automatically based on the user's role.
                    </p>
                  </div>
                  {isSystemRole && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      System Protected
                    </span>
                  )}
                </div>

                {permissions.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-500 text-xs">
                    <ShieldCheck size={28} className="mx-auto text-slate-400 mb-2" />
                    <div className="font-semibold text-slate-700">Standard Platform Permissions</div>
                    <p className="mt-1 max-w-sm mx-auto text-slate-500">
                      This role operates with standard system privileges designated for {roleName}.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {permissions.map((perm) => (
                      <div
                        key={perm.id || perm.slug}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2"
                      >
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-800 truncate">
                            {perm.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            {perm.slug}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'employee' && (
            <div className="space-y-4">
              {displayUser.is_employee && employee ? (
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                        <IdCard size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900">
                          {employee.first_name} {employee.last_name}
                        </div>
                        <div className="text-xs font-mono text-slate-500">
                          {employee.employee_code}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {employee.status || 'Active'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-slate-400 font-medium block mb-1">Employee ID</label>
                      <div className="font-semibold text-slate-800">#{employee.id}</div>
                    </div>

                    <div>
                      <label className="text-slate-400 font-medium block mb-1">Employee Code</label>
                      <div className="font-semibold text-slate-800">{employee.employee_code || '—'}</div>
                    </div>

                    <div>
                      <label className="text-slate-400 font-medium block mb-1">Department</label>
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Building2 size={13} className="text-slate-400" />
                        <span>{employee.department?.name || '—'}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-400 font-medium block mb-1">Designation</label>
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Briefcase size={13} className="text-slate-400" />
                        <span>{employee.designation?.title || '—'}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-400 font-medium block mb-1">Phone</label>
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Phone size={13} className="text-slate-400" />
                        <span>{employee.phone || '—'}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-400 font-medium block mb-1">Official Email</label>
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Mail size={13} className="text-slate-400" />
                        <span>{employee.email || displayUser.email}</span>
                      </div>
                    </div>

                    {employee.joining_date && (
                      <div>
                        <label className="text-slate-400 font-medium block mb-1">Joining Date</label>
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{employee.joining_date}</span>
                        </div>
                      </div>
                    )}

                    {employee.skills && (
                      <div className="sm:col-span-2">
                        <label className="text-slate-400 font-medium block mb-1">Skills</label>
                        <div className="font-medium text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          {employee.skills}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-2xs text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <IdCard size={24} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">No Employee Profile Linked</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    This user account operates as a standalone system user. You can link it to an existing employee record by editing this user profile.
                  </p>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm text-xs px-4 py-2 rounded-xl mt-2 inline-flex items-center gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => onEdit(displayUser)}
                  >
                    <Edit2 size={13} />
                    <span>Link to Employee</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </SlideDrawer>
  )
}
