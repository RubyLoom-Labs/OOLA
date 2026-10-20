import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderKanban,
  Plus,
  Search,
  LayoutGrid,
  List,
  CheckCircle,
  Clock,
  Eye,
  Edit2,
  Trash2,
  Building2,
  Users,
  DollarSign,
} from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import StatCard from '@/components/common/StatCard'
import Breadcrumb from '@/components/ui/Breadcrumb'
import DataTable, { type Column } from '@/components/common/DataTable'
import ActionDropdown from '@/components/common/ActionDropdown'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import { capitalizeWords } from '@/lib/utils'
import ProjectViewDrawer from '@/components/projects/ProjectViewDrawer'
import ProjectFormDrawer from '@/components/projects/ProjectFormDrawer'
import {
  projectsApi,
  type Project,
  type ProjectStage,
  type ProjectStatusItem,
  type ProjectPriorityItem,
  type ProjectQueryParams,
  type CreateProjectPayload,
  type UpdateProjectPayload,
} from '@/apis/projectsApi'

interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  in_progress_count?: number
  completed_count?: number
  total_quoted?: number
}

export default function Projects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Dynamic stages, statuses, and priorities
  const [stages, setStages] = useState<ProjectStage[]>([])
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatusItem[]>([])
  const [projectPriorities, setProjectPriorities] = useState<ProjectPriorityItem[]>([])

  // Sorting state
  const [sortBy] = useState<string>('created_at')
  const [sortDir] = useState<'asc' | 'desc'>('desc')

  // Pagination state (default 15 per page matching backend API documentation)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    in_progress_count: 0,
    completed_count: 0,
    total_quoted: 0,
  })

  // Drawer / Modal states
  const [viewingProject, setViewingProject] = useState<Project | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [viewDrawerInitialEdit, setViewDrawerInitialEdit] = useState(false)

  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Confirmation Modal state
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Fetch stages, statuses, and priorities
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [stagesRes, statusesRes, prioritiesRes] = await Promise.allSettled([
          projectsApi.getStages(),
          projectsApi.getProjectStatuses(),
          projectsApi.getProjectPriorities(),
        ])
        if (stagesRes.status === 'fulfilled' && stagesRes.value?.data) {
          setStages(stagesRes.value.data)
        }
        if (statusesRes.status === 'fulfilled' && statusesRes.value?.data) {
          setProjectStatuses(statusesRes.value.data)
        }
        if (prioritiesRes.status === 'fulfilled' && prioritiesRes.value?.data) {
          setProjectPriorities(prioritiesRes.value.data)
        }
      } catch (err) {
        console.error('Failed to load project metadata in page:', err)
      }
    }
    loadMetadata()
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

  // Fetch Projects from GET /api/v1/projects
  const fetchProjectsList = useCallback(async () => {
    setLoading(true)
    try {
      const params: ProjectQueryParams = {
        page: currentPage,
        per_page: perPage,
        search: debouncedSearch.trim() || undefined,
        stage_id: stageFilter === 'all' ? undefined : Number(stageFilter),
        status: statusFilter === 'all' ? undefined : statusFilter,
        priority: priorityFilter === 'all' ? undefined : priorityFilter,
        sort_by: sortBy,
        sort_dir: sortDir,
      }
      const res = await projectsApi.getProjects(params)
      const dataList: Project[] = Array.isArray(res.data) ? res.data : []
      setProjects(dataList)

      const inProgressCount = dataList.filter(
        (p) => {
          const st = stages.find((s) => s.id === p.stage_id) || p.stage
          return st?.name?.toLowerCase() === 'in progress' || p.status?.toLowerCase() === 'in progress'
        }
      ).length
      const completedCount = dataList.filter(
        (p) => {
          const st = stages.find((s) => s.id === p.stage_id) || p.stage
          return st?.name?.toLowerCase() === 'completed' || p.status?.toLowerCase() === 'completed'
        }
      ).length
      const totalQuotedSum = dataList.reduce(
        (acc, p) => acc + (Number(p.quoted_amount) || Number(p.budget) || 0),
        0
      )

      if (res.meta) {
        setMeta({
          current_page: res.meta.current_page || currentPage,
          last_page: res.meta.last_page || 1,
          per_page: res.meta.per_page || perPage,
          total: res.meta.total ?? dataList.length,
          in_progress_count: inProgressCount,
          completed_count: completedCount,
          total_quoted: totalQuotedSum,
        })
      } else {
        setMeta({
          current_page: currentPage,
          last_page: Math.max(1, Math.ceil(dataList.length / perPage)),
          per_page: perPage,
          total: dataList.length,
          in_progress_count: inProgressCount,
          completed_count: completedCount,
          total_quoted: totalQuotedSum,
        })
      }
    } catch (err) {
      console.error('Failed to fetch projects list:', err)
      showToast('Failed to load projects. Please try refreshing.')
    } finally {
      setLoading(false)
    }
  }, [currentPage, perPage, debouncedSearch, stageFilter, statusFilter, priorityFilter, sortBy, sortDir, stages])

  useEffect(() => {
    fetchProjectsList()
  }, [fetchProjectsList])

  // Checkbox Selection
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(projects.map((p) => p.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  // Handlers for View Drawer
  const handleOpenView = (project: Project, editMode = false) => {
    setViewingProject(project)
    setViewDrawerInitialEdit(editMode)
    setIsViewOpen(true)
  }

  const handleOpenEdit = (project: Project) => {
    setViewingProject(project)
    setViewDrawerInitialEdit(true)
    setIsViewOpen(true)
  }

  const handleCloseView = () => {
    setIsViewOpen(false)
    setViewingProject(null)
    setViewDrawerInitialEdit(false)
  }

  // Handlers for Form Drawer
  const handleOpenCreateForm = () => {
    setEditingProject(null)
    setIsFormOpen(true)
  }


  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingProject(null)
  }

  const handleFormSubmit = async (
    payload: CreateProjectPayload | UpdateProjectPayload,
    isEdit: boolean
  ) => {
    if (isEdit && editingProject) {
      const res = await projectsApi.updateProject(editingProject.id, payload as UpdateProjectPayload)
      const title = res?.data?.project_title || editingProject.project_title || 'Project'
      showToast(`Project "${title}" updated successfully.`)
      // If view drawer is also open with this project, update it
      if (viewingProject && viewingProject.id === editingProject.id) {
        setViewingProject(res.data)
      }
    } else {
      const res = await projectsApi.createProject(payload as CreateProjectPayload)
      const title = res?.data?.project_title || (payload as CreateProjectPayload).project_title || 'New Project'
      showToast(`Project "${title}" created successfully.`)
    }
    await fetchProjectsList()
  }

  // Delete project handler
  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return
    try {
      await projectsApi.deleteProject(projectToDelete.id)
      showToast(`Project "${projectToDelete.project_title}" has been deleted.`)
      setProjectToDelete(null)
      if (viewingProject && viewingProject.id === projectToDelete.id) {
        handleCloseView()
      }
      await fetchProjectsList()
    } catch (err: any) {
      console.error('Failed to delete project:', err)
      showToast(err?.message || 'Failed to delete project. Please try again.')
    }
  }

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

  // Define Table Columns
  const columns: Column<Project>[] = [
    {
      key: 'project',
      header: 'PROJECT',
      accessor: (project: Project) => {
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm shrink-0 border border-primary-100">
              <FolderKanban size={20} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate hover:text-primary-600 transition-colors">
                {project.project_title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-[11px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                  {project.project_code}
                </span>
                {project.project_type && (
                  <span className="text-[11px] text-gray-400 truncate max-w-[150px]">
                    {project.project_type}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      key: 'client',
      header: 'CLIENT / ORGANIZATION',
      accessor: (project: Project) => {
        if (!project.customer) {
          return <span className="text-xs text-gray-400 italic">No client</span>
        }
        return (
          <div className="flex items-center gap-2">
            <Building2 size={15} className="text-gray-400 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-gray-800 text-xs truncate">
                {capitalizeWords(project.customer.company_name)}
              </p>
              {project.customer.customer_code && (
                <p className="font-mono text-[11px] text-gray-400">
                  {project.customer.customer_code}
                </p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      key: 'stage',
      header: 'STAGE',
      accessor: (project: Project) => {
        const stage = stages.find((s) => s.id === project.stage_id) || project.stage
        const color = stage?.color || '#64748B'
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: `${color}15`,
              color: color,
              border: `1px solid ${color}35`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            {stage?.name || '—'}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'STATUS',
      accessor: (project: Project) => {
        return (
          <span className={`badge text-xs ${getStatusBadgeClass(project.status)}`}>
            {project.status || 'Not Started'}
          </span>
        )
      },
    },
    {
      key: 'priority',
      header: 'PRIORITY',
      accessor: (project: Project) => {
        const displayPriority = project.priority?.includes('Priority')
          ? project.priority
          : `${project.priority || 'Low'} Priority`
        return (
          <span className={`badge text-xs ${getPriorityBadgeClass(project.priority)}`}>
            {displayPriority}
          </span>
        )
      },
    },
    {
      key: 'timeline',
      header: 'TIMELINE',
      accessor: (project: Project) => {
        return (
          <div className="text-xs text-gray-600 space-y-0.5">
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-gray-400">Start:</span>
              <span>
                {project.start_date
                  ? new Date(project.start_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-gray-400">End:</span>
              <span>
                {project.expected_end_date
                  ? new Date(project.expected_end_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Open'}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      key: 'budget',
      header: 'BUDGET & QUOTED',
      accessor: (project: Project) => {
        const quoted = Number(project.quoted_amount) || 0
        const budget = Number(project.budget) || 0
        return (
          <div className="text-xs">
            <p className="font-semibold text-gray-900">
              ${quoted.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            {budget > 0 && (
              <p className="text-[11px] text-gray-400">
                Budget: ${budget.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </p>
            )}
          </div>
        )
      },
    },
    {
      key: 'actions',
      header: '',
      accessor: (project: Project) => {
        return (
          <div
            className="flex items-center justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            <ActionDropdown
              items={[
                {
                  key: 'view',
                  label: 'View Details',
                  icon: <Eye size={14} />,
                  onClick: () => handleOpenView(project, false),
                },
                {
                  key: 'edit',
                  label: 'Edit Project',
                  icon: <Edit2 size={14} />,
                  onClick: () => handleOpenEdit(project),
                },
                {
                  key: 'open-project',
                  label: 'Go to Project',
                  icon: <LayoutGrid size={14} />,
                  onClick: () => navigate(`/projects/${project.id}`),
                },
                {
                  key: 'divider',
                  label: '',
                  divider: true,
                },
                {
                  key: 'delete',
                  label: 'Delete Project',
                  icon: <Trash2 size={14} />,
                  danger: true,
                  onClick: () => setProjectToDelete(project),
                },
              ]}
            />
          </div>
        )
      },
    },
  ]

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
      <Breadcrumb items={[{ label: 'Projects' }]} />

      {/* Header */}
      <PageHeader
        icon={<FolderKanban size={24} />}
        title="Projects"
        description="Manage and track client projects, development sprints, and budgets."
        actions={
          <div className="flex items-center gap-2">
            <button
              id="add-project-btn"
              data-testid="add-project-btn"
              className="btn btn-primary shadow-sm flex items-center gap-1.5"
              onClick={handleOpenCreateForm}
            >
              <Plus size={16} />
              <span>New Project</span>
            </button>
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="contacts-stats-grid">
        <StatCard
          label="Total Projects"
          value={meta.total}
          icon={<FolderKanban size={20} />}
          variant="blue"
          active={stageFilter === 'all'}
          onClick={() => {
            setStageFilter('all')
            setCurrentPage(1)
          }}
        />
        <StatCard
          label="In Progress"
          value={meta.in_progress_count ?? 0}
          icon={<Clock size={20} />}
          variant="amber"
          active={Boolean(stages.find((s) => s.name.toLowerCase() === 'in progress' && String(s.id) === stageFilter))}
          onClick={() => {
            const inProg = stages.find((s) => s.name.toLowerCase() === 'in progress')
            if (inProg) {
              setStageFilter(String(inProg.id))
            }
            setCurrentPage(1)
          }}
        />
        <StatCard
          label="Completed"
          value={meta.completed_count ?? 0}
          icon={<CheckCircle size={20} />}
          variant="green"
          active={Boolean(stages.find((s) => s.name.toLowerCase() === 'completed' && String(s.id) === stageFilter))}
          onClick={() => {
            const comp = stages.find((s) => s.name.toLowerCase() === 'completed')
            if (comp) {
              setStageFilter(String(comp.id))
            }
            setCurrentPage(1)
          }}
        />
        <StatCard
          label="Total Quoted"
          value={`$${(meta.total_quoted ?? 0).toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}`}
          icon={<DollarSign size={20} />}
          variant="purple"
        />
      </div>

      {/* Filter & Search Toolbar */}
      <div className="contacts-filter-bar">
        <div className="contacts-filter-left">
          {/* Stage Dropdown Selector */}
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

          {/* Status Dropdown Selector */}
          <div className="relative">
            <select
              className="form-select contacts-status-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="all">All Statuses</option>
              {projectStatuses.map((st) => (
                <option key={st.id} value={st.name}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Dropdown Selector */}
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
              {projectPriorities.map((pr) => (
                <option key={pr.id} value={pr.name}>
                  {pr.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Projects Bar */}
          <div className="contacts-search-box">
            <Search size={16} className="contacts-search-icon" />
            <input
              type="text"
              className="contacts-search-input"
              placeholder="Search by project title, code, client, type..."
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
              <option value={15}>15</option>
              <option value={25}>25</option>
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

      {/* Main Content Area: Table or Grid */}
      {viewMode === 'table' ? (
        <DataTable<Project>
          columns={columns}
          data={projects}
          loading={loading}
          loadingMessage="Loading projects from server..."
          emptyMessage="No projects found matching your criteria."
          selectable
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectRow={(id) => handleSelectOne(Number(id))}
          onRowClick={(project) => handleOpenView(project, false)}
          pagination={{
            currentPage,
            total: meta.total,
            perPage,
            lastPage: meta.last_page,
            onPageChange: setCurrentPage,
            itemName: 'projects',
          }}
        />
      ) : (
        /* GRID VIEW */
        <div className="projects-cards-grid">
          {projects.map((project) => {
            const stage = stages.find((s) => s.id === project.stage_id) || project.stage
            const stageColor = stage?.color || '#3B82F6'
            return (
              <div
                key={project.id}
                className="contact-grid-card cursor-pointer hover:shadow-md transition-all"
                onClick={() => handleOpenView(project, false)}
              >
                <div className="contact-grid-card-header items-center">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-2xs"
                    style={{
                      background: `linear-gradient(135deg, ${stageColor}, #1e293b)`,
                    }}
                  >
                    <FolderKanban size={20} />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{
                        backgroundColor: `${stageColor}15`,
                        color: stageColor,
                        border: `1px solid ${stageColor}35`,
                      }}
                    >
                      {stage?.name || '—'}
                    </span>
                    <span className={`badge text-[11px] ${getStatusBadgeClass(project.status)}`}>
                      {project.status || 'Not Started'}
                    </span>
                  </div>
                </div>

                <div className="contact-grid-name font-semibold text-slate-900 mt-2 truncate">
                  {project.project_title}
                </div>

                <div className="contact-grid-title flex items-center justify-between gap-1.5 text-xs text-muted mt-1.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                      {project.project_code}
                    </span>
                    {project.project_type && (
                      <span className="truncate text-slate-500">• {project.project_type}</span>
                    )}
                  </div>
                  <span className={`badge text-[11px] shrink-0 ${getPriorityBadgeClass(project.priority)}`}>
                    {project.priority?.includes('Priority') ? project.priority : `${project.priority || 'Low'} Priority`}
                  </span>
                </div>

                <div className="contact-grid-meta text-xs text-slate-600 mt-3 space-y-1">
                  {project.customer && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Building2 size={13} className="text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800">
                        {capitalizeWords(project.customer.company_name)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>
                      Budget: <strong className="text-slate-800">${(Number(project.budget) || 0).toLocaleString()}</strong>
                    </span>
                    <span>
                      Quoted: <strong className="text-blue-600">${(Number(project.quoted_amount) || 0).toLocaleString()}</strong>
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-muted">
                  <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                    <Users size={12} className="text-slate-400" />
                    <span>{project.users?.length ?? 0} Members</span>
                  </span>
                  <span className="text-blue-600 font-medium hover:underline">View details →</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Slide Drawers */}
      <ProjectViewDrawer
        project={viewingProject}
        isOpen={isViewOpen}
        onClose={handleCloseView}
        initialEditMode={viewDrawerInitialEdit}
        onSave={(updatedProject) => {
          showToast(`Project "${updatedProject.project_title}" updated successfully.`)
          fetchProjectsList()
        }}
        onDelete={(id) => {
          const prj = projects.find((p) => p.id === id) || viewingProject
          if (prj) setProjectToDelete(prj)
        }}
      />

      <ProjectFormDrawer
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        project={editingProject}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(projectToDelete)}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Project"
        message={`Are you sure you want to permanently delete "${projectToDelete?.project_title}" (${projectToDelete?.project_code})? This action cannot be undone.`}
        confirmText="Delete Project"
        variant="danger"
      />
    </div>
  )
}
