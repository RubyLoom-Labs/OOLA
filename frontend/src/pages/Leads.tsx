import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Target,
  Plus,
  Search,
  LayoutGrid,
  List,
  Clock,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Eye,
  Edit2,
  Trash2,
  Building2,
  Mail,
  Phone,
  GripVertical,
  ArrowRight,
  User,
} from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import StatCard from '@/components/common/StatCard'
import Breadcrumb from '@/components/ui/Breadcrumb'
import DataTable, { type Column } from '@/components/common/DataTable'
import ActionDropdown, { type ActionDropdownItem } from '@/components/common/ActionDropdown'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import SlideDrawer from '@/components/common/SlideDrawer'
import { capitalizeWords } from '@/lib/utils'
import {
  leadsApi,
  type LeadItem,
  type LeadStageItem,
  type LeadSourceItem,
  type CreateLeadPayload,
} from '@/apis/leadsApi'
import { companiesApi, type CompanyLookupItem } from '@/apis/companiesApi'

type ViewMode = 'kanban' | 'table'

interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

const DEFAULT_STAGE_COLORS = [
  '#64748B',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#F59E0B',
  '#10B981',
  '#EF4444',
]

const DEFAULT_LEAD_STAGES: LeadStageItem[] = [
  { id: 1, name: 'New', slug: 'new', color: '#64748B', order_column: 1, is_won: false, is_lost: false },
  { id: 2, name: 'Contacted', slug: 'contacted', color: '#3B82F6', order_column: 2, is_won: false, is_lost: false },
  { id: 3, name: 'Qualified', slug: 'qualified', color: '#6366F1', order_column: 3, is_won: false, is_lost: false },
  { id: 4, name: 'Requirement Gathering', slug: 'requirement-gathering', color: '#8B5CF6', order_column: 4, is_won: false, is_lost: false },
  { id: 5, name: 'Proposal', slug: 'proposal', color: '#EC4899', order_column: 5, is_won: false, is_lost: false },
  { id: 6, name: 'Negotiation', slug: 'negotiation', color: '#F59E0B', order_column: 6, is_won: false, is_lost: false },
  { id: 7, name: 'Won', slug: 'won', color: '#10B981', order_column: 7, is_won: true, is_lost: false },
  { id: 8, name: 'Lost', slug: 'lost', color: '#EF4444', order_column: 8, is_won: false, is_lost: true },
]

export default function Leads() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [leads, setLeads] = useState<LeadItem[]>([])
  const [stages, setStages] = useState<LeadStageItem[]>(DEFAULT_LEAD_STAGES)
  const [sources, setSources] = useState<LeadSourceItem[]>([])
  const [companies, setCompanies] = useState<CompanyLookupItem[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  // Table pagination & selection
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  })

  // Kanban Drag-and-Drop state
  const [draggingLeadId, setDraggingLeadId] = useState<number | null>(null)
  const [dragOverStageId, setDragOverStageId] = useState<number | null>(null)

  // Drawers & Modals
  const [viewingLead, setViewingLead] = useState<LeadItem | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<LeadItem | null>(null)
  const [formSaving, setFormSaving] = useState(false)
  const [formData, setFormData] = useState<CreateLeadPayload>({
    lead_title: '',
    requirement_name: '',
    requirement_details: '',
    customer_id: null,
    lead_source_id: null,
    lead_stage_id: null,
    budget_quoted: 0,
    currency: 'LKR',
    priority: 'Medium',
    status: 'Active',
    next_step: '',
    expected_closing_date: '',
  })

  const [leadToDelete, setLeadToDelete] = useState<LeadItem | null>(null)

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Debounce search
  useEffect(() => {
    if (searchQuery === debouncedSearch) return
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, debouncedSearch])

  // Load metadata: Lead Stages, Lead Sources, Companies Lookup
  const loadMetadata = useCallback(async () => {
    try {
      const [stagesRes, sourcesRes, companiesRes] = await Promise.allSettled([
        leadsApi.getLeadStages(),
        leadsApi.getLeadSources(),
        companiesApi.getLookup(),
      ])

      if (
        stagesRes.status === 'fulfilled' &&
        Array.isArray(stagesRes.value) &&
        stagesRes.value.length > 0
      ) {
        setStages(stagesRes.value)
      }
      if (sourcesRes.status === 'fulfilled' && Array.isArray(sourcesRes.value)) {
        setSources(sourcesRes.value)
      }
      if (
        companiesRes.status === 'fulfilled' &&
        Array.isArray(companiesRes.value?.data)
      ) {
        setCompanies(companiesRes.value.data)
      }
    } catch (err) {
      console.error('Failed to load lead metadata:', err)
    }
  }, [])

  useEffect(() => {
    loadMetadata()
  }, [loadMetadata])

  // Fetch Leads from Backend API
  const fetchLeadsData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await leadsApi.getLeads({
        page: viewMode === 'table' ? currentPage : 1,
        per_page: viewMode === 'table' ? perPage : 200,
        search: debouncedSearch.trim() || undefined,
        stage_id: stageFilter === 'all' ? undefined : Number(stageFilter),
        priority: priorityFilter === 'all' ? undefined : priorityFilter,
      })

      const dataList: LeadItem[] = Array.isArray(res.data) ? res.data : []
      setLeads(dataList)

      if (res.meta) {
        setMeta({
          current_page: res.meta.current_page || currentPage,
          last_page: res.meta.last_page || 1,
          per_page: res.meta.per_page || perPage,
          total: res.meta.total ?? dataList.length,
        })
      } else {
        setMeta({
          current_page: currentPage,
          last_page: Math.max(1, Math.ceil(dataList.length / perPage)),
          per_page: perPage,
          total: dataList.length,
        })
      }
    } catch (err) {
      console.error('Failed to fetch leads from backend:', err)
      setLeads([])
      setMeta({
        current_page: 1,
        last_page: 1,
        per_page: perPage,
        total: 0,
      })
    } finally {
      setLoading(false)
    }
  }, [viewMode, currentPage, perPage, debouncedSearch, stageFilter, priorityFilter])

  useEffect(() => {
    fetchLeadsData()
  }, [fetchLeadsData])

  // Helper formatters
  const getCompanyOrClientName = (lead: LeadItem): string => {
    if (lead.customer?.company_name) {
      return lead.customer.company_name
    }
    const senderName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
    if (senderName) return senderName
    if (lead.email) return lead.email
    return 'Direct Lead'
  }

  const getAssigneeInfo = (lead: LeadItem) => {
    const firstUser =
      Array.isArray(lead.users) && lead.users.length > 0 ? lead.users[0] : null
    const senderName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
    const name = firstUser?.name || senderName || 'Unassigned'
    const parts = name.trim().split(/\s+/)
    const initials =
      parts.length >= 2
        ? `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
        : name.slice(0, 2).toUpperCase() || 'LD'
    return { name, initials }
  }

  const getDaysInStage = (lead: LeadItem): number => {
    const refDate = lead.updated_at || lead.created_at
    if (!refDate) return 1
    const diffMs = Date.now() - new Date(refDate).getTime()
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    return Math.max(1, days)
  }

  const formatBudget = (lead: LeadItem): string => {
    const amount = Number(lead.budget_quoted) || 0
    return `${lead.currency || 'LKR'} ${amount.toLocaleString()}`
  }

  const getPriorityBadgeClass = (priority: string) => {
    switch ((priority || '').toLowerCase()) {
      case 'urgent':
      case 'high':
        return 'badge-danger'
      case 'medium':
        return 'badge-warning'
      case 'low':
      default:
        return 'badge-gray'
    }
  }

  const resolveStageForLead = (lead: LeadItem): LeadStageItem | undefined => {
    if (lead.lead_stage_id) {
      const byId = stages.find((s) => s.id === Number(lead.lead_stage_id))
      if (byId) return byId
    }
    if (lead.stage?.id) {
      const byNestedId = stages.find((s) => s.id === Number(lead.stage?.id))
      if (byNestedId) return byNestedId
    }
    if (lead.stage?.name) {
      const byName = stages.find(
        (s) => s.name.toLowerCase() === lead.stage!.name.toLowerCase()
      )
      if (byName) return byName
    }
    return stages[0]
  }

  // Group leads by stage for Kanban View
  const getLeadsForStage = (stage: LeadStageItem): LeadItem[] => {
    return leads.filter((lead) => {
      if (lead.lead_stage_id && Number(lead.lead_stage_id) === stage.id) {
        return true
      }
      if (lead.stage?.id && Number(lead.stage.id) === stage.id) {
        return true
      }
      if (
        !lead.lead_stage_id &&
        lead.stage?.name &&
        lead.stage.name.toLowerCase() === stage.name.toLowerCase()
      ) {
        return true
      }
      // Fallback to first stage if lead has no stage assigned
      if (!lead.lead_stage_id && !lead.stage && stages[0]?.id === stage.id) {
        return true
      }
      return false
    })
  }

  // Summary Stats
  const stats = useMemo(() => {
    const totalCount = meta.total || leads.length
    const wonCount = leads.filter(
      (l) => l.status === 'Won' || Boolean(l.stage?.is_won)
    ).length
    const activeCount = leads.filter(
      (l) =>
        l.status === 'Active' &&
        !l.stage?.is_won &&
        !l.stage?.is_lost
    ).length
    const totalPipelineValue = leads.reduce(
      (sum, l) => sum + (Number(l.budget_quoted) || 0),
      0
    )
    return {
      totalCount,
      activeCount,
      wonCount,
      totalPipelineValue,
    }
  }, [leads, meta.total])

  // ── Kanban Drag and Drop Handlers ──
  const handleDragStart = (e: React.DragEvent, leadId: number) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(leadId))
    setDraggingLeadId(leadId)
  }

  const handleDragEnd = () => {
    setDraggingLeadId(null)
    setDragOverStageId(null)
  }

  const handleDragOver = (e: React.DragEvent, stageId: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverStageId !== stageId) {
      setDragOverStageId(stageId)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setDragOverStageId(null)
  }

  const handleStageChange = async (lead: LeadItem, targetStage: LeadStageItem) => {
    const currentStage = resolveStageForLead(lead)
    if (currentStage && currentStage.id === targetStage.id) return

    const previousLeads = [...leads]

    // Optimistic update
    const updatedLead: LeadItem = {
      ...lead,
      lead_stage_id: targetStage.id,
      stage: targetStage,
      status: targetStage.is_won
        ? 'Won'
        : targetStage.is_lost
          ? 'Lost'
          : 'Active',
    }

    setLeads((prev) =>
      prev.map((item) => (item.id === lead.id ? updatedLead : item))
    )
    if (viewingLead && viewingLead.id === lead.id) {
      setViewingLead(updatedLead)
    }

    try {
      const savedLead = await leadsApi.updateLeadStage(lead.id, targetStage.id)
      setLeads((prev) =>
        prev.map((item) =>
          item.id === lead.id
            ? {
                ...updatedLead,
                ...savedLead,
                lead_stage_id: targetStage.id,
                stage: savedLead.stage || targetStage,
              }
            : item
        )
      )
      showToast(`Moved "${lead.lead_title}" to ${targetStage.name}`)
    } catch (err: any) {
      console.error('Failed to update lead stage:', err)
      setLeads(previousLeads)
      showToast(err?.message || 'Failed to move lead stage')
    }
  }

  const handleDrop = async (e: React.DragEvent, targetStage: LeadStageItem) => {
    e.preventDefault()
    const rawId = e.dataTransfer.getData('text/plain')
    const leadId = rawId ? Number(rawId) : draggingLeadId

    setDraggingLeadId(null)
    setDragOverStageId(null)

    if (!leadId) return
    const draggedLead = leads.find((l) => l.id === leadId)
    if (!draggedLead) return

    await handleStageChange(draggedLead, targetStage)
  }

  // ── Create / Edit / View / Delete Handlers ──
  const handleOpenView = (lead: LeadItem) => {
    setViewingLead(lead)
    setIsViewOpen(true)
  }

  const handleOpenCreateForm = (defaultStageId?: number) => {
    setEditingLead(null)
    setFormData({
      lead_title: '',
      requirement_name: '',
      requirement_details: '',
      customer_id: null,
      lead_source_id: sources[0]?.id ?? null,
      lead_stage_id: defaultStageId ?? stages[0]?.id ?? null,
      budget_quoted: 0,
      currency: 'LKR',
      priority: 'Medium',
      status: 'Active',
      next_step: '',
      expected_closing_date: '',
    })
    setIsFormOpen(true)
  }

  const handleOpenEditForm = (lead: LeadItem) => {
    setEditingLead(lead)
    setFormData({
      lead_title: lead.lead_title || '',
      requirement_name: lead.requirement_name || '',
      requirement_details: lead.requirement_details || '',
      customer_id: lead.customer_id ?? null,
      lead_source_id: lead.lead_source_id ?? sources[0]?.id ?? null,
      lead_stage_id: lead.lead_stage_id ?? lead.stage?.id ?? stages[0]?.id ?? null,
      budget_quoted: Number(lead.budget_quoted) || 0,
      currency: lead.currency || 'LKR',
      priority: lead.priority || 'Medium',
      status: lead.status || 'Active',
      next_step: lead.next_step || '',
      expected_closing_date: lead.expected_closing_date || '',
    })
    setIsFormOpen(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.lead_title.trim()) {
      showToast('Lead title is required.')
      return
    }

    setFormSaving(true)
    try {
      const payload: CreateLeadPayload = {
        ...formData,
        lead_title: formData.lead_title.trim(),
        requirement_name: formData.requirement_name?.trim() || null,
        requirement_details: formData.requirement_details?.trim() || null,
        next_step: formData.next_step?.trim() || null,
        expected_closing_date: formData.expected_closing_date || null,
      }

      if (editingLead) {
        const updated = await leadsApi.updateLead(editingLead.id, payload)
        showToast(`Lead "${updated.lead_title}" updated successfully`)
        if (viewingLead && viewingLead.id === editingLead.id) {
          setViewingLead(updated)
        }
      } else {
        const created = await leadsApi.createLead(payload)
        showToast(`Lead "${created.lead_title}" created successfully`)
      }

      setIsFormOpen(false)
      setEditingLead(null)
      await fetchLeadsData()
    } catch (err: any) {
      showToast(err?.message || 'Failed to save lead')
    } finally {
      setFormSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return
    const target = leadToDelete
    try {
      await leadsApi.deleteLead(target.id)
      showToast(`Lead "${target.lead_title}" deleted successfully`)
      if (viewingLead && viewingLead.id === target.id) {
        setIsViewOpen(false)
        setViewingLead(null)
      }
      setLeadToDelete(null)
      await fetchLeadsData()
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete lead')
    }
  }

  // Row Actions for Table & Cards
  const getLeadActionItems = (lead: LeadItem): ActionDropdownItem[] => {
    const items: ActionDropdownItem[] = [
      {
        key: 'view',
        label: 'View Details',
        icon: <Eye size={14} />,
        onClick: () => handleOpenView(lead),
      },
      {
        key: 'edit',
        label: 'Edit Lead',
        icon: <Edit2 size={14} />,
        onClick: () => handleOpenEditForm(lead),
      },
    ]

    if (stages.length > 0) {
      items.push({
        key: 'divider-stage',
        label: '',
        divider: true,
      })

      stages.forEach((st) => {
        const currentSt = resolveStageForLead(lead)
        if (currentSt?.id !== st.id) {
          items.push({
            key: `move-stage-${st.id}`,
            label: `Move to ${st.name}`,
            icon: <ArrowRight size={14} />,
            onClick: () => handleStageChange(lead, st),
          })
        }
      })
    }

    items.push(
      {
        key: 'divider-delete',
        label: '',
        divider: true,
      },
      {
        key: 'delete',
        label: 'Delete Lead',
        icon: <Trash2 size={14} />,
        danger: true,
        onClick: () => setLeadToDelete(lead),
      }
    )

    return items
  }

  // Table Columns
  const leadColumns: Column<LeadItem>[] = [
    {
      key: 'lead_title',
      header: 'LEAD',
      render: (lead) => (
        <div className="contact-name-cell">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-2xs">
            <Target size={16} />
          </div>
          <div className="min-w-0">
            <div className="contact-table-name font-semibold text-slate-900 truncate">
              {capitalizeWords(lead.lead_title)}
            </div>
            <div className="contact-table-designation text-muted text-xs truncate font-mono">
              {lead.lead_code}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'company',
      header: 'CLIENT / SENDER',
      render: (lead) => {
        const clientName = getCompanyOrClientName(lead)
        return (
          <div className="min-w-0">
            <div className="font-medium text-slate-800 text-sm truncate">
              {capitalizeWords(clientName)}
            </div>
            {(lead.email || lead.contact_number) && (
              <div className="text-xs text-slate-400 truncate">
                {lead.email || lead.contact_number}
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'stage',
      header: 'STAGE',
      render: (lead) => {
        const st = resolveStageForLead(lead)
        const color = st?.color || '#3B82F6'
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
            style={{
              backgroundColor: `${color}15`,
              color,
              border: `1px solid ${color}35`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            {st?.name || lead.stage?.name || 'New'}
          </span>
        )
      },
    },
    {
      key: 'priority',
      header: 'PRIORITY',
      render: (lead) => (
        <span className={`badge ${getPriorityBadgeClass(lead.priority)}`}>
          {capitalizeWords(lead.priority)}
        </span>
      ),
    },
    {
      key: 'budget',
      header: 'BUDGET',
      render: (lead) => (
        <span className="font-semibold text-slate-800 text-sm whitespace-nowrap">
          {formatBudget(lead)}
        </span>
      ),
    },
    {
      key: 'assignee',
      header: 'ASSIGNED',
      render: (lead) => {
        const { name, initials } = getAssigneeInfo(lead)
        return (
          <div className="flex items-center gap-2">
            <div
              className="avatar avatar-sm avatar-primary shrink-0"
              style={{ width: 24, height: 24, fontSize: 9 }}
            >
              {initials}
            </div>
            <span className="text-xs font-medium text-slate-700 truncate max-w-[130px]">
              {capitalizeWords(name)}
            </span>
          </div>
        )
      },
    },
    {
      key: 'nextStep',
      header: 'NEXT STEP',
      render: (lead) => (
        <span className="text-slate-600 text-xs truncate max-w-[180px] block">
          {lead.next_step || lead.contact_number || 'Initial Follow-up'}
        </span>
      ),
    },
    {
      key: 'daysInStage',
      header: 'DAYS',
      render: (lead) => (
        <span className="text-slate-500 text-xs font-medium">
          {getDaysInStage(lead)}d
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      width: 60,
      align: 'center',
      render: (lead) => (
        <div onClick={(e) => e.stopPropagation()}>
          <ActionDropdown minWidth={190} items={getLeadActionItems(lead)} />
        </div>
      ),
    },
  ]

  return (
    <div className="contacts-module-container animate-fade-in min-w-0 max-w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="module-toast animate-slide-up">
          <CheckCircle size={16} className="text-success-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Leads' }]} />

      {/* Page Header with Kanban / Table Switcher + New Lead Button */}
      <PageHeader
        icon={<Target size={24} />}
        title="Leads"
        description="Manage and track your sales pipeline. Drag and drop cards across stages in Kanban view or switch to Table view."
        actions={
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200"
              role="group"
              aria-label="Lead view mode"
            >
              <button
                type="button"
                className={`btn btn-sm flex items-center gap-1.5 ${
                  viewMode === 'kanban' ? 'btn-primary shadow-2xs' : 'btn-ghost'
                }`}
                onClick={() => setViewMode('kanban')}
              >
                <LayoutGrid size={14} />
                <span>Kanban</span>
              </button>
              <button
                type="button"
                className={`btn btn-sm flex items-center gap-1.5 ${
                  viewMode === 'table' ? 'btn-primary shadow-2xs' : 'btn-ghost'
                }`}
                onClick={() => setViewMode('table')}
              >
                <List size={14} />
                <span>Table</span>
              </button>
            </div>

            <button
              type="button"
              className="btn btn-primary shadow-sm flex items-center gap-1.5"
              onClick={() => handleOpenCreateForm()}
            >
              <Plus size={16} />
              <span>New Lead</span>
            </button>
          </div>
        }
      />

      {/* Summary Stat Cards */}
      <div className="contacts-stats-grid">
        <StatCard
          label="Total Leads"
          value={stats.totalCount}
          icon={<Target size={20} />}
          variant="blue"
          active={stageFilter === 'all'}
          onClick={() => {
            setStageFilter('all')
            setCurrentPage(1)
          }}
        />
        <StatCard
          label="Active Pipeline"
          value={stats.activeCount}
          icon={<TrendingUp size={20} />}
          variant="amber"
        />
        <StatCard
          label="Won Leads"
          value={stats.wonCount}
          icon={<CheckCircle size={20} />}
          variant="green"
        />
        <StatCard
          label="Pipeline Value"
          value={`LKR ${stats.totalPipelineValue.toLocaleString()}`}
          icon={<DollarSign size={20} />}
          variant="purple"
        />
      </div>

      {/* Filter & Search Toolbar */}
      <div className="contacts-filter-bar">
        <div className="contacts-filter-left">
          {/* Stage Filter */}
          <div className="relative">
            <select
              className="form-select contacts-status-select"
              value={stageFilter}
              onChange={(e) => {
                setStageFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="all">All Stages</option>
              {stages.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <select
              className="form-select contacts-status-select"
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="all">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="contacts-search-box">
            <Search size={16} className="contacts-search-icon" />
            <input
              type="text"
              className="contacts-search-input"
              placeholder="Search leads by title, code, client, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="contacts-filter-right">
          {viewMode === 'table' && (
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
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          )}

          <div className="view-mode-toggle-box">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
              title="Kanban View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Kanban View vs Table View */}
      {viewMode === 'kanban' ? (
        <div className="kanban-board">
          {stages.map((stage, idx) => {
            const stageColor =
              stage.color || DEFAULT_STAGE_COLORS[idx % DEFAULT_STAGE_COLORS.length]
            const stageLeads = getLeadsForStage(stage)
            const isDropTarget = dragOverStageId === stage.id

            return (
              <div
                key={stage.id}
                className={`kanban-column transition-all ${
                  isDropTarget
                    ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50/40'
                    : ''
                }`}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage)}
              >
                <div className="kanban-column-header">
                  <div className="kanban-column-title">
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: stageColor,
                        display: 'inline-block',
                      }}
                    />
                    <span>{stage.name}</span>
                    <span className="kanban-column-count">
                      {stageLeads.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm"
                    style={{ padding: 4 }}
                    title={`Add lead to ${stage.name}`}
                    onClick={() => handleOpenCreateForm(stage.id)}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="kanban-column-body">
                  {loading ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Loading leads...
                    </div>
                  ) : (
                    <>
                      {stageLeads.map((lead) => {
                        const { initials } = getAssigneeInfo(lead)
                        const isDragging = draggingLeadId === lead.id

                        return (
                          <div
                            key={lead.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, lead.id)}
                            onDragEnd={handleDragEnd}
                            onClick={() => handleOpenView(lead)}
                            className={`kanban-card select-none ${
                              isDragging ? 'opacity-50 scale-[0.98]' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="kanban-card-title mb-0 flex items-center gap-1.5 min-w-0">
                                <GripVertical
                                  size={13}
                                  className="text-slate-300 shrink-0 cursor-grab"
                                />
                                <span className="truncate">{lead.lead_title}</span>
                              </div>
                              <div onClick={(e) => e.stopPropagation()}>
                                <ActionDropdown
                                  minWidth={185}
                                  items={getLeadActionItems(lead)}
                                />
                              </div>
                            </div>

                            <div
                              style={{
                                fontSize: 12,
                                color: 'var(--color-gray-500)',
                                marginBottom: 8,
                              }}
                              className="truncate"
                            >
                              {getCompanyOrClientName(lead)}
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 8,
                              }}
                            >
                              <span
                                className={`badge ${getPriorityBadgeClass(
                                  lead.priority
                                )}`}
                                style={{ fontSize: 11 }}
                              >
                                {lead.priority}
                              </span>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: 'var(--color-gray-700)',
                                }}
                              >
                                {formatBudget(lead)}
                              </span>
                            </div>

                            <div className="kanban-card-meta">
                              <div
                                className="avatar avatar-sm avatar-primary shrink-0"
                                style={{ width: 22, height: 22, fontSize: 9 }}
                              >
                                {initials}
                              </div>
                              <span className="truncate" style={{ flex: 1 }}>
                                {lead.next_step ||
                                  lead.contact_number ||
                                  'Initial Follow-up'}
                              </span>
                              <span
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 3,
                                }}
                              >
                                <Clock size={11} />
                                {getDaysInStage(lead)}d
                              </span>
                            </div>
                          </div>
                        )
                      })}

                      {stageLeads.length === 0 && (
                        <div
                          style={{
                            padding: 20,
                            textAlign: 'center',
                            color: 'var(--color-gray-400)',
                            fontSize: 13,
                          }}
                        >
                          Drop lead card here or no leads in {stage.name}.
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Table View using Shared DataTable */
        <DataTable<LeadItem>
          data={leads}
          columns={leadColumns}
          loading={loading}
          loadingMessage="Loading leads from server..."
          emptyMessage="No leads found matching your criteria."
          selectable
          selectedIds={selectedIds}
          onSelectAll={(selected) => {
            if (selected) {
              setSelectedIds(leads.map((l) => l.id))
            } else {
              setSelectedIds([])
            }
          }}
          onSelectRow={(id) => {
            const numId = Number(id)
            setSelectedIds((prev) =>
              prev.includes(numId)
                ? prev.filter((i) => i !== numId)
                : [...prev, numId]
            )
          }}
          onRowClick={(lead) => handleOpenView(lead)}
          pagination={{
            currentPage,
            total: meta.total,
            perPage,
            lastPage: meta.last_page,
            onPageChange: setCurrentPage,
            itemName: 'leads',
          }}
        />
      )}

      {/* Slide Drawer: View Lead Details (Exact same design & width as Inquiry / Comment View Drawers) */}
      <SlideDrawer
        isOpen={isViewOpen && Boolean(viewingLead)}
        onClose={() => setIsViewOpen(false)}
        width="640px"
        title=""
        subtitle=""
        className="contact-view-drawer"
        hideHeader
      >
        {viewingLead && (
          <div className="cvd-panel">
            {/* ── HERO HEADER ── */}
            <div className="cvd-hero">
              <div className="cvd-avatar-wrap relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-sm border border-blue-400/30">
                  {getAssigneeInfo(viewingLead).initials}
                </div>
              </div>

              <div className="cvd-hero-info">
                <div className="cvd-name-row flex items-center gap-2 flex-wrap">
                  <h2 className="cvd-name font-bold text-lg text-slate-900">
                    {viewingLead.lead_title}
                  </h2>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {viewingLead.lead_code}
                  </span>
                  <span
                    className={`contact-status-pill ${
                      viewingLead.status === 'Won'
                        ? 'status-active'
                        : viewingLead.status === 'Lost'
                          ? 'status-inactive'
                          : 'status-active'
                    }`}
                  >
                    {resolveStageForLead(viewingLead)?.name ||
                      viewingLead.stage?.name ||
                      'New'}
                  </span>
                </div>

                <p className="cvd-subtitle text-xs text-muted mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium text-slate-700">
                    {getCompanyOrClientName(viewingLead)}
                  </span>
                  {viewingLead.email && (
                    <>
                      <span>•</span>
                      <span>{viewingLead.email}</span>
                    </>
                  )}
                  {viewingLead.created_at && (
                    <>
                      <span>•</span>
                      <span>
                        {new Date(viewingLead.created_at).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }
                        )}
                      </span>
                    </>
                  )}
                </p>
              </div>

              <button
                type="button"
                className="cvd-close-btn"
                onClick={() => setIsViewOpen(false)}
                title="Close"
              >
                <span style={{ fontSize: 18, lineHeight: 1, color: '#94a3b8' }}>
                  ×
                </span>
              </button>
            </div>

            {/* ── QUICK ACTION BUTTONS ROW ── */}
            <div className="cvd-actions-row">
              <button
                type="button"
                className="cvd-btn-primary inline-flex items-center gap-1.5"
                onClick={() => {
                  setIsViewOpen(false)
                  handleOpenEditForm(viewingLead)
                }}
              >
                <Edit2 size={13} />
                <span>Edit Lead</span>
              </button>

              {viewingLead.email && (
                <a
                  href={`mailto:${viewingLead.email}`}
                  className="cvd-btn-outline inline-flex items-center gap-1.5"
                >
                  <Mail size={13} />
                  <span>Email</span>
                </a>
              )}

              {viewingLead.contact_number && (
                <a
                  href={`tel:${viewingLead.contact_number}`}
                  className="cvd-btn-outline inline-flex items-center gap-1.5"
                >
                  <Phone size={13} />
                  <span>Call</span>
                </a>
              )}

              <div style={{ marginLeft: 'auto' }}>
                <button
                  type="button"
                  className="cvd-btn-outline text-rose-600 inline-flex items-center gap-1.5"
                  onClick={() => setLeadToDelete(viewingLead)}
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            {/* ── TAB BAR ── */}
            <div className="cvd-tabs">
              <button type="button" className="cvd-tab cvd-tab-active">
                Overview
              </button>
            </div>

            {/* ── TAB CONTENT ── */}
            <div className="cvd-body">
              <div className="cvd-tab-pane">
                <div className="cvd-card">
                  <div className="cvd-card-header">
                    <span className="cvd-card-title">Lead Information</span>
                  </div>

                  <div className="cvd-info-list">
                    <div className="cvd-info-row">
                      <div className="cvd-info-label">
                        <Target size={15} />
                        <span>Lead Code</span>
                      </div>
                      <div className="cvd-info-value">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {viewingLead.lead_code}
                        </span>
                      </div>
                    </div>

                    <div className="cvd-info-row">
                      <div className="cvd-info-label">
                        <Target size={15} />
                        <span>Lead Title</span>
                      </div>
                      <div className="cvd-info-value font-semibold text-slate-900">
                        {viewingLead.lead_title}
                      </div>
                    </div>

                    <div className="cvd-info-row">
                      <div className="cvd-info-label">
                        <Building2 size={15} />
                        <span>Client / Sender</span>
                      </div>
                      <div className="cvd-info-value font-medium text-slate-800">
                        {getCompanyOrClientName(viewingLead)}
                      </div>
                    </div>

                    <div className="cvd-info-row">
                      <div className="cvd-info-label">
                        <TrendingUp size={15} />
                        <span>Pipeline Stage</span>
                      </div>
                      <div className="cvd-info-value">
                        <select
                          className="form-select form-input-xs py-1 max-w-[200px]"
                          value={
                            viewingLead.lead_stage_id ??
                            resolveStageForLead(viewingLead)?.id ??
                            ''
                          }
                          onChange={(e) => {
                            const targetSt = stages.find(
                              (s) => s.id === Number(e.target.value)
                            )
                            if (targetSt) {
                              handleStageChange(viewingLead, targetSt)
                            }
                          }}
                        >
                          {stages.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="cvd-info-row">
                      <div className="cvd-info-label">
                        <DollarSign size={15} />
                        <span>Budget Quoted</span>
                      </div>
                      <div className="cvd-info-value font-semibold text-slate-900">
                        {formatBudget(viewingLead)}
                      </div>
                    </div>

                    <div className="cvd-info-row">
                      <div className="cvd-info-label">
                        <User size={15} />
                        <span>Priority & Status</span>
                      </div>
                      <div className="cvd-info-value flex items-center gap-2">
                        <span
                          className={`badge ${getPriorityBadgeClass(
                            viewingLead.priority
                          )}`}
                        >
                          {viewingLead.priority}
                        </span>
                        <span className="badge badge-primary">
                          {viewingLead.status}
                        </span>
                      </div>
                    </div>

                    {viewingLead.email && (
                      <div className="cvd-info-row">
                        <div className="cvd-info-label">
                          <Mail size={15} />
                          <span>Email Address</span>
                        </div>
                        <div className="cvd-info-value">
                          <a
                            href={`mailto:${viewingLead.email}`}
                            className="link-primary font-medium text-blue-600 hover:underline break-all"
                          >
                            {viewingLead.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {viewingLead.contact_number && (
                      <div className="cvd-info-row">
                        <div className="cvd-info-label">
                          <Phone size={15} />
                          <span>Contact Number</span>
                        </div>
                        <div className="cvd-info-value">
                          <a
                            href={`tel:${viewingLead.contact_number}`}
                            className="link-primary font-medium text-blue-600 hover:underline"
                          >
                            {viewingLead.contact_number}
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="cvd-info-row">
                      <div className="cvd-info-label">
                        <Clock size={15} />
                        <span>Next Step</span>
                      </div>
                      <div className="cvd-info-value">
                        {viewingLead.next_step || '—'}
                      </div>
                    </div>
                  </div>
                </div>

                {(viewingLead.requirement_details || viewingLead.message) && (
                  <div className="cvd-card">
                    <div className="cvd-card-header">
                      <span className="cvd-card-title">
                        Requirement / Message
                      </span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                      {viewingLead.requirement_details || viewingLead.message}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </SlideDrawer>

      {/* Slide Drawer: Create / Edit Lead Form */}
      <SlideDrawer
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingLead ? 'Edit Lead' : 'Create New Lead'}
        subtitle={
          editingLead
            ? `Updating ${editingLead.lead_code}`
            : 'Add a new lead to your sales pipeline'
        }
        width="640px"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsFormOpen(false)}
              disabled={formSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="lead-form"
              className="btn btn-primary"
              disabled={formSaving}
            >
              {formSaving
                ? 'Saving...'
                : editingLead
                  ? 'Update Lead'
                  : 'Create Lead'}
            </button>
          </div>
        }
      >
        <form id="lead-form" onSubmit={handleFormSubmit} className="p-5 space-y-4">
          <div className="form-group">
            <label className="form-label">
              Lead Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. Website Redesign Project"
              value={formData.lead_title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, lead_title: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Pipeline Stage</label>
              <select
                className="form-select"
                value={formData.lead_stage_id ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    lead_stage_id: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              >
                {stages.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                value={formData.priority}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    priority: e.target.value as any,
                  }))
                }
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Company / Client</label>
              <select
                className="form-select"
                value={formData.customer_id ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customer_id: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              >
                <option value="">Select Company (Optional)</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Lead Source</label>
              <select
                className="form-select"
                value={formData.lead_source_id ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    lead_source_id: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              >
                <option value="">Select Source (Optional)</option>
                {sources.map((src) => (
                  <option key={src.id} value={src.id}>
                    {src.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select
                className="form-select"
                value={formData.currency}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, currency: e.target.value }))
                }
              >
                <option value="LKR">LKR</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Budget Quoted</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-input"
                value={formData.budget_quoted ?? 0}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    budget_quoted: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Next Step</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Schedule Demo / Send Quotation"
                value={formData.next_step || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, next_step: e.target.value }))
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Expected Closing Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.expected_closing_date || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    expected_closing_date: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Requirement Details</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Describe the lead requirements..."
              value={formData.requirement_details || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  requirement_details: e.target.value,
                }))
              }
            />
          </div>
        </form>
      </SlideDrawer>

      {/* Delete Lead Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(leadToDelete)}
        onClose={() => setLeadToDelete(null)}
        onConfirm={handleConfirmDelete}
        variant="danger"
        title="Delete Lead"
        itemName={leadToDelete?.lead_title}
        message="Are you sure you want to delete this lead? It will be archived from your sales pipeline."
        confirmText="Delete Lead"
        cancelText="Cancel"
      />
    </div>
  )
}
