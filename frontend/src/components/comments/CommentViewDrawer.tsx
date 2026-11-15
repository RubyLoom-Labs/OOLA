import React, { useState, useEffect, useRef } from 'react'
import {
  MoreHorizontal,
  Building2,
  User,
  FileText,
  MessageSquare,
  Calendar,
  Loader2,
  Copy,
  Check,
  Hash,
  CheckCircle,
  Eye,
  EyeOff,
  Trash2,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'
import {
  commentsApi,
  getCommentImageUrl,
  getCommentStatusLabel,
  getCommentDisplayStatusLabel,
  type CommentItem,
} from '@/apis/commentsApi'
import SlideDrawer from '@/components/common/SlideDrawer'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import { capitalizeWords, fileToBase64 } from '@/lib/utils'

interface CommentViewDrawerProps {
  comment: CommentItem | null
  isOpen: boolean
  onClose: () => void
  onApprove?: (comment: CommentItem) => void
  onMarkDisplay?: (comment: CommentItem) => void
  onMarkNotDisplay?: (comment: CommentItem) => void
  onDelete?: (comment: CommentItem) => void
  onImageUpdated?: (updatedComment: CommentItem) => void
}

type TabType = 'overview' | 'comment'

export default function CommentViewDrawer({
  comment,
  isOpen,
  onClose,
  onApprove,
  onMarkDisplay,
  onMarkNotDisplay,
  onDelete,
  onImageUpdated,
}: CommentViewDrawerProps) {
  const [localComment, setLocalComment] = useState<CommentItem | null>(comment)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [pendingImageBase64, setPendingImageBase64] = useState<string | null>(
    null
  )
  const [showSaveImageConfirm, setShowSaveImageConfirm] = useState(false)
  const [showRemoveImageConfirm, setShowRemoveImageConfirm] = useState(false)
  const [copiedComment, setCopiedComment] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (comment && isOpen) {
      setLocalComment(comment)
      setActiveTab('overview')
      setShowMoreMenu(false)
      setImageError(null)
      setPendingImageBase64(null)
      setShowSaveImageConfirm(false)
      setShowRemoveImageConfirm(false)
      fetchFullComment(comment.id)
    } else {
      setActiveTab('overview')
      setShowMoreMenu(false)
      setImageError(null)
      setPendingImageBase64(null)
      setShowSaveImageConfirm(false)
      setShowRemoveImageConfirm(false)
    }
  }, [comment?.id, comment?.status, comment?.display_status, isOpen])

  const fetchFullComment = async (id: number) => {
    try {
      setDetailsLoading(true)
      const res = await commentsApi.getComment(id)
      if (res.data) {
        setLocalComment(res.data)
      }
    } catch (err) {
      console.error('Failed to load comment details:', err)
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file || !localComment) return

    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image file must be under 5MB')
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
      return
    }

    try {
      setImageError(null)
      const base64 = await fileToBase64(file)
      setPendingImageBase64(base64)
      setShowSaveImageConfirm(true)
    } catch (err: any) {
      console.error('Failed to read comment image:', err)
      setImageError(err?.message || 'Failed to read selected image file')
    } finally {
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    }
  }

  const handleExecuteSaveImage = async () => {
    if (!localComment || !pendingImageBase64) return
    try {
      setImageUploading(true)
      setImageError(null)
      const res = await commentsApi.uploadCommentImage(
        localComment.id,
        pendingImageBase64
      )
      if (res.data) {
        setLocalComment(res.data)
        if (onImageUpdated) onImageUpdated(res.data)
      }
      setShowSaveImageConfirm(false)
      setPendingImageBase64(null)
    } catch (err: any) {
      console.error('Failed to upload comment image:', err)
      setImageError(err?.message || 'Failed to upload comment image')
      setShowSaveImageConfirm(false)
      setPendingImageBase64(null)
    } finally {
      setImageUploading(false)
    }
  }

  const handleRemoveImage = () => {
    if (!localComment) return
    setShowRemoveImageConfirm(true)
  }

  const handleExecuteRemoveImage = async () => {
    if (!localComment) return
    try {
      setImageUploading(true)
      setImageError(null)
      const res = await commentsApi.uploadCommentImage(localComment.id, null)
      if (res.data) {
        setLocalComment(res.data)
        if (onImageUpdated) onImageUpdated(res.data)
      }
      setShowRemoveImageConfirm(false)
      setPendingImageBase64(null)
    } catch (err: any) {
      console.error('Failed to remove comment image:', err)
      setImageError(err?.message || 'Failed to remove comment image')
      setShowRemoveImageConfirm(false)
    } finally {
      setImageUploading(false)
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    }
  }

  const handleCopyComment = async () => {
    if (!localComment?.comment) return
    try {
      await navigator.clipboard.writeText(localComment.comment)
      setCopiedComment(true)
      setTimeout(() => setCopiedComment(false), 2000)
    } catch {
      // Ignore clipboard failure
    }
  }

  if (!localComment) return null

  const displayName =
    capitalizeWords(localComment.name || '') || 'Website Visitor'
  const parts = displayName.trim().split(/\s+/)
  const initials =
    parts.length >= 2
      ? `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
      : displayName.slice(0, 2).toUpperCase()
  const commentCode = `CMT-${String(localComment.id).padStart(4, '0')}`
  const resolvedImageUrl = getCommentImageUrl(
    localComment.image,
    localComment.image_url
  )
  const previewImageUrl = pendingImageBase64 || resolvedImageUrl

  const statusLabel = getCommentStatusLabel(localComment.status)
  const displayStatusLabel = getCommentDisplayStatusLabel(
    localComment.display_status
  )
  const statusPillClass =
    Number(localComment.status) === 1 ? 'status-active' : 'status-inactive'
  const displayStatusPillClass =
    Number(localComment.display_status) === 1
      ? 'status-active'
      : 'status-neutral'

  return (
    <>
      <SlideDrawer
        isOpen={isOpen}
        onClose={onClose}
        width="640px"
        title=""
        subtitle=""
        className="contact-view-drawer"
        hideHeader
      >
        <div className="cvd-panel">
          {/* Hidden file input for Comment Image Upload */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageFileChange}
          />

          {/* ── HERO HEADER ── */}
          <div className="cvd-hero">
            <div className="cvd-avatar-wrap relative group">
              {previewImageUrl ? (
                <img
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0 bg-white shadow-sm"
                  src={previewImageUrl}
                  alt={displayName}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const fb = e.currentTarget.nextElementSibling as HTMLElement
                    if (fb) fb.style.display = 'flex'
                  }}
                />
              ) : null}
              <div
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white items-center justify-center font-bold text-lg shadow-sm border border-blue-400/30"
                style={{ display: previewImageUrl ? 'none' : 'flex' }}
              >
                {initials}
              </div>
            </div>

          <div className="cvd-hero-info">
            <div className="cvd-name-row flex items-center gap-2 flex-wrap">
              <h2 className="cvd-name font-bold text-lg text-slate-900">
                {displayName}
              </h2>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {commentCode}
              </span>
              {(detailsLoading || imageUploading) && (
                <Loader2 size={13} className="animate-spin text-primary-500" />
              )}
              <span className={`contact-status-pill ${statusPillClass}`}>
                {statusLabel}
              </span>
              <span
                className={`contact-status-pill ${displayStatusPillClass}`}
                title="Home Page Visibility"
              >
                {displayStatusLabel}
              </span>
            </div>

            <p className="cvd-subtitle text-xs text-muted mt-1 flex items-center gap-1.5 flex-wrap">
              {localComment.company && (
                <span className="font-medium text-slate-700">
                  {localComment.company}
                </span>
              )}
              {localComment.title && (
                <>
                  {localComment.company && <span>•</span>}
                  <span>{localComment.title}</span>
                </>
              )}
              {localComment.created_at && (
                <>
                  {(localComment.company || localComment.title) && (
                    <span>•</span>
                  )}
                  <span>
                    {new Date(localComment.created_at).toLocaleDateString(
                      'en-US',
                      {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }
                    )}
                  </span>
                </>
              )}
            </p>
          </div>

          <button className="cvd-close-btn" onClick={onClose} title="Close">
            <span style={{ fontSize: 18, lineHeight: 1, color: '#94a3b8' }}>
              ×
            </span>
          </button>
        </div>

        {/* ── QUICK ACTION BUTTONS ROW ── */}
        <div className="cvd-actions-row">
          {Number(localComment.status) === 0 && onApprove && (
            <button
              type="button"
              className="cvd-btn-primary inline-flex items-center gap-1.5"
              onClick={() => onApprove(localComment)}
            >
              <CheckCircle size={13} />
              <span>Approve Comment</span>
            </button>
          )}

          {Number(localComment.status) === 1 &&
            Number(localComment.display_status) === 0 &&
            onMarkDisplay && (
              <button
                type="button"
                className="cvd-btn-primary inline-flex items-center gap-1.5"
                onClick={() => onMarkDisplay(localComment)}
              >
                <Eye size={13} />
                <span>Display</span>
              </button>
            )}

          {Number(localComment.status) === 1 &&
            Number(localComment.display_status) === 1 &&
            onMarkNotDisplay && (
              <button
                type="button"
                className="cvd-btn-outline inline-flex items-center gap-1.5"
                onClick={() => onMarkNotDisplay(localComment)}
              >
                <EyeOff size={13} />
                <span>Not Display</span>
              </button>
            )}

          {onDelete && (
            <div style={{ position: 'relative', marginLeft: 'auto' }}>
              <button
                type="button"
                className="cvd-btn-outline"
                onClick={() => setShowMoreMenu(!showMoreMenu)}
              >
                <MoreHorizontal size={13} />
                <span>More</span>
              </button>
              {showMoreMenu && (
                <div
                  className="dropdown-menu animate-fade-in"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: 4,
                    zIndex: 50,
                  }}
                >
                  <button
                    type="button"
                    className="dropdown-item text-danger"
                    onClick={() => {
                      setShowMoreMenu(false)
                      onDelete(localComment)
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Delete Comment</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Image Error Banner */}
        {imageError && (
          <div className="cvd-validation-error">
            <AlertCircle size={13} />
            <span>{imageError}</span>
          </div>
        )}

        {/* ── TAB BAR ── */}
        <div className="cvd-tabs">
          <button
            className={`cvd-tab${
              activeTab === 'overview' ? ' cvd-tab-active' : ''
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`cvd-tab${
              activeTab === 'comment' ? ' cvd-tab-active' : ''
            }`}
            onClick={() => setActiveTab('comment')}
          >
            Full Comment
          </button>
        </div>

        {/* ── TAB CONTENT ── */}
        <div className="cvd-body">
          {activeTab === 'overview' && (
            <div className="cvd-tab-pane">
              {/* COMMENT DETAILS CARD */}
              <div className="cvd-card">
                <div className="cvd-card-header">
                  <span className="cvd-card-title">Comment Information</span>
                </div>

                <div className="space-y-3.5 pt-1">
                  {/* Comment Image Section (matches CompanyFormDrawer upload section) */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-4">
                    <div className="relative shrink-0">
                      {previewImageUrl ? (
                        <img
                          src={previewImageUrl}
                          alt={displayName}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-200 bg-white shadow-2xs"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const fallback = e.currentTarget
                              .nextElementSibling as HTMLElement
                            if (fallback) fallback.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div
                        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white items-center justify-center font-bold text-base shadow-2xs"
                        style={{ display: previewImageUrl ? 'none' : 'flex' }}
                      >
                        {initials || <User size={20} />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-800 mb-0.5">
                        Comment Image
                      </div>
                      <div className="text-[11px] text-muted mb-2">
                        Upload an image (PNG, JPG, SVG, WEBP up to 5MB)
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-outline btn-xs flex items-center gap-1"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={imageUploading}
                        >
                          {imageUploading ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Upload size={12} />
                          )}
                          {resolvedImageUrl ? 'Change Image' : 'Upload Image'}
                        </button>
                        {resolvedImageUrl && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center gap-1"
                            onClick={handleRemoveImage}
                            disabled={imageUploading}
                          >
                            <Trash2 size={12} />
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="cvd-info-list">
                  <div className="cvd-info-row">
                    <div className="cvd-info-label">
                      <Hash size={15} />
                      <span>Comment ID</span>
                    </div>
                    <div className="cvd-info-value">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {commentCode}
                      </span>
                    </div>
                  </div>

                  <div className="cvd-info-row">
                    <div className="cvd-info-label">
                      <User size={15} />
                      <span>Name</span>
                    </div>
                    <div className="cvd-info-value font-semibold text-slate-900">
                      {localComment.name || '—'}
                    </div>
                  </div>

                  <div className="cvd-info-row">
                    <div className="cvd-info-label">
                      <Building2 size={15} />
                      <span>Company</span>
                    </div>
                    <div className="cvd-info-value font-medium text-slate-800">
                      {localComment.company || '—'}
                    </div>
                  </div>

                  <div className="cvd-info-row cvd-info-row-top">
                    <div className="cvd-info-label">
                      <FileText size={15} />
                      <span>Title</span>
                    </div>
                    <div className="cvd-info-value font-medium text-slate-800 break-words">
                      {localComment.title || '—'}
                    </div>
                  </div>

                  <div className="cvd-info-row">
                    <div className="cvd-info-label">
                      <CheckCircle size={15} />
                      <span>Status</span>
                    </div>
                    <div className="cvd-info-value">
                      <span
                        className={`contact-status-pill ${statusPillClass}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  </div>

                  <div className="cvd-info-row">
                    <div className="cvd-info-label">
                      <Eye size={15} />
                      <span>Home Page</span>
                    </div>
                    <div className="cvd-info-value">
                      <span
                        className={`contact-status-pill ${displayStatusPillClass}`}
                      >
                        {displayStatusLabel}
                      </span>
                    </div>
                  </div>

                  <div className="cvd-info-row cvd-info-row-top">
                    <div className="cvd-info-label">
                      <ImageIcon size={15} />
                      <span>Image URL</span>
                    </div>
                    <div className="cvd-info-value break-all">
                      {resolvedImageUrl ? (
                        <a
                          href={resolvedImageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline break-all"
                        >
                          <span>{resolvedImageUrl}</span>
                          <ExternalLink size={12} className="shrink-0" />
                        </a>
                      ) : (
                        <span className="text-slate-400">No image uploaded</span>
                      )}
                    </div>
                  </div>

                  {localComment.created_at && (
                    <div className="cvd-info-row">
                      <div className="cvd-info-label">
                        <Calendar size={15} />
                        <span>Received On</span>
                      </div>
                      <div className="cvd-info-value text-slate-600">
                        {new Date(localComment.created_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              </div>

              {/* COMMENT CONTENT CARD */}
              <div className="cvd-card">
                <div className="cvd-card-header flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={15} className="text-blue-600" />
                    <span className="cvd-card-title">Comment</span>
                  </div>
                  {localComment.comment && (
                    <button
                      type="button"
                      onClick={handleCopyComment}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-blue-600 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                      title="Copy comment"
                    >
                      {copiedComment ? (
                        <>
                          <Check size={12} className="text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {localComment.title && (
                  <div className="mb-2.5 px-3.5 py-2 bg-blue-50/70 border border-blue-100 rounded-lg text-xs font-semibold text-slate-800">
                    Title: {localComment.title}
                  </div>
                )}

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-sm text-slate-700 leading-relaxed max-h-96 overflow-y-auto">
                  {localComment.comment ? (
                    <p className="whitespace-pre-wrap break-words">
                      {localComment.comment}
                    </p>
                  ) : (
                    <p className="text-muted italic">No comment provided.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comment' && (
            <div className="cvd-tab-pane">
              <div className="cvd-card">
                <div className="cvd-card-header flex items-center justify-between">
                  <div>
                    <span className="cvd-card-title">Full Comment</span>
                    {localComment.title && (
                      <p className="text-xs text-muted mt-0.5">
                        Title: {localComment.title}
                      </p>
                    )}
                  </div>
                  {localComment.comment && (
                    <button
                      type="button"
                      onClick={handleCopyComment}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-blue-600 px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                    >
                      {copiedComment ? (
                        <>
                          <Check size={12} className="text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy Comment</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-sm text-slate-800 leading-relaxed">
                  {localComment.comment ? (
                    <div className="whitespace-pre-wrap break-words">
                      {localComment.comment}
                    </div>
                  ) : (
                    <p className="text-muted italic">No comment provided.</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    From: {displayName}
                    {localComment.company ? ` (${localComment.company})` : ''}
                  </span>
                  {localComment.created_at && (
                    <span>
                      Received:{' '}
                      {new Date(localComment.created_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SlideDrawer>

      {/* Global Confirmation Modal before saving uploaded image */}
      <ConfirmationModal
        isOpen={showSaveImageConfirm}
        onClose={() => {
          if (!imageUploading) {
            setShowSaveImageConfirm(false)
            setPendingImageBase64(null)
          }
        }}
        onConfirm={handleExecuteSaveImage}
        variant="primary"
        title="Save Comment Image"
        itemName={displayName}
        message="Are you sure you want to upload and save this image for this comment?"
        confirmText="Save Changes"
        cancelText="Cancel"
        loading={imageUploading}
      />

      {/* Global Confirmation Modal before removing image */}
      <ConfirmationModal
        isOpen={showRemoveImageConfirm}
        onClose={() => {
          if (!imageUploading) {
            setShowRemoveImageConfirm(false)
          }
        }}
        onConfirm={handleExecuteRemoveImage}
        variant="danger"
        title="Remove Comment Image"
        itemName={displayName}
        message="Are you sure you want to remove the uploaded image from this comment?"
        confirmText="Remove Image"
        cancelText="Cancel"
        loading={imageUploading}
      />
    </>
  )
}
