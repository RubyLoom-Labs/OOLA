import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Plus,
  Search,
  LayoutGrid,
  List,
  CheckCircle,
  Clock,
  Building2,
  Eye,
  Edit2,
  Trash2,
  RotateCcw,
} from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import StatCard from '@/components/common/StatCard'
import Breadcrumb from '@/components/ui/Breadcrumb'
import DataTable, { type Column } from '@/components/common/DataTable'
import ActionDropdown from '@/components/common/ActionDropdown'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import { capitalizeWords, getAvatarUrl } from '@/lib/utils'
import ContactViewDrawer from '@/components/contacts/ContactViewDrawer'
import ContactFormDrawer from '@/components/contacts/ContactFormDrawer'
import {
  contactsApi,
  type Contact,
  type ContactQueryParams,
  type CreateContactPayload,
  type UpdateContactPayload,
} from '@/apis/contactsApi'

interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  active_count?: number
  inactive_count?: number
  company_count?: number
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [selectedIds, setSelectedIds] = useState<number[]>([])

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
    active_count: 0,
    inactive_count: 0,
    company_count: 0,
  })

  // Drawer / Modal states
  const [viewingContact, setViewingContact] = useState<Contact | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [viewDrawerInitialEdit, setViewDrawerInitialEdit] = useState(false)

  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Confirmation Modal state
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Debounce search input
  useEffect(() => {
    if (searchQuery === debouncedSearch) return
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, debouncedSearch])

  // Fetch Contacts from GET /api/v1/contacts
  const fetchContactsList = useCallback(async () => {
    setLoading(true)
    try {
      const params: ContactQueryParams = {
        page: currentPage,
        per_page: perPage,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        sort_by: sortBy,
        sort_dir: sortDir,
      }
      const res = await contactsApi.getContacts(params)
      const dataList: Contact[] = Array.isArray(res.data) ? res.data : []
      setContacts(dataList)

      if (res.meta) {
        setMeta({
          current_page: res.meta.current_page || currentPage,
          last_page: res.meta.last_page || 1,
          per_page: res.meta.per_page || perPage,
          total: res.meta.total ?? dataList.length,
          active_count:
            res.meta.active_count ??
            dataList.filter((c) => c.status?.toLowerCase() === 'active').length,
          inactive_count:
            res.meta.inactive_count ??
            dataList.filter((c) => c.status?.toLowerCase() === 'inactive').length,
          company_count:
            res.meta.company_count ??
            new Set(dataList.map((c) => c.company).filter(Boolean)).size,
        })
      } else {
        setMeta({
          current_page: currentPage,
          last_page: Math.max(1, Math.ceil(dataList.length / perPage)),
          per_page: perPage,
          total: dataList.length,
          active_count: dataList.filter((c) => c.status?.toLowerCase() === 'active').length,
          inactive_count: dataList.filter((c) => c.status?.toLowerCase() === 'inactive').length,
          company_count: new Set(dataList.map((c) => c.company).filter(Boolean)).size,
        })
      }
    } catch (err: any) {
      console.error('Error fetching contacts from API:', err)
      setContacts([])
      setMeta({
        current_page: 1,
        last_page: 1,
        per_page: perPage,
        total: 0,
        active_count: 0,
        inactive_count: 0,
        company_count: 0,
      })
    } finally {
      setLoading(false)
    }
  }, [currentPage, perPage, debouncedSearch, statusFilter, sortBy, sortDir])

  useEffect(() => {
    fetchContactsList()
  }, [fetchContactsList])

  // Checkbox Selection
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
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
    setViewDrawerInitialEdit(false)
    setIsViewOpen(true)
  }

  const handleOpenCreate = () => {
    setEditingContact(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (contact: Contact) => {
    setViewingContact(contact)
    setViewDrawerInitialEdit(true)
    setIsViewOpen(true)
  }

  const handleFormSubmit = async (
    payload: CreateContactPayload | UpdateContactPayload,
    isEdit: boolean
  ) => {
    if (isEdit && editingContact) {
      const res = await contactsApi.updateContact(editingContact.id, payload)
      showToast(`Contact "${res.data?.name || payload.first_name}" updated successfully`)
      if (viewingContact && viewingContact.id === editingContact.id) {
        setViewingContact(res.data)
      }
    } else {
      const res = await contactsApi.createContact(payload as CreateContactPayload)
      showToast(`Contact "${res.data?.name || payload.first_name}" created successfully`)
    }
    fetchContactsList()
  }

  const handleDelete = (contactOrId: Contact | number) => {
    if (typeof contactOrId === 'number') {
      const target = contacts.find((c) => c.id === contactOrId) || viewingContact
      if (target) {
        setContactToDelete(target)
      } else {
        setContactToDelete({ id: contactOrId, first_name: 'Contact', last_name: `#${contactOrId}` } as Contact)
      }
    } else {
      setContactToDelete(contactOrId)
    }
  }

  const handleConfirmDelete = async () => {
    if (!contactToDelete) return
    const id = contactToDelete.id
    const contactName = getDisplayName(contactToDelete)
    try {
      await contactsApi.deleteContact(id)
      showToast(`Contact "${contactName}" deleted successfully`)
      if (viewingContact && viewingContact.id === id) {
        setIsViewOpen(false)
      }
      setContactToDelete(null)
      fetchContactsList()
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to delete contact')
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

  const getDisplayName = (contact: Contact) => {
    const raw =
      contact.full_name ||
      contact.name ||
      `${contact.first_name || ''} ${contact.last_name || ''}`.trim() ||
      'Unnamed Contact'
    return capitalizeWords(raw)
  }

  const getDisplayPhone = (contact: Contact) => {
    return (
      contact.phone ||
      contact.primary_phone_number?.phone_number ||
      (contact.phone_numbers && contact.phone_numbers[0]?.phone_number) ||
      '—'
    )
  }

  const contactColumns: Column<Contact>[] = [
    {
      key: 'name',
      header: 'NAME',
      render: (contact) => {
        const displayName = getDisplayName(contact)
        return (
          <div className="contact-name-cell">
            <img
              src={getAvatarUrl(contact.avatar)}
              alt={displayName}
              className="contact-table-avatar"
            />
            <div>
              <div className="contact-table-name font-semibold">{displayName}</div>
              <div className="contact-table-designation text-muted text-xs">
                {capitalizeWords(contact.designation) || 'Specialist'}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      key: 'company',
      header: 'COMPANY',
      render: (contact) => (
        <span className="font-medium text-gray-700">
          {capitalizeWords(contact.company) || '—'}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'EMAIL',
      render: (contact) =>
        contact.email ? (
          <a
            href={`mailto:${contact.email}`}
            className="text-gray-600 hover:text-primary-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {contact.email}
          </a>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: 'phone',
      header: 'PHONE',
      render: (contact) => (
        <span className="text-gray-600">{getDisplayPhone(contact)}</span>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (contact) => (
        <span
          className={`contact-status-pill ${
            contact.status?.toLowerCase() === 'active'
              ? 'status-active'
              : contact.status?.toLowerCase() === 'inactive'
              ? 'status-inactive'
              : 'status-archived'
          }`}
        >
          {capitalizeWords(contact.status) || 'Active'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      width: 60,
      align: 'center',
      render: (contact) => (
        <ActionDropdown
          minWidth={175}
          items={[
            {
              key: 'view',
              label: 'View Details',
              icon: <Eye size={14} />,
              onClick: () => handleOpenView(contact),
            },
            {
              key: 'edit',
              label: 'Edit Contact',
              icon: <Edit2 size={14} />,
              onClick: () => handleOpenEdit(contact),
            },
            {
              key: 'divider',
              label: '',
              divider: true,
            },
            contact.status === 'Archived'
              ? {
                  key: 'restore',
                  label: 'Restore Contact',
                  icon: <RotateCcw size={14} />,
                  success: true,
                  onClick: () => handleRestore(contact.id),
                }
              : {
                  key: 'delete',
                  label: 'Delete Contact',
                  icon: <Trash2 size={14} />,
                  danger: true,
                  onClick: () => handleDelete(contact.id),
                },
          ]}
        />
      ),
    },
  ]

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
      <Breadcrumb items={[{ label: 'Contacts' }]} />

      {/* Module Page Header */}
      <PageHeader
        icon={<Users size={24} />}
        title="Contacts"
        description="Manage your companies and contacts. Create, edit, and connect them to leads, projects and deals."
        actions={
          <div className="flex items-center gap-2">
            <button
              className="btn btn-primary shadow-sm flex items-center gap-1.5"
              onClick={handleOpenCreate}
            >
              <Plus size={16} />
              <span>Add Contact</span>
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
          onClick={() => {
            setStatusFilter('all')
            setCurrentPage(1)
          }}
        />
        <StatCard
          label="Active"
          value={meta.active_count ?? 0}
          icon={<CheckCircle size={20} />}
          variant="green"
          active={statusFilter === 'Active'}
          onClick={() => {
            setStatusFilter('Active')
            setCurrentPage(1)
          }}
        />
        <StatCard
          label="Inactive"
          value={meta.inactive_count ?? 0}
          icon={<Clock size={20} />}
          variant="amber"
          active={statusFilter === 'Inactive'}
          onClick={() => {
            setStatusFilter('Inactive')
            setCurrentPage(1)
          }}
        />
        <StatCard
          label="Companies"
          value={meta.company_count ?? 0}
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
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Search Contacts Bar */}
          <div className="contacts-search-box">
            <Search size={16} className="contacts-search-icon" />
            <input
              type="text"
              className="contacts-search-input"
              placeholder="Search by name, email, company, phone, role..."
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

      {/* Contacts Table View */}
      {viewMode === 'table' ? (
        <DataTable<Contact>
          data={contacts}
          columns={contactColumns}
          loading={loading}
          loadingMessage="Loading contacts from server..."
          emptyMessage="No contacts found matching your criteria."
          selectable
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectRow={(id) => handleSelectOne(Number(id))}
          onRowClick={(contact) => handleOpenView(contact)}
          pagination={{
            currentPage,
            total: meta.total,
            perPage,
            lastPage: meta.last_page,
            onPageChange: setCurrentPage,
            itemName: 'contacts',
          }}
        />
      ) : (
        /* Grid View Mode */
        <div className="contacts-cards-grid">
          {contacts.map((contact) => {
            const displayName = getDisplayName(contact)
            const displayPhone = getDisplayPhone(contact)

            return (
              <div
                key={contact.id}
                className="contact-grid-card"
                onClick={() => handleOpenView(contact)}
              >
                <div className="contact-grid-card-header">
                  <img
                    src={getAvatarUrl(contact.avatar)}
                    alt={displayName}
                    className="contact-grid-avatar"
                  />
                  <span
                    className={`contact-status-pill ${
                      contact.status?.toLowerCase() === 'active'
                        ? 'status-active'
                        : contact.status?.toLowerCase() === 'inactive'
                        ? 'status-inactive'
                        : 'status-archived'
                    }`}
                  >
                    {capitalizeWords(contact.status) || 'Active'}
                  </span>
                </div>
                <div className="contact-grid-name">{displayName}</div>
                <div className="contact-grid-title">
                  {capitalizeWords(contact.designation) || 'Specialist'}{contact.company ? ` at ${capitalizeWords(contact.company)}` : ''}
                </div>
                <div className="contact-grid-meta">
                  <div>{contact.email || '—'}</div>
                  <div>{displayPhone}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Slide Drawer: View & In-Place Edit Contact Details */}
      <ContactViewDrawer
        contact={viewingContact}
        isOpen={isViewOpen}
        initialEditMode={viewDrawerInitialEdit}
        onClose={() => {
          setIsViewOpen(false)
          setViewDrawerInitialEdit(false)
        }}
        onSave={(updatedContact) => {
          showToast(`Contact "${updatedContact.name || updatedContact.first_name}" updated successfully`)
          setViewingContact(updatedContact)
          fetchContactsList()
        }}
        onDelete={handleDelete}
        onRestore={handleRestore}
      />

      {/* Slide Drawer: Create New Contact */}
      <ContactFormDrawer
        contact={editingContact}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Global Confirmation Modal for Deletion */}
      <ConfirmationModal
        isOpen={Boolean(contactToDelete)}
        onClose={() => setContactToDelete(null)}
        onConfirm={handleConfirmDelete}
        variant="danger"
        title="Delete Contact"
        itemName={contactToDelete ? getDisplayName(contactToDelete) : undefined}
        message="Are you sure you want to delete this contact? All associated interactions, activities, and records will be archived."
        confirmText="Delete Contact"
        cancelText="Cancel"
      />
    </div>
  )
}
