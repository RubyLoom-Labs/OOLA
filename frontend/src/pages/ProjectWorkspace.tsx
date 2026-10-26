import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
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
  UserPlus,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import {
  projectsApi,
  type Project,
  type ProjectTaskPayload,
} from '@/apis/projectsApi'
import { tasksApi } from '@/apis/tasksApi'
import { getUserColor, getUserInitials } from '@/components/users/UserSelect'
import { type ProjectUser, getUserRoleName } from '@/apis/usersApi'
import AddTeamMemberModal from '@/components/projects/AddTeamMemberModal'
import ProjectViewDrawer from '@/components/projects/ProjectViewDrawer'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import Breadcrumb from '@/components/ui/Breadcrumb'
import StatCard from '@/components/common/StatCard'

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

const mapApiTaskToKanbanTask = (t: any): KanbanTask => {
  let stage: KanbanTask['stage'] = 'to-do'
  const rawStage = String(t.stage || t.status || '').toLowerCase().replace(/[\s_]+/g, '-')
  if (rawStage.includes('progress') || rawStage === 'in-progress' || rawStage === 'doing') {
    stage = 'in-progress'
  } else if (rawStage.includes('review') || rawStage.includes('testing') || rawStage.includes('qa')) {
    stage = 'review'
  } else if (rawStage.includes('complete') || rawStage.includes('done')) {
    stage = 'completed'
  } else {
    stage = 'to-do'
  }

  let priority: KanbanTask['priority'] = 'Medium'
  const rawPriority = String(t.priority || '').toLowerCase()
  if (rawPriority.includes('high') || rawPriority.includes('urgent')) {
    priority = 'High'
  } else if (rawPriority.includes('low')) {
    priority = 'Low'
  } else {
    priority = 'Medium'
  }

  const firstUser = Array.isArray(t.users) && t.users.length > 0 ? t.users[0] : (t.user || null)
  const assigneeName =
    firstUser?.name ||
    t.assignee_name ||
    (typeof t.assignee === 'string' ? t.assignee : t.assignee?.name) ||
    'Unassigned'
  const assigneeAvatar = firstUser?.avatar || (typeof t.assignee === 'object' ? t.assignee?.avatar : undefined)
  const assigneeRole =
    firstUser?.designation || (typeof t.assignee === 'object' ? t.assignee?.role : undefined) || 'Team Member'

  let dueDate = 'No Due Date'
  if (t.due_date) {
    try {
      const d = new Date(t.due_date)
      if (!isNaN(d.getTime())) {
        dueDate = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      } else {
        dueDate = String(t.due_date)
      }
    } catch {
      dueDate = String(t.due_date)
    }
  }

  return {
    id: String(t.id),
    title: t.title || t.name || 'Untitled Task',
    description: t.description || undefined,
    priority,
    taskType: (t.task_type as any) || 'General',
    stage,
    assignee: {
      name: assigneeName,
      avatar: assigneeAvatar,
      role: assigneeRole,
    },
    dueDate,
    subtasksCount: t.subtasks_count || (Array.isArray(t.subtasks) ? t.subtasks.length : 0),
    completedAt: t.completed_at || (stage === 'completed' ? dueDate : undefined),
  }
}

const STAGES: { id: KanbanTask['stage']; name: string }[] = [
  { id: 'to-do', name: 'To Do' },
  { id: 'in-progress', name: 'In Progress' },
  { id: 'review', name: 'Review' },
  { id: 'completed', name: 'Completed' },
]

const parseDateToInputFormat = (dateStr?: string): string => {
  if (!dateStr) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  try {
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  } catch (e) {
    // fallback
  }
  return ''
}

const getApiErrorMessage = (err: any, fallback = 'Operation failed'): string => {
  if (err?.errors && typeof err.errors === 'object') {
    const errorStrings = Object.values(err.errors)
      .flat()
      .filter(Boolean)
    if (errorStrings.length > 0) {
      return errorStrings.join(' ')
    }
  }
  return err?.response?.data?.message || err?.message || fallback
}

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

  // Task list state - starts empty and loads real tasks from API
  const [tasks, setTasks] = useState<KanbanTask[]>(() => {
    if (!id) return []
    const saved = localStorage.getItem(`project_tasks_${id}`)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          // If the cache contains any legacy mock tasks ('task-1' through 'task-16'), wipe cache completely
          const hasLegacyMock = parsed.some((t: any) => /^task-(?:[1-9]|1[0-6])$/.test(String(t.id)))
          if (hasLegacyMock) {
            localStorage.removeItem(`project_tasks_${id}`)
            return []
          }
          return parsed
        }
      } catch (e) {
        // Fallback
      }
    }
    return []
  })
  const [tasksLoading, setTasksLoading] = useState(false)

  // Drag and Drop state
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<KanbanTask['stage'] | null>(null)

  // Add / Edit Task Modal State
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('High')
  const [newTaskType, setNewTaskType] = useState<'General' | 'Bug' | 'Feature' | 'Task'>('General')
  const [newTaskAssignee, setNewTaskAssignee] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState(() => new Date().toISOString().split('T')[0])
  const [newTaskReminder, setNewTaskReminder] = useState('1 Hour Before')
  const [newTaskStage, setNewTaskStage] = useState<KanbanTask['stage']>('to-do')
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<KanbanTask | null>(null)
  const [memberToRemove, setMemberToRemove] = useState<ProjectUser | null>(null)
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false)

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Task form loading and error state
  const [taskFormLoading, setTaskFormLoading] = useState(false)
  const [taskFormError, setTaskFormError] = useState<string | null>(null)

  // Persist tasks in localStorage per project
  useEffect(() => {
    if (id) {
      localStorage.setItem(`project_tasks_${id}`, JSON.stringify(tasks))
    }
  }, [tasks, id])

  // Fetch real tasks from backend API
  const fetchTasks = async (projectId: string | number) => {
    setTasksLoading(true)
    // 1. Try project-specific endpoint /projects/{id}/tasks
    try {
      const res = await projectsApi.getProjectTasks(projectId)
      const taskList = (res as any)?.data?.data || (res as any)?.data || res
      if (Array.isArray(taskList)) {
        const mapped = taskList.map(mapApiTaskToKanbanTask)
        setTasks(mapped)
        if (id) {
          localStorage.setItem(`project_tasks_${id}`, JSON.stringify(mapped))
        }
        return
      }
    } catch (err) {
      console.warn('projectsApi.getProjectTasks failed, trying tasksApi:', err)
    }

    // 2. Try generic tasksApi with taskable filters
    try {
      const res = await tasksApi.getTasks({
        taskable_type: 'project',
        taskable_id: projectId,
        per_page: 100,
      })
      const taskList = (res as any)?.data?.data || (res as any)?.data || res
      if (Array.isArray(taskList)) {
        const mapped = taskList.map(mapApiTaskToKanbanTask)
        setTasks(mapped)
        if (id) {
          localStorage.setItem(`project_tasks_${id}`, JSON.stringify(mapped))
        }
        return
      }
    } catch (err) {
      console.warn('tasksApi.getTasks taskable query failed, trying fallback:', err)
    }

    // 3. Fallback query
    try {
      const res = await tasksApi.getTasks({
        taskable_id: projectId,
        per_page: 100,
      } as any)
      const taskList = (res as any)?.data?.data || (res as any)?.data || res
      if (Array.isArray(taskList)) {
        const mapped = taskList.map(mapApiTaskToKanbanTask)
        setTasks(mapped)
        if (id) {
          localStorage.setItem(`project_tasks_${id}`, JSON.stringify(mapped))
        }
        return
      }
    } catch (err) {
      console.warn('tasksApi.getTasks fallback failed:', err)
    } finally {
      setTasksLoading(false)
    }
  }

  // Fetch project details
  const fetchProjectData = async () => {
    if (!id) return
    try {
      const res = await projectsApi.getProject(id)
      const projectData = (res as any)?.data?.data || (res as any)?.data || res
      setProject(projectData)

      // If backend project endpoint returns tasks relation, use it
      if (Array.isArray(projectData?.tasks) && projectData.tasks.length > 0) {
        const mapped = projectData.tasks.map(mapApiTaskToKanbanTask)
        setTasks(mapped)
        localStorage.setItem(`project_tasks_${id}`, JSON.stringify(mapped))
      } else {
        await fetchTasks(id)
      }
    } catch (err: any) {
      console.warn('API getProject failed, attempting to load tasks independently:', err)
      await fetchTasks(id)
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

  const handleDrop = async (e: React.DragEvent, targetStage: KanbanTask['stage']) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId
    if (!taskId) return

    setDraggingTaskId(null)
    setDragOverStage(null)

    const existingTask = tasks.find((t) => t.id === taskId)
    if (!existingTask || existingTask.stage === targetStage) return

    // If it's a backend task, sync with backend before updating state
    if (!taskId.startsWith('task-')) {
      try {
        await tasksApi.updateTask(taskId, { stage: targetStage })
        setTasks((prev) => {
          const updated = prev.map((t) => (t.id === taskId ? { ...t, stage: targetStage } : t))
          if (id) {
            localStorage.setItem(`project_tasks_${id}`, JSON.stringify(updated))
          }
          return updated
        })
        showToast(`Task moved to "${targetStage.replace('-', ' ')}".`, 'success')
      } catch (err: any) {
        console.error('Backend updateTask stage failed:', err)
        const errorMsg = getApiErrorMessage(err, 'Failed to update task stage.')
        showToast(errorMsg, 'error')
        // Do NOT update FE state; remains in existingTask.stage
      }
    } else {
      setTasks((prev) => {
        const updated = prev.map((t) => (t.id === taskId ? { ...t, stage: targetStage } : t))
        if (id) {
          localStorage.setItem(`project_tasks_${id}`, JSON.stringify(updated))
        }
        return updated
      })
    }
  }

  // Open Create Task Modal
  const handleOpenCreateTask = (stageId?: KanbanTask['stage']) => {
    setEditingTaskId(null)
    setTaskFormError(null)
    setTaskFormLoading(false)
    setNewTaskTitle('')
    setNewTaskDesc('')
    setNewTaskStage(stageId || 'to-do')
    setNewTaskPriority('High')
    setNewTaskType('General')
    if (projectAssignedUsers.length > 0) {
      setNewTaskAssignee(projectAssignedUsers[0].name)
    } else {
      setNewTaskAssignee('')
    }
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    setNewTaskDueDate(`${yyyy}-${mm}-${dd}`)
    setNewTaskReminder('1 Hour Before')
    setShowAddTaskModal(true)
  }

  // Open Edit Task Modal
  const handleOpenEditTask = (task: KanbanTask) => {
    setEditingTaskId(task.id)
    setTaskFormError(null)
    setTaskFormLoading(false)
    setNewTaskTitle(task.title)
    setNewTaskDesc(task.description || '')
    setNewTaskAssignee(task.assignee.name)
    setNewTaskStage(task.stage)
    setNewTaskPriority(task.priority)
    setNewTaskType(task.taskType || 'General')
    setNewTaskDueDate(parseDateToInputFormat(task.dueDate))
    setNewTaskReminder('1 Hour Before')
    setShowAddTaskModal(true)
  }

  // Open Task Delete Confirmation Modal
  const handleDeleteTask = (taskOrId: KanbanTask | string) => {
    if (typeof taskOrId === 'string') {
      const found = tasks.find((t) => t.id === taskOrId)
      if (found) {
        setTaskToDelete(found)
      } else {
        setTaskToDelete({
          id: taskOrId,
          title: 'this task',
          stage: 'to-do',
          priority: 'Medium',
          assignee: { name: 'Unassigned' },
          dueDate: '',
        })
      }
    } else {
      setTaskToDelete(taskOrId)
    }
  }

  // Handle Confirm Delete Task
  const handleConfirmDeleteTask = async () => {
    if (!taskToDelete) return
    const taskId = taskToDelete.id
    const taskTitle = taskToDelete.title

    // If it's a backend task, call API and await response
    if (!taskId.startsWith('task-')) {
      try {
        await tasksApi.deleteTask(taskId)
      } catch (err: any) {
        console.error('Backend deleteTask failed:', err)
        const errorMsg = getApiErrorMessage(err, `Failed to delete task "${taskTitle}".`)
        showToast(errorMsg, 'error')
        setTaskToDelete(null)
        // CRITICAL: Do NOT delete from FE state on backend error!
        return
      }
    }

    // Backend succeeded (or mock task): update FE state
    setTasks((prev) => {
      const updated = prev.filter((t) => t.id !== taskId)
      if (id) {
        localStorage.setItem(`project_tasks_${id}`, JSON.stringify(updated))
      }
      return updated
    })
    setTaskToDelete(null)
    showToast(`Task "${taskTitle}" deleted successfully.`, 'success')
  }

  // Handle Confirm Delete Project
  const handleConfirmDeleteProject = async () => {
    if (!displayProject?.id) return
    try {
      await projectsApi.deleteProject(displayProject.id)
      navigate('/projects')
    } catch (err: any) {
      console.error('Failed to delete project:', err)
      alert(err?.response?.data?.message || err?.message || 'Failed to delete project.')
    }
  }

  // Handle Save Task (Create or Update)
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    setTaskFormError(null)
    setTaskFormLoading(true)

    const assignedUser = projectAssignedUsers.find((u) => u.name === newTaskAssignee)
    const isManager = assignedUser && assignedUser.id === displayProject.manager?.id
    const userRole = isManager
      ? 'Project Manager'
      : (assignedUser?.designation || getUserRoleName(assignedUser) || 'Team Member')

    let formattedDueDate = newTaskDueDate
    if (newTaskDueDate && newTaskDueDate.includes('-')) {
      try {
        const parts = newTaskDueDate.split('-')
        if (parts.length === 3) {
          const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
          formattedDueDate = d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        }
      } catch (err) {
        // Fallback
      }
    }

    const taskPayload = {
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim() || undefined,
      priority: newTaskPriority,
      task_type: newTaskType,
      stage: newTaskStage,
      taskable_type: 'project',
      taskable_id: Number(displayProject.id),
      due_date: newTaskDueDate,
      reminder: newTaskReminder,
      user_ids: assignedUser ? [assignedUser.id] : [],
    }

    try {
      if (editingTaskId) {
        // Edit existing task in backend
        let updatedTaskData: any = null
        if (!editingTaskId.startsWith('task-')) {
          const res = await tasksApi.updateTask(editingTaskId, taskPayload)
          updatedTaskData = (res as any)?.data?.data || (res as any)?.data || res
        }

        // ONLY if backend succeeded, update frontend state
        setTasks((prev) => {
          const updated = prev.map((t) => {
            if (t.id === editingTaskId) {
              return {
                ...t,
                title: updatedTaskData?.title || newTaskTitle.trim(),
                description: updatedTaskData?.description ?? (newTaskDesc.trim() || undefined),
                priority: updatedTaskData?.priority || newTaskPriority,
                taskType: updatedTaskData?.task_type || newTaskType,
                stage: newTaskStage,
                assignee: {
                  name: newTaskAssignee || assignedUser?.name || t.assignee.name || 'Unassigned',
                  avatar: (assignedUser as any)?.avatar || t.assignee.avatar,
                  role: userRole,
                },
                dueDate: formattedDueDate || t.dueDate,
              }
            }
            return t
          })
          if (id) {
            localStorage.setItem(`project_tasks_${id}`, JSON.stringify(updated))
          }
          return updated
        })

        showToast(`Task "${newTaskTitle.trim()}" updated successfully.`, 'success')
      } else {
        // Create new task in backend
        const res = await tasksApi.createTask(taskPayload)
        const created = (res as any)?.data?.data || (res as any)?.data || res
        const realId = created?.id ? String(created.id) : `task-${Date.now()}`

        const newTask: KanbanTask = {
          id: realId,
          title: created?.title || newTaskTitle.trim(),
          description: created?.description || (newTaskDesc.trim() || undefined),
          priority: created?.priority || newTaskPriority,
          taskType: created?.task_type || newTaskType,
          stage: newTaskStage,
          assignee: {
            name: newTaskAssignee || assignedUser?.name || 'Unassigned',
            avatar: (assignedUser as any)?.avatar,
            role: userRole,
          },
          dueDate: formattedDueDate || 'Oct 25, 2026',
          subtasksCount: 0,
        }

        // ONLY if backend succeeded, update frontend state
        setTasks((prev) => {
          const updated = [newTask, ...prev]
          if (id) {
            localStorage.setItem(`project_tasks_${id}`, JSON.stringify(updated))
          }
          return updated
        })

        showToast(`Task "${newTaskTitle.trim()}" created successfully.`, 'success')
      }

      // Close modal and reset form only on success
      setEditingTaskId(null)
      setNewTaskTitle('')
      setNewTaskDesc('')
      setTaskFormError(null)
      setShowAddTaskModal(false)
    } catch (err: any) {
      console.error('Task operation failed in backend:', err)
      const errorMsg = getApiErrorMessage(
        err,
        editingTaskId ? 'Failed to update task.' : 'Failed to create task.'
      )
      // Display error inside modal and via toast, keeping modal open and FE state intact!
      setTaskFormError(errorMsg)
      showToast(errorMsg, 'error')
    } finally {
      setTaskFormLoading(false)
    }
  }

  // Active Display Project with robust fallback
  const displayProject: any = project || {
    id: id ? (isNaN(Number(id)) ? id : Number(id)) : '',
    project_code: '',
    project_title: 'Project Workspace',
    description: '',
    customer_id: null,
    customer: null,
    manager: null,
    users: [],
    stage: { name: 'In Progress', color: '#10b981' },
    project_type: '',
    priority: 'Medium',
    status: 'In Progress',
    start_date: '',
    expected_end_date: '',
    budget: 0,
    quoted_amount: 0,
    cost: 0,
    revenue: 0,
  }

  // Project assigned users (manager + team members, deduplicated)
  const projectAssignedUsers: ProjectUser[] = useMemo(() => {
    const list: ProjectUser[] = []
    const seen = new Set<number>()

    // Manager
    if (displayProject?.manager?.id && displayProject?.manager?.name) {
      seen.add(displayProject.manager.id)
      list.push(displayProject.manager as ProjectUser)
    }

    // Assigned team members
    if (Array.isArray(displayProject?.users)) {
      displayProject.users.forEach((u: ProjectUser) => {
        if (!seen.has(u.id)) {
          seen.add(u.id)
          list.push(u)
        }
      })
    }

    return list
  }, [displayProject])

  // Keep newTaskAssignee in sync with available assigned users
  useEffect(() => {
    if (projectAssignedUsers.length > 0) {
      if (!newTaskAssignee || !projectAssignedUsers.some((u) => u.name === newTaskAssignee)) {
        setNewTaskAssignee(projectAssignedUsers[0].name)
      }
    } else {
      setNewTaskAssignee('')
    }
  }, [projectAssignedUsers, newTaskAssignee])

  // Add new team members via AddTeamMemberModal
  const handleAddMembers = async (
    newlySelectedUserIds: number[],
    _newlySelectedUsers: ProjectUser[]
  ) => {
    if (!displayProject?.id) return
    const currentIds = Array.isArray(displayProject.users)
      ? displayProject.users.map((u: ProjectUser) => u.id)
      : []
    const combinedIds = Array.from(new Set([...currentIds, ...newlySelectedUserIds]))

    try {
      const res = await projectsApi.updateProject(displayProject.id, {
        user_ids: combinedIds,
      })
      if (res?.data) {
        setProject(res.data)
      } else {
        await fetchProjectData()
      }
      setShowAddMemberModal(false)
    } catch (err: any) {
      console.error('Failed to assign team members:', err)
      alert(err?.response?.data?.message || err?.message || 'Failed to update team members.')
    }
  }

  // Remove member from project (opens ConfirmationModal)
  const handleRemoveMember = (userId: number) => {
    const member = displayProject.users?.find((u: ProjectUser) => u.id === userId)
    if (member) {
      setMemberToRemove(member)
    }
  }

  // Handle Confirm Remove Member
  const handleConfirmRemoveMember = async () => {
    if (!displayProject?.id || !memberToRemove) return
    const userId = memberToRemove.id
    const currentIds = Array.isArray(displayProject.users)
      ? displayProject.users.map((u: ProjectUser) => u.id)
      : []
    const updatedIds = currentIds.filter((id: number) => id !== userId)

    try {
      const res = await projectsApi.updateProject(displayProject.id, {
        user_ids: updatedIds,
      })
      if (res?.data) {
        setProject(res.data)
      } else {
        await fetchProjectData()
      }
      setMemberToRemove(null)
      showToast(`Team member "${memberToRemove.name}" removed from project.`)
    } catch (err: any) {
      console.error('Failed to remove team member:', err)
      showToast(err?.response?.data?.message || err?.message || 'Failed to remove team member.')
    }
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

  // Available unique team members for filter: strictly backend assigned users for this project
  const teamMembers = useMemo(() => {
    const assignedNames = projectAssignedUsers.map((u) => u.name).filter(Boolean)
    return ['All Members', ...assignedNames]
  }, [projectAssignedUsers])

  // Sync selectedMember if previously selected member is no longer assigned to project
  useEffect(() => {
    if (selectedMember !== 'All Members' && !teamMembers.includes(selectedMember)) {
      setSelectedMember('All Members')
    }
  }, [teamMembers, selectedMember])

  const getPriorityBadgeClass = (p?: string) => {
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

  return (
    <div className="contacts-module-container animate-fade-in">
      {/* Toast Feedback */}
      {toast && (
        <div
          className={`module-toast animate-slide-up flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium ${
            toast.type === 'error'
              ? 'bg-rose-50 border border-rose-200 text-rose-800'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
          ) : (
            <CheckCircle size={16} className="text-emerald-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── BREADCRUMB ── */}
      <div className="mb-4">
        <Breadcrumb
          items={[
            { label: 'Projects', path: '/projects' },
            { label: displayProject.project_title },
          ]}
        />
      </div>

      {/* ── MODULE PAGE HEADER ── */}
      <div className="module-page-header flex items-start sm:items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="module-page-header-left flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs mt-0.5 sm:mt-0">
            <FolderKanban size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-snug">
                {displayProject.project_title}
              </h1>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 shadow-2xs"
                style={{
                  backgroundColor: `${displayProject.stage?.color || '#2563eb'}15`,
                  color: displayProject.stage?.color || '#2563eb',
                  border: `1px solid ${displayProject.stage?.color || '#2563eb'}35`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: displayProject.stage?.color || '#2563eb' }}
                />
                <span>{displayProject.stage?.name || displayProject.status || 'In Progress'}</span>
              </span>
              {displayProject.project_code && (
                <span className="inline-flex items-center font-mono text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200/90 shadow-2xs shrink-0">
                  {displayProject.project_code}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-[13px] text-gray-500 mt-1 leading-relaxed max-w-3xl">
              {displayProject.description ||
                `Manage project tasks, development sprints, and tracking for ${displayProject.customer?.company_name || 'Client'}.`}
            </p>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="module-page-header-actions flex items-center gap-2.5 shrink-0 self-start sm:self-center mt-1 sm:mt-0">
          {/* Project Actions Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              className="btn btn-outline btn-sm text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
              onClick={() => setShowActionsDropdown(!showActionsDropdown)}
            >
              <span>Project Actions</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            {showActionsDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowActionsDropdown(false)}
                />
                <div
                  className="absolute left-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-1.5 z-50 animate-scale-in text-xs font-medium text-slate-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-2.5 transition-colors group cursor-pointer"
                    onClick={() => {
                      setShowActionsDropdown(false)
                      window.print()
                    }}
                  >
                    <div className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-blue-50 text-slate-500 group-hover:text-blue-600 flex items-center justify-center shrink-0 transition-colors">
                      <Download size={13} />
                    </div>
                    <span className="font-semibold text-slate-700 group-hover:text-slate-900">
                      Export Summary PDF
                    </span>
                  </button>

                  <button
                    type="button"
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-2.5 transition-colors group cursor-pointer"
                    onClick={() => {
                      setShowActionsDropdown(false)
                      navigator.clipboard.writeText(window.location.href)
                      showToast('Project share link copied to clipboard!')
                    }}
                  >
                    <div className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-blue-50 text-slate-500 group-hover:text-blue-600 flex items-center justify-center shrink-0 transition-colors">
                      <Share2 size={13} />
                    </div>
                    <span className="font-semibold text-slate-700 group-hover:text-slate-900">
                      Share Project Link
                    </span>
                  </button>

                  <div className="h-px bg-slate-100 my-1" />

                  <button
                    type="button"
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-rose-50 flex items-center gap-2.5 transition-colors group cursor-pointer text-rose-600"
                    onClick={() => {
                      setShowActionsDropdown(false)
                      setShowDeleteProjectModal(true)
                    }}
                  >
                    <div className="w-6 h-6 rounded-lg bg-rose-50 group-hover:bg-rose-100 text-rose-500 flex items-center justify-center shrink-0 transition-colors">
                      <Trash2 size={13} />
                    </div>
                    <span className="font-semibold text-rose-600 group-hover:text-rose-700">
                      Delete Project
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Edit Project Button */}
          <button
            type="button"
            className="btn btn-outline btn-sm text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs whitespace-nowrap shrink-0"
            onClick={() => {
              setIsEditMode(true)
              setIsEditDrawerOpen(true)
            }}
          >
            <Edit2 size={14} />
            <span>Edit Project</span>
          </button>

          {/* Add Task Primary Button */}
          <button
            type="button"
            className="btn btn-primary btn-sm text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs whitespace-nowrap shrink-0"
            onClick={() => handleOpenCreateTask()}
          >
            <Plus size={15} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* ── STAT CARDS ROW (STANDARD GLOBAL STAT CARDS) ── */}
      <div className="contacts-stats-grid">
        <StatCard
          label="Project Value"
          value={`$${(Number(displayProject.budget) || Number(displayProject.quoted_amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
          icon={<Briefcase size={20} />}
          variant="blue"
        />
        <StatCard
          label="Paid Amount"
          value={`$${(Number(displayProject.revenue) || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
          icon={<DollarSign size={20} />}
          variant="green"
        />
        <StatCard
          label="Outstanding"
          value={`$${(Number(displayProject.cost) || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
          icon={<FileText size={20} />}
          variant="amber"
        />
        <StatCard
          label="Target End Date"
          value={
            displayProject.expected_end_date
              ? new Date(displayProject.expected_end_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Not set'
          }
          icon={<Calendar size={20} />}
          variant="purple"
        />
      </div>

      {/* ── HORIZONTAL NAVIGATION TABS ── */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
        {[
          { key: 'overview', label: 'Overview', icon: <FolderKanban size={14} /> },
          { key: 'tasks', label: 'Tasks', icon: <CheckSquare size={14} />, count: tasks.length },
          { key: 'subtasks', label: 'Subtasks', icon: <ListTodo size={14} /> },
          { key: 'team', label: 'Team', icon: <Users size={14} /> },
          { key: 'documents', label: 'Documents', icon: <Files size={14} /> },
          { key: 'payments', label: 'Payments', icon: <DollarSign size={14} /> },
          { key: 'activities', label: 'Activities', icon: <Activity size={14} /> },
          { key: 'notes', label: 'Notes', icon: <FileText size={14} /> },
          { key: 'tickets', label: 'Tickets', icon: <LifeBuoy size={14} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
              activeTab === tab.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === tab.key
                    ? 'bg-primary-50 text-primary-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT: TASKS (DEFAULT KANBAN / LIST VIEW) ── */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Controls Bar: View Switcher, Search, Filters */}
          <div className="contacts-filter-bar">
            {/* View Switcher Pills */}
            <div className="view-mode-toggle-box">
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                onClick={() => setViewMode('kanban')}
                title="Kanban View"
              >
                <LayoutGrid size={14} />
                <span className="text-xs font-medium ml-1.5">Kanban View</span>
              </button>
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <List size={14} />
                <span className="text-xs font-medium ml-1.5">List View</span>
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-2.5 flex-wrap flex-1 justify-end">
              {/* Search tasks... */}
              <div className="contacts-search-box" style={{ maxWidth: 300, minWidth: 200 }}>
                <Search size={15} className="contacts-search-icon" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="contacts-search-input"
                />
              </div>

              {/* Filter: All Members */}
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="form-select contacts-status-select"
              >
                {teamMembers.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Filter: All Priority */}
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="form-select contacts-status-select"
              >
                <option value="All Priority">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              {/* Filter: All Stages */}
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="form-select contacts-status-select"
              >
                <option value="All Stages">All Stages</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-select contacts-status-select"
              >
                <option value="Default">Sort: Default</option>
                <option value="DueDate">Sort: Due Date</option>
                <option value="Priority">Sort: Priority</option>
                <option value="Title">Sort: Title (A-Z)</option>
              </select>
            </div>
          </div>

          {/* ── MAIN WORKSPACE CONTENT: LEFT INFO + RIGHT KANBAN ── */}
          <div className="flex flex-col lg:flex-row items-start gap-4">
            {/* ── LEFT COLUMN: PROJECT INFO & TEAM (approx 270px) ── */}
            <div className="w-full lg:w-[270px] shrink-0 space-y-4">
              {/* Card 1: Project Information */}
              <div className="card p-4">
                {/* Header */}
                <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-gray-100">
                  <Briefcase size={14} className="text-primary-600 shrink-0" />
                  <h3 className="card-title text-xs uppercase tracking-wider font-bold text-gray-900 whitespace-nowrap">
                    Project Information
                  </h3>
                </div>

                {/* Details List */}
                <div className="divide-y divide-gray-100 text-xs">
                  {/* Project Manager */}
                  <div className="flex items-center justify-between gap-3 py-2 first:pt-0">
                    <span className="text-gray-500 font-medium shrink-0">Project Manager</span>
                    <div className="flex items-center gap-1.5 font-semibold text-gray-800 min-w-0 justify-end flex-1">
                      {displayProject.manager?.name ? (
                        <>
                          {(displayProject.manager as any).avatar ? (
                            <img
                              src={(displayProject.manager as any).avatar}
                              alt="Manager"
                              className="w-5 h-5 rounded-full object-cover shrink-0 ring-1 ring-gray-200"
                            />
                          ) : (
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getUserColor(
                                displayProject.manager.id || 0
                              )}`}
                            >
                              {getUserInitials(displayProject.manager.name)}
                            </div>
                          )}
                          <span className="truncate text-right" title={displayProject.manager.name}>
                            {displayProject.manager.name}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Unassigned</span>
                      )}
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="flex items-center justify-between gap-3 py-2">
                    <span className="text-gray-500 font-medium shrink-0">Customer</span>
                    <div className="flex items-center gap-1.5 font-semibold text-gray-800 min-w-0 justify-end flex-1">
                      <Building2 size={13} className="text-primary-600 shrink-0" />
                      <span
                        className="truncate text-right"
                        title={displayProject.customer?.company_name || 'No Client'}
                      >
                        {displayProject.customer?.company_name || 'No Client'}
                      </span>
                    </div>
                  </div>

                  {/* Project Type */}
                  <div className="flex items-center justify-between gap-3 py-2">
                    <span className="text-gray-500 font-medium shrink-0">Project Type</span>
                    <span
                      className="font-semibold text-gray-800 truncate text-right flex-1 min-w-0"
                      title={displayProject.project_type || 'General'}
                    >
                      {displayProject.project_type || 'General'}
                    </span>
                  </div>

                  {/* Priority */}
                  <div className="flex items-center justify-between gap-3 py-2">
                    <span className="text-gray-500 font-medium shrink-0">Priority</span>
                    <span className={`badge text-[10px] py-0.5 px-2.5 font-semibold ${getPriorityBadgeClass(displayProject.priority)}`}>
                      {displayProject.priority || 'Medium'}
                    </span>
                  </div>

                  {/* Start Date */}
                  <div className="flex items-center justify-between gap-3 py-2">
                    <span className="text-gray-500 font-medium shrink-0">Start Date</span>
                    <div className="flex items-center gap-1.5 font-medium text-gray-700">
                      <Calendar size={12} className="text-gray-400 shrink-0" />
                      <span className="tabular-nums">
                        {displayProject.start_date
                          ? new Date(displayProject.start_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Not set'}
                      </span>
                    </div>
                  </div>

                  {/* End Date */}
                  <div className="flex items-center justify-between gap-3 py-2">
                    <span className="text-gray-500 font-medium shrink-0">End Date</span>
                    <div className="flex items-center gap-1.5 font-medium text-gray-700">
                      <Calendar size={12} className="text-gray-400 shrink-0" />
                      <span className="tabular-nums">
                        {displayProject.expected_end_date
                          ? new Date(displayProject.expected_end_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Not set'}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between gap-3 py-2 last:pb-0">
                    <span className="text-gray-500 font-medium shrink-0">Status</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="truncate">
                        {displayProject.stage?.name || displayProject.status || 'In Progress'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Project Team */}
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                  <h3 className="card-title text-xs uppercase tracking-wider font-bold text-gray-900">
                    Project Team
                  </h3>
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-primary-600 hover:text-primary-700"
                    onClick={() => setActiveTab('team')}
                  >
                    View All
                  </button>
                </div>

                {projectAssignedUsers.length > 0 ? (
                  <div className="flex items-center -space-x-2 py-1 overflow-hidden">
                    {projectAssignedUsers.slice(0, 4).map((u) => {
                      const colorClass = getUserColor(u.id)
                      const initials = getUserInitials(u.name)

                      return (u as any).avatar ? (
                        <img
                          key={u.id}
                          className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-2xs"
                          src={(u as any).avatar}
                          title={`${u.name}${u.designation ? ` (${u.designation})` : ''}`}
                          alt={u.name}
                        />
                      ) : (
                        <div
                          key={u.id}
                          className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold shadow-2xs ${colorClass}`}
                          title={`${u.name}${u.designation ? ` (${u.designation})` : ''}`}
                        >
                          {initials}
                        </div>
                      )
                    })}
                    {projectAssignedUsers.length > 4 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold shadow-2xs">
                        +{projectAssignedUsers.length - 4}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-2 text-center">
                    <p className="text-xs text-gray-400">No team members assigned</p>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs mt-2 text-[11px] inline-flex items-center gap-1"
                      onClick={() => setShowAddMemberModal(true)}
                    >
                      <UserPlus size={11} />
                      <span>Assign Member</span>
                    </button>
                  </div>
                )}
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
                        className={`rounded-xl border transition-all duration-150 flex flex-col min-h-[500px] ${
                          isOver
                            ? 'bg-primary-50/50 border-primary-300 ring-2 ring-primary-400/20'
                            : 'bg-gray-50/70 border-gray-200'
                        }`}
                        onDragOver={(e) => handleDragOver(e, col.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, col.id)}
                      >
                        {/* Column Header */}
                        <div className="p-3 pb-2.5 flex items-center justify-between border-b border-gray-200/80 bg-gray-50/80 rounded-t-xl">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                              {col.name}
                            </span>
                            <span className="w-5 h-5 rounded-full bg-gray-200/80 text-gray-700 flex items-center justify-center text-[11px] font-bold">
                              {colTasks.length}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="w-6 h-6 rounded-md hover:bg-gray-200/80 text-gray-500 hover:text-primary-600 flex items-center justify-center transition-colors"
                              title={`Add task to ${col.name}`}
                              onClick={() => handleOpenCreateTask(col.id)}
                            >
                              <Plus size={15} />
                            </button>

                            <button
                              type="button"
                              className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-200/50"
                              title="More options"
                            >
                              <MoreHorizontal size={14} />
                            </button>
                          </div>
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
                                onClick={() => handleOpenEditTask(task)}
                                className={`group bg-white rounded-lg p-3 border transition-all duration-150 cursor-grab active:cursor-grabbing shadow-card hover:shadow-md ${
                                  isBeingDragged
                                    ? 'opacity-40 scale-95 border-primary-400'
                                    : 'border-gray-200 hover:border-primary-300'
                                }`}
                              >
                                {isCompleted ? (
                                  /* Completed Task Design (with Checkmark icon) */
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                                        <Check size={12} className="stroke-[3]" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-800 leading-snug">
                                          {task.title}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-gray-400">
                                          <Calendar size={11} />
                                          <span>{task.completedAt || task.dueDate}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action buttons (revealed on group-hover) */}
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleOpenEditTask(task)
                                        }}
                                        className="w-5 h-5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 flex items-center justify-center transition-colors"
                                        title="Edit Task"
                                      >
                                        <Edit2 size={11} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteTask(task)
                                        }}
                                        className="w-5 h-5 rounded hover:bg-gray-100 text-gray-400 hover:text-rose-600 flex items-center justify-center transition-colors"
                                        title="Delete Task"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Standard Task Design */
                                  <div>
                                    {/* Title + Priority badge + Action buttons */}
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <h4 className="text-xs font-semibold text-gray-800 leading-snug group-hover:text-primary-600 transition-colors flex-1 min-w-0">
                                        {task.title}
                                      </h4>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {/* Action buttons (revealed on group-hover) */}
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleOpenEditTask(task)
                                            }}
                                            className="w-5 h-5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 flex items-center justify-center transition-colors"
                                            title="Edit Task"
                                          >
                                            <Edit2 size={11} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleDeleteTask(task)
                                            }}
                                            className="w-5 h-5 rounded hover:bg-rose-50 text-gray-400 hover:text-rose-600 flex items-center justify-center transition-colors"
                                            title="Delete Task"
                                          >
                                            <Trash2 size={11} />
                                          </button>
                                        </div>

                                        <span
                                          className={`badge text-[10px] leading-none shrink-0 ${
                                            task.priority === 'High'
                                              ? 'badge-warning'
                                              : task.priority === 'Medium'
                                              ? 'badge-info'
                                              : 'badge-success'
                                          }`}
                                        >
                                          {task.priority}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Assignee + Meta info */}
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                                      {/* Assignee */}
                                      <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                                        {task.assignee.avatar ? (
                                          <img
                                            src={task.assignee.avatar}
                                            alt={task.assignee.name}
                                            className="w-5 h-5 rounded-full object-cover shrink-0"
                                            style={{ width: '20px', height: '20px' }}
                                          />
                                        ) : (
                                          <div
                                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getUserColor(
                                              task.assignee.name
                                            )}`}
                                            style={{ width: '20px', height: '20px' }}
                                          >
                                            {getUserInitials(task.assignee.name)}
                                          </div>
                                        )}
                                        <span className="truncate font-medium text-gray-700">
                                          {task.assignee.name}
                                        </span>
                                      </div>

                                      {/* Due date & Subtasks count */}
                                      <div className="flex items-center gap-2 shrink-0">
                                        <div className="flex items-center gap-1 text-gray-400 font-normal">
                                          <Calendar size={11} />
                                          <span>{task.dueDate}</span>
                                        </div>

                                        {task.subtasksCount ? (
                                          <div className="flex items-center gap-0.5 text-gray-400 font-medium">
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
                            <div className="border-2 border-dashed border-primary-400 bg-primary-50/70 rounded-xl p-4 flex flex-col items-center justify-center text-primary-600 gap-1.5 transition-all animate-pulse">
                              <ArrowDown size={18} className="animate-bounce" />
                              <span className="text-xs font-semibold">
                                Drop here to move to {col.name}
                              </span>
                            </div>
                          )}

                          {tasksLoading && tasks.length === 0 ? (
                            <div className="py-8 flex flex-col items-center justify-center text-gray-400 gap-2">
                              <Loader2 size={16} className="animate-spin text-primary-500" />
                              <span className="text-[11px]">Loading tasks...</span>
                            </div>
                          ) : colTasks.length === 0 && !isOver ? (
                            <div className="py-8 text-center text-gray-400 text-xs font-normal">
                              No tasks in {col.name}
                            </div>
                          ) : null}
                        </div>


                      </div>
                    )
                  })}
                </div>
              ) : (
                /* LIST VIEW MODE */
                <div className="table-card overflow-hidden">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Task Name</th>
                        <th>Stage</th>
                        <th>Priority</th>
                        <th>Assignee</th>
                        <th>Due Date</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasksLoading && tasks.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-gray-400 text-xs font-normal">
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 size={16} className="animate-spin text-primary-500" />
                              <span>Loading tasks...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredTasks.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-gray-400 text-xs font-normal">
                            No tasks found
                          </td>
                        </tr>
                      ) : (
                        filteredTasks.map((task) => (
                          <tr key={task.id} className="table-row">
                            <td className="font-semibold text-gray-900">
                              {task.title}
                            </td>
                            <td>
                              <span className="badge badge-neutral capitalize">
                                {task.stage.replace('-', ' ')}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  task.priority === 'High'
                                    ? 'badge-warning'
                                    : task.priority === 'Medium'
                                    ? 'badge-info'
                                    : 'badge-success'
                                }`}
                              >
                                {task.priority}
                              </span>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                {task.assignee.avatar ? (
                                  <img
                                    src={task.assignee.avatar}
                                    alt={task.assignee.name}
                                    className="w-5 h-5 rounded-full object-cover shrink-0"
                                  />
                                ) : (
                                  <div
                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getUserColor(
                                      task.assignee.name
                                    )}`}
                                  >
                                    {getUserInitials(task.assignee.name)}
                                  </div>
                                )}
                                <span className="font-medium text-gray-800">
                                  {task.assignee.name}
                                </span>
                              </div>
                            </td>
                            <td className="text-gray-500">
                              {task.dueDate}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  className="text-gray-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50 transition-colors"
                                  onClick={() => handleOpenEditTask(task)}
                                  title="Edit task"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  className="text-gray-400 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 transition-colors"
                                  onClick={() => handleDeleteTask(task)}
                                  title="Delete task"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
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
        <div className="card p-6 space-y-6">
          <div>
            <h2 className="card-title text-base font-bold text-gray-900 mb-2">Project Overview</h2>
            <p className="text-xs text-gray-500 leading-relaxed max-w-3xl">
              {displayProject.description ||
                'This project encompasses comprehensive architecture planning, infrastructure migration, responsive front-end design, and enterprise-grade backend APIs.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
              <span className="text-xs text-gray-500">Overall Progress</span>
              <div className="mt-2 flex items-center justify-between text-sm font-bold text-gray-900">
                <span>Completed Tasks</span>
                <span>
                  {tasks.filter((t) => t.stage === 'completed').length} / {tasks.length} (
                  {tasks.length > 0
                    ? Math.round(
                        (tasks.filter((t) => t.stage === 'completed').length / tasks.length) * 100
                      )
                    : 0}
                  %)
                </span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{
                    width: `${
                      tasks.length > 0
                        ? Math.round(
                            (tasks.filter((t) => t.stage === 'completed').length / tasks.length) * 100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
              <span className="text-xs text-gray-500">Project Type & Priority</span>
              <p className="mt-2 text-sm font-bold text-gray-900">
                {displayProject.project_type || 'Web Development'}
              </p>
              <span className={`inline-block mt-1 badge text-[11px] ${getPriorityBadgeClass(displayProject.priority)}`}>
                {displayProject.priority || 'High'} Priority
              </span>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
              <span className="text-xs text-gray-500">Client Organization</span>
              <p className="mt-2 text-sm font-bold text-gray-900">
                {displayProject.customer?.company_name || 'TechSolutions Inc.'}
              </p>
              <span className="inline-block mt-1 text-[11px] text-gray-500">
                Managed by {displayProject.manager?.name || 'Unassigned'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT: TEAM ── */}
      {activeTab === 'team' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <div>
              <h2 className="card-title text-base font-bold text-gray-900">Project Team Members</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {projectAssignedUsers.length} member{projectAssignedUsers.length === 1 ? '' : 's'} assigned to this project
              </p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-primary text-xs flex items-center gap-1.5 shadow-2xs"
              onClick={() => setShowAddMemberModal(true)}
            >
              <UserPlus size={13} />
              <span>Assign Member</span>
            </button>
          </div>

          {projectAssignedUsers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectAssignedUsers.map((u) => {
                const initials = getUserInitials(u.name)
                const colorClass = getUserColor(u.id)
                const userTasksCount = tasks.filter(
                  (t) => t.assignee.name.toLowerCase() === u.name.toLowerCase()
                ).length
                const isManager = u.id === displayProject.manager?.id
                const roleName = isManager
                  ? 'Project Manager'
                  : u.designation || getUserRoleName(u) || 'Team Member'

                return (
                  <div
                    key={u.id}
                    className="p-4 rounded-xl border border-gray-200 bg-white hover:border-primary-200 shadow-2xs transition-all flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {(u as any).avatar ? (
                        <img
                          src={(u as any).avatar}
                          alt={u.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-100"
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${colorClass}`}
                        >
                          {initials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-gray-900 truncate">{u.name}</p>
                          {isManager && (
                            <span className="badge badge-info text-[9px] py-0 px-1.5 leading-tight">
                              Lead
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-primary-600 font-semibold truncate mt-0.5">
                          {roleName}
                        </p>
                        {u.email && (
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">{u.email}</p>
                        )}
                        <p className="text-[10px] text-gray-500 mt-2 font-medium">
                          {userTasksCount} active task{userTasksCount === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>

                    {!isManager && (
                      <button
                        type="button"
                        className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors shrink-0"
                        title={`Remove ${u.name} from project`}
                        onClick={() => handleRemoveMember(u.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Users size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs font-semibold text-gray-700">No team members assigned yet</p>
              <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
                Add staff and team contributors to allocate tasks and track contributions.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm mt-3.5 inline-flex items-center gap-1.5 shadow-2xs"
                onClick={() => setShowAddMemberModal(true)}
              >
                <UserPlus size={13} />
                <span>Assign Team Member</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB CONTENT: OTHER TABS FALLBACK ── */}
      {activeTab !== 'tasks' && activeTab !== 'overview' && activeTab !== 'team' && (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-3">
            <CheckSquare size={22} />
          </div>
          <h3 className="card-title text-sm font-bold text-gray-800 capitalize">{activeTab} Details</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            Manage all project {activeTab} information, updates, and records.
          </p>
        </div>
      )}

      {/* ── FLOATING / MODAL: ADD / EDIT TASK ── */}
      {showAddTaskModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddTaskModal(false)
              setEditingTaskId(null)
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-xl overflow-hidden animate-scale-up flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 px-5 flex items-start justify-between border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                    editingTaskId ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {editingTaskId ? <Edit2 size={18} /> : <ListTodo size={20} />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingTaskId ? 'Edit Task' : 'Add New Task'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editingTaskId ? 'Update task details in ' : 'Create and assign a task to '}
                    <span className="font-semibold text-slate-700">{displayProject.project_title}</span>{' '}
                    {displayProject.project_code && (
                      <span className="font-mono text-[11px] text-blue-600 font-bold">
                        ({displayProject.project_code})
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
                onClick={() => {
                  setShowAddTaskModal(false)
                  setEditingTaskId(null)
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTask} className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {/* Error Alert */}
              {taskFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5 animate-shake">
                  <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <span className="flex-1 font-medium leading-relaxed">{taskFormError}</span>
                </div>
              )}

              {/* Task Title */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Implement authentication flows..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:outline-none focus:ring-0 focus:border-slate-300 shadow-2xs text-slate-800 font-medium placeholder:text-slate-400"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide detailed instructions, acceptance criteria, or technical notes..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:outline-none focus:ring-0 focus:border-slate-300 shadow-2xs text-slate-800 font-medium placeholder:text-slate-400 resize-none"
                />
              </div>

              {/* Row 1: Assign To & Stage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Assign To */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Assign To <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:outline-none focus:ring-0 focus:border-slate-300 shadow-2xs text-slate-800 font-medium"
                    required
                  >
                    {projectAssignedUsers.length === 0 ? (
                      <option value="" disabled>No project members available</option>
                    ) : (
                      <>
                        <option value="">Select Assignee</option>
                        {projectAssignedUsers.map((u) => (
                          <option key={u.id} value={u.name}>
                            {u.name} ({u.id === displayProject.manager?.id ? 'Project Manager' : u.designation || getUserRoleName(u) || 'Team Member'})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                {/* Stage */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Stage <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newTaskStage}
                    onChange={(e) => setNewTaskStage(e.target.value as any)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:outline-none focus:ring-0 focus:border-slate-300 shadow-2xs text-slate-800 font-medium"
                  >
                    <option value="to-do">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Priority & Task Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Priority */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:outline-none focus:ring-0 focus:border-slate-300 shadow-2xs text-slate-800 font-medium"
                  >
                    <option value="High">🔴 High Priority</option>
                    <option value="Medium">🟡 Medium Priority</option>
                    <option value="Low">🟢 Low Priority</option>
                  </select>
                </div>

                {/* Task Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Task Type
                  </label>
                  <select
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value as any)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:outline-none focus:ring-0 focus:border-slate-300 shadow-2xs text-slate-800 font-medium"
                  >
                    <option value="General">General</option>
                    <option value="Feature">Feature</option>
                    <option value="Task">Task</option>
                    <option value="Bug">Bug</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Due Date & Reminder */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Due Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:outline-none focus:ring-0 focus:border-slate-300 shadow-2xs text-slate-800 font-medium"
                    required
                  />
                </div>

                {/* Reminder */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Reminder
                  </label>
                  <select
                    value={newTaskReminder}
                    onChange={(e) => setNewTaskReminder(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:outline-none focus:ring-0 focus:border-slate-300 shadow-2xs text-slate-800 font-medium"
                  >
                    <option value="1 Hour Before">1 Hour Before</option>
                    <option value="30 Mins Before">30 Mins Before</option>
                    <option value="1 Day Before">1 Day Before</option>
                    <option value="None">No Reminder</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={taskFormLoading}
                  className="btn btn-outline btn-sm text-xs px-4 rounded-xl disabled:opacity-50"
                  onClick={() => {
                    setShowAddTaskModal(false)
                    setEditingTaskId(null)
                    setTaskFormError(null)
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={taskFormLoading}
                  className="btn btn-primary btn-sm text-xs px-4 flex items-center gap-1.5 rounded-xl shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {taskFormLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>{editingTaskId ? 'Saving...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <>
                      {editingTaskId ? <Save size={14} /> : <Plus size={14} />}
                      <span>{editingTaskId ? 'Save Changes' : 'Create Task'}</span>
                    </>
                  )}
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

      {/* ── ADD TEAM MEMBER MODAL ── */}
      {showAddMemberModal && (
        <AddTeamMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          existingUserIds={projectAssignedUsers.map((u) => u.id)}
          existingUsers={projectAssignedUsers}
          projectTitle={displayProject.project_title}
          projectCode={displayProject.project_code}
          onSave={handleAddMembers}
        />
      )}

      {/* ── GLOBAL CONFIRMATION MODAL: DELETE TASK ── */}
      <ConfirmationModal
        isOpen={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDeleteTask}
        title="Delete Task"
        message={
          <span>
            Are you sure you want to permanently delete{' '}
            <strong className="text-gray-900 font-bold">{taskToDelete?.title}</strong>? This task will be removed from this project.
          </span>
        }
        confirmText="Delete Task"
        cancelText="Cancel"
        variant="danger"
      />

      {/* ── GLOBAL CONFIRMATION MODAL: REMOVE MEMBER ── */}
      <ConfirmationModal
        isOpen={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleConfirmRemoveMember}
        title="Remove Team Member"
        message={
          <span>
            Are you sure you want to remove{' '}
            <strong className="text-gray-900 font-bold">{memberToRemove?.name}</strong> from this project?
          </span>
        }
        confirmText="Remove Member"
        cancelText="Cancel"
        variant="danger"
      />

      {/* ── GLOBAL CONFIRMATION MODAL: DELETE PROJECT ── */}
      <ConfirmationModal
        isOpen={showDeleteProjectModal}
        onClose={() => setShowDeleteProjectModal(false)}
        onConfirm={handleConfirmDeleteProject}
        title="Delete Project"
        message={
          <span>
            Are you sure you want to permanently delete{' '}
            <strong className="text-gray-900 font-bold">{displayProject.project_title}</strong>{' '}
            ({displayProject.project_code})? This action cannot be undone and will remove all associated tasks and documents.
          </span>
        }
        confirmText="Delete Project"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}
