import React, { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  MoreVertical,
  CheckCircle,
  Clock,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  RotateCcw,
  UserPlus,
} from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import StatCard from '@/components/common/StatCard'
import Breadcrumb from '@/components/ui/Breadcrumb'
import ContactViewDrawer from '@/components/contacts/ContactViewDrawer'
import ContactFormDrawer from '@/components/contacts/ContactFormDrawer'
import AddOwnerModal from '@/components/contacts/AddOwnerModal'
import {
  contactsApi,
  type Contact,
  type ContactQueryParams,
  type CreateContactPayload,
  type UpdateContactPayload,
  type AddOwnerPayload,
} from '@/apis/contactsApi'

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive' | 'archived'>('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage] = useState(10)
  const [meta, setMeta] = useState({
    total: 248,
    active_count: 220,
    inactive_count: 18,
    company_count: 156,
    last_page: 25,
  })

  // Action Menu State
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null)

  // Drawer / Modal states
  const [viewingContact, setViewingContact] = useState<Contact | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const [ownerModalContact, setOwnerModalContact] = useState<Contact | null>(null)
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false)

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Fetch Contacts
  const fetchContactsList = useCallback(async () => {
    setLoading(true)
    try {
      const params: ContactQueryParams = {
        page: currentPage,
        per_page: perPage,
        search: searchQuery || undefined,
        status: statusFilter,
        sort_by: 'created_at',
        sort_order: 'desc',
      }
      const res = await contactsApi.getContacts(params)
      if (res.data) {
        setContacts(res.data)
      }
      if (res.meta) {
        setMeta({
          total: res.meta.total || 248,
          active_count: res.meta.active_count || 220,
          inactive_count: res.meta.inactive_count || 18,
          company_count: res.meta.company_count || 156,
          last_page: res.meta.last_page || 25,
        })
      }
    } catch (err: any) {
      console.error('Error fetching contacts:', err)
    } finally {
      setLoading(false)
    }
  }, [currentPage, perPage, searchQuery, statusFilter])

  useEffect(() => {
    fetchContactsList()
  }, [fetchContactsList])

  // Click outside to close actions menu
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null)
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  // Checkbox Selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(contacts.map((c) => c.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  // Handlers for CRUD Actions
  const handleOpenView = (contact: Contact) => {
    setViewingContact(contact)
    setIsViewOpen(true)
  }

  const handleOpenCreate = () => {
    setEditingContact(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (contact: Contact) => {
    setEditingContact(contact)
    setIsFormOpen(true)
  }

  const handleFormSubmit = async (
    payload: CreateContactPayload | UpdateContactPayload,
    isEdit: boolean
  ) => {
    if (isEdit && editingContact) {
      const res = await contactsApi.updateContact(editingContact.id, payload)
      showToast(`Contact "${res.data.name}" updated successfully`)
      if (viewingContact && viewingContact.id === editingContact.id) {
        setViewingContact(res.data)
      }
    } else {
      const res = await contactsApi.createContact(payload as CreateContactPayload)
      showToast(`Contact "${res.data.name}" created successfully`)
    }
    fetchContactsList()
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      await contactsApi.deleteContact(id)
      showToast('Contact deleted successfully')
      if (viewingContact && viewingContact.id === id) {
        setIsViewOpen(false)
      }
      fetchContactsList()
    }
  }

  const handleRestore = async (id: number) => {
    await contactsApi.restoreContact(id)
    showToast('Contact restored successfully')
    if (viewingContact && viewingContact.id === id) {
      setViewingContact({ ...viewingContact, status: 'Active' })
    }
    fetchContactsList()
  }

  const handleAddOwnerSubmit = async (contactId: number, payload: AddOwnerPayload) => {
    await contactsApi.addContactOwner(contactId, payload)
    showToast(`Added ${payload.name} as owner`)
    fetchContactsList()
  }

  return (
    <div className="contacts-module-container animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="module-toast animate-slide-up">
          <CheckCircle size={16} className="text-success-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Customers / Contacts' }]} />

      {/* Module Page Header */}
      <PageHeader
        icon={<Users size={24} />}
        title="Contacts"
        description="Manage your customers and contacts. Create, edit, and connect them to leads, projects and deals."
        actions={
          <div className="flex items-center gap-2">
            <button
              className="btn btn-primary shadow-sm"
              onClick={handleOpenCreate}
            >
              <Plus size={16} />
              <span>Add Contact</span>
              <ChevronDown size={14} className="opacity-75" />
            </button>
          </div>
        }
      />

      {/* Stat Cards Summary Row */}
      <div className="contacts-stats-grid">
        <StatCard
          label="Total Contacts"
          value={meta.total}
          icon={<Users size={20} />}
          variant="blue"
          active={statusFilter === 'all'}
          onClick={() => setStatusFilter('all')}
        />
        <StatCard
          label="Active"
          value={meta.active_count}
          icon={<CheckCircle size={20} />}
          variant="green"
          active={statusFilter === 'Active'}
          onClick={() => setStatusFilter('Active')}
        />
        <StatCard
          label="Inactive"
          value={meta.inactive_count}
          icon={<Clock size={20} />}
          variant="amber"
          active={statusFilter === 'Inactive'}
          onClick={() => setStatusFilter('Inactive')}
        />
        <StatCard
          label="Companies"
          value={meta.company_count}
          icon={<Building2 size={20} />}
          variant="purple"
        />
      </div>

      {/* Filter & Search Toolbar */}
      <div className="contacts-filter-bar">
        <div className="contacts-filter-left">
          {/* Status Dropdown Selector */}
          <div className="relative">
            <select
              className="form-select contacts-status-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any)
                setCurrentPage(1)
              }}
            >
              <option value="all">All Contacts</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Search Contacts Bar */}
          <div className="contacts-search-box">
            <Search size={16} className="contacts-search-icon" />
            <input
              type="text"
              className="contacts-search-input"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
        </div>

        <div className="contacts-filter-right">
          <button className="btn btn-outline btn-sm">
            <Filter size={15} />
            Filter
          </button>

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

      {/* Contacts Table View */}
      {viewMode === 'table' ? (
        <div className="table-card">
          <div className="table-responsive">
            <table className="contacts-table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>
                    <input
                      type="checkbox"
                      className="custom-checkbox"
                      checked={
                        contacts.length > 0 && selectedIds.length === contacts.length
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th style={{ width: 60, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted">
                      Loading contacts from server...
                    </td>
                  </tr>
                ) : contacts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted">
                      No contacts found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  contacts.map((contact) => {
                    const isSelected = selectedIds.includes(contact.id)
                    return (
                      <tr
                        key={contact.id}
                        className={`contact-row ${isSelected ? 'row-selected' : ''}`}
                        onClick={() => handleOpenView(contact)}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="custom-checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectOne(contact.id)}
                          />
                        </td>
                        <td>
                          <div className="contact-name-cell">
                            <img
                              src={
                                contact.avatar ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                              }
                              alt={contact.name}
                              className="contact-table-avatar"
                            />
                            <div>
                              <div className="contact-table-name font-semibold">
                                {contact.name}
                              </div>
                              <div className="contact-table-designation text-muted text-xs">
                                {contact.designation || 'CEO'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="font-medium text-gray-700">
                          {contact.company}
                        </td>
                        <td>
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-gray-600 hover:text-primary-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {contact.email}
                          </a>
                        </td>
                        <td className="text-gray-600">{contact.phone}</td>
                        <td>
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
                        </td>
                        <td
                          className="text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative inline-block">
                            <button
                              className="table-action-dots-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                setActiveMenuId(
                                  activeMenuId === contact.id ? null : contact.id
                                )
                              }}
                            >
                              <MoreVertical size={16} />
                            </button>

                            {activeMenuId === contact.id && (
                              <div
                                className="dropdown-menu animate-fade-in"
                                style={{ right: 0, top: '100%' }}
                              >
                                <button
                                  className="dropdown-item"
                                  onClick={() => {
                                    setActiveMenuId(null)
                                    handleOpenView(contact)
                                  }}
                                >
                                  <Eye size={14} />
                                  View Details
                                </button>
                                <button
                                  className="dropdown-item"
                                  onClick={() => {
                                    setActiveMenuId(null)
                                    handleOpenEdit(contact)
                                  }}
                                >
                                  <Edit2 size={14} />
                                  Edit Contact
                                </button>
                                <button
                                  className="dropdown-item"
                                  onClick={() => {
                                    setActiveMenuId(null)
                                    setOwnerModalContact(contact)
                                    setIsOwnerModalOpen(true)
                                  }}
                                >
                                  <UserPlus size={14} />
                                  Add Owner
                                </button>
                                {contact.status === 'Archived' ? (
                                  <button
                                    className="dropdown-item text-success"
                                    onClick={() => {
                                      setActiveMenuId(null)
                                      handleRestore(contact.id)
                                    }}
                                  >
                                    <RotateCcw size={14} />
                                    Restore Contact
                                  </button>
                                ) : (
                                  <button
                                    className="dropdown-item text-danger"
                                    onClick={() => {
                                      setActiveMenuId(null)
                                      handleDelete(contact.id)
                                    }}
                                  >
                                    <Trash2 size={14} />
                                    Delete Contact
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="contacts-pagination-footer">
            <div className="pagination-info-text text-muted text-xs">
              Showing 1 to {contacts.length} of {meta.total} contacts
            </div>

            <div className="pagination-pages-list">
              <button
                className="pagination-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} />
              </button>

              <button
                className={`pagination-page-btn ${currentPage === 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(1)}
              >
                1
              </button>
              <button
                className={`pagination-page-btn ${currentPage === 2 ? 'active' : ''}`}
                onClick={() => setCurrentPage(2)}
              >
                2
              </button>
              <button
                className={`pagination-page-btn ${currentPage === 3 ? 'active' : ''}`}
                onClick={() => setCurrentPage(3)}
              >
                3
              </button>
              <button
                className={`pagination-page-btn ${currentPage === 4 ? 'active' : ''}`}
                onClick={() => setCurrentPage(4)}
              >
                4
              </button>
              <button
                className={`pagination-page-btn ${currentPage === 5 ? 'active' : ''}`}
                onClick={() => setCurrentPage(5)}
              >
                5
              </button>
              <span className="pagination-ellipsis">...</span>
              <button
                className={`pagination-page-btn ${currentPage === 25 ? 'active' : ''}`}
                onClick={() => setCurrentPage(25)}
              >
                25
              </button>

              <button
                className="pagination-page-btn"
                disabled={currentPage === meta.last_page}
                onClick={() => setCurrentPage((p) => Math.min(meta.last_page, p + 1))}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Grid View Mode */
        <div className="contacts-cards-grid">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="contact-grid-card"
              onClick={() => handleOpenView(contact)}
            >
              <div className="contact-grid-card-header">
                <img
                  src={
                    contact.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={contact.name}
                  className="contact-grid-avatar"
                />
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
              <div className="contact-grid-name">{contact.name}</div>
              <div className="contact-grid-title">
                {contact.designation || 'CEO'} at {contact.company}
              </div>
              <div className="contact-grid-meta">
                <div>{contact.email}</div>
                <div>{contact.phone}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide Drawer: View Contact Details */}
      <ContactViewDrawer
        contact={viewingContact}
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        onEdit={(c) => {
          setIsViewOpen(false)
          handleOpenEdit(c)
        }}
        onDelete={handleDelete}
        onRestore={handleRestore}
        onAddOwner={(c) => {
          setOwnerModalContact(c)
          setIsOwnerModalOpen(true)
        }}
      />

      {/* Slide Drawer: Create / Edit Contact */}
      <ContactFormDrawer
        contact={editingContact}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Modal: Add Additional Owner */}
      <AddOwnerModal
        contact={ownerModalContact}
        isOpen={isOwnerModalOpen}
        onClose={() => setIsOwnerModalOpen(false)}
        onAddOwner={handleAddOwnerSubmit}
      />
    </div>
  )
}
