import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Edit2,
  MoreHorizontal,
  FolderKanban,
  LayoutGrid,
  Building2,
  Calendar,
  DollarSign,
  User,
  Users,
  Check,
  CheckCircle,
  Clock,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  Tag,
  Layers,
  CheckSquare,
  FileText,
  TrendingUp,
  Percent,
  Briefcase,
  Mail,
  Phone,
  Plus,
} from 'lucide-react'
import type {
  Project,
  ProjectStage,
  ProjectStatusItem,
  ProjectPriorityItem,
  ProjectUser,
  UpdateProjectPayload,
} from '@/apis/projectsApi'
import { projectsApi } from '@/apis/projectsApi'
import { companiesApi, type CompanyLookupItem, type CompanyContact } from '@/apis/companiesApi'
import SlideDrawer from '@/components/common/SlideDrawer'
import CompanySelect from '@/components/companies/CompanySelect'
import CompanyContactsMultiSelect from '@/components/companies/CompanyContactsMultiSelect'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import { capitalizeWords } from '@/lib/utils'

interface ProjectViewDrawerProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
  initialEditMode?: boolean
  onSave?: (updatedProject: Project) => void
  onDelete: (projectId: number) => void
}

type TabType = 'overview' | 'financials' | 'team' | 'tasks' | 'payments'

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

export default function ProjectViewDrawer({
  project,
  isOpen,
  onClose,
  initialEditMode = false,
  onSave,
  onDelete,
}: ProjectViewDrawerProps) {
  const navigate = useNavigate()
  const [localProject, setLocalProject] = useState<Project | null>(project)
  const [isEditing, setIsEditing] = useState(initialEditMode)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Dynamic Metadata
  const [stages, setStages] = useState<ProjectStage[]>([])
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatusItem[]>([])
  const [projectPriorities, setProjectPriorities] = useState<ProjectPriorityItem[]>([])
  const [availableUsers, setAvailableUsers] = useState<ProjectUser[]>([])
  const [leads, setLeads] = useState<any[]>([])

  // Edit form states
  const [projectTitle, setProjectTitle] = useState('')
  const [customerId, setCustomerId] = useState<number | undefined>(undefined)
  const [selectedCompany, setSelectedCompany] = useState<CompanyLookupItem | null>(null)
  const [description, setDescription] = useState('')
  const [leadId, setLeadId] = useState<number | ''>('')
  const [projectManagerId, setProjectManagerId] = useState<number | ''>('')
  const [stageId, setStageId] = useState<number | ''>('')
  const [projectType, setProjectType] = useState('Cloud Infrastructure')
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

  // Populate form state from project
  const populateForm = (p: Project) => {
    setProjectTitle(p.project_title || '')
    setCustomerId(p.customer_id)
    if (p.customer) {
      setSelectedCompany({
        id: p.customer.id,
        company_name: p.customer.company_name,
        company_code: p.customer.customer_code || p.customer.company_code,
        email: p.customer.email,
        phone_number: p.customer.phone,
        status: p.customer.status,
      })
    } else {
      setSelectedCompany(null)
    }
    setDescription(p.description || '')
    setLeadId(p.lead_id || '')
    setProjectManagerId(p.project_manager_id || '')
    setStageId(p.stage_id || '')
    setProjectType(p.project_type || 'Cloud Infrastructure')
    setPriority(p.priority || 'High')
    setStatus(p.status || 'In Progress')
    setStartDate(p.start_date ? p.start_date.substring(0, 10) : '')
    setExpectedEndDate(p.expected_end_date ? p.expected_end_date.substring(0, 10) : '')
    setActualEndDate(p.actual_end_date ? p.actual_end_date.substring(0, 10) : '')
    setBudget(p.budget !== null && p.budget !== undefined ? String(p.budget) : '')
    setQuotedAmount(p.quoted_amount !== null && p.quoted_amount !== undefined ? String(p.quoted_amount) : '')
    setCost(p.cost !== null && p.cost !== undefined ? String(p.cost) : '')
    setRevenue(p.revenue !== null && p.revenue !== undefined ? String(p.revenue) : '')
    setProfit(p.profit !== null && p.profit !== undefined ? String(p.profit) : '')
    setSelectedUserIds(Array.isArray(p.users) ? p.users.map((u) => u.id) : [])
    setSelectedContactIds(
      (p as any).contact_ids || (Array.isArray((p as any).contacts) ? (p as any).contacts.map((c: any) => c.id) : [])
    )
    setSelectedContacts((p as any).contacts || [])
  }

  // Load project details and metadata on drawer open
  useEffect(() => {
    if (project && isOpen) {
      setIsEditing(initialEditMode)
      setLocalProject(project)
      populateForm(project)
      fetchFullProjectDetails(project.id)
      fetchMetadata()
    } else if (!isOpen) {
      setIsEditing(false)
      setShowMoreMenu(false)
      setShowDeleteConfirm(false)
      setValidationError(null)
    }
  }, [project?.id, isOpen, initialEditMode])

  const fetchMetadata = async () => {
    try {
      const [stageRes, statusRes, priorityRes, userRes, leadRes] = await Promise.allSettled([
        projectsApi.getStages(),
        projectsApi.getProjectStatuses(),
        projectsApi.getProjectPriorities(),
        projectsApi.getUsers(),
        projectsApi.getLeads(),
      ])

      if (stageRes.status === 'fulfilled' && stageRes.value.data) {
        setStages(stageRes.value.data)
      }
      if (statusRes.status === 'fulfilled' && statusRes.value.data) {
        setProjectStatuses(statusRes.value.data)
      }
      if (priorityRes.status === 'fulfilled' && priorityRes.value.data) {
        setProjectPriorities(priorityRes.value.data)
      }
      if (userRes.status === 'fulfilled' && userRes.value.data) {
        setAvailableUsers(userRes.value.data)
      }
      if (leadRes.status === 'fulfilled' && leadRes.value.data) {
        setLeads(leadRes.value.data)
      }
    } catch (err) {
      console.error('Failed to load project metadata:', err)
    }
  }

  const fetchFullProjectDetails = async (id: number | string) => {
    setDetailsLoading(true)
    try {
      const res = await projectsApi.getProject(id)
      if (res && res.data) {
        setLocalProject(res.data)
        populateForm(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch project details:', err)
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleStartEdit = () => {
    if (localProject) {
      populateForm(localProject)
    }
    if (activeTab === 'tasks' || activeTab === 'payments') {
      setActiveTab('overview')
    }
    setValidationError(null)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    if (localProject) {
      populateForm(localProject)
    }
    setValidationError(null)
    setIsEditing(false)
  }

  const handleToggleUser = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleSaveClick = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!localProject) return

    if (!projectTitle.trim()) {
      setValidationError('Project title is required')
      return
    }

    setValidationError(null)
    setSaveLoading(true)

    try {
      const payload: UpdateProjectPayload = {
        project_title: projectTitle.trim(),
        customer_id: customerId,
        description: description.trim() || undefined,
        lead_id: leadId ? Number(leadId) : undefined,
        project_manager_id: projectManagerId ? Number(projectManagerId) : undefined,
        stage_id: stageId ? Number(stageId) : undefined,
        project_type: projectType,
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

      const res = await projectsApi.updateProject(localProject.id, payload)
      if (res && res.data) {
        setLocalProject(res.data)
        populateForm(res.data)
        if (onSave) onSave(res.data)
        setIsEditing(false)
      }
    } catch (err: any) {
      console.error('Failed to update project:', err)
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save project updates. Please check the fields and try again.'
      setValidationError(msg)
    } finally {
      setSaveLoading(false)
    }
  }

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  if (!localProject) return null

  // Helpers for displaying stage color and status
  const currentStage =
    stages.find((s) => s.id === localProject.stage_id) || localProject.stage
  const stageColor = currentStage?.color || '#3B82F6'

  // Calculate profit margin
  const quoted = Number(localProject.quoted_amount) || 0
  const costVal = Number(localProject.cost) || 0
  const rev = Number(localProject.revenue) || quoted
  const profitVal = localProject.profit !== null && localProject.profit !== undefined ? Number(localProject.profit) : (rev - costVal)
  const marginPercent = rev > 0 ? Math.round((profitVal / rev) * 100) : 0

  const getPriorityBadgeClass = (p: string) => {
    const val = (p || '').toLowerCase().replace(' priority', '').trim()
    switch (val) {
      case 'urgent':
        return 'badge-danger'
      case 'high':
        return 'badge-warning'
      case 'medium':
        return 'badge-info'
      case 'low':
      default:
        return 'badge-neutral'
    }
  }

  const getStatusBadgeClass = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'completed':
        return 'badge-success'
      case 'in progress':
        return 'badge-primary'
      case 'on hold':
        return 'badge-warning'
      case 'cancelled':
        return 'badge-danger'
      case 'not started':
      default:
        return 'badge-neutral'
    }
  }

  return (
    <>
      <SlideDrawer
        isOpen={isOpen}
        onClose={onClose}
        width="640px"
        title=""
        subtitle=""
        className="contact-view-drawer"
        hideHeader
      >
        <div className="cvd-panel">
          {/* ── HERO BANNER ── */}
          <div className="cvd-hero">
            <div className="cvd-avatar-wrap">
              <div
                className="cvd-avatar flex items-center justify-center font-bold text-white shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${stageColor}, #1e293b)`,
                  fontSize: '22px',
                }}
              >
                <FolderKanban size={28} className="text-white" />
              </div>
            </div>

            {/* Title + Meta */}
            <div className="cvd-hero-info">
              {isEditing ? (
                <div className="cvd-name-edit-row">
                  <input
                    type="text"
                    className="form-input form-input-sm"
                    placeholder="Project Title"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    style={{ maxWidth: 320 }}
                  />
                </div>
              ) : (
                <div className="cvd-name-row">
                  <h2 className="cvd-name" title={localProject.project_title}>
                    {localProject.project_title}
                  </h2>
                  {detailsLoading && (
                    <Loader2 size={13} className="animate-spin text-primary-500" />
                  )}
                  <span
                    className="badge text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${stageColor}15`,
                      color: stageColor,
                      border: `1px solid ${stageColor}40`,
                    }}
                  >
                    {currentStage?.name || localProject.stage?.name || '—'}
                  </span>
                </div>
              )}

              <p className="cvd-subtitle">
                <span className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    {localProject.project_code}
                  </span>
                  <span>•</span>
                  <span className="font-medium text-slate-700">
                    {selectedCompany?.company_name || localProject.customer?.company_name || 'Independent Client'}
                  </span>
                  {localProject.priority && (
                    <>
                      <span>•</span>
                      <span className="font-semibold text-slate-600">{localProject.priority} Priority</span>
                    </>
                  )}
                  {localProject.project_type && (
                    <>
                      <span>•</span>
                      <span>{localProject.project_type}</span>
                    </>
                  )}
                </span>
              </p>
            </div>

            {/* Close button top-right */}
            <button className="cvd-close-btn" onClick={onClose} title="Close">
              <span style={{ fontSize: 18, lineHeight: 1, color: '#94a3b8' }}>×</span>
            </button>
          </div>

          {/* ── ACTION BUTTONS ROW ── */}
          {!isEditing ? (
            <div className="cvd-actions-row">
              <button className="cvd-btn-primary" onClick={handleStartEdit}>
                <Edit2 size={13} />
                <span>Edit</span>
              </button>
              <button
                type="button"
                className="cvd-btn-outline"
                onClick={() => {
                  if (localProject) {
                    onClose()
                    navigate(`/projects/${localProject.id}`)
                  }
                }}
              >
                <LayoutGrid size={13} />
                <span>Go to Project</span>
              </button>
              <div style={{ position: 'relative', marginLeft: 'auto' }}>
                <button
                  className="cvd-btn-outline"
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                >
                  <MoreHorizontal size={13} />
                  <span>More</span>
                </button>
                {showMoreMenu && (
                  <div
                    className="dropdown-menu animate-fade-in"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      marginTop: 4,
                      zIndex: 50,
                    }}
                  >
                    <button
                      className="dropdown-item text-danger"
                      onClick={() => {
                        setShowMoreMenu(false)
                        setShowDeleteConfirm(true)
                      }}
                    >
                      <Trash2 size={14} /> Delete Project
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── EDIT MODE SAVE BAR ── */
            <div className="cvd-edit-bar">
              <div className="flex items-center gap-2">
                <span className="contact-edit-badge">Edit Mode</span>
                <span className="text-xs text-gray-500">
                  Updating {localProject.project_code}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleCancelEdit}
                  disabled={saveLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                  onClick={handleSaveClick}
                  disabled={saveLoading}
                >
                  {saveLoading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Save size={13} />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          )}

          {/* Validation error */}
          {validationError && (
            <div className="cvd-validation-error">
              <AlertCircle size={13} />
              <span>{validationError}</span>
            </div>
          )}

          {/* ── TAB BAR ── */}
          <div className="cvd-tabs">
            <button
              className={`cvd-tab${activeTab === 'overview' ? ' cvd-tab-active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              {isEditing ? 'Edit Information' : 'Overview'}
            </button>
            {!isEditing && (
              <>
                <button
                  className={`cvd-tab${activeTab === 'financials' ? ' cvd-tab-active' : ''}`}
                  onClick={() => setActiveTab('financials')}
                >
                  Financials & Budget
                </button>
                <button
                  className={`cvd-tab${activeTab === 'team' ? ' cvd-tab-active' : ''}`}
                  onClick={() => setActiveTab('team')}
                >
                  Team Members ({localProject.users?.length || 0})
                </button>
                <button
                  className={`cvd-tab${activeTab === 'tasks' ? ' cvd-tab-active' : ''}`}
                  onClick={() => setActiveTab('tasks')}
                >
                  Tasks ({localProject.tasks_count ?? 0})
                </button>
                <button
                  className={`cvd-tab${activeTab === 'payments' ? ' cvd-tab-active' : ''}`}
                  onClick={() => setActiveTab('payments')}
                >
                  Payments ({localProject.payments_count ?? 0})
                </button>
              </>
            )}
          </div>

          {/* ── DRAWER BODY CONTENT ── */}
          <div className="cvd-body">
            {/* ──────── OVERVIEW TAB ──────── */}
            {activeTab === 'overview' && (
              <div className="cvd-tab-pane">
                {isEditing ? (
                  /* EDIT MODE FOR OVERVIEW */
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
                              if (id !== customerId) {
                                setSelectedContactIds([])
                                setSelectedContacts([])
                              }
                            }}
                            placeholder="Select client company..."
                            required
                          />
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
                              {availableUsers.map((u) => (
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
                          {availableUsers.map((u) => {
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
                ) : (
                  /* VIEW MODE FOR OVERVIEW */
                  <div className="space-y-4">
                    {/* General Specs Card */}
                    <div className="cvd-card">
                      <div className="cvd-card-header">
                        <span className="cvd-card-title flex items-center gap-1.5">
                          <FolderKanban size={14} className="text-primary-600" />
                          Project Specifications
                        </span>
                        <button
                          className="cvd-section-edit-btn"
                          onClick={handleStartEdit}
                          title="Edit Specs"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>

                      <div className="cvd-info-list">
                        <div className="cvd-info-row">
                          <span className="cvd-info-label">
                            <Tag size={13} /> Project Code
                          </span>
                          <span className="cvd-info-value font-mono font-medium text-gray-700">
                            {localProject.project_code}
                          </span>
                        </div>

                        <div className="cvd-info-row">
                          <span className="cvd-info-label">
                            <Layers size={13} /> Project Stage
                          </span>
                          <span className="cvd-info-value">
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor: `${stageColor}15`,
                                color: stageColor,
                                border: `1px solid ${stageColor}30`,
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: stageColor }}
                              />
                              {currentStage?.name || localProject.stage?.name || '—'}
                            </span>
                          </span>
                        </div>

                        <div className="cvd-info-row">
                          <span className="cvd-info-label">
                            <Clock size={13} /> Project Status
                          </span>
                          <span className="cvd-info-value">
                            <span className={`badge ${getStatusBadgeClass(localProject.status)}`}>
                              {localProject.status || 'Not Started'}
                            </span>
                          </span>
                        </div>

                        <div className="cvd-info-row">
                          <span className="cvd-info-label">
                            <Tag size={13} /> Priority
                          </span>
                          <span className="cvd-info-value">
                            <span className={`badge ${getPriorityBadgeClass(localProject.priority)}`}>
                              {localProject.priority?.includes('Priority')
                                ? localProject.priority
                                : `${localProject.priority || 'Low'} Priority`}
                            </span>
                          </span>
                        </div>

                        <div className="cvd-info-row">
                          <span className="cvd-info-label">
                            <Briefcase size={13} /> Type
                          </span>
                          <span className="cvd-info-value font-medium text-gray-800">
                            {localProject.project_type || 'Custom Project'}
                          </span>
                        </div>

                        <div className="cvd-info-row">
                          <span className="cvd-info-label">
                            <Calendar size={13} /> Start Date
                          </span>
                          <span className="cvd-info-value text-gray-700">
                            {localProject.start_date
                              ? new Date(localProject.start_date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'Not specified'}
                          </span>
                        </div>

                        <div className="cvd-info-row">
                          <span className="cvd-info-label">
                            <Calendar size={13} /> Expected Completion
                          </span>
                          <span className="cvd-info-value text-gray-700">
                            {localProject.expected_end_date
                              ? new Date(localProject.expected_end_date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'Open-ended'}
                          </span>
                        </div>

                        {localProject.actual_end_date && (
                          <div className="cvd-info-row">
                            <span className="cvd-info-label">
                              <CheckCircle size={13} className="text-emerald-500" /> Completed On
                            </span>
                            <span className="cvd-info-value text-emerald-700 font-medium">
                              {new Date(localProject.actual_end_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Client & Organization Card */}
                    <div className="cvd-card">
                      <div className="cvd-card-header">
                        <span className="cvd-card-title flex items-center gap-1.5">
                          <Building2 size={14} className="text-primary-600" />
                          Client Organization
                        </span>
                      </div>
                      <div className="p-4">
                        {localProject.customer ? (
                          <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm shrink-0">
                              <Building2 size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 text-sm">
                                {capitalizeWords(localProject.customer.company_name)}
                              </h4>
                              {localProject.customer.customer_code && (
                                <p className="text-xs font-mono text-gray-500 mt-0.5">
                                  {localProject.customer.customer_code}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-600">
                                {localProject.customer.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail size={12} className="text-gray-400" />
                                    {localProject.customer.email}
                                  </span>
                                )}
                                {localProject.customer.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone size={12} className="text-gray-400" />
                                    {localProject.customer.phone}
                                  </span>
                                )}
                              </div>

                              {selectedContacts.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <span className="text-xs font-semibold text-gray-700 block mb-1.5">
                                    Company Contacts ({selectedContacts.length})
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {selectedContacts.map((c) => {
                                      const name = c.full_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.name || c.email
                                      return (
                                        <span
                                          key={c.id}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-medium border border-blue-200"
                                        >
                                          <span>{name}</span>
                                          {c.designation && <span className="text-slate-400 text-[10px]">({c.designation})</span>}
                                        </span>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic">No client profile assigned.</p>
                        )}
                      </div>
                    </div>

                    {/* Project Manager Card */}
                    <div className="cvd-card">
                      <div className="cvd-card-header">
                        <span className="cvd-card-title flex items-center gap-1.5">
                          <User size={14} className="text-primary-600" />
                          Project Manager
                        </span>
                      </div>
                      <div className="p-4">
                        {localProject.manager ? (
                          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                              {localProject.manager.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .substring(0, 2)
                                .toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 text-sm">
                                {capitalizeWords(localProject.manager.name)}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {localProject.manager.designation || 'Project Manager'}
                              </p>
                              {localProject.manager.email && (
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                  <Mail size={11} className="text-gray-400" />
                                  {localProject.manager.email}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic">
                            No dedicated project manager appointed.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Scope / Description Card */}
                    <div className="cvd-card">
                      <div className="cvd-card-header">
                        <span className="cvd-card-title flex items-center gap-1.5">
                          <FileText size={14} className="text-primary-600" />
                          Project Scope & Description
                        </span>
                      </div>
                      <div className="p-4">
                        {localProject.description ? (
                          <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {localProject.description}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No description provided.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ──────── FINANCIALS TAB (READ-ONLY) ──────── */}
            {activeTab === 'financials' && (
              <div className="cvd-tab-pane space-y-4">
                {/* Stat Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs">
                        <span className="text-xs text-gray-500 font-medium block">
                          Quoted Amount
                        </span>
                        <span className="text-base font-bold text-gray-900 mt-0.5 block">
                          ${quoted.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[11px] text-gray-400 mt-1 block">Contract value</span>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs">
                        <span className="text-xs text-gray-500 font-medium block">
                          Allocated Budget
                        </span>
                        <span className="text-base font-bold text-primary-600 mt-0.5 block">
                          ${(Number(localProject.budget) || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                        <span className="text-[11px] text-gray-400 mt-1 block">Target threshold</span>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs">
                        <span className="text-xs text-gray-500 font-medium block">
                          Estimated / Real Cost
                        </span>
                        <span className="text-base font-bold text-amber-600 mt-0.5 block">
                          ${costVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[11px] text-gray-400 mt-1 block">Expenditure to date</span>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs">
                        <span className="text-xs text-gray-500 font-medium block">
                          Realized Revenue
                        </span>
                        <span className="text-base font-bold text-blue-600 mt-0.5 block">
                          ${rev.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[11px] text-gray-400 mt-1 block">Billed / collected</span>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs">
                        <span className="text-xs text-gray-500 font-medium block">Net Profit</span>
                        <span
                          className={`text-base font-bold mt-0.5 block ${
                            profitVal >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          ${profitVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[11px] text-gray-400 mt-1 block">Net returns</span>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs">
                        <span className="text-xs text-gray-500 font-medium block">Profit Margin</span>
                        <span
                          className={`text-base font-bold mt-0.5 block ${
                            marginPercent >= 20 ? 'text-emerald-600' : 'text-blue-600'
                          }`}
                        >
                          {marginPercent}%
                        </span>
                        <span className="text-[11px] text-gray-400 mt-1 block">Return on revenue</span>
                      </div>
                    </div>

                    {/* Budget Variance Visual Card */}
                    <div className="cvd-card">
                      <div className="cvd-card-header">
                        <span className="cvd-card-title flex items-center gap-1.5">
                          <TrendingUp size={14} className="text-primary-600" />
                          Cost vs Budget Analysis
                        </span>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Cost Burn Rate</span>
                          <span className="font-semibold">
                            {Number(localProject.budget) > 0
                              ? Math.min(
                                  100,
                                  Math.round((costVal / Number(localProject.budget)) * 100)
                                )
                              : 0}
                            % of budget consumed
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              Number(localProject.budget) > 0 && costVal > Number(localProject.budget)
                                ? 'bg-rose-500'
                                : 'bg-primary-500'
                            }`}
                            style={{
                              width: `${
                                Number(localProject.budget) > 0
                                  ? Math.min(100, (costVal / Number(localProject.budget)) * 100)
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

            {/* ──────── TEAM TAB (READ-ONLY) ──────── */}
            {activeTab === 'team' && (
              <div className="cvd-tab-pane space-y-4">
                <div className="space-y-3">
                  {localProject.users && localProject.users.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {localProject.users.map((u) => (
                        <div
                          key={u.id}
                            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-xs"
                          >
                            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs shrink-0">
                              {u.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .substring(0, 2)
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-semibold text-gray-900 truncate">
                                {capitalizeWords(u.name)}
                              </h4>
                              <p className="text-[11px] text-gray-500 truncate">
                                {u.designation || capitalizeWords(u.role || 'Developer')}
                              </p>
                              {u.email && (
                                <p className="text-[11px] text-gray-400 truncate mt-0.5">
                                  {u.email}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Users size={28} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-xs font-medium text-gray-600">
                          No team members assigned yet
                        </p>
                        <button
                          className="btn btn-outline btn-xs mt-3"
                          onClick={handleStartEdit}
                        >
                          <Plus size={12} /> Assign Members
                        </button>
                      </div>
                    )}
                  </div>
              </div>
            )}

            {/* ──────── TASKS TAB ──────── */}
            {activeTab === 'tasks' && (
              <div className="cvd-tab-pane space-y-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <CheckSquare size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        Associated Tasks ({localProject.tasks_count ?? 0})
                      </h4>
                      <p className="text-xs text-gray-500">
                        Track progress, milestones, and deliverables
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-primary font-mono text-xs">
                    {localProject.tasks_count ?? 0} Total
                  </span>
                </div>

                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <Clock size={24} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-xs text-gray-500">
                    {localProject.tasks_count
                      ? `${localProject.tasks_count} tasks are tracked for ${localProject.project_code}`
                      : 'No tasks have been assigned to this project yet.'}
                  </p>
                </div>
              </div>
            )}

            {/* ──────── PAYMENTS TAB ──────── */}
            {activeTab === 'payments' && (
              <div className="cvd-tab-pane space-y-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <DollarSign size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        Invoices & Payments ({localProject.payments_count ?? 0})
                      </h4>
                      <p className="text-xs text-gray-500">
                        Payment records and receivables breakdown
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-success font-mono text-xs">
                    {localProject.payments_count ?? 0} Recorded
                  </span>
                </div>

                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <FileText size={24} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-xs text-gray-500">
                    {localProject.payments_count
                      ? `${localProject.payments_count} payment transactions registered.`
                      : 'No payments have been recorded for this project.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </SlideDrawer>

      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false)
          onDelete(localProject.id)
        }}
        title="Delete Project"
        message={`Are you sure you want to delete "${localProject.project_title}" (${localProject.project_code})? This action cannot be undone.`}
        confirmText="Delete Project"
        confirmVariant="danger"
      />
    </>
  )
}
