import { useState, useEffect } from 'react'
import {
  Edit2,
  Plus,
  MoreHorizontal,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Globe,
  MapPin,
  Clock,
  FileText,
  DollarSign,
  FolderKanban,
  CheckSquare,
  Trash2,
  RotateCcw,
  UserPlus,
} from 'lucide-react'
import {
  type Contact,
  type ContactProject,
  contactsApi,
} from '@/apis/contactsApi'
import SlideDrawer from '@/components/common/SlideDrawer'

interface ContactViewDrawerProps {
  contact: Contact | null
  isOpen: boolean
  onClose: () => void
  onEdit: (contact: Contact) => void
  onDelete: (contactId: number) => void
  onRestore: (contactId: number) => void
  onAddOwner: (contact: Contact) => void
}

type TabType = 'overview' | 'activities' | 'projects' | 'deals' | 'notes' | 'files'

export default function ContactViewDrawer({
  contact,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onRestore,
  onAddOwner,
}: ContactViewDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [projects, setProjects] = useState<ContactProject[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  useEffect(() => {
    if (contact && isOpen && activeTab === 'projects') {
      fetchProjects()
    }
  }, [contact, isOpen, activeTab])

  const fetchProjects = async () => {
    if (!contact) return
    setProjectsLoading(true)
    try {
      const res = await contactsApi.getContactProjects(contact.id)
      if (res.data && res.data.projects) {
        setProjects(res.data.projects)
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    } finally {
      setProjectsLoading(false)
    }
  }

  if (!contact) return null

  return (
    <SlideDrawer
      isOpen={isOpen}
      onClose={onClose}
      width="640px"
      className="contact-details-drawer"
    >
      <div className="contact-view-panel">
        {/* Profile Header */}
        <div className="contact-view-header">
          <div className="contact-view-avatar-box">
            <img
              src={
                contact.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={contact.name}
              className="contact-view-avatar"
            />
          </div>
          <div className="contact-view-header-info">
            <div className="contact-view-name-row">
              <h2 className="contact-view-name">{contact.name}</h2>
              <span
                className={`contact-status-pill ${
                  contact.status === 'Active'
                    ? 'status-active'
                    : contact.status === 'Inactive'
                    ? 'status-inactive'
                    : 'status-archived'
                }`}
              >
                {contact.status}
              </span>
            </div>
            <p className="contact-view-subtitle">
              {contact.designation || 'Specialist'} at {contact.company}
            </p>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="contact-view-actions-row">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onEdit(contact)}
          >
            <Edit2 size={14} />
            Edit
          </button>
          <button className="btn btn-outline btn-sm">
            <Plus size={14} />
            Create Lead
          </button>
          <button className="btn btn-outline btn-sm">
            <Plus size={14} />
            Create Project
          </button>
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
            >
              <MoreHorizontal size={14} />
              More
            </button>
            {showMoreMenu && (
              <div className="dropdown-menu animate-fade-in" style={{ right: 0, top: '100%', marginTop: 4 }}>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowMoreMenu(false)
                    onAddOwner(contact)
                  }}
                >
                  <UserPlus size={14} />
                  Add Additional Owner
                </button>
                {contact.status === 'Archived' ? (
                  <button
                    className="dropdown-item text-success"
                    onClick={() => {
                      setShowMoreMenu(false)
                      onRestore(contact.id)
                    }}
                  >
                    <RotateCcw size={14} />
                    Restore Contact
                  </button>
                ) : (
                  <button
                    className="dropdown-item text-danger"
                    onClick={() => {
                      setShowMoreMenu(false)
                      onDelete(contact.id)
                    }}
                  >
                    <Trash2 size={14} />
                    Delete Contact
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="contact-tabs-nav">
          <button
            className={`contact-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`contact-tab-btn ${activeTab === 'activities' ? 'active' : ''}`}
            onClick={() => setActiveTab('activities')}
          >
            Activities
          </button>
          <button
            className={`contact-tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            Projects {contact.projects_count ? `(${contact.projects_count})` : ''}
          </button>
          <button
            className={`contact-tab-btn ${activeTab === 'deals' ? 'active' : ''}`}
            onClick={() => setActiveTab('deals')}
          >
            Deals
          </button>
          <button
            className={`contact-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            Notes
          </button>
          <button
            className={`contact-tab-btn ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            Files
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="contact-tab-pane">
            {/* Contact Information Box */}
            <div className="contact-card-section">
              <div className="contact-card-section-header">
                <span className="contact-card-title">Contact Information</span>
                <button
                  className="btn-icon-link"
                  onClick={() => onEdit(contact)}
                  title="Edit Contact"
                >
                  <Edit2 size={14} />
                  <span>Edit</span>
                </button>
              </div>

              <div className="contact-info-list">
                <div className="contact-info-row">
                  <div className="contact-info-label">
                    <Mail size={15} />
                    <span>Email</span>
                  </div>
                  <div className="contact-info-value">
                    <a href={`mailto:${contact.email}`} className="link-primary">
                      {contact.email}
                    </a>
                  </div>
                </div>

                <div className="contact-info-row">
                  <div className="contact-info-label">
                    <Phone size={15} />
                    <span>Phone</span>
                  </div>
                  <div className="contact-info-value">{contact.phone}</div>
                </div>

                <div className="contact-info-row">
                  <div className="contact-info-label">
                    <Building2 size={15} />
                    <span>Company</span>
                  </div>
                  <div className="contact-info-value font-medium">
                    {contact.company}
                  </div>
                </div>

                <div className="contact-info-row">
                  <div className="contact-info-label">
                    <Briefcase size={15} />
                    <span>Designation</span>
                  </div>
                  <div className="contact-info-value">
                    {contact.designation || 'CEO'}
                  </div>
                </div>

                <div className="contact-info-row">
                  <div className="contact-info-label">
                    <Globe size={15} />
                    <span>Website</span>
                  </div>
                  <div className="contact-info-value">
                    <a
                      href={contact.website || contact.company_web || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="link-primary"
                    >
                      {contact.website || contact.company_web || 'https://techsolutions.com'}
                    </a>
                  </div>
                </div>

                <div className="contact-info-row">
                  <div className="contact-info-label">
                    <MapPin size={15} />
                    <span>Address</span>
                  </div>
                  <div className="contact-info-value">
                    {contact.address || '123 Business St, San Francisco, CA 94105'}
                  </div>
                </div>
              </div>
            </div>

            {/* Linked Items Grid */}
            <div className="contact-card-section">
              <span className="contact-card-title mb-3 block">Linked Items</span>
              <div className="linked-items-grid">
                <div className="linked-item-card">
                  <div className="linked-item-icon-wrap icon-blue">
                    <FileText size={16} />
                  </div>
                  <div className="linked-item-content">
                    <div className="linked-item-title-row">
                      <span className="linked-item-name">Related Leads</span>
                      <a href="#leads" className="linked-item-link">
                        View All
                      </a>
                    </div>
                    <div className="linked-item-count">{contact.leads_count ?? 2}</div>
                  </div>
                </div>

                <div className="linked-item-card">
                  <div className="linked-item-icon-wrap icon-green">
                    <FolderKanban size={16} />
                  </div>
                  <div className="linked-item-content">
                    <div className="linked-item-title-row">
                      <span className="linked-item-name">Related Projects</span>
                      <a
                        href="#projects"
                        className="linked-item-link"
                        onClick={(e) => {
                          e.preventDefault()
                          setActiveTab('projects')
                        }}
                      >
                        View All
                      </a>
                    </div>
                    <div className="linked-item-count">{contact.projects_count ?? 1}</div>
                  </div>
                </div>

                <div className="linked-item-card">
                  <div className="linked-item-icon-wrap icon-purple">
                    <DollarSign size={16} />
                  </div>
                  <div className="linked-item-content">
                    <div className="linked-item-title-row">
                      <span className="linked-item-name">Related Deals</span>
                      <a href="#deals" className="linked-item-link">
                        View All
                      </a>
                    </div>
                    <div className="linked-item-count">{contact.deals_count ?? 1}</div>
                  </div>
                </div>

                <div className="linked-item-card">
                  <div className="linked-item-icon-wrap icon-amber">
                    <CheckSquare size={16} />
                  </div>
                  <div className="linked-item-content">
                    <div className="linked-item-title-row">
                      <span className="linked-item-name">Related Tasks</span>
                      <a href="#tasks" className="linked-item-link">
                        View All
                      </a>
                    </div>
                    <div className="linked-item-count">{contact.tasks_count ?? 3}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags Section */}
            <div className="contact-card-section">
              <span className="contact-card-title mb-3 block">Tags</span>
              <div className="contact-tags-list">
                {(contact.tags && contact.tags.length > 0
                  ? contact.tags
                  : ['VIP', 'Enterprise', 'High Value']
                ).map((tag) => (
                  <span key={tag} className="contact-tag-badge">
                    {tag}
                  </span>
                ))}
                <button
                  className="contact-add-tag-btn"
                  onClick={() => onEdit(contact)}
                >
                  <Plus size={12} />
                  Add Tag
                </button>
              </div>
            </div>

            {/* Last Activity Section */}
            <div className="contact-card-section">
              <span className="contact-card-title mb-2 block">Last Activity</span>
              <div className="contact-last-activity-box">
                <div className="last-activity-icon">
                  <Clock size={16} />
                </div>
                <div className="last-activity-info">
                  <div className="last-activity-text">
                    {contact.last_activity?.action || 'Last contacted'}{' '}
                    <strong>{contact.last_activity?.timestamp || '2 days ago'}</strong>
                  </div>
                  <div className="last-activity-author">
                    By {contact.last_activity?.by || 'John Doe'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Projects Tab: Project Counts & Full History (GET /api/v1/contacts/{id}/projects) */}
        {activeTab === 'projects' && (
          <div className="contact-tab-pane">
            <div className="contact-card-section">
              <div className="contact-card-section-header">
                <div>
                  <span className="contact-card-title">Project History & Portfolio</span>
                  <p className="text-xs text-muted">
                    Directly connected to backend endpoint GET /api/v1/contacts/{contact.id}/projects
                  </p>
                </div>
                <button className="btn btn-primary btn-sm">
                  <Plus size={14} /> Add Project
                </button>
              </div>

              {projectsLoading ? (
                <div className="loading-state">Loading project history...</div>
              ) : projects.length === 0 ? (
                <div className="empty-state-card">No projects linked yet.</div>
              ) : (
                <div className="contact-projects-list">
                  {projects.map((proj) => (
                    <div key={proj.id} className="contact-project-card">
                      <div className="contact-project-header">
                        <div className="contact-project-title">{proj.name}</div>
                        <span
                          className={`contact-status-pill ${
                            proj.status === 'Completed'
                              ? 'status-active'
                              : proj.status === 'In Progress'
                              ? 'status-warning'
                              : 'status-neutral'
                          }`}
                        >
                          {proj.status}
                        </span>
                      </div>
                      <div className="contact-project-meta-row">
                        <span>
                          <strong>Budget:</strong> {proj.budget}
                        </span>
                        <span>
                          <strong>Role:</strong> {proj.role || 'Executive Sponsor'}
                        </span>
                        <span>
                          <strong>Timeline:</strong> {proj.start_date}{' '}
                          {proj.end_date ? `to ${proj.end_date}` : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activities Tab */}
        {activeTab === 'activities' && (
          <div className="contact-tab-pane">
            <div className="contact-card-section">
              <span className="contact-card-title mb-3 block">Activity Log</span>
              <div className="contact-timeline">
                <div className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <p className="timeline-title">Follow-up Call Scheduled</p>
                    <p className="timeline-meta">Scheduled by John Doe • Today at 10:30 AM</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <p className="timeline-title">Quotation for Q3 Software Services Sent</p>
                    <p className="timeline-meta">Sent via Communication Hub • 2 days ago</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <p className="timeline-title">Contact Information Updated</p>
                    <p className="timeline-meta">Updated by Sarah Johnson • 5 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deals, Notes, Files tabs */}
        {(activeTab === 'deals' || activeTab === 'notes' || activeTab === 'files') && (
          <div className="contact-tab-pane">
            <div className="contact-card-section">
              <span className="contact-card-title mb-3 block capitalize">{activeTab} Details</span>
              <p className="text-muted text-sm">
                {activeTab === 'notes'
                  ? contact.notes || 'No notes currently attached to this contact.'
                  : `Active records and linked attachments for ${contact.name}.`}
              </p>
              {activeTab === 'files' && contact.documents && contact.documents.length > 0 && (
                <div className="uploaded-docs-list mt-3">
                  {contact.documents.map((doc) => (
                    <div key={doc.id} className="doc-item-row">
                      <div className="doc-item-info">
                        <FileText size={16} className="doc-icon" />
                        <div>
                          <span className="doc-item-name">{doc.name}</span>
                          <span className="doc-item-size">{doc.size}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SlideDrawer>
  )
}
