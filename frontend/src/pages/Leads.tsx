import { useState } from 'react'
import Breadcrumb from '@/components/ui/Breadcrumb'
import {
  Plus,
  Filter,
  Download,
  LayoutGrid,
  List,
  Search,
  MoreVertical,
  Clock,
} from 'lucide-react'

type ViewMode = 'kanban' | 'list'

interface Lead {
  id: number
  title: string
  customer: string
  budget: string
  priority: 'High' | 'Medium' | 'Low'
  assignee: string
  assigneeInitials: string
  nextStep: string
  daysInStage: number
  stage: string
}

const leads: Lead[] = [
  { id: 1, title: 'Website Redesign', customer: 'TechNova Inc.', budget: '$15,000', priority: 'High', assignee: 'John Doe', assigneeInitials: 'JD', nextStep: 'Send Proposal', daysInStage: 2, stage: 'New' },
  { id: 2, title: 'Mobile App Development', customer: 'StartUp Labs', budget: '$45,000', priority: 'High', assignee: 'Mary Jane', assigneeInitials: 'MJ', nextStep: 'Schedule Demo', daysInStage: 1, stage: 'New' },
  { id: 3, title: 'E-commerce Platform', customer: 'RetailMax Corp.', budget: '$28,000', priority: 'Medium', assignee: 'John Doe', assigneeInitials: 'JD', nextStep: 'Requirement Meeting', daysInStage: 5, stage: 'Contacted' },
  { id: 4, title: 'CRM Integration', customer: 'DataFlow Inc.', budget: '$12,000', priority: 'Low', assignee: 'Sarah Kim', assigneeInitials: 'SK', nextStep: 'Technical Review', daysInStage: 3, stage: 'Contacted' },
  { id: 5, title: 'Cloud Migration', customer: 'Legacy Systems', budget: '$35,000', priority: 'High', assignee: 'Mary Jane', assigneeInitials: 'MJ', nextStep: 'Prepare Quotation', daysInStage: 7, stage: 'Qualified' },
  { id: 6, title: 'AI Dashboard', customer: 'Analytics Pro', budget: '$22,000', priority: 'Medium', assignee: 'John Doe', assigneeInitials: 'JD', nextStep: 'Send Quotation', daysInStage: 4, stage: 'Proposal' },
  { id: 7, title: 'Security Audit', customer: 'SecureNet LLC', budget: '$8,500', priority: 'Medium', assignee: 'Sarah Kim', assigneeInitials: 'SK', nextStep: 'Final Discussion', daysInStage: 2, stage: 'Negotiation' },
  { id: 8, title: 'API Gateway', customer: 'MicroServ Tech', budget: '$18,000', priority: 'Low', assignee: 'David Park', assigneeInitials: 'DP', nextStep: 'Follow-up Call', daysInStage: 6, stage: 'Proposal' },
]

const stages = [
  { name: 'New', color: '#3b82f6' },
  { name: 'Contacted', color: '#06b6d4' },
  { name: 'Qualified', color: '#8b5cf6' },
  { name: 'Proposal', color: '#f59e0b' },
  { name: 'Negotiation', color: '#f97316' },
  { name: 'Won', color: '#22c55e' },
]

const priorityBadge: Record<string, string> = {
  High: 'badge-danger',
  Medium: 'badge-warning',
  Low: 'badge-gray',
}

export default function Leads() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')

  const getLeadsByStage = (stageName: string) => leads.filter((l) => l.stage === stageName)

  return (
    <div className="animate-fade-in">
      <Breadcrumb items={[{ label: 'Leads' }]} />

      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Leads</h1>
          <p className="page-description">Manage and track your sales pipeline.</p>
        </div>
        <div className="page-header-actions">
          <div style={{ display: 'flex', background: 'var(--color-gray-100)', borderRadius: 'var(--radius-md)', padding: 2 }}>
            <button
              className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('kanban')}
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              <LayoutGrid size={14} />
              Kanban
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('list')}
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              <List size={14} />
              List
            </button>
          </div>
          <button className="btn btn-outline">
            <Filter size={16} />
            Filter
          </button>
          <button className="btn btn-outline">
            <Download size={16} />
            Export
          </button>
          <button className="btn btn-primary">
            <Plus size={16} />
            New Lead
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: 20, position: 'relative', maxWidth: 320 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
        <input
          type="text"
          className="form-input"
          placeholder="Search leads..."
          style={{ paddingLeft: 36 }}
        />
      </div>

      {viewMode === 'kanban' ? (
        /* Kanban View */
        <div className="kanban-board">
          {stages.map((stage) => {
            const stageLeads = getLeadsByStage(stage.name)
            return (
              <div key={stage.name} className="kanban-column">
                <div className="kanban-column-header">
                  <div className="kanban-column-title">
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: stage.color,
                        display: 'inline-block',
                      }}
                    />
                    {stage.name}
                    <span className="kanban-column-count">{stageLeads.length}</span>
                  </div>
                  <button className="btn btn-ghost btn-icon btn-sm" style={{ padding: 4 }}>
                    <Plus size={14} />
                  </button>
                </div>
                <div className="kanban-column-body">
                  {stageLeads.map((lead) => (
                    <div key={lead.id} className="kanban-card">
                      <div className="kanban-card-title">{lead.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-gray-500)', marginBottom: 8 }}>
                        {lead.customer}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span className={`badge ${priorityBadge[lead.priority]}`} style={{ fontSize: 11 }}>
                          {lead.priority}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-gray-700)' }}>
                          {lead.budget}
                        </span>
                      </div>
                      <div className="kanban-card-meta">
                        <div className="avatar avatar-sm avatar-primary" style={{ width: 22, height: 22, fontSize: 9 }}>
                          {lead.assigneeInitials}
                        </div>
                        <span style={{ flex: 1 }}>{lead.nextStep}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={11} />
                          {lead.daysInStage}d
                        </span>
                      </div>
                    </div>
                  ))}
                  {stageLeads.length === 0 && (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-gray-400)', fontSize: 13 }}>
                      No leads
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* List View */
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Customer</th>
                <th>Stage</th>
                <th>Priority</th>
                <th>Budget</th>
                <th>Assigned</th>
                <th>Next Step</th>
                <th>Days</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td style={{ fontWeight: 500, color: 'var(--color-gray-900)' }}>{lead.title}</td>
                  <td>{lead.customer}</td>
                  <td>
                    <span className="badge badge-primary">{lead.stage}</span>
                  </td>
                  <td>
                    <span className={`badge ${priorityBadge[lead.priority]}`}>{lead.priority}</span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{lead.budget}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="avatar avatar-sm avatar-primary" style={{ width: 24, height: 24, fontSize: 9 }}>
                        {lead.assigneeInitials}
                      </div>
                      <span style={{ fontSize: 13 }}>{lead.assignee}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-gray-500)', fontSize: 13 }}>{lead.nextStep}</td>
                  <td style={{ color: 'var(--color-gray-500)' }}>{lead.daysInStage}d</td>
                  <td>
                    <button className="btn btn-ghost btn-icon" style={{ padding: 4 }}>
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--color-gray-500)' }}>
              Showing 1 to 8 of 48 leads
            </span>
            <div className="pagination" style={{ marginTop: 0 }}>
              <button className="pagination-btn" disabled>‹</button>
              <button className="pagination-btn active">1</button>
              <button className="pagination-btn">2</button>
              <button className="pagination-btn">3</button>
              <button className="pagination-btn">4</button>
              <button className="pagination-btn">5</button>
              <button className="pagination-btn">6</button>
              <button className="pagination-btn">›</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
