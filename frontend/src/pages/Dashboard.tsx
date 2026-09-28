import Breadcrumb from '@/components/ui/Breadcrumb'
import {
  TrendingUp,
  TrendingDown,
  Users,
  FolderKanban,
  DollarSign,
  CheckSquare,
  Clock,
  AlertCircle,
  Calendar,
  ArrowRight,
} from 'lucide-react'

const stats = [
  {
    label: 'Total Revenue',
    value: '$124,560',
    change: '+12.5%',
    trend: 'up' as const,
    icon: DollarSign,
    color: 'var(--color-success-600)',
    bgColor: 'var(--color-success-50)',
  },
  {
    label: 'Active Leads',
    value: '48',
    change: '+8 this week',
    trend: 'up' as const,
    icon: Users,
    color: 'var(--color-primary-600)',
    bgColor: 'var(--color-primary-50)',
  },
  {
    label: 'Active Projects',
    value: '12',
    change: '3 due this month',
    trend: 'up' as const,
    icon: FolderKanban,
    color: '#7c3aed',
    bgColor: '#f3e8ff',
  },
  {
    label: 'Pending Tasks',
    value: '23',
    change: '-5 from yesterday',
    trend: 'down' as const,
    icon: CheckSquare,
    color: 'var(--color-warning-600)',
    bgColor: 'var(--color-warning-50)',
  },
]

const todayTasks = [
  {
    id: 1,
    title: 'Prepare proposal for ABC Ltd',
    lead: 'ABC Website Redesign',
    priority: 'High',
    priorityColor: 'danger',
    status: 'Pending',
    due: '2h',
    assignee: 'JD',
  },
  {
    id: 2,
    title: 'Client meeting - Project Review',
    lead: 'XYZ Corp Dashboard',
    priority: 'Medium',
    priorityColor: 'warning',
    status: 'In Progress',
    due: '4h',
    assignee: 'MJ',
  },
  {
    id: 3,
    title: 'Follow-up call with DEF Ltd',
    lead: 'DEF E-commerce Platform',
    priority: 'High',
    priorityColor: 'danger',
    status: 'Pending',
    due: '6h',
    assignee: 'JD',
  },
  {
    id: 4,
    title: 'Review wireframes for GHI Project',
    lead: 'GHI Mobile App',
    priority: 'Low',
    priorityColor: 'gray',
    status: 'Todo',
    due: 'Tomorrow',
    assignee: 'SK',
  },
  {
    id: 5,
    title: 'Update payment records',
    lead: 'Internal',
    priority: 'Medium',
    priorityColor: 'warning',
    status: 'Pending',
    due: '8h',
    assignee: 'JD',
  },
]

const recentActivities = [
  {
    id: 1,
    icon: '🎯',
    text: 'Lead "TechNova Website" moved to Proposal stage',
    time: '10 mins ago',
  },
  {
    id: 2,
    icon: '💰',
    text: 'Payment of $15,000 received for ABC Project',
    time: '32 mins ago',
  },
  {
    id: 3,
    icon: '📋',
    text: 'New task "Review Design Mockups" created by Mary',
    time: '1 hour ago',
  },
  {
    id: 4,
    icon: '👤',
    text: 'New lead "XYZ Automation Platform" added',
    time: '2 hours ago',
  },
  {
    id: 5,
    icon: '📄',
    text: 'Quotation QUO-2024-0058 sent to TechNova Inc.',
    time: '3 hours ago',
  },
]

const pipelineStages = [
  { name: 'New', count: 12, value: '$45,000', color: 'var(--color-primary-500)' },
  { name: 'Contacted', count: 8, value: '$32,000', color: '#06b6d4' },
  { name: 'Qualified', count: 6, value: '$28,000', color: '#8b5cf6' },
  { name: 'Proposal', count: 5, value: '$67,000', color: 'var(--color-warning-500)' },
  { name: 'Negotiation', count: 3, value: '$54,000', color: '#f97316' },
  { name: 'Won', count: 14, value: '$124,000', color: 'var(--color-success-500)' },
]

export default function Dashboard() {
  return (
    <div className="animate-fade-in">
      <Breadcrumb items={[{ label: 'Dashboard' }]} />

      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">Welcome back, John. Here's what's happening today.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-outline">
            <Calendar size={16} />
            Sep 27, 2026
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-4col" style={{ marginBottom: 24 }}>
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="stat-card-label">{stat.label}</div>
                  <div className="stat-card-value">{stat.value}</div>
                  <div className={`stat-card-change ${stat.trend === 'up' ? 'stat-card-change-up' : 'stat-card-change-down'}`}>
                    {stat.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {stat.change}
                  </div>
                </div>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 'var(--radius-lg)',
                    background: stat.bgColor,
                    color: stat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={20} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Today's Tasks */}
          <div className="card" style={{ padding: 0 }}>
            <div className="card-header" style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-gray-100)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={18} style={{ color: 'var(--color-primary-600)' }} />
                <h3 className="card-title">Today's Tasks</h3>
                <span className="badge badge-primary" style={{ marginLeft: 4 }}>{todayTasks.length}</span>
              </div>
              <button className="btn btn-ghost btn-sm">
                View All
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Lead / Project</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Due</th>
                    <th>Assignee</th>
                  </tr>
                </thead>
                <tbody>
                  {todayTasks.map((task) => (
                    <tr key={task.id}>
                      <td>
                        <span style={{ fontWeight: 500, color: 'var(--color-gray-900)' }}>
                          {task.title}
                        </span>
                      </td>
                      <td style={{ color: 'var(--color-gray-500)', fontSize: 13 }}>{task.lead}</td>
                      <td>
                        <span className={`badge badge-${task.priorityColor}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-gray">{task.status}</span>
                      </td>
                      <td>
                        <span style={{
                          fontWeight: 500,
                          color: task.due === '2h' ? 'var(--color-danger-500)' : 'var(--color-gray-600)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}>
                          {task.due === '2h' && <AlertCircle size={13} />}
                          {task.due}
                        </span>
                      </td>
                      <td>
                        <div className="avatar avatar-sm avatar-primary" style={{ fontSize: 10 }}>
                          {task.assignee}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sales Pipeline */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Sales Pipeline</h3>
              <button className="btn btn-ghost btn-sm">
                View Details
                <ArrowRight size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {pipelineStages.map((stage) => (
                <div
                  key={stage.name}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '14px 8px',
                    background: 'var(--color-gray-50)',
                    borderRadius: 'var(--radius-md)',
                    borderTop: `3px solid ${stage.color}`,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-gray-500)', marginBottom: 4 }}>
                    {stage.name}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-gray-900)', marginBottom: 2 }}>
                    {stage.count}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>
                    {stage.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Upcoming Reminders */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Upcoming Reminders</h3>
              <span className="badge badge-warning">3</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: '📞', text: 'Follow-up call with DEF Ltd', time: 'In 2 hours' },
                { icon: '📧', text: 'Send revised quotation to GHI Corp', time: 'In 4 hours' },
                { icon: '📅', text: 'Team standup meeting', time: 'Tomorrow, 9:00 AM' },
              ].map((reminder, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: '10px 12px',
                    background: 'var(--color-gray-50)',
                    borderRadius: 'var(--radius-md)',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{reminder.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-gray-900)' }}>
                      {reminder.text}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>
                      {reminder.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Activity</h3>
              <button className="btn btn-ghost btn-sm">View All</button>
            </div>
            <div className="timeline">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="timeline-item">
                  <div className="timeline-dot timeline-dot-blue" />
                  <div className="timeline-content">
                    <div className="timeline-title">{activity.text}</div>
                  </div>
                  <div className="timeline-time">{activity.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
