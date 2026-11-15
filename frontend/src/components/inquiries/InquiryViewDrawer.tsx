import { useState, useEffect } from 'react'
import {
  MoreHorizontal,
  Mail,
  Phone,
  User,
  FileText,
  MessageSquare,
  Calendar,
  Loader2,
  Copy,
  Check,
  Hash,
  UserPlus,
  Trash2,
} from 'lucide-react'
import { inquiriesApi, type Inquiry } from '@/apis/inquiriesApi'
import SlideDrawer from '@/components/common/SlideDrawer'
import { capitalizeWords } from '@/lib/utils'

interface InquiryViewDrawerProps {
  inquiry: Inquiry | null
  isOpen: boolean
  onClose: () => void
  onConvertToLead?: (inquiry: Inquiry) => void
  onDelete?: (inquiry: Inquiry) => void
}

type TabType = 'overview' | 'message'

export default function InquiryViewDrawer({
  inquiry,
  isOpen,
  onClose,
  onConvertToLead,
  onDelete,
}: InquiryViewDrawerProps) {
  const [localInquiry, setLocalInquiry] = useState<Inquiry | null>(inquiry)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [copiedMessage, setCopiedMessage] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  useEffect(() => {
    if (inquiry && isOpen) {
      setLocalInquiry(inquiry)
      setActiveTab('overview')
      setShowMoreMenu(false)
      fetchFullInquiry(inquiry.id)
    } else {
      setActiveTab('overview')
      setShowMoreMenu(false)
    }
  }, [inquiry?.id, isOpen])

  const fetchFullInquiry = async (id: number) => {
    try {
      setDetailsLoading(true)
      const res = await inquiriesApi.getInquiry(id)
      if (res.data) {
        setLocalInquiry(res.data)
      }
    } catch (err) {
      console.error('Failed to load inquiry details:', err)
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleCopyMessage = async () => {
    if (!localInquiry?.message) return
    try {
      await navigator.clipboard.writeText(localInquiry.message)
      setCopiedMessage(true)
      setTimeout(() => setCopiedMessage(false), 2000)
    } catch {
      // Ignore clipboard failure
    }
  }

  if (!localInquiry) return null

  const firstName = localInquiry.first_name || localInquiry.firstname || ''
  const lastName = localInquiry.last_name || localInquiry.lastname || ''
  const fullName =
    capitalizeWords(`${firstName} ${lastName}`.trim()) || 'Website Visitor'
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() ||
    fullName.slice(0, 2).toUpperCase()
  const inquiryCode = `INQ-${String(localInquiry.id).padStart(4, '0')}`

  return (
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
        {/* ── HERO HEADER ── */}
        <div className="cvd-hero">
          <div className="cvd-avatar-wrap relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-sm border border-blue-400/30">
              {initials}
            </div>
          </div>

          <div className="cvd-hero-info">
            <div className="cvd-name-row flex items-center gap-2 flex-wrap">
              <h2 className="cvd-name font-bold text-lg text-slate-900">
                {fullName}
              </h2>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {inquiryCode}
              </span>
              {detailsLoading && (
                <Loader2 size={13} className="animate-spin text-primary-500" />
              )}
              <span className="contact-status-pill status-active">
                Active Inquiry
              </span>
            </div>

            <p className="cvd-subtitle text-xs text-muted mt-1 flex items-center gap-1.5 flex-wrap">
              {localInquiry.email && (
                <span className="font-medium text-slate-700">
                  {localInquiry.email}
                </span>
              )}
              {localInquiry.contact_number && (
                <>
                  <span>•</span>
                  <span>{localInquiry.contact_number}</span>
                </>
              )}
              {localInquiry.created_at && (
                <>
                  <span>•</span>
                  <span>
                    {new Date(localInquiry.created_at).toLocaleDateString(
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

        {/* ── QUICK ACTION BUTTONS ROW (NO EDIT / ADD) ── */}
        <div className="cvd-actions-row">
          {onConvertToLead && (
            <button
              type="button"
              className="cvd-btn-primary inline-flex items-center gap-1.5"
              onClick={() => onConvertToLead(localInquiry)}
            >
              <UserPlus size={13} />
              <span>Convert to Lead</span>
            </button>
          )}

          {localInquiry.email && (
            <a
              href={`mailto:${localInquiry.email}${
                localInquiry.subject
                  ? `?subject=${encodeURIComponent(`Re: ${localInquiry.subject}`)}`
                  : ''
              }`}
              className="cvd-btn-outline inline-flex items-center gap-1.5"
            >
              <Mail size={13} />
              <span>Email</span>
            </a>
          )}

          {localInquiry.contact_number && (
            <a
              href={`tel:${localInquiry.contact_number}`}
              className="cvd-btn-outline inline-flex items-center gap-1.5"
            >
              <Phone size={13} />
              <span>Call</span>
            </a>
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
                      onDelete(localInquiry)
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Delete Inquiry</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

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
              activeTab === 'message' ? ' cvd-tab-active' : ''
            }`}
            onClick={() => setActiveTab('message')}
          >
            Full Message
          </button>
        </div>

        {/* ── TAB CONTENT ── */}
        <div className="cvd-body">
          {activeTab === 'overview' && (
            <div className="cvd-tab-pane">
              {/* SENDER & INQUIRY DETAILS CARD */}
              <div className="cvd-card">
                <div className="cvd-card-header">
                  <span className="cvd-card-title">Inquiry Information</span>
                </div>

                <div className="cvd-info-list">
                  <div className="cvd-info-row">
                    <div className="cvd-info-label">
                      <Hash size={15} />
                      <span>Inquiry ID</span>
                    </div>
                    <div className="cvd-info-value">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {inquiryCode}
                      </span>
                    </div>
                  </div>

                  <div className="cvd-info-row">
                    <div className="cvd-info-label">
                      <User size={15} />
                      <span>First Name</span>
                    </div>
                    <div className="cvd-info-value font-semibold text-slate-900">
                      {firstName || '—'}
                    </div>
                  </div>

                  <div className="cvd-info-row">
                    <div className="cvd-info-label">
                      <User size={15} />
                      <span>Last Name</span>
                    </div>
                    <div className="cvd-info-value font-semibold text-slate-900">
                      {lastName || '—'}
                    </div>
                  </div>

                  <div className="cvd-info-row">
                    <div className="cvd-info-label">
                      <Mail size={15} />
                      <span>Email Address</span>
                    </div>
                    <div className="cvd-info-value">
                      {localInquiry.email ? (
                        <a
                          href={`mailto:${localInquiry.email}`}
                          className="link-primary font-medium text-blue-600 hover:underline break-all"
                        >
                          {localInquiry.email}
                        </a>
                      ) : (
                        '—'
                      )}
                    </div>
                  </div>

                  <div className="cvd-info-row">
                    <div className="cvd-info-label">
                      <Phone size={15} />
                      <span>Contact Number</span>
                    </div>
                    <div className="cvd-info-value">
                      {localInquiry.contact_number ? (
                        <a
                          href={`tel:${localInquiry.contact_number}`}
                          className="link-primary font-medium text-blue-600 hover:underline"
                        >
                          {localInquiry.contact_number}
                        </a>
                      ) : (
                        '—'
                      )}
                    </div>
                  </div>

                  <div className="cvd-info-row cvd-info-row-top">
                    <div className="cvd-info-label">
                      <FileText size={15} />
                      <span>Subject</span>
                    </div>
                    <div className="cvd-info-value font-medium text-slate-800 break-words">
                      {localInquiry.subject || '—'}
                    </div>
                  </div>

                  {localInquiry.created_at && (
                    <div className="cvd-info-row">
                      <div className="cvd-info-label">
                        <Calendar size={15} />
                        <span>Received On</span>
                      </div>
                      <div className="cvd-info-value text-slate-600">
                        {new Date(localInquiry.created_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* MESSAGE CONTENT CARD */}
              <div className="cvd-card">
                <div className="cvd-card-header flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={15} className="text-blue-600" />
                    <span className="cvd-card-title">Inquiry Message</span>
                  </div>
                  {localInquiry.message && (
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-blue-600 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                      title="Copy message"
                    >
                      {copiedMessage ? (
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

                {localInquiry.subject && (
                  <div className="mb-2.5 px-3.5 py-2 bg-blue-50/70 border border-blue-100 rounded-lg text-xs font-semibold text-slate-800">
                    Subject: {localInquiry.subject}
                  </div>
                )}

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-sm text-slate-700 leading-relaxed max-h-96 overflow-y-auto">
                  {localInquiry.message ? (
                    <p className="whitespace-pre-wrap break-words">
                      {localInquiry.message}
                    </p>
                  ) : (
                    <p className="text-muted italic">
                      No message body provided with this inquiry.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'message' && (
            <div className="cvd-tab-pane">
              <div className="cvd-card">
                <div className="cvd-card-header flex items-center justify-between">
                  <div>
                    <span className="cvd-card-title">Full Inquiry Message</span>
                    {localInquiry.subject && (
                      <p className="text-xs text-muted mt-0.5">
                        Subject: {localInquiry.subject}
                      </p>
                    )}
                  </div>
                  {localInquiry.message && (
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-blue-600 px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                    >
                      {copiedMessage ? (
                        <>
                          <Check size={12} className="text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy Message</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-sm text-slate-800 leading-relaxed">
                  {localInquiry.message ? (
                    <div className="whitespace-pre-wrap break-words">
                      {localInquiry.message}
                    </div>
                  ) : (
                    <p className="text-muted italic">
                      No message body provided with this inquiry.
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    From: {fullName} ({localInquiry.email})
                  </span>
                  {localInquiry.created_at && (
                    <span>
                      Received:{' '}
                      {new Date(localInquiry.created_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SlideDrawer>
  )
}
