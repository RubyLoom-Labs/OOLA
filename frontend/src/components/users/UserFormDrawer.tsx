import React, { useState, useEffect } from 'react'
import {
  Save,
  Loader2,
  AlertCircle,
  Shield,
  IdCard,
  User,
  Mail,
  Building2,
  Check,
} from 'lucide-react'
import SlideDrawer from '@/components/common/SlideDrawer'
import {
  usersApi,
  type ProjectUser,
  type UserRole,
  type UserEmployee,
  type CreateUserPayload,
  type UpdateUserPayload,
} from '@/apis/usersApi'

interface UserFormDrawerProps {
  isOpen: boolean
  onClose: () => void
  user?: ProjectUser | null // null = Create, object = Edit
  onSubmit: (
    payload: CreateUserPayload | UpdateUserPayload,
    isEdit: boolean
  ) => Promise<void>
}

export default function UserFormDrawer({
  isOpen,
  onClose,
  user,
  onSubmit,
}: UserFormDrawerProps) {
  const isEdit = Boolean(user && user.id)

  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Options from API
  const [roles, setRoles] = useState<UserRole[]>([])
  const [employees, setEmployees] = useState<UserEmployee[]>([])

  // Form Fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [roleId, setRoleId] = useState<number | ''>('')
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active')

  // Employee Linkage
  const [isEmployee, setIsEmployee] = useState(false)
  const [employeeId, setEmployeeId] = useState<number | ''>('')

  // Validation
  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    roleId?: string
    employeeId?: string
  }>({})

  // Fetch Roles and Employees when drawer opens
  useEffect(() => {
    if (!isOpen) return

    setDataLoading(true)
    Promise.all([usersApi.getRoles(), usersApi.getEmployees()])
      .then(([rolesData, employeesData]) => {
        setRoles(rolesData)
        setEmployees(employeesData)
      })
      .catch((err) => {
        console.warn('Failed to load roles or employees:', err)
      })
      .finally(() => {
        setDataLoading(false)
      })
  }, [isOpen])

  // Initialize form state
  useEffect(() => {
    if (!isOpen) {
      setErrorMessage(null)
      setErrors({})
      return
    }

    if (user) {
      // Edit mode
      setName(user.name || '')
      setEmail(user.email || '')
      setRoleId(user.role_id || (user.role && typeof user.role === 'object' ? user.role.id : '') || '')
      setStatus((user.status as any) || 'Active')
      const hasEmp = Boolean(user.is_employee && user.employee_id)
      setIsEmployee(hasEmp)
      setEmployeeId(user.employee_id || '')
    } else {
      // Create mode
      setName('')
      setEmail('')
      setRoleId('')
      setStatus('Active')
      setIsEmployee(false)
      setEmployeeId('')
    }
    setErrorMessage(null)
    setErrors({})
  }, [isOpen, user])

  // When an employee is chosen, optionally sync name and email if empty
  const handleEmployeeChange = (empId: number | '') => {
    setEmployeeId(empId)
    if (empId !== '') {
      const selected = employees.find((e) => e.id === Number(empId))
      if (selected) {
        if (!name.trim()) {
          const empName = `${selected.first_name || ''} ${selected.last_name || ''}`.trim()
          if (empName) setName(empName)
        }
        if (!email.trim() && selected.email) {
          setEmail(selected.email)
        }
      }
    }
  }

  const validate = (): boolean => {
    const newErrors: typeof errors = {}

    if (!name.trim()) {
      newErrors.name = 'Full name is required.'
    }

    if (!isEdit) {
      if (!email.trim()) {
        newErrors.email = 'Email address is required.'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        newErrors.email = 'Please enter a valid email address.'
      }
    }

    if (!roleId) {
      newErrors.roleId = 'Please select a platform role.'
    }

    if (isEmployee && !employeeId) {
      newErrors.employeeId = 'Please select the employee profile to link.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!validate()) return

    setLoading(true)
    try {
      if (isEdit && user) {
        // Update payload
        const updatePayload: UpdateUserPayload = {
          name: name.trim(),
          role_id: Number(roleId),
          status,
          is_employee: isEmployee && Boolean(employeeId),
          employee_id: isEmployee && employeeId ? Number(employeeId) : null,
        }
        await onSubmit(updatePayload, true)
      } else {
        // Create payload
        const createPayload: CreateUserPayload = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role_id: Number(roleId),
          is_employee: isEmployee && Boolean(employeeId),
          employee_id: isEmployee && employeeId ? Number(employeeId) : null,
        }
        await onSubmit(createPayload, false)
      }
      onClose()
    } catch (err: any) {
      console.error('Failed to submit user form:', err)
      setErrorMessage(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to save user. Please check the details and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <SlideDrawer
      isOpen={isOpen}
      onClose={onClose}
      width="560px"
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <User size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              {isEdit ? 'Edit Platform User' : 'Create New User'}
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              {isEdit
                ? `Update user profile, permissions role, and employee linkage for ${user?.name}`
                : 'Add a new platform account with role permissions and employee binding'}
            </p>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* General API error banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {dataLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <Loader2 size={14} className="animate-spin text-blue-600" />
              <span>Loading platform roles and employees...</span>
            </div>
          )}

          {/* Section 1: User Profile */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User size={14} className="text-blue-500" />
              <span>User Profile Details</span>
            </h3>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  className={`form-input w-full rounded-xl text-xs py-2.5 px-3 border ${
                    errors.name ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200'
                  }`}
                  placeholder="e.g. David Miller"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                  }}
                />
              </div>
              {errors.name && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  className={`form-input w-full rounded-xl text-xs py-2.5 px-3 border ${
                    isEdit
                      ? 'bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed'
                      : errors.email
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-200'
                  }`}
                  placeholder="e.g. david.miller@example.com"
                  value={email}
                  onChange={(e) => {
                    if (!isEdit) {
                      setEmail(e.target.value)
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                    }
                  }}
                  disabled={isEdit}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.email}</p>
              )}
              {isEdit && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Email address cannot be modified after user creation.
                </p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Role & Privileges <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  className={`form-select w-full rounded-xl text-xs py-2.5 px-3 border ${
                    errors.roleId ? 'border-rose-400' : 'border-slate-200'
                  }`}
                  value={roleId}
                  onChange={(e) => {
                    setRoleId(e.target.value ? Number(e.target.value) : '')
                    if (errors.roleId) setErrors((prev) => ({ ...prev, roleId: undefined }))
                  }}
                >
                  <option value="">Select a platform role...</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.is_system ? '(System)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              {errors.roleId && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.roleId}</p>
              )}
            </div>

            {/* Status (Edit mode only) */}
            {isEdit && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Account Status
                </label>
                <select
                  className="form-select w-full rounded-xl text-xs py-2.5 px-3 border border-slate-200"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>

          {/* Section 2: Employee Linkage */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <IdCard size={14} className="text-purple-500" />
                  <span>Employee Linkage</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Connect this login user to an internal employee record.
                </p>
              </div>

              {/* Toggle Link to Employee */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isEmployee}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setIsEmployee(checked)
                    if (!checked) {
                      setEmployeeId('')
                      if (errors.employeeId) {
                        setErrors((prev) => ({ ...prev, employeeId: undefined }))
                      }
                    }
                  }}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {isEmployee ? (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select Employee <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className={`form-select w-full rounded-xl text-xs py-2.5 px-3 border ${
                      errors.employeeId ? 'border-rose-400' : 'border-slate-200'
                    }`}
                    value={employeeId}
                    onChange={(e) =>
                      handleEmployeeChange(e.target.value ? Number(e.target.value) : '')
                    }
                  >
                    <option value="">Choose an employee from the company list...</option>
                    {employees.map((emp) => {
                      const empName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Employee'
                      const title = emp.designation?.title || emp.department?.name || ''
                      return (
                        <option key={emp.id} value={emp.id}>
                          {emp.employee_code ? `[${emp.employee_code}] ` : ''}
                          {empName} {title ? `— ${title}` : ''}
                        </option>
                      )
                    })}
                  </select>
                  {errors.employeeId && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.employeeId}</p>
                  )}
                </div>

                {employeeId !== '' && (
                  <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100/90 text-xs text-purple-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Check size={14} className="text-purple-600" />
                      <span>Employee linked successfully</span>
                    </div>
                    {(() => {
                      const selected = employees.find((e) => e.id === Number(employeeId))
                      if (!selected) return null
                      return (
                        <div className="text-[11px] text-purple-700 space-y-0.5 pt-1">
                          <div>
                            <strong>Code:</strong> {selected.employee_code || 'N/A'} |{' '}
                            <strong>Name:</strong> {selected.first_name} {selected.last_name}
                          </div>
                          <div>
                            <strong>Department:</strong> {selected.department?.name || '—'} |{' '}
                            <strong>Designation:</strong> {selected.designation?.title || '—'}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 flex items-center gap-2">
                <AlertCircle size={15} className="text-slate-400 shrink-0" />
                <span>
                  Employee linking is disabled. This user will be created as a standalone system user with{' '}
                  <code className="text-slate-700 font-semibold bg-white px-1 py-0.5 rounded border border-slate-200">
                    is_employee: false
                  </code>
                  .
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            className="btn btn-outline btn-sm text-xs px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-50"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-sm text-xs px-5 py-2 rounded-xl flex items-center gap-2 shadow-xs"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>{isEdit ? 'Update User' : 'Create User'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </SlideDrawer>
  )
}
