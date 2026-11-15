import { useState, useEffect, useCallback } from 'react'
import {
  Globe,
  Search,
  LayoutGrid,
  List,
  Eye,
  Mail,
  MessageSquare,
  FileText,
  Clock,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Trash2,
  CheckCircle,
} from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import StatCard from '@/components/common/StatCard'
import Breadcrumb from '@/components/ui/Breadcrumb'
import DataTable, { getPageNumbers, type Column } from '@/components/common/DataTable'
import ActionDropdown from '@/components/common/ActionDropdown'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import InquiryViewDrawer from '@/components/inquiries/InquiryViewDrawer'
import { capitalizeWords } from '@/lib/utils'
import {
  inquiriesApi,
  type Inquiry,
  type InquiryQueryParams,
} from '@/apis/inquiriesApi'

interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export default function Inquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Sorting state
  const [sortBy] = useState<string>('created_at')
  const [sortDir] = useState<'asc' | 'desc'>('desc')

  // Pagination state (same as Companies / Contacts / Projects tabs)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  })

  // View Drawer state (Read-only, no Add/Edit options)
  const [viewingInquiry, setViewingInquiry] = useState<Inquiry | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  // Universal Confirmation Modal states for Convert to Lead and Delete
  const [inquiryToConvert, setInquiryToConvert] = useState<Inquiry | null>(null)
  const [inquiryToDelete, setInquiryToDelete] = useState<Inquiry | null>(null)

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

  // Fetch Inquiries from GET /api/v1/inquiries (only status = 1 and is_delete = 0)
  const fetchInquiriesList = useCallback(async () => {
    setLoading(true)
    try {
      const params: InquiryQueryParams = {
        page: currentPage,
        per_page: perPage,
        search: debouncedSearch.trim() || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
      }
      const res = await inquiriesApi.getInquiries(params)
      const dataList: Inquiry[] = Array.isArray(res.data) ? res.data : []
      setInquiries(dataList)

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
      console.error('Error fetching website inquiries from API:', err)
      setInquiries([])
      setMeta({
        current_page: 1,
        last_page: 1,
        per_page: perPage,
        total: 0,
      })
    } finally {
      setLoading(false)
    }
  }, [currentPage, perPage, debouncedSearch, sortBy, sortDir])

  useEffect(() => {
    fetchInquiriesList()
  }, [fetchInquiriesList])

  // Checkbox Selection
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(inquiries.map((item) => item.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  // Open View Slide Panel
  const handleOpenView = (inquiry: Inquiry) => {
    setViewingInquiry(inquiry)
    setIsViewOpen(true)
  }

  const getDisplayName = (inquiry: Inquiry) => {
    const f = inquiry.first_name || inquiry.firstname || ''
    const l = inquiry.last_name || inquiry.lastname || ''
    return capitalizeWords(`${f} ${l}`.trim()) || `Inquiry #${inquiry.id}`
  }

  // Confirm Convert to Lead
  const handleConfirmConvertToLead = async () => {
    if (!inquiryToConvert) return
    const target = inquiryToConvert
    const displayName = getDisplayName(target)
    try {
      await inquiriesApi.convertToLead(target.id)
      showToast(`Inquiry from "${displayName}" converted to Lead successfully`)
      if (viewingInquiry && viewingInquiry.id === target.id) {
        setIsViewOpen(false)
      }
      setInquiryToConvert(null)
      fetchInquiriesList()
    } catch (err: any) {
      showToast(err?.message || 'Failed to convert inquiry to lead')
    }
  }

  // Confirm Delete Inquiry
  const handleConfirmDelete = async () => {
    if (!inquiryToDelete) return
    const target = inquiryToDelete
    const displayName = getDisplayName(target)
    try {
      await inquiriesApi.deleteInquiry(target.id)
      showToast(`Inquiry from "${displayName}" deleted successfully`)
      if (viewingInquiry && viewingInquiry.id === target.id) {
        setIsViewOpen(false)
      }
      setInquiryToDelete(null)
      fetchInquiriesList()
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete inquiry')
    }
  }

  const getInitials = (inquiry: Inquiry) => {
    const f = (inquiry.first_name || inquiry.firstname || '').charAt(0)
    const l = (inquiry.last_name || inquiry.lastname || '').charAt(0)
    return `${f}${l}`.toUpperCase() || 'IN'
  }

  const todayCount = inquiries.filter((inq) => {
    if (!inq.created_at) return false
    const d = new Date(inq.created_at)
    const now = new Date()
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    )
  }).length

  const withSubjectCount = inquiries.filter(
    (inq) => inq.subject && inq.subject.trim().length > 0
  ).length

  const withMessageCount = inquiries.filter(
    (inq) => inq.message && inq.message.trim().length > 0
  ).length

  const inquiryColumns: Column<Inquiry>[] = [
    {
      key: 'first_name',
      header: 'FIRST NAME',
      render: (inquiry) => {
        const firstName = inquiry.first_name || inquiry.firstname || '—'
        return (
          <div className="contact-name-cell">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-2xs">
              {getInitials(inquiry)}
            </div>
            <div className="min-w-0">
              <div className="contact-table-name font-semibold text-slate-900 truncate">
                {firstName}
              </div>
              <div className="contact-table-designation text-muted text-xs truncate">
                INQ-{String(inquiry.id).padStart(4, '0')}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      key: 'last_name',
      header: 'LAST NAME',
      render: (inquiry) => (
        <span className="font-semibold text-slate-800 text-sm whitespace-nowrap">
          {inquiry.last_name || inquiry.lastname || '—'}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'EMAIL',
      render: (inquiry) =>
        inquiry.email ? (
          <a
            href={`mailto:${inquiry.email}`}
            className="text-slate-600 hover:text-blue-600 text-sm hover:underline whitespace-nowrap"
            onClick={(e) => e.stopPropagation()}
          >
            {inquiry.email}
          </a>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        ),
    },
    {
      key: 'contact_number',
      header: 'CONTACT NUMBER',
      render: (inquiry) =>
        inquiry.contact_number ? (
          <a
            href={`tel:${inquiry.contact_number}`}
            className="text-slate-600 hover:text-blue-600 text-sm font-medium hover:underline whitespace-nowrap"
            onClick={(e) => e.stopPropagation()}
          >
            {inquiry.contact_number}
          </a>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        ),
    },
    {
      key: 'subject',
      header: 'SUBJECT',
      render: (inquiry) => (
        <div
          className="text-slate-800 text-sm font-medium max-w-[200px] truncate"
          title={inquiry.subject || undefined}
        >
          {inquiry.subject || '—'}
        </div>
      ),
    },
    {
      key: 'message',
      header: 'MESSAGE',
      render: (inquiry) => (
        <div
          className="text-slate-600 text-xs max-w-[280px] truncate"
          title={inquiry.message || undefined}
        >
          {inquiry.message || '—'}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      width: 60,
      align: 'center',
      render: (inquiry) => (
        <ActionDropdown
          minWidth={185}
          items={[
            {
              key: 'view',
              label: 'View Details',
              icon: <Eye size={14} />,
              onClick: () => handleOpenView(inquiry),
            },
            {
              key: 'convert',
              label: 'Convert to Lead',
              icon: <UserPlus size={14} />,
              success: true,
              onClick: () => setInquiryToConvert(inquiry),
            },
            {
              key: 'divider',
              label: '',
              divider: true,
            },
            {
              key: 'delete',
              label: 'Delete Inquiry',
              icon: <Trash2 size={14} />,
              danger: true,
              onClick: () => setInquiryToDelete(inquiry),
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
      <Breadcrumb items={[{ label: 'Website' }, { label: 'Inquiry' }]} />

      {/* Module Page Header (No Add / Edit buttons as required) */}
      <PageHeader
        icon={<Globe size={24} />}
        title="Website Inquiries"
        description="View customer inquiries received from your company website. Click any inquiry row to inspect full details, convert to a lead, or archive."
      />

      {/* Stat Cards Summary Row */}
      <div className="contacts-stats-grid">
        <StatCard
          label="Total Inquiries"
          value={meta.total}
          icon={<MessageSquare size={20} />}
          variant="blue"
          active
          onClick={() => setCurrentPage(1)}
        />
        <StatCard
          label="Received Today"
          value={todayCount}
          icon={<Clock size={20} />}
          variant="green"
        />
        <StatCard
          label="With Subject"
          value={withSubjectCount}
          icon={<FileText size={20} />}
          variant="amber"
        />
        <StatCard
          label="Detailed Messages"
          value={withMessageCount}
          icon={<Mail size={20} />}
          variant="purple"
        />
      </div>

      {/* Filter & Search Toolbar */}
      <div className="contacts-filter-bar">
        <div className="contacts-filter-left">
          {/* Search Inquiries Bar */}
          <div className="contacts-search-box">
            <Search size={16} className="contacts-search-icon" />
            <input
              type="text"
              className="contacts-search-input"
              placeholder="Search by first name, last name, email, contact number, subject, message..."
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

      {/* Main Content Area: Table View vs Grid View */}
      {viewMode === 'table' ? (
        <DataTable<Inquiry>
          data={inquiries}
          columns={inquiryColumns}
          loading={loading}
          loadingMessage="Loading website inquiries from server..."
          emptyMessage="No website inquiries found matching your criteria."
          selectable
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectRow={(id) => handleSelectOne(Number(id))}
          onRowClick={(inquiry) => handleOpenView(inquiry)}
          pagination={{
            currentPage,
            total: meta.total,
            perPage,
            lastPage: meta.last_page,
            onPageChange: setCurrentPage,
            itemName: 'inquiries',
          }}
        />
      ) : (
        /* Grid View Mode + Pagination */
        <div>
          <div className="contacts-cards-grid">
            {inquiries.map((inquiry) => {
              const firstName = inquiry.first_name || inquiry.firstname || ''
              const lastName = inquiry.last_name || inquiry.lastname || ''
              const fullName =
                `${firstName} ${lastName}`.trim() || 'Website Visitor'

              return (
                <div
                  key={inquiry.id}
                  className="contact-grid-card cursor-pointer hover:shadow-md transition-all"
                  onClick={() => handleOpenView(inquiry)}
                >
                  <div className="contact-grid-card-header">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-2xs">
                      {getInitials(inquiry)}
                    </div>
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      INQ-{String(inquiry.id).padStart(4, '0')}
                    </span>
                  </div>

                  <div className="contact-grid-name font-semibold text-slate-900 mt-2 truncate">
                    {fullName}
                  </div>

                  <div className="contact-grid-title flex items-center gap-1.5 text-xs text-muted mt-1 truncate">
                    <span className="truncate font-medium text-slate-700">
                      {inquiry.subject || 'No Subject'}
                    </span>
                  </div>

                  <div className="contact-grid-meta text-xs text-slate-600 mt-3 space-y-1">
                    <div className="truncate">{inquiry.email || '—'}</div>
                    <div>{inquiry.contact_number || '—'}</div>
                    {inquiry.message && (
                      <div className="text-slate-500 line-clamp-2 pt-1">
                        {inquiry.message}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-muted">
                    <span className="text-slate-400">
                      {inquiry.created_at
                        ? new Date(inquiry.created_at).toLocaleDateString()
                        : '—'}
                    </span>
                    <span className="text-blue-600 font-medium hover:underline">
                      View inquiry →
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Grid View Pagination Footer */}
          <div className="table-card mt-4">
            <div className="table-pagination-footer">
              <div className="pagination-info-text text-muted text-xs">
                {meta.total === 0
                  ? 'Showing 0 inquiries'
                  : `Showing ${(currentPage - 1) * perPage + 1} to ${Math.min(
                      currentPage * perPage,
                      meta.total
                    )} of ${meta.total} inquiries`}
              </div>

              {meta.last_page > 1 && (
                <div className="pagination-pages-list">
                  <button
                    type="button"
                    className="pagination-page-btn"
                    disabled={currentPage <= 1 || loading}
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    title="Previous page"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {getPageNumbers(currentPage, meta.last_page).map((item, idx) => {
                    if (item === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                          ...
                        </span>
                      )
                    }
                    const pageNum = Number(item)
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        className={`pagination-page-btn ${
                          currentPage === pageNum ? 'active' : ''
                        }`}
                        disabled={loading}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    )
                  })}

                  <button
                    type="button"
                    className="pagination-page-btn"
                    disabled={currentPage >= meta.last_page || loading}
                    onClick={() =>
                      setCurrentPage(Math.min(meta.last_page, currentPage + 1))
                    }
                    title="Next page"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slide Drawer: View Inquiry Details (Read-Only) */}
      <InquiryViewDrawer
        inquiry={viewingInquiry}
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        onConvertToLead={(inq) => setInquiryToConvert(inq)}
        onDelete={(inq) => setInquiryToDelete(inq)}
      />

      {/* Universal Confirmation Modal: Convert to Lead */}
      <ConfirmationModal
        isOpen={Boolean(inquiryToConvert)}
        onClose={() => setInquiryToConvert(null)}
        onConfirm={handleConfirmConvertToLead}
        variant="primary"
        title="Convert Inquiry to Lead"
        itemName={inquiryToConvert ? getDisplayName(inquiryToConvert) : undefined}
        message="Are you sure you want to convert this inquiry into a Lead? A new lead record will be created with these inquiry details, and this inquiry will be removed from the Inquiry list."
        confirmText="Convert to Lead"
        cancelText="Cancel"
      />

      {/* Universal Confirmation Modal: Delete Inquiry */}
      <ConfirmationModal
        isOpen={Boolean(inquiryToDelete)}
        onClose={() => setInquiryToDelete(null)}
        onConfirm={handleConfirmDelete}
        variant="danger"
        title="Delete Inquiry"
        itemName={inquiryToDelete ? getDisplayName(inquiryToDelete) : undefined}
        message="Are you sure you want to delete this inquiry? This record will be archived and removed from the Inquiry list."
        confirmText="Delete Inquiry"
        cancelText="Cancel"
      />
    </div>
  )
}
