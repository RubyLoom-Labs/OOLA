import { useState, useEffect, useCallback } from 'react'
import {
  MessageSquare,
  Search,
  LayoutGrid,
  List,
  Eye,
  CheckCircle,
  Clock,
  EyeOff,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import StatCard from '@/components/common/StatCard'
import Breadcrumb from '@/components/ui/Breadcrumb'
import DataTable, { getPageNumbers, type Column } from '@/components/common/DataTable'
import ActionDropdown, { type ActionDropdownItem } from '@/components/common/ActionDropdown'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import CommentViewDrawer from '@/components/comments/CommentViewDrawer'
import { capitalizeWords } from '@/lib/utils'
import {
  commentsApi,
  getCommentImageUrl,
  getCommentStatusLabel,
  getCommentDisplayStatusLabel,
  type CommentItem,
  type CommentQueryParams,
} from '@/apis/commentsApi'

type CommentFilterMode =
  | 'all'
  | 'pending'
  | 'approved'
  | 'display'
  | 'not_display'

interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  pending_count?: number
  approved_count?: number
  display_count?: number
  not_display_count?: number
}

export default function Comments() {
  const [comments, setComments] = useState<CommentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CommentFilterMode>('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Sorting state
  const [sortBy] = useState<string>('created_at')
  const [sortDir] = useState<'asc' | 'desc'>('desc')

  // Pagination state (same as Companies / Inquiry tabs)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    pending_count: 0,
    approved_count: 0,
    display_count: 0,
    not_display_count: 0,
  })

  // View Drawer state (Read-only + Image Upload)
  const [viewingComment, setViewingComment] = useState<CommentItem | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  // Universal Confirmation Modal states
  const [commentToApprove, setCommentToApprove] = useState<CommentItem | null>(null)
  const [commentToDisplay, setCommentToDisplay] = useState<CommentItem | null>(null)
  const [commentToNotDisplay, setCommentToNotDisplay] = useState<CommentItem | null>(null)
  const [commentToDelete, setCommentToDelete] = useState<CommentItem | null>(null)

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

  // Fetch Comments from GET /api/v1/comments
  const fetchCommentsList = useCallback(async () => {
    setLoading(true)
    try {
      const params: CommentQueryParams = {
        page: currentPage,
        per_page: perPage,
        search: debouncedSearch.trim() || undefined,
        status:
          statusFilter === 'pending'
            ? 0
            : statusFilter === 'approved'
              ? 1
              : undefined,
        display_status:
          statusFilter === 'display'
            ? 1
            : statusFilter === 'not_display'
              ? 0
              : undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
      }
      const res = await commentsApi.getComments(params)
      const dataList: CommentItem[] = Array.isArray(res.data) ? res.data : []
      setComments(dataList)

      const pendingCount = dataList.filter((c) => Number(c.status) === 0).length
      const approvedCount = dataList.filter((c) => Number(c.status) === 1).length
      const displayCount = dataList.filter(
        (c) => Number(c.display_status) === 1
      ).length
      const notDisplayCount = dataList.filter(
        (c) => Number(c.display_status) === 0
      ).length

      if (res.meta) {
        setMeta({
          current_page: res.meta.current_page || currentPage,
          last_page: res.meta.last_page || 1,
          per_page: res.meta.per_page || perPage,
          total: res.meta.total ?? dataList.length,
          pending_count: res.meta.pending_count ?? pendingCount,
          approved_count: res.meta.approved_count ?? approvedCount,
          display_count: res.meta.display_count ?? displayCount,
          not_display_count: res.meta.not_display_count ?? notDisplayCount,
        })
      } else {
        setMeta({
          current_page: currentPage,
          last_page: Math.max(1, Math.ceil(dataList.length / perPage)),
          per_page: perPage,
          total: dataList.length,
          pending_count: pendingCount,
          approved_count: approvedCount,
          display_count: displayCount,
          not_display_count: notDisplayCount,
        })
      }
    } catch (err) {
      console.error('Error fetching website comments from API:', err)
      setComments([])
      setMeta({
        current_page: 1,
        last_page: 1,
        per_page: perPage,
        total: 0,
        pending_count: 0,
        approved_count: 0,
        display_count: 0,
        not_display_count: 0,
      })
    } finally {
      setLoading(false)
    }
  }, [currentPage, perPage, debouncedSearch, statusFilter, sortBy, sortDir])

  useEffect(() => {
    fetchCommentsList()
  }, [fetchCommentsList])

  // Checkbox Selection
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(comments.map((item) => item.id))
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
  const handleOpenView = (comment: CommentItem) => {
    setViewingComment(comment)
    setIsViewOpen(true)
  }

  const getDisplayName = (comment: CommentItem) => {
    return capitalizeWords((comment.name || '').trim()) || `Comment #${comment.id}`
  }

  // Sync comment when image is uploaded/removed in Drawer
  const handleImageUpdated = (updatedComment: CommentItem) => {
    setViewingComment(updatedComment)
    setComments((prev) =>
      prev.map((c) => (c.id === updatedComment.id ? updatedComment : c))
    )
    showToast(
      updatedComment.image
        ? `Image uploaded for "${getDisplayName(updatedComment)}"`
        : `Image removed for "${getDisplayName(updatedComment)}"`
    )
  }

  // Confirm Approve Comment (Pending -> Approved)
  const handleConfirmApprove = async () => {
    if (!commentToApprove) return
    const target = commentToApprove
    const displayName = getDisplayName(target)
    try {
      const res = await commentsApi.approveComment(target.id)
      showToast(`Comment from "${displayName}" approved successfully`)
      if (viewingComment && viewingComment.id === target.id && res.data) {
        setViewingComment(res.data)
      }
      setCommentToApprove(null)
      fetchCommentsList()
    } catch (err: any) {
      showToast(err?.message || 'Failed to approve comment')
    }
  }

  // Confirm Change Home Page Display Status to Display (Not Display -> Display)
  const handleConfirmDisplay = async () => {
    if (!commentToDisplay) return
    const target = commentToDisplay
    const displayName = getDisplayName(target)
    try {
      const res = await commentsApi.updateCommentStatus(target.id, 1)
      showToast(`Comment from "${displayName}" set to Display on Home Page`)
      if (viewingComment && viewingComment.id === target.id && res.data) {
        setViewingComment(res.data)
      }
      setCommentToDisplay(null)
      fetchCommentsList()
    } catch (err: any) {
      showToast(err?.message || 'Failed to update comment display status')
    }
  }

  // Confirm Change Home Page Display Status to Not Display (Display -> Not Display)
  const handleConfirmNotDisplay = async () => {
    if (!commentToNotDisplay) return
    const target = commentToNotDisplay
    const displayName = getDisplayName(target)
    try {
      const res = await commentsApi.updateCommentStatus(target.id, 0)
      showToast(`Comment from "${displayName}" set to Not Display on Home Page`)
      if (viewingComment && viewingComment.id === target.id && res.data) {
        setViewingComment(res.data)
      }
      setCommentToNotDisplay(null)
      fetchCommentsList()
    } catch (err: any) {
      showToast(err?.message || 'Failed to update comment display status')
    }
  }

  // Confirm Delete Comment
  const handleConfirmDelete = async () => {
    if (!commentToDelete) return
    const target = commentToDelete
    const displayName = getDisplayName(target)
    try {
      await commentsApi.deleteComment(target.id)
      showToast(`Comment from "${displayName}" deleted successfully`)
      if (viewingComment && viewingComment.id === target.id) {
        setIsViewOpen(false)
      }
      setCommentToDelete(null)
      fetchCommentsList()
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete comment')
    }
  }

  const getInitials = (comment: CommentItem) => {
    const clean = (comment.name || '').trim()
    if (!clean) return 'CM'
    const parts = clean.split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
    }
    return clean.slice(0, 2).toUpperCase()
  }

  const getStatusPillClass = (isActive: boolean, isPending?: boolean) => {
    if (isActive) return 'status-active'
    if (isPending) return 'status-inactive'
    return 'status-neutral'
  }

  const getRowActionItems = (comment: CommentItem): ActionDropdownItem[] => {
    const items: ActionDropdownItem[] = [
      {
        key: 'view',
        label: 'View Details',
        icon: <Eye size={14} />,
        onClick: () => handleOpenView(comment),
      },
    ]

    if (Number(comment.status) === 0) {
      items.push({
        key: 'approve',
        label: 'Approve Comment',
        icon: <CheckCircle size={14} />,
        success: true,
        onClick: () => setCommentToApprove(comment),
      })
    } else {
      // After pending is approved (status === 1), display_status can be toggled between Display (1) and Not Display (0)
      if (Number(comment.display_status) === 0) {
        items.push({
          key: 'display',
          label: 'Display',
          icon: <Eye size={14} />,
          success: true,
          onClick: () => setCommentToDisplay(comment),
        })
      } else {
        items.push({
          key: 'not_display',
          label: 'Not Display',
          icon: <EyeOff size={14} />,
          onClick: () => setCommentToNotDisplay(comment),
        })
      }
    }

    items.push(
      {
        key: 'divider',
        label: '',
        divider: true,
      },
      {
        key: 'delete',
        label: 'Delete Comment',
        icon: <Trash2 size={14} />,
        danger: true,
        onClick: () => setCommentToDelete(comment),
      }
    )

    return items
  }

  const commentColumns: Column<CommentItem>[] = [
    {
      key: 'name',
      header: 'NAME',
      render: (comment) => {
        const imgUrl = getCommentImageUrl(comment.image, comment.image_url)
        return (
          <div className="contact-name-cell">
            {imgUrl ? (
              <img
                src={imgUrl}
                alt={comment.name}
                className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0 bg-white shadow-2xs"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  const fb = e.currentTarget.nextElementSibling as HTMLElement
                  if (fb) fb.style.display = 'flex'
                }}
              />
            ) : null}
            <div
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white items-center justify-center font-bold text-xs uppercase shrink-0 shadow-2xs"
              style={{ display: imgUrl ? 'none' : 'flex' }}
            >
              {getInitials(comment)}
            </div>
            <div className="min-w-0">
              <div className="contact-table-name font-semibold text-slate-900 truncate">
                {comment.name || '—'}
              </div>
              <div className="contact-table-designation text-muted text-xs truncate">
                CMT-{String(comment.id).padStart(4, '0')}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      key: 'company',
      header: 'COMPANY',
      render: (comment) => (
        <span className="font-medium text-slate-800 text-sm whitespace-nowrap">
          {comment.company || '—'}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'TITLE',
      render: (comment) => (
        <div
          className="text-slate-800 text-sm font-medium max-w-[200px] truncate"
          title={comment.title || undefined}
        >
          {comment.title || '—'}
        </div>
      ),
    },
    {
      key: 'comment',
      header: 'COMMENT',
      render: (comment) => (
        <div
          className="text-slate-600 text-xs max-w-[280px] truncate"
          title={comment.comment || undefined}
        >
          {comment.comment || '—'}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      width: 115,
      render: (comment) => (
        <span
          className={`contact-status-pill whitespace-nowrap ${getStatusPillClass(
            Number(comment.status) === 1,
            Number(comment.status) === 0
          )}`}
        >
          {getCommentStatusLabel(comment.status)}
        </span>
      ),
    },
    {
      key: 'display_status',
      header: 'HOME PAGE',
      width: 125,
      render: (comment) => (
        <span
          className={`contact-status-pill whitespace-nowrap ${getStatusPillClass(
            Number(comment.display_status) === 1
          )}`}
        >
          {getCommentDisplayStatusLabel(comment.display_status)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      width: 60,
      align: 'center',
      render: (comment) => (
        <ActionDropdown minWidth={185} items={getRowActionItems(comment)} />
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
      <Breadcrumb items={[{ label: 'Website' }, { label: 'Comments' }]} />

      {/* Module Page Header */}
      <PageHeader
        icon={<MessageSquare size={24} />}
        title="Website Comments"
        description="Review, approve, or manage visibility of visitor comments submitted from your company website."
      />

      {/* Stat Cards Summary Row */}
      <div className="contacts-stats-grid">
        <StatCard
          label="Total Comments"
          value={
            (meta.pending_count ?? 0) + (meta.approved_count ?? 0) || meta.total
          }
          icon={<MessageSquare size={20} />}
          variant="blue"
          active={statusFilter === 'all'}
          onClick={() => {
            setStatusFilter('all')
            setCurrentPage(1)
          }}
        />
        <StatCard
          label="Pending"
          value={meta.pending_count ?? 0}
          icon={<Clock size={20} />}
          variant="amber"
          active={statusFilter === 'pending'}
          onClick={() => {
            setStatusFilter('pending')
            setCurrentPage(1)
          }}
        />
        <StatCard
          label="Approved"
          value={meta.approved_count ?? 0}
          icon={<CheckCircle size={20} />}
          variant="green"
          active={statusFilter === 'approved'}
          onClick={() => {
            setStatusFilter('approved')
            setCurrentPage(1)
          }}
        />
        <StatCard
          label="Home Page Display"
          value={meta.display_count ?? 0}
          icon={<Eye size={20} />}
          variant="purple"
          active={statusFilter === 'display'}
          onClick={() => {
            setStatusFilter('display')
            setCurrentPage(1)
          }}
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
                setStatusFilter(e.target.value as CommentFilterMode)
                setCurrentPage(1)
              }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="display">Home Page: Display</option>
              <option value="not_display">Home Page: Not Display</option>
            </select>
          </div>

          {/* Search Comments Bar */}
          <div className="contacts-search-box">
            <Search size={16} className="contacts-search-icon" />
            <input
              type="text"
              className="contacts-search-input"
              placeholder="Search by name, company, title, comment..."
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
        <DataTable<CommentItem>
          data={comments}
          columns={commentColumns}
          loading={loading}
          loadingMessage="Loading website comments from server..."
          emptyMessage="No website comments found matching your criteria."
          selectable
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectRow={(id) => handleSelectOne(Number(id))}
          onRowClick={(comment) => handleOpenView(comment)}
          pagination={{
            currentPage,
            total: meta.total,
            perPage,
            lastPage: meta.last_page,
            onPageChange: setCurrentPage,
            itemName: 'comments',
          }}
        />
      ) : (
        /* Grid View Mode + Pagination */
        <div>
          <div className="contacts-cards-grid">
            {comments.map((comment) => {
              const imgUrl = getCommentImageUrl(comment.image, comment.image_url)
              return (
                <div
                  key={comment.id}
                  className="contact-grid-card cursor-pointer hover:shadow-md transition-all"
                  onClick={() => handleOpenView(comment)}
                >
                  <div className="contact-grid-card-header">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={comment.name}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 bg-white shadow-2xs"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          const fb = e.currentTarget
                            .nextElementSibling as HTMLElement
                          if (fb) fb.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white items-center justify-center font-bold text-xs uppercase shrink-0 shadow-2xs"
                      style={{ display: imgUrl ? 'none' : 'flex' }}
                    >
                      {getInitials(comment)}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`contact-status-pill ${getStatusPillClass(
                          Number(comment.status) === 1,
                          Number(comment.status) === 0
                        )}`}
                      >
                        {getCommentStatusLabel(comment.status)}
                      </span>
                      <span
                        className={`contact-status-pill ${getStatusPillClass(
                          Number(comment.display_status) === 1
                        )}`}
                      >
                        {getCommentDisplayStatusLabel(comment.display_status)}
                      </span>
                    </div>
                  </div>

                  <div className="contact-grid-name font-semibold text-slate-900 mt-2 truncate">
                    {comment.name || 'Website Visitor'}
                  </div>

                  <div className="contact-grid-title flex items-center gap-1.5 text-xs text-muted mt-1 truncate">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      CMT-{String(comment.id).padStart(4, '0')}
                    </span>
                    <span className="truncate font-medium text-slate-700">
                      {comment.company || 'No Company'}
                    </span>
                  </div>

                  <div className="contact-grid-meta text-xs text-slate-600 mt-3 space-y-1">
                    <div className="truncate font-medium text-slate-700">
                      {comment.title || '—'}
                    </div>
                    {comment.comment && (
                      <div className="text-slate-500 line-clamp-2 pt-1">
                        {comment.comment}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-muted">
                    <span className="text-slate-400">
                      {comment.created_at
                        ? new Date(comment.created_at).toLocaleDateString()
                        : '—'}
                    </span>
                    <span className="text-blue-600 font-medium hover:underline">
                      View comment →
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
                  ? 'Showing 0 comments'
                  : `Showing ${(currentPage - 1) * perPage + 1} to ${Math.min(
                      currentPage * perPage,
                      meta.total
                    )} of ${meta.total} comments`}
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

      {/* Slide Drawer: View Comment Details + Image Upload */}
      <CommentViewDrawer
        comment={viewingComment}
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        onApprove={(cmt) => setCommentToApprove(cmt)}
        onMarkDisplay={(cmt) => setCommentToDisplay(cmt)}
        onMarkNotDisplay={(cmt) => setCommentToNotDisplay(cmt)}
        onDelete={(cmt) => setCommentToDelete(cmt)}
        onImageUpdated={handleImageUpdated}
      />

      {/* Universal Confirmation Modal: Approve Comment */}
      <ConfirmationModal
        isOpen={Boolean(commentToApprove)}
        onClose={() => setCommentToApprove(null)}
        onConfirm={handleConfirmApprove}
        variant="primary"
        title="Approve Comment"
        itemName={commentToApprove ? getDisplayName(commentToApprove) : undefined}
        message="Are you sure you want to approve this website comment? Its status will be changed from Pending to Approved and displayed on the Home Page."
        confirmText="Approve Comment"
        cancelText="Cancel"
      />

      {/* Universal Confirmation Modal: Change Home Page Status to Display */}
      <ConfirmationModal
        isOpen={Boolean(commentToDisplay)}
        onClose={() => setCommentToDisplay(null)}
        onConfirm={handleConfirmDisplay}
        variant="primary"
        title="Display Comment on Home Page"
        itemName={commentToDisplay ? getDisplayName(commentToDisplay) : undefined}
        message="Are you sure you want to change this comment's Home Page status to Display? It will be shown on the website Home Page."
        confirmText="Display"
        cancelText="Cancel"
      />

      {/* Universal Confirmation Modal: Change Home Page Status to Not Display */}
      <ConfirmationModal
        isOpen={Boolean(commentToNotDisplay)}
        onClose={() => setCommentToNotDisplay(null)}
        onConfirm={handleConfirmNotDisplay}
        variant="warning"
        title="Mark Comment as Not Display"
        itemName={commentToNotDisplay ? getDisplayName(commentToNotDisplay) : undefined}
        message="Are you sure you want to change this approved comment's Home Page status to Not Display? It will no longer be displayed on the website Home Page."
        confirmText="Not Display"
        cancelText="Cancel"
      />

      {/* Universal Confirmation Modal: Delete Comment */}
      <ConfirmationModal
        isOpen={Boolean(commentToDelete)}
        onClose={() => setCommentToDelete(null)}
        onConfirm={handleConfirmDelete}
        variant="danger"
        title="Delete Comment"
        itemName={commentToDelete ? getDisplayName(commentToDelete) : undefined}
        message="Are you sure you want to delete this comment? This record will be archived and removed from the Comments list."
        confirmText="Delete Comment"
        cancelText="Cancel"
      />
    </div>
  )
}
