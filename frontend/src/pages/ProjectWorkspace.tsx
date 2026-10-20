import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Edit2,
  Plus,
  Search,
  LayoutGrid,
  List,
  Calendar,
  Building2,
  Users,
  DollarSign,
  FolderKanban,
  Code,
  FileText,
  Files,
  CheckSquare,
  ListTodo,
  Share2,
  Download,
  MoreHorizontal,
  Trash2,
  X,
  ArrowDown,
  Briefcase,
  Check,
  Activity,
  LifeBuoy,
  Paperclip,
} from 'lucide-react'
import {
  projectsApi,
  type Project,
} from '@/apis/projectsApi'
import ProjectViewDrawer from '@/components/projects/ProjectViewDrawer'

// Task Interface matching the Kanban board requirements
export interface KanbanTask {
  id: string
  title: string
  description?: string
  priority: 'High' | 'Medium' | 'Low'
  taskType?: 'General' | 'Bug' | 'Feature' | 'Task'
  stage: 'to-do' | 'in-progress' | 'review' | 'completed'
  assignee: {
    name: string
    avatar?: string
    role?: string
  }
  dueDate: string
  subtasksCount?: number
  subtasksCompleted?: number
  commentsCount?: number
  completedAt?: string
}

const INITIAL_TASKS: KanbanTask[] = [
  // To Do
  {
    id: 'task-1',
    title: 'Prepare project proposal',
    description: 'Draft the initial project scope, milestone timelines, and deliverable commitments.',
    priority: 'High',
    taskType: 'General',
    stage: 'to-do',
    assignee: {
      name: 'Sarah Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
      role: 'Project Lead',
    },
    dueDate: 'Sep 28, 2026',
    subtasksCount: 2,
  },
  {
    id: 'task-2',
    title: 'Collect client requirements',
    description: 'Schedule discovery sessions with core stakeholder team and document technical specifications.',
    priority: 'Medium',
    taskType: 'Task',
    stage: 'to-do',
    assignee: {
      name: 'Michael Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      role: 'Business Analyst',
    },
    dueDate: 'Sep 29, 2026',
    subtasksCount: 1,
  },
  {
    id: 'task-3',
    title: 'Design homepage mockup',
    description: 'Create high-fidelity wireframes and interactive prototypes in Figma for desktop and mobile.',
    priority: 'Medium',
    taskType: 'Feature',
    stage: 'to-do',
    assignee: {
      name: 'Emily Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      role: 'UI/UX Designer',
    },
    dueDate: 'Oct 01, 2026',
    subtasksCount: 1,
  },
  {
    id: 'task-4',
    title: 'Setup development environment',
    description: 'Configure Docker containers, CI/CD pipeline triggers, and cloud staging environments.',
    priority: 'Low',
    taskType: 'General',
    stage: 'to-do',
    assignee: {
      name: 'David Kim',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      role: 'DevOps Engineer',
    },
    dueDate: 'Oct 02, 2026',
  },

  // In Progress
  {
    id: 'task-5',
    title: 'Develop authentication module',
    description: 'Implement JWT session handling, multi-factor authentication, and password reset flows.',
    priority: 'High',
    taskType: 'Feature',
    stage: 'in-progress',
    assignee: {
      name: 'John Doe',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      role: 'Senior Backend Dev',
    },
    dueDate: 'Sep 30, 2026',
    subtasksCount: 3,
  },
  {
    id: 'task-6',
    title: 'Integrate payment gateway',
    description: 'Connect Stripe and PayPal webhooks with secure PCI-compliant transaction logging.',
    priority: 'High',
    taskType: 'Feature',
    stage: 'in-progress',
    assignee: {
      name: 'Lisa Wang',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
      role: 'Full Stack Dev',
    },
    dueDate: 'Oct 02, 2026',
    subtasksCount: 1,
  },
  {
    id: 'task-7',
    title: 'Create API endpoints',
    description: 'Define RESTful contracts for user entities, project status transitions, and team rosters.',
    priority: 'Medium',
    taskType: 'Feature',
    stage: 'in-progress',
    assignee: {
      name: 'Robert Taylor',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face',
      role: 'Backend Architect',
    },
    dueDate: 'Oct 03, 2026',
    subtasksCount: 2,
  },
  {
    id: 'task-8',
    title: 'Deploy to staging server',
    description: 'Automate build artifacts packaging and run smoke integration test suite.',
    priority: 'Medium',
    taskType: 'Task',
    stage: 'in-progress',
    assignee: {
      name: 'Kevin Perera',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop&crop=face',
      role: 'Cloud Engineer',
    },
    dueDate: 'Oct 03, 2026',
  },

  // Review
  {
    id: 'task-9',
    title: 'UI/UX improvements',
    description: 'Refine micro-interactions, responsive mobile margins, and accessibility contrast standards.',
    priority: 'Medium',
    taskType: 'Task',
    stage: 'review',
    assignee: {
      name: 'Thomas Brown',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
      role: 'Product Designer',
    },
    dueDate: 'Oct 05, 2026',
    subtasksCount: 1,
  },
  {
    id: 'task-10',
    title: 'Test all features',
    description: 'Execute end-to-end regression tests across Edge, Chrome, Safari, and mobile breakpoints.',
    priority: 'High',
    taskType: 'Bug',
    stage: 'review',
    assignee: {
      name: 'Amanda Wilson',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face',
      role: 'QA Lead',
    },
    dueDate: 'Oct 06, 2026',
  },
  {
    id: 'task-11',
    title: 'Performance optimization',
    description: 'Audit query execution times, implement Redis cache layer, and minify static assets.',
    priority: 'Low',
    taskType: 'Task',
    stage: 'review',
    assignee: {
      name: 'Daniel Martinez',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face',
      role: 'Performance Eng',
    },
    dueDate: 'Oct 07, 2026',
  },

  // Completed
  {
    id: 'task-12',
    title: 'Project setup and planning',
    priority: 'Medium',
    stage: 'completed',
    assignee: {
      name: 'Sarah Connor',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    },
    dueDate: 'Sep 20, 2026',
    completedAt: 'Sep 20, 2026',
  },
  {
    id: 'task-13',
    title: 'Database schema design',
    priority: 'High',
    stage: 'completed',
    assignee: {
      name: 'John Doe',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    },
    dueDate: 'Sep 21, 2026',
    completedAt: 'Sep 21, 2026',
  },
  {
    id: 'task-14',
    title: 'Initial development setup',
    priority: 'Medium',
    stage: 'completed',
    assignee: {
      name: 'David Kim',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    },
    dueDate: 'Sep 22, 2026',
    completedAt: 'Sep 22, 2026',
  },
  {
    id: 'task-15',
    title: 'User roles and permissions',
    priority: 'High',
    stage: 'completed',
    assignee: {
      name: 'Robert Taylor',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face',
    },
    dueDate: 'Sep 23, 2026',
    completedAt: 'Sep 23, 2026',
  },
  {
    id: 'task-16',
    title: 'Basic CRM modules',
    priority: 'Medium',
    stage: 'completed',
    assignee: {
      name: 'Lisa Wang',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    },
    dueDate: 'Sep 24, 2026',
    completedAt: 'Sep 24, 2026',
  },
]

const STAGES: { id: KanbanTask['stage']; name: string }[] = [
  { id: 'to-do', name: 'To Do' },
  { id: 'in-progress', name: 'In Progress' },
  { id: 'review', name: 'Review' },
  { id: 'completed', name: 'Completed' },
]

export default function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Project state
  const [project, setProject] = useState<Project | null>(null)

  // Drawer edit modal state
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  // Tab state
  const [activeTab, setActiveTab] = useState<
    'overview' | 'tasks' | 'subtasks' | 'team' | 'documents' | 'payments' | 'activities' | 'notes' | 'tickets'
  >('tasks')

  // View state (Kanban vs List)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMember, setSelectedMember] = useState('All Members')
  const [selectedPriority, setSelectedPriority] = useState('All Priority')
  const [selectedStage, setSelectedStage] = useState('All Stages')
  const [sortBy, setSortBy] = useState('Default')

  // Project Actions dropdown
  const [showActionsDropdown, setShowActionsDropdown] = useState(false)

  // Task list state
  const [tasks, setTasks] = useState<KanbanTask[]>(() => {
    const saved = localStorage.getItem(`project_tasks_${id}`)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        // Fallback
      }
    }
    return INITIAL_TASKS
  })

  // Drag and Drop state
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<KanbanTask['stage'] | null>(null)

  // Add Task Modal State
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('High')
  const [newTaskType, setNewTaskType] = useState<'General' | 'Bug' | 'Feature' | 'Task'>('General')
  const [newTaskAssignee, setNewTaskAssignee] = useState('John Doe')
  const [newTaskDueDate, setNewTaskDueDate] = useState('10/18/2026')
  const [newTaskReminder, setNewTaskReminder] = useState('1 Hour Before')
  const [newTaskStage, setNewTaskStage] = useState<KanbanTask['stage']>('to-do')

  // Persist tasks in localStorage per project
  useEffect(() => {
    if (id) {
      localStorage.setItem(`project_tasks_${id}`, JSON.stringify(tasks))
    }
  }, [tasks, id])

  // Fetch project details
  const fetchProjectData = async () => {
    if (!id) return
    try {
      const res = await projectsApi.getProject(id)
      const projectData = (res as any)?.data?.data || (res as any)?.data || res
      setProject(projectData)
    } catch (err: any) {
      console.warn('API getProject failed, using fallback mock data:', err)
      // Provide robust fallback data matching the screenshot
      setProject({
        id: Number(id) || 1,
        project_code: 'PRJ-2026-001',
        project_title: 'Website Development',
        description: 'Develop a modern and scalable website for TechSolutions Inc. with advanced features.',
        customer_id: 1,
        customer: {
          id: 1,
          company_name: 'TechSolutions Inc.',
          customer_code: 'CUS-001',
        },
        manager: {
          id: 1,
          name: 'Michael Chen',
          email: 'michael.chen@ooralabz.com',
          status: 'Active',
          role: 'Project Manager',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        },
        stage: {
          id: 2,
          name: 'In Progress',
          color: '#10b981',
        },
        project_type: 'Web Development',
        priority: 'High',
        status: 'In Progress',
        start_date: '2026-09-01',
        expected_end_date: '2026-12-31',
        budget: 1200000,
        quoted_amount: 1200000,
        cost: 600000,
        revenue: 600000,
        tasks_count: 12,
        payments_count: 4,
      })
    } finally {
      // Done fetching
    }
  }

  useEffect(() => {
    fetchProjectData()
  }, [id])

  // Handlers for Drag and Drop
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId)
    setDraggingTaskId(taskId)
  }

  const handleDragOver = (e: React.DragEvent, stage: KanbanTask['stage']) => {
    e.preventDefault()
    if (dragOverStage !== stage) {
      setDragOverStage(stage)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the column container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setDragOverStage(null)
  }

  const handleDrop = (e: React.DragEvent, targetStage: KanbanTask['stage']) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId
    if (!taskId) return

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, stage: targetStage } : t))
    )
    setDraggingTaskId(null)
    setDragOverStage(null)
  }

  // Handle Add New Task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    const newTask: KanbanTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim() || undefined,
      priority: newTaskPriority,
      taskType: newTaskType,
      stage: newTaskStage,
      assignee: {
        name: newTaskAssignee,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        role: 'Team Member',
      },
      dueDate: newTaskDueDate || 'Oct 25, 2026',
      subtasksCount: 0,
    }

    setTasks((prev) => [newTask, ...prev])
    setNewTaskTitle('')
    setNewTaskDesc('')
    setShowAddTaskModal(false)
  }

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = task.title.toLowerCase().includes(q)
        const matchDesc = task.description?.toLowerCase().includes(q)
        const matchAssignee = task.assignee.name.toLowerCase().includes(q)
        if (!matchTitle && !matchDesc && !matchAssignee) return false
      }
      // Member
      if (selectedMember !== 'All Members' && task.assignee.name !== selectedMember) {
        return false
      }
      // Priority
      if (selectedPriority !== 'All Priority' && task.priority !== selectedPriority) {
        return false
      }
      // Stage
      if (selectedStage !== 'All Stages') {
        const stageMap: Record<string, string> = {
          'To Do': 'to-do',
          'In Progress': 'in-progress',
          Review: 'review',
          Completed: 'completed',
        }
        if (task.stage !== stageMap[selectedStage]) return false
      }
      return true
    })
  }, [tasks, searchQuery, selectedMember, selectedPriority, selectedStage])

  // Get tasks for a given column
  const getTasksByStage = (stageId: KanbanTask['stage']) => {
    return filteredTasks.filter((t) => t.stage === stageId)
  }

  // Available unique team members for filter
  const teamMembers = useMemo(() => {
    const names = Array.from(new Set(tasks.map((t) => t.assignee.name)))
    return ['All Members', ...names]
  }, [tasks])

  const displayProject = project || {
    id: 1,
    project_code: 'PRJ-2026-001',
    project_title: 'Website Development',
    description: 'Develop a modern and scalable website for TechSolutions Inc. with advanced features.',
    customer_id: 1,
    customer: { company_name: 'TechSolutions Inc.' },
    manager: { name: 'Michael Chen' },
    stage: { name: 'In Progress', color: '#10b981' },
    project_type: 'Web Development',
    priority: 'High',
    status: 'In Progress',
    start_date: '2026-09-01',
    expected_end_date: '2026-12-31',
    budget: 1200000,
    cost: 600000,
    revenue: 600000,
  }

  return (
    <div className="p-4 md:p-6 bg-slate-50/60 min-h-screen">
      {/* ── TOP BREADCRUMBS & ACTION BUTTONS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* Breadcrumb: < Projects > Website Development */}
        <div className="flex items-center gap-2 text-sm">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={15} />
            <span>Projects</span>
          </Link>
          <ChevronRight size={14} className="text-slate-400" />
          <span className="font-semibold text-slate-900 truncate max-w-xs sm:max-w-md">
            {displayProject.project_title}
          </span>
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Project Actions Dropdown */}
          <div className="relative">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs"
              onClick={() => setShowActionsDropdown(!showActionsDropdown)}
            >
              <span>Project Actions</span>
              <ChevronDown size={14} className="text-slate-500" />
            </button>

            {showActionsDropdown && (
              <div
                className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-fade-in text-xs font-medium text-slate-700"
                onClick={() => setShowActionsDropdown(false)}
              >
                <button
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                  onClick={() => {
                    setIsEditMode(true)
                    setIsEditDrawerOpen(true)
                  }}
                >
                  <Edit2 size={13} className="text-slate-500" />
                  <span>Edit Project Details</span>
                </button>
                <button
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                  onClick={() => alert('Exporting project report...')}
                >
                  <Download size={13} className="text-slate-500" />
                  <span>Export Summary PDF</span>
                </button>
                <button
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                  onClick={() => alert('Project share link copied to clipboard!')}
                >
                  <Share2 size={13} className="text-slate-500" />
                  <span>Share Project Link</span>
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                  onClick={() => {
                    if (confirm(`Are you sure you want to archive ${displayProject.project_title}?`)) {
                      navigate('/projects')
                    }
                  }}
                >
                  <Trash2 size={13} className="text-red-500" />
                  <span>Archive Project</span>
                </button>
              </div>
            )}
          </div>

          {/* Edit Project Button */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
            onClick={() => {
              setIsEditMode(true)
              setIsEditDrawerOpen(true)
            }}
          >
            <Edit2 size={13} />
            <span>Edit Project</span>
          </button>

          {/* Add Task Primary Button */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 active:scale-98 transition-all shadow-sm"
            onClick={() => setShowAddTaskModal(true)}
          >
            <Plus size={14} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* ── PROJECT HERO BANNER & STATS CARD ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 mb-5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          {/* Left: Project Icon, Title, Stage, Code, Subtitle */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200/80 flex items-center justify-center text-blue-600 shrink-0 shadow-xs">
              <Code size={24} className="text-blue-600 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {displayProject.project_title}
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {displayProject.stage?.name || displayProject.status || 'In Progress'}
                </span>
                <span className="text-slate-300 font-normal">|</span>
                <span className="font-mono text-xs font-semibold text-slate-500">
                  {displayProject.project_code}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl font-normal leading-relaxed">
                {displayProject.description ||
                  `Develop a modern and scalable website for ${displayProject.customer?.company_name || 'Client'} with advanced features.`}
              </p>
            </div>
          </div>

          {/* Right: 4 Stat Mini Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            {/* Stat 1: Project Value */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
              <div className="w-9 h-9 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0">
                <Briefcase size={17} />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium leading-none mb-1">Project Value</p>
                <p className="text-sm font-bold text-slate-900 leading-none">
                  Rs. {(displayProject.budget || 1200000).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Stat 2: Paid Amount */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
              <div className="w-9 h-9 rounded-lg bg-emerald-100/70 text-emerald-600 flex items-center justify-center shrink-0">
                <DollarSign size={17} />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium leading-none mb-1">Paid Amount</p>
                <p className="text-sm font-bold text-slate-900 leading-none">
                  Rs. {(displayProject.revenue || 600000).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Stat 3: Outstanding */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
              <div className="w-9 h-9 rounded-lg bg-amber-100/70 text-amber-600 flex items-center justify-center shrink-0">
                <FileText size={17} />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium leading-none mb-1">Outstanding</p>
                <p className="text-sm font-bold text-slate-900 leading-none">
                  Rs. {(displayProject.cost || 600000).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Stat 4: End Date */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
              <div className="w-9 h-9 rounded-lg bg-purple-100/70 text-purple-600 flex items-center justify-center shrink-0">
                <Calendar size={17} />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium leading-none mb-1">End Date</p>
                <p className="text-sm font-bold text-slate-900 leading-none">
                  Dec 31, 2026
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── HORIZONTAL NAVIGATION TABS ── */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-slate-200/90 mb-5 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FolderKanban size={14} />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
            activeTab === 'tasks'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare size={14} />
          <span>Tasks</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'tasks' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200/70 text-slate-600'
            }`}
          >
            {tasks.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subtasks')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
            activeTab === 'subtasks'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ListTodo size={14} />
          <span>Subtasks</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
            activeTab === 'team'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users size={14} />
          <span>Team</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
            activeTab === 'documents'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Files size={14} />
          <span>Documents</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
            activeTab === 'payments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign size={14} />
          <span>Payments</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activities')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
            activeTab === 'activities'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity size={14} />
          <span>Activities</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
            activeTab === 'notes'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText size={14} />
          <span>Notes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
            activeTab === 'tickets'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <LifeBuoy size={14} />
          <span>Tickets</span>
        </button>
      </div>

      {/* ── TAB CONTENT: TASKS (DEFAULT / MOCKUP VIEW) ── */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Controls Bar: View Switcher, Search, Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* View Switcher Pills */}
            <div className="inline-flex items-center p-1 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
              <button
                type="button"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                onClick={() => setViewMode('kanban')}
              >
                <LayoutGrid size={13} />
                <span>Kanban View</span>
              </button>
              <button
                type="button"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                onClick={() => setViewMode('list')}
              >
                <List size={13} />
                <span>List View</span>
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search tasks... */}
              <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
                />
              </div>

              {/* Filter: All Members */}
              <div className="relative">
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="appearance-none pl-3 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer"
                >
                  {teamMembers.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Filter: All Priority */}
              <div className="relative">
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="appearance-none pl-3 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer"
                >
                  <option value="All Priority">All Priority</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Filter: All Stages */}
              <div className="relative">
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="appearance-none pl-3 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer"
                >
                  <option value="All Stages">All Stages</option>
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Completed">Completed</option>
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pl-3 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer"
                >
                  <option value="Default">Sort ▾</option>
                  <option value="DueDate">Due Date</option>
                  <option value="Priority">Priority</option>
                  <option value="Title">Title (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── MAIN WORKSPACE CONTENT: LEFT INFO + RIGHT KANBAN ── */}
          <div className="flex flex-col lg:flex-row items-start gap-4">
            {/* ── LEFT COLUMN: PROJECT INFO & TEAM (approx 270px) ── */}
            <div className="w-full lg:w-[270px] shrink-0 space-y-4">
              {/* Card 1: Project Information */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4">
                <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Project Information
                  </h3>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 px-2 py-0.5 rounded border border-slate-200 hover:border-blue-300 transition-colors"
                    onClick={() => {
                      setIsEditMode(true)
                      setIsEditDrawerOpen(true)
                    }}
                  >
                    <Edit2 size={11} />
                    <span>Edit</span>
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Project Manager */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 font-normal">Project Manager</span>
                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                        alt="Manager"
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span>{displayProject.manager?.name || 'Michael Chen'}</span>
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 font-normal">Customer</span>
                    <div className="flex items-center gap-1.5 font-medium text-slate-800 truncate max-w-[150px]">
                      <Building2 size={13} className="text-blue-600 shrink-0" />
                      <span className="truncate">
                        {displayProject.customer?.company_name || 'TechSolutions Inc.'}
                      </span>
                    </div>
                  </div>

                  {/* Project Type */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 font-normal">Project Type</span>
                    <span className="font-medium text-slate-800">
                      {displayProject.project_type || 'Web Development'}
                    </span>
                  </div>

                  {/* Priority */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 font-normal">Priority</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                      {displayProject.priority || 'High'}
                    </span>
                  </div>

                  {/* Start Date */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 font-normal">Start Date</span>
                    <div className="flex items-center gap-1 font-medium text-slate-800">
                      <Calendar size={12} className="text-slate-400" />
                      <span>Sep 01, 2026</span>
                    </div>
                  </div>

                  {/* End Date */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 font-normal">End Date</span>
                    <div className="flex items-center gap-1 font-medium text-slate-800">
                      <Calendar size={12} className="text-slate-400" />
                      <span>Dec 31, 2026</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <span className="text-slate-500 font-normal">Status</span>
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{displayProject.stage?.name || 'In Progress'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Project Team */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Project Team
                  </h3>
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                    onClick={() => setActiveTab('team')}
                  >
                    View All
                  </button>
                </div>

                <div className="flex items-center -space-x-2 py-1">
                  <img
                    className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-2xs"
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
                    title="Sarah Johnson"
                    alt="Sarah"
                  />
                  <img
                    className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-2xs"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                    title="Michael Chen"
                    alt="Michael"
                  />
                  <img
                    className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-2xs"
                    src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
                    title="Emily Rodriguez"
                    alt="Emily"
                  />
                  <img
                    className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-2xs"
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
                    title="John Doe"
                    alt="John"
                  />
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shadow-2xs">
                    +2
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT MAIN AREA: KANBAN COLUMNS (OR LIST VIEW) ── */}
            <div className="flex-1 w-full overflow-hidden">
              {viewMode === 'kanban' ? (
                /* 4-COLUMN KANBAN BOARD */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 items-start">
                  {STAGES.map((col) => {
                    const colTasks = getTasksByStage(col.id)
                    const isOver = dragOverStage === col.id

                    return (
                      <div
                        key={col.id}
                        className={`rounded-2xl border transition-all duration-150 flex flex-col min-h-[500px] ${
                          isOver
                            ? 'bg-blue-50/40 border-blue-300 ring-2 ring-blue-400/20'
                            : 'bg-slate-100/70 border-slate-200/80'
                        }`}
                        onDragOver={(e) => handleDragOver(e, col.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, col.id)}
                      >
                        {/* Column Header */}
                        <div className="p-3 pb-2 flex items-center justify-between border-b border-slate-200/70">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">
                              {col.name}
                            </span>
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px] font-bold">
                              {colTasks.length}
                            </span>
                          </div>

                          <button
                            type="button"
                            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200/50"
                            title="More options"
                          >
                            <MoreHorizontal size={14} />
                          </button>
                        </div>

                        {/* Task Cards Container */}
                        <div className="p-2.5 space-y-2.5 flex-1">
                          {colTasks.map((task) => {
                            const isBeingDragged = draggingTaskId === task.id
                            const isCompleted = col.id === 'completed'

                            return (
                              <div
                                key={task.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, task.id)}
                                className={`group bg-white rounded-xl p-3 border transition-all duration-150 cursor-grab active:cursor-grabbing shadow-2xs hover:shadow-md ${
                                  isBeingDragged ? 'opacity-40 scale-95 border-blue-400' : 'border-slate-200/80 hover:border-slate-300'
                                }`}
                              >
                                {isCompleted ? (
                                  /* Completed Task Design (with Checkmark icon) */
                                  <div className="flex items-start gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                                      <Check size={12} className="stroke-[3]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-semibold text-slate-800 leading-snug">
                                        {task.title}
                                      </p>
                                      <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-400">
                                        <Calendar size={11} />
                                        <span>{task.completedAt || task.dueDate}</span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  /* Standard Task Design */
                                  <div>
                                    {/* Title + Priority badge */}
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <h4 className="text-xs font-semibold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
                                        {task.title}
                                      </h4>
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 leading-none ${
                                          task.priority === 'High'
                                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                            : task.priority === 'Medium'
                                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                            : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                        }`}
                                      >
                                        {task.priority}
                                      </span>
                                    </div>

                                    {/* Assignee + Meta info */}
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                                      {/* Assignee */}
                                      <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                                        <img
                                          src={
                                            task.assignee.avatar ||
                                            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
                                          }
                                          alt={task.assignee.name}
                                          className="w-5 h-5 rounded-full object-cover shrink-0"
                                          style={{ width: '20px', height: '20px' }}
                                        />
                                        <span className="truncate font-medium text-slate-700">
                                          {task.assignee.name}
                                        </span>
                                      </div>

                                      {/* Due date & Subtasks count */}
                                      <div className="flex items-center gap-2 shrink-0">
                                        <div className="flex items-center gap-1 text-slate-400 font-normal">
                                          <Calendar size={11} />
                                          <span>{task.dueDate}</span>
                                        </div>

                                        {task.subtasksCount ? (
                                          <div className="flex items-center gap-0.5 text-slate-400 font-medium">
                                            <Paperclip size={10} />
                                            <span>{task.subtasksCount}</span>
                                          </div>
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}

                          {/* DROP ZONE INDICATOR matching mockup */}
                          {isOver && (
                            <div className="border-2 border-dashed border-blue-400 bg-blue-50/70 rounded-xl p-4 flex flex-col items-center justify-center text-blue-600 gap-1.5 transition-all animate-pulse">
                              <ArrowDown size={18} className="animate-bounce" />
                              <span className="text-xs font-semibold">
                                Drop here to move to {col.name}
                              </span>
                            </div>
                          )}

                          {colTasks.length === 0 && !isOver && (
                            <div className="py-8 text-center text-slate-400 text-xs font-normal">
                              No tasks in {col.name}
                            </div>
                          )}
                        </div>

                        {/* Quick add task button at bottom of column */}
                        <div className="p-2 pt-0">
                          <button
                            type="button"
                            className="w-full py-1.5 rounded-lg border border-dashed border-slate-300 hover:border-blue-400 hover:bg-white text-slate-500 hover:text-blue-600 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all"
                            onClick={() => {
                              setNewTaskStage(col.id)
                              setShowAddTaskModal(true)
                            }}
                          >
                            <Plus size={12} />
                            <span>Add task to {col.name}</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* LIST VIEW MODE */
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Task Name</th>
                        <th className="py-3 px-4">Stage</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Assignee</th>
                        <th className="py-3 px-4">Due Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTasks.map((task) => (
                        <tr key={task.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {task.title}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                              {task.stage.replace('-', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                task.priority === 'High'
                                  ? 'bg-rose-50 text-rose-600'
                                  : task.priority === 'Medium'
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'bg-emerald-50 text-emerald-600'
                              }`}
                            >
                              {task.priority}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <img
                                src={
                                  task.assignee.avatar ||
                                  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
                                }
                                alt=""
                                className="w-5 h-5 rounded-full object-cover"
                              />
                              <span className="font-medium text-slate-700">
                                {task.assignee.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {task.dueDate}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              className="text-slate-400 hover:text-red-600 p-1 rounded"
                              onClick={() =>
                                setTasks((prev) => prev.filter((t) => t.id !== task.id))
                              }
                              title="Delete task"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-2">Project Overview</h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
              {displayProject.description ||
                'This project encompasses comprehensive architecture planning, infrastructure migration, responsive front-end design, and enterprise-grade backend APIs.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="text-xs text-slate-500">Overall Progress</span>
              <div className="mt-2 flex items-center justify-between text-sm font-bold text-slate-900">
                <span>Completed Tasks</span>
                <span>5 / 16 (31%)</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '31%' }} />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="text-xs text-slate-500">Project Type & Priority</span>
              <p className="mt-2 text-sm font-bold text-slate-900">
                {displayProject.project_type || 'Web Development'}
              </p>
              <span className="inline-block mt-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                High Priority
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="text-xs text-slate-500">Client Organization</span>
              <p className="mt-2 text-sm font-bold text-slate-900">
                {displayProject.customer?.company_name || 'TechSolutions Inc.'}
              </p>
              <span className="inline-block mt-1 text-[11px] text-slate-500">
                Managed by {displayProject.manager?.name || 'Michael Chen'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT: TEAM ── */}
      {activeTab === 'team' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Project Team Members</h2>
            <button
              type="button"
              className="btn btn-sm btn-outline text-xs"
              onClick={() => alert('Invite member dialog')}
            >
              <Plus size={13} />
              <span>Assign Member</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: 'Michael Chen',
                role: 'Project Manager',
                email: 'michael.chen@ooralabz.com',
                tasks: 4,
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
              },
              {
                name: 'Sarah Johnson',
                role: 'Lead Architect',
                email: 'sarah.j@ooralabz.com',
                tasks: 3,
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
              },
              {
                name: 'Emily Rodriguez',
                role: 'UI/UX Designer',
                email: 'emily.r@ooralabz.com',
                tasks: 2,
                avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
              },
              {
                name: 'John Doe',
                role: 'Senior Backend Engineer',
                email: 'john.d@ooralabz.com',
                tasks: 3,
                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
              },
              {
                name: 'Lisa Wang',
                role: 'Full Stack Developer',
                email: 'lisa.w@ooralabz.com',
                tasks: 2,
                avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
              },
              {
                name: 'Kevin Perera',
                role: 'DevOps & Cloud Engineer',
                email: 'kevin.p@ooralabz.com',
                tasks: 2,
                avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop&crop=face',
              },
            ].map((m, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
                <img src={m.avatar} alt={m.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800">{m.name}</p>
                  <p className="text-[11px] text-blue-600 font-medium">{m.role}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{m.email}</p>
                  <p className="text-[10px] text-slate-500 mt-2 font-semibold">{m.tasks} active tasks</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB CONTENT: OTHER TABS FALLBACK ── */}
      {activeTab !== 'tasks' && activeTab !== 'overview' && activeTab !== 'team' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <CheckSquare size={22} />
          </div>
          <h3 className="text-sm font-bold text-slate-800 capitalize">{activeTab} Details</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Manage all project {activeTab} information, updates, and records.
          </p>
        </div>
      )}

      {/* ── FLOATING / MODAL: ADD NEW TASK (EXACT MATCH TO MOCKUP) ── */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-start sm:p-6 p-3 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-md overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-4 pb-3 flex items-center justify-between border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add New Task</h3>
              <button
                type="button"
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
                onClick={() => setShowAddTaskModal(false)}
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateTask} className="p-4 space-y-3.5">
              {/* Task Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter task title..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter task description..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 font-medium text-slate-800 resize-none"
                />
              </div>

              {/* Priority, Task Type, Assign To */}
              <div className="grid grid-cols-3 gap-2.5">
                {/* Priority */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                  >
                    <option value="High">🔴 High</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Low">🟢 Low</option>
                  </select>
                </div>

                {/* Task Type */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Task Type
                  </label>
                  <select
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                  >
                    <option value="General">General</option>
                    <option value="Bug">Bug</option>
                    <option value="Feature">Feature</option>
                    <option value="Task">Task</option>
                  </select>
                </div>

                {/* Assign To */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Assign To <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                  >
                    <option value="John Doe">John Doe</option>
                    <option value="Sarah Johnson">Sarah Johnson</option>
                    <option value="Michael Chen">Michael Chen</option>
                    <option value="Emily Rodriguez">Emily Rodriguez</option>
                    <option value="David Kim">David Kim</option>
                    <option value="Lisa Wang">Lisa Wang</option>
                    <option value="Kevin Perera">Kevin Perera</option>
                  </select>
                </div>
              </div>

              {/* Due Date, Reminder, Stage */}
              <div className="grid grid-cols-3 gap-2.5">
                {/* Due Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                  />
                </div>

                {/* Reminder */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Reminder
                  </label>
                  <select
                    value={newTaskReminder}
                    onChange={(e) => setNewTaskReminder(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                  >
                    <option value="1 Hour Before">1 Hour Before</option>
                    <option value="30 Mins Before">30 Mins Before</option>
                    <option value="1 Day Before">1 Day Before</option>
                  </select>
                </div>

                {/* Stage */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Stage
                  </label>
                  <select
                    value={newTaskStage}
                    onChange={(e) => setNewTaskStage(e.target.value as any)}
                    className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                  >
                    <option value="to-do">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  onClick={() => setShowAddTaskModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-sm"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PROJECT EDIT SLIDE DRAWER INTEGRATION ── */}
      {project && (
        <ProjectViewDrawer
          project={project}
          isOpen={isEditDrawerOpen}
          initialEditMode={isEditMode}
          onClose={() => {
            setIsEditDrawerOpen(false)
            setIsEditMode(false)
            fetchProjectData()
          }}
          onSave={(updatedProject) => {
            setProject(updatedProject)
            setIsEditDrawerOpen(false)
            setIsEditMode(false)
          }}
          onDelete={() => {
            setIsEditDrawerOpen(false)
            navigate('/projects')
          }}
        />
      )}
    </div>
  )
}
