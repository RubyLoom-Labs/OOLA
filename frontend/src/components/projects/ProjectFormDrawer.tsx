import React, { useState, useEffect } from 'react'
import {
  Loader2,
  AlertCircle,
  Save,
  FolderKanban,
  Building2,
  Calendar,
  DollarSign,
  User,
  Users,
  Check,
  Tag,
  Layers,
  FileText,
} from 'lucide-react'
import type {
  Project,
  ProjectStage,
  ProjectStatusItem,
  ProjectPriorityItem,
  ProjectUser,
  CreateProjectPayload,
  UpdateProjectPayload,
} from '@/apis/projectsApi'
import { projectsApi } from '@/apis/projectsApi'
import { companiesApi, type CompanyLookupItem, type CompanyContact } from '@/apis/companiesApi'
import SlideDrawer from '@/components/common/SlideDrawer'
import CompanySelect from '@/components/companies/CompanySelect'
import CompanyContactsMultiSelect from '@/components/companies/CompanyContactsMultiSelect'
import { capitalizeWords } from '@/lib/utils'

interface ProjectFormDrawerProps {
  isOpen: boolean
  onClose: () => void
  project?: Project | null
  onSubmit: (
    payload: CreateProjectPayload | UpdateProjectPayload,
    isEdit: boolean
  ) => Promise<void>
}

const PROJECT_TYPE_PRESETS = [
  'Cloud Infrastructure',
  'Web Development',
  'Mobile App Development',
  'DevOps & Hybrid Cloud',
  'Enterprise ERP Integration',
  'Maintenance & SLA',
  'Security & Audit',
  'Consulting & Advisory',
]

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent']

const STATUS_OPTIONS = [
  'Not Started',
  'In Progress',
  'On Hold',
  'Completed',
  'Cancelled',
]

export default function ProjectFormDrawer({
  isOpen,
  onClose,
  project,
  onSubmit,
}: ProjectFormDrawerProps) {
  const isEdit = Boolean(project && project.id)
  const [loading, setLoading] = useState(false)
  const [metaLoading, setMetaLoading] = useState(false)

  // Dynamic Metadata
  const [stages, setStages] = useState<ProjectStage[]>([])
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatusItem[]>([])
  const [projectPriorities, setProjectPriorities] = useState<ProjectPriorityItem[]>([])
  const [users, setUsers] = useState<ProjectUser[]>([])
  const [leads, setLeads] = useState<any[]>([])

  // Form Fields
  const [projectTitle, setProjectTitle] = useState('')
  const [customerId, setCustomerId] = useState<number | undefined>(undefined)
  const [selectedCompany, setSelectedCompany] = useState<CompanyLookupItem | null>(null)
  const [description, setDescription] = useState('')
  const [leadId, setLeadId] = useState<number | ''>('')
  const [projectManagerId, setProjectManagerId] = useState<number | ''>('')
  const [stageId, setStageId] = useState<number | ''>('')
  const [projectType, setProjectType] = useState('Cloud Infrastructure')
  const [customType, setCustomType] = useState('')
  const [priority, setPriority] = useState('High')
  const [status, setStatus] = useState('In Progress')
  const [startDate, setStartDate] = useState('')
  const [expectedEndDate, setExpectedEndDate] = useState('')
  const [actualEndDate, setActualEndDate] = useState('')
  const [budget, setBudget] = useState<string>('')
  const [quotedAmount, setQuotedAmount] = useState<string>('')
  const [cost, setCost] = useState<string>('')
  const [revenue, setRevenue] = useState<string>('')
  const [profit, setProfit] = useState<string>('')
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([])
  const [selectedContacts, setSelectedContacts] = useState<CompanyContact[]>([])

  // Validation States
  const [titleError, setTitleError] = useState<string | null>(null)
  const [customerError, setCustomerError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [touched, setTouched] = useState({ title: false, customer: false })

  // Load Stages, Statuses, Priorities, Users, Leads dynamically when drawer opens
  useEffect(() => {
    if (!isOpen) return
    const fetchMetadata = async () => {
      setMetaLoading(true)
      try {
        const [stagesRes, statusesRes, prioritiesRes, usersRes, leadsRes] = await Promise.allSettled([
          projectsApi.getStages(),
          projectsApi.getProjectStatuses(),
          projectsApi.getProjectPriorities(),
          projectsApi.getUsers(),
          projectsApi.getLeads(),
        ])

        if (stagesRes.status === 'fulfilled' && Array.isArray(stagesRes.value.data)) {
          setStages(stagesRes.value.data)
          if (!project && stagesRes.value.data.length > 0 && !stageId) {
            setStageId(stagesRes.value.data[0].id)
          }
        }

        if (statusesRes.status === 'fulfilled' && Array.isArray(statusesRes.value.data)) {
          setProjectStatuses(statusesRes.value.data)
        }

        if (prioritiesRes.status === 'fulfilled' && Array.isArray(prioritiesRes.value.data)) {
          setProjectPriorities(prioritiesRes.value.data)
        }

        if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value.data)) {
          setUsers(usersRes.value.data)
          if (!project && usersRes.value.data.length > 0 && !projectManagerId) {
            setProjectManagerId(usersRes.value.data[0].id)
          }
        }

        if (leadsRes.status === 'fulfilled' && Array.isArray(leadsRes.value.data)) {
          setLeads(leadsRes.value.data)
        }
      } catch (err) {
        console.error('Failed to load project metadata:', err)
      } finally {
        setMetaLoading(false)
      }
    }

    fetchMetadata()
  }, [isOpen, project])

  // Reset or Populate Fields
  useEffect(() => {
    if (project && isOpen) {
      setProjectTitle(project.project_title || '')
      setCustomerId(project.customer_id)
      if (project.customer) {
        setSelectedCompany({
          id: project.customer.id,
          company_name: project.customer.company_name,
          company_code: project.customer.customer_code || project.customer.company_code || '',
        })
      } else {
        setSelectedCompany(null)
      }
      setDescription(project.description || '')
      setLeadId(project.lead_id || '')
      setProjectManagerId(project.project_manager_id || (project.manager ? project.manager.id : ''))
      setStageId(project.stage_id || (project.stage ? project.stage.id : ''))

      const pType = project.project_type || 'Cloud Infrastructure'
      if (PROJECT_TYPE_PRESETS.includes(pType)) {
        setProjectType(pType)
        setCustomType('')
      } else {
        setProjectType('Custom')
        setCustomType(pType)
      }

      setPriority(project.priority || 'High')
      setStatus(project.status || 'In Progress')
      setStartDate(project.start_date || '')
      setExpectedEndDate(project.expected_end_date || '')
      setActualEndDate(project.actual_end_date || '')
      setBudget(project.budget !== null && project.budget !== undefined ? String(project.budget) : '')
      setQuotedAmount(project.quoted_amount !== null && project.quoted_amount !== undefined ? String(project.quoted_amount) : '')
      setCost(project.cost !== null && project.cost !== undefined ? String(project.cost) : '')
      setRevenue(project.revenue !== null && project.revenue !== undefined ? String(project.revenue) : '')
      setProfit(project.profit !== null && project.profit !== undefined ? String(project.profit) : '')

      const userIds = Array.isArray(project.users) ? project.users.map((u) => u.id) : []
      setSelectedUserIds(userIds)
      setSelectedContactIds(
        (project as any).contact_ids || (Array.isArray((project as any).contacts) ? (project as any).contacts.map((c: any) => c.id) : [])
      )
      setSelectedContacts((project as any).contacts || [])

      setTitleError(null)
      setCustomerError(null)
      setValidationError(null)
      setTouched({ title: false, customer: false })
    } else if (isOpen && !project) {
      setProjectTitle('')
      setCustomerId(undefined)
      setSelectedCompany(null)
      setDescription('')
      setLeadId('')
      setProjectManagerId(users[0]?.id || '')
      setStageId(stages[0]?.id || '')
      setProjectType('Cloud Infrastructure')
      setCustomType('')
      setPriority('High')
      setStatus('In Progress')
      setStartDate(new Date().toISOString().slice(0, 10))
      setExpectedEndDate('')
      setActualEndDate('')
      setBudget('')
      setQuotedAmount('')
      setCost('')
      setRevenue('')
      setProfit('')
      setSelectedUserIds(users[0]?.id ? [users[0].id] : [])
      setSelectedContactIds([])
      setSelectedContacts([])

      setTitleError(null)
      setCustomerError(null)
      setValidationError(null)
      setTouched({ title: false, customer: false })
    }
  }, [project, isOpen, stages, users])

  // Toggle user assignment
  const handleToggleUser = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setTouched({ title: true, customer: true })

    let hasError = false
    if (!projectTitle.trim()) {
      setTitleError('Project title is required.')
      hasError = true
    } else if (projectTitle.trim().length > 255) {
      setTitleError('Project title cannot exceed 255 characters.')
      hasError = true
    } else {
      setTitleError(null)
    }

    if (!customerId) {
      setCustomerError('Please select a client company.')
      hasError = true
    } else {
      setCustomerError(null)
    }

    if (hasError) {
      setValidationError('Please resolve the required fields before submitting.')
      return
    }

    setValidationError(null)

    const payload: CreateProjectPayload | UpdateProjectPayload = {
      project_title: projectTitle.trim(),
      customer_id: Number(customerId),
      description: description.trim() || undefined,
      lead_id: leadId ? Number(leadId) : undefined,
      project_manager_id: projectManagerId ? Number(projectManagerId) : undefined,
      stage_id: stageId ? Number(stageId) : undefined,
      project_type: projectType.trim() || undefined,
      priority,
      status,
      start_date: startDate || undefined,
      expected_end_date: expectedEndDate || undefined,
      actual_end_date: actualEndDate || undefined,
      budget: budget !== '' ? Number(budget) : undefined,
      quoted_amount: quotedAmount !== '' ? Number(quotedAmount) : undefined,
      cost: cost !== '' ? Number(cost) : undefined,
      revenue: revenue !== '' ? Number(revenue) : undefined,
      profit: profit !== '' ? Number(profit) : undefined,
      user_ids: selectedUserIds,
      contact_ids: selectedContactIds,
    }

    setLoading(true)
    try {
      await onSubmit(payload, isEdit)
      onClose()
    } catch (error: any) {
      if (error?.errors && typeof error.errors === 'object') {
        const errorList: string[] = []
        Object.entries(error.errors).forEach(([field, msgs]) => {
          const msg = Array.isArray(msgs) ? msgs.join(', ') : String(msgs)
          if (field === 'project_title') setTitleError(msg)
          if (field === 'customer_id') setCustomerError(msg)
          errorList.push(`${field.replace(/_/g, ' ')}: ${msg}`)
        })
        setValidationError(errorList.length > 0 ? errorList.join(' | ') : 'Validation failed')
      } else {
        const msg = error?.message || 'Failed to save project'
        setValidationError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <SlideDrawer
      isOpen={isOpen}
      onClose={onClose}
      width="620px"
      title=""
      subtitle=""
      className="contact-view-drawer contact-form-drawer"
      hideHeader
    >
      <form onSubmit={handleSubmit} noValidate className="cvd-panel">
        {/* ── HERO HEADER ── */}
        <div className="cvd-hero">
          <div className="cvd-avatar-wrap">
            <div
              className="cvd-avatar flex items-center justify-center font-bold text-white shadow-md"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #1e293b)',
                fontSize: '22px',
              }}
            >
              <FolderKanban size={28} className="text-white" />
            </div>
          </div>

          <div className="cvd-hero-info">
            <div className="cvd-name-edit-row">
              <input
                type="text"
                className={`form-input form-input-sm ${titleError ? 'input-error' : ''}`}
                placeholder="Project Title *"
                value={projectTitle}
                onChange={(e) => {
                  setProjectTitle(e.target.value)
                  if (titleError && e.target.value.trim()) setTitleError(null)
                  if (validationError) setValidationError(null)
                }}
                style={{ maxWidth: 320 }}
              />
            </div>
            <p className="cvd-subtitle">
              {selectedCompany?.company_name
                ? `${projectType || 'Project'} for ${capitalizeWords(selectedCompany.company_name)}`
                : isEdit
                ? `Updating ${project?.project_code || 'project'}`
                : 'Create a new project record and allocate team resources'}
            </p>
          </div>

          <button type="button" className="cvd-close-btn" onClick={onClose} title="Close">
            <span style={{ fontSize: 18, lineHeight: 1, color: '#94a3b8' }}>×</span>
          </button>
        </div>

        {/* ── SAVE BAR ── */}
        <div className="cvd-edit-bar">
          <div className="flex items-center gap-2">
            <span className="contact-edit-badge">{isEdit ? 'Edit Mode' : 'Create Mode'}</span>
            <span className="text-xs text-gray-500">
              {isEdit ? `Updating ${project?.project_code || 'project'}` : 'Marked fields (*) are required'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm flex items-center gap-1.5"
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Save size={13} />
              )}
              <span>{isEdit ? 'Save Changes' : 'Create Project'}</span>
            </button>
          </div>
        </div>

        {/* ── VALIDATION ERROR BANNER ── */}
        {validationError && (
          <div className="cvd-validation-error">
            <AlertCircle size={13} />
            <span>{validationError}</span>
          </div>
        )}

        {/* ── TAB BAR ── */}
        <div className="cvd-tabs">
          <button type="button" className="cvd-tab cvd-tab-active">
            {isEdit ? 'Edit Information' : 'Project Details'}
          </button>
        </div>

        {/* ── FORM CONTENT ── */}
        <div className="cvd-body">
          <div className="cvd-tab-pane">
            <div className="space-y-4">
              {/* Card 1: Project Classification & Stage */}
              <div className="cvd-card">
                <div className="cvd-card-header">
                  <span className="cvd-card-title flex items-center gap-1.5">
                    <FolderKanban size={14} className="text-blue-600" />
                    <span>Project Classification & Stage</span>
                  </span>
                </div>
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-group min-w-0">
                      <label className="form-label text-xs">Stage</label>
                      <select
                        className="form-select form-input-sm"
                        value={stageId}
                        onChange={(e) => setStageId(e.target.value ? Number(e.target.value) : '')}
                        disabled={metaLoading}
                      >
                        <option value="">Select Stage...</option>
                        {stages.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group min-w-0">
                      <label className="form-label text-xs">Priority</label>
                      <select
                        className="form-select form-input-sm"
                        value={(priority || '').replace(' Priority', '').trim()}
                        onChange={(e) => setPriority(e.target.value)}
                        disabled={metaLoading}
                      >
                        {projectPriorities.length > 0
                          ? projectPriorities.map((p) => {
                              const cleanName = p.name.replace(' Priority', '').trim()
                              return (
                                <option key={p.id} value={cleanName}>
                                  {p.name.includes('Priority') ? p.name : `${p.name} Priority`}
                                </option>
                              )
                            })
                          : PRIORITY_OPTIONS.map((p) => (
                              <option key={p} value={p}>
                                {p} Priority
                              </option>
                            ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-group min-w-0">
                      <label className="form-label text-xs">Status</label>
                      <select
                        className="form-select form-input-sm"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        disabled={metaLoading}
                      >
                        {projectStatuses.length > 0
                          ? projectStatuses.map((s) => (
                              <option key={s.id} value={s.name}>
                                {s.name}
                              </option>
                            ))
                          : STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                      </select>
                    </div>
                    <div className="form-group min-w-0">
                      <label className="form-label text-xs">Project Type</label>
                      <input
                        type="text"
                        className="form-input form-input-sm"
                        value={projectType}
                        onChange={(e) => setProjectType(e.target.value)}
                        placeholder="e.g. Cloud Infrastructure"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Client & Leadership */}
              <div className="cvd-card">
                <div className="cvd-card-header">
                  <span className="cvd-card-title flex items-center gap-1.5">
                    <Building2 size={14} className="text-emerald-600" />
                    <span>Client & Leadership</span>
                  </span>
                </div>
                <div className="space-y-3 pt-1">
                  <div className="form-group">
                    <label className="form-label text-xs">
                      Client Organization <span className="text-danger">*</span>
                    </label>
                    <CompanySelect
                      value={customerId}
                      companyName={selectedCompany?.company_name}
                      onChange={(id, comp) => {
                        setCustomerId(id)
                        setSelectedCompany(comp)
                        if (id) setCustomerError(null)
                        if (id !== customerId) {
                          setSelectedContactIds([])
                          setSelectedContacts([])
                        }
                      }}
                      placeholder="Select client company..."
                      required
                    />
                    {customerError && (
                      <div className="field-error-msg">
                        <AlertCircle size={12} />
                        <span>{customerError}</span>
                      </div>
                    )}
                  </div>

                  {/* Company Contact Multi-Select */}
                  <CompanyContactsMultiSelect
                    companyId={customerId}
                    value={selectedContactIds}
                    onChange={(ids, contacts) => {
                      setSelectedContactIds(ids)
                      setSelectedContacts(contacts)
                    }}
                    label="Company Contact"
                    placeholder="Select company contacts..."
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-group min-w-0">
                      <label className="form-label text-xs">Project Manager</label>
                      <select
                        className="form-select form-input-sm"
                        value={projectManagerId}
                        onChange={(e) =>
                          setProjectManagerId(e.target.value ? Number(e.target.value) : '')
                        }
                      >
                        <option value="">Select Project Manager...</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} {u.designation || u.role ? `(${u.designation || u.role})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group min-w-0">
                      <label className="form-label text-xs">Associated Lead</label>
                      <select
                        className="form-select form-input-sm"
                        value={leadId}
                        onChange={(e) => setLeadId(e.target.value ? Number(e.target.value) : '')}
                      >
                        <option value="">No linked lead</option>
                        {leads.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.lead_code || `Lead #${l.id}`} - {l.lead_title || l.title || l.requirement_name || 'Opportunity'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Timeline & Schedule */}
              <div className="cvd-card">
                <div className="cvd-card-header">
                  <span className="cvd-card-title flex items-center gap-1.5">
                    <Calendar size={14} className="text-amber-600" />
                    <span>Timeline & Schedule</span>
                  </span>
                </div>
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="form-group min-w-0">
                      <label className="form-label text-xs">Start Date</label>
                      <input
                        type="date"
                        className="form-input form-input-sm"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="form-group min-w-0">
                      <label className="form-label text-xs">Expected End</label>
                      <input
                        type="date"
                        className="form-input form-input-sm"
                        value={expectedEndDate}
                        onChange={(e) => setExpectedEndDate(e.target.value)}
                      />
                    </div>
                    <div className="form-group min-w-0">
                      <label className="form-label text-xs">Actual End</label>
                      <input
                        type="date"
                        className="form-input form-input-sm"
                        value={actualEndDate}
                        onChange={(e) => setActualEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Financials & Budget */}
              <div className="cvd-card">
                <div className="cvd-card-header">
                  <span className="cvd-card-title flex items-center gap-1.5">
                    <DollarSign size={14} className="text-violet-600" />
                    <span>Financials & Budget</span>
                  </span>
                </div>
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="form-group min-w-0">
                      <label className="form-label text-xs">Allocated Budget</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-semibold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-input form-input-sm pl-6"
                          placeholder="0.00"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-group min-w-0">
                      <label className="form-label text-xs">Quoted Price</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-semibold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-input form-input-sm pl-6"
                          placeholder="0.00"
                          value={quotedAmount}
                          onChange={(e) => setQuotedAmount(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-group min-w-0">
                      <label className="form-label text-xs">Total Cost</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-semibold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-input form-input-sm pl-6"
                          placeholder="0.00"
                          value={cost}
                          onChange={(e) => setCost(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                    <div className="form-group min-w-0">
                      <label className="form-label text-xs">Realized Revenue</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-semibold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-input form-input-sm pl-6"
                          placeholder="0.00"
                          value={revenue}
                          onChange={(e) => setRevenue(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-group min-w-0">
                      <label className="form-label text-xs">Net Profit</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-semibold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          className="form-input form-input-sm pl-6"
                          placeholder="0.00"
                          value={profit}
                          onChange={(e) => setProfit(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 5: Team Members Allocation */}
              <div className="cvd-card">
                <div className="cvd-card-header">
                  <span className="cvd-card-title flex items-center gap-1.5">
                    <Users size={14} className="text-blue-600" />
                    <span>Team Members Allocation</span>
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {selectedUserIds.length} allocated
                  </span>
                </div>
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50/70 rounded-xl border border-slate-200">
                    {users.map((u) => {
                      const isSelected = selectedUserIds.includes(u.id)
                      return (
                        <div
                          key={u.id}
                          className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50 border-blue-200 text-blue-900 font-medium'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                          onClick={() => handleToggleUser(u.id)}
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check size={11} strokeWidth={3} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate">{u.name}</div>
                            <div className="text-muted text-[10px] truncate">
                              {u.designation || u.role}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Card 6: Project Scope & Notes */}
              <div className="cvd-card">
                <div className="cvd-card-header">
                  <span className="cvd-card-title flex items-center gap-1.5">
                    <FileText size={14} className="text-slate-600" />
                    <span>Project Scope & Notes</span>
                  </span>
                </div>
                <div className="pt-1">
                  <div className="form-group">
                    <textarea
                      rows={3}
                      className="form-input form-input-sm w-full"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Project scope, deliverables, or technical notes..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </SlideDrawer>
  )
}
