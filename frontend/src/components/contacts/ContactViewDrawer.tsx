import React, { useState, useEffect } from 'react'
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
  FileText,
  DollarSign,
  FolderKanban,
  CheckSquare,
  Trash2,
  RotateCcw,
  Camera,
  Save,
  Users,
  Calendar,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import {
  type Contact,
  type ContactProject,
  type ContactCompany,
  type UpdateContactPayload,
  contactsApi,
} from '@/apis/contactsApi'
import type { CompanyLookupItem } from '@/apis/companiesApi'
import SlideDrawer from '@/components/common/SlideDrawer'
import StatusToggle from '@/components/common/StatusToggle'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import CompanySelect from '@/components/companies/CompanySelect'
import PhoneInput, { validatePhone, validateEmail } from '@/components/common/PhoneInput'
import { capitalizeWords } from '@/lib/utils'

interface ContactViewDrawerProps {
  contact: Contact | null
  isOpen: boolean
  onClose: () => void
  initialEditMode?: boolean
  onSave?: (updatedContact: Contact) => void
  onDelete: (contactId: number) => void
  onRestore: (contactId: number) => void
}

type TabType = 'overview' | 'activities' | 'projects' | 'deals' | 'notes' | 'files'

const COUNTRIES = [
  'Sri Lanka',
  'United States',
  'United Kingdom',
  'Australia',
  'Singapore',
  'United Arab Emirates',
  'Canada',
  'Germany',
  'India',
  'Other',
]

const STATES = [
  'Western Province',
  'Central Province',
  'Southern Province',
  'California',
  'New York',
  'Texas',
  'London',
  'Victoria',
  'Dubai',
  'Other',
]

export default function ContactViewDrawer({
  contact,
  isOpen,
  onClose,
  initialEditMode = false,
  onSave,
  onDelete,
  onRestore,
}: ContactViewDrawerProps) {
  const [localContact, setLocalContact] = useState<Contact | null>(contact)
  const [isEditing, setIsEditing] = useState(initialEditMode)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [projects, setProjects] = useState<ContactProject[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  // Edit form states
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [designation, setDesignation] = useState('')
  const [email, setEmail] = useState('')
  const [phoneCountryCode, setPhoneCountryCode] = useState('+94')
  const [phone, setPhone] = useState('')
  const [companyId, setCompanyId] = useState<number | undefined>(undefined)
  const [companyName, setCompanyName] = useState<string>('')
  const [address, setAddress] = useState('')
  const [state, setState] = useState('Western Province')
  const [country, setCountry] = useState('Sri Lanka')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active')
  const [notes, setNotes] = useState('')
  const [avatar, setAvatar] = useState('')

  const [validationError, setValidationError] = useState<string | null>(null)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)

  // Validation state for edit mode
  const [emailError, setEmailError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [touched, setTouched] = useState({ email: false, phone: false })

  const getContactFullName = (c: Contact | null): string => {
    if (!c) return ''
    const raw =
      c.full_name ||
      c.name ||
      `${c.first_name || ''} ${c.last_name || ''}`.trim() ||
      'Unnamed Contact'
    return capitalizeWords(raw)
  }

  const populateForm = (c: Contact) => {
    const fullName = getContactFullName(c)
    const nameParts = fullName.split(' ')
    setFirstName(c.first_name || nameParts[0] || '')
    setLastName(c.last_name || nameParts.slice(1).join(' ') || '')
    setDesignation(c.designation || '')
    setEmail(c.email || '')

    if (c.phone) {
      const phoneMatch = c.phone.match(/^(\+\d+)\s*(.*)$/)
      if (phoneMatch) {
        setPhoneCountryCode(phoneMatch[1])
        setPhone(phoneMatch[2])
      } else {
        setPhone(c.phone)
      }
    } else {
      setPhone('')
    }

    // Extract Company info
    const compId =
      c.company_id || (c.company && typeof c.company === 'object' ? c.company.id : undefined)
    const compName =
      c.company_name ||
      (typeof c.company === 'string' ? c.company : c.company?.company_name) ||
      ''

    setCompanyId(compId)
    setCompanyName(compName)
    setAddress(c.address || '')
    setState(c.state || 'Western Province')
    setCountry(c.country || 'Sri Lanka')
    setDateOfBirth(c.date_of_birth || c.birthday || '')
    setStatus(c.status === 'Inactive' ? 'Inactive' : 'Active')
    setNotes(c.notes || '')
    setAvatar(
      c.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    )
  }

  // Trigger GET /api/v1/contacts/{id} when drawer opens
  useEffect(() => {
    if (contact && isOpen) {
      setIsEditing(initialEditMode)
      setLocalContact(contact)
      populateForm(contact)
      fetchFullContactDetails(contact.id)
    } else if (!isOpen) {
      setIsEditing(false)
      setShowMoreMenu(false)
    }
  }, [contact?.id, isOpen, initialEditMode])

  const fetchFullContactDetails = async (contactId: number) => {
    setDetailsLoading(true)
    try {
      const res = await contactsApi.getContact(contactId)
      if (res && res.data) {
        setLocalContact(res.data)
        populateForm(res.data)
        if (res.data.projects && Array.isArray(res.data.projects)) {
          setProjects(res.data.projects)
        }
      }
    } catch (err) {
      console.error('Failed to fetch full contact details:', err)
    } finally {
      setDetailsLoading(false)
    }
  }

  // Load projects when switching to projects tab
  useEffect(() => {
    if (localContact && isOpen && activeTab === 'projects' && projects.length === 0) {
      fetchProjects()
    }
  }, [localContact, isOpen, activeTab])

  const fetchProjects = async () => {
    if (!localContact) return
    setProjectsLoading(true)
    try {
      const res = await contactsApi.getContactProjects(localContact.id)
      if (res.data && res.data.projects) {
        setProjects(res.data.projects)
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    } finally {
      setProjectsLoading(false)
    }
  }

  const handleStartEdit = () => {
    if (localContact) {
      populateForm(localContact)
    }
    setTouched({ email: false, phone: false })
    setEmailError(null)
    setPhoneError(null)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    if (localContact) {
      populateForm(localContact)
    }
    setValidationError(null)
    setTouched({ email: false, phone: false })
    setEmailError(null)
    setPhoneError(null)
    setIsEditing(false)
  }

  const handleCompanyChange = (id: number | undefined, comp: CompanyLookupItem | null) => {
    setCompanyId(id)
    setCompanyName(comp ? comp.company_name : '')
  }

  const handleSaveClick = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!localContact) return

    const eErr = validateEmail(email)
    const pErr = validatePhone(phone, phoneCountryCode)
    setEmailError(eErr)
    setPhoneError(pErr)
    setTouched({ email: true, phone: true })

    if (!firstName.trim() || !lastName.trim()) {
      setValidationError('Please fill in required fields: First Name and Last Name')
      return
    }
    if (eErr || pErr) {
      setValidationError(eErr ?? pErr)
      return
    }
    setValidationError(null)
    setShowSaveConfirm(true)
  }

  const handleExecuteSave = async () => {
    if (!localContact) return
    setSaveLoading(true)
    try {
      const formattedPhone = phone.trim()
        ? `${phoneCountryCode} ${phone.trim()}`.trim()
        : ''

      const payload: UpdateContactPayload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        designation: designation.trim(),
        email: email.trim(),
        phone: formattedPhone,
        phone_country_code: phoneCountryCode,
        company_id: companyId,
        company_name: companyName,
        company: companyName,
        date_of_birth: dateOfBirth,
        address: address.trim(),
        state,
        country,
        status,
        notes,
        avatar,
      }

      const res = await contactsApi.updateContact(localContact.id, payload)
      if (res.data) {
        setLocalContact(res.data)
        if (onSave) {
          onSave(res.data)
        }
      }
      setShowSaveConfirm(false)
      setIsEditing(false)
    } catch (err: any) {
      setValidationError(err?.response?.data?.message || err?.message || 'Failed to update contact')
      setShowSaveConfirm(false)
    } finally {
      setSaveLoading(false)
    }
  }

  if (!localContact) return null

  const contactFullName = getContactFullName(localContact)

  // Safe extraction of company details object
  const companyObj: ContactCompany | null =
    localContact.company && typeof localContact.company === 'object'
      ? (localContact.company as ContactCompany)
      : null

  const displayCompanyName =
    companyObj?.company_name ||
    localContact.company_name ||
    (typeof localContact.company === 'string' ? localContact.company : '') ||
    'Independent'

  return (
    <SlideDrawer
      isOpen={isOpen}
      onClose={onClose}
      width="620px"
      title=""
      subtitle=""
      className="contact-view-drawer"
      hideHeader
    >
      <div className="cvd-panel">

        {/* ── HERO HEADER ── */}
        <div className="cvd-hero">
          {/* Avatar */}
          <div className="cvd-avatar-wrap">
            <img
              className="cvd-avatar"
              src={
                isEditing
                  ? avatar
                  : localContact.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={contactFullName}
            />
            {isEditing && (
              <label className="cvd-avatar-camera" title="Change photo">
                <Camera size={12} />
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const reader = new FileReader()
                      reader.onload = (ev) => {
                        if (ev.target?.result) setAvatar(ev.target.result as string)
                      }
                      reader.readAsDataURL(e.target.files[0])
                    }
                  }}
                />
              </label>
            )}
          </div>

          {/* Name + Meta */}
          <div className="cvd-hero-info">
            {isEditing ? (
              <div className="cvd-name-edit-row">
                <input
                  type="text"
                  required
                  className="form-input form-input-sm"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{ maxWidth: 140 }}
                />
                <input
                  type="text"
                  required
                  className="form-input form-input-sm"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={{ maxWidth: 140 }}
                />
              </div>
            ) : (
              <div className="cvd-name-row">
                <h2 className="cvd-name">{contactFullName}</h2>
                {detailsLoading && <Loader2 size={13} className="animate-spin text-primary-500" />}
                <StatusToggle
                  status={localContact.status}
                  onChange={() => {}}
                  isEditing={false}
                  size="sm"
                />
              </div>
            )}
            <p className="cvd-subtitle">
              {isEditing
                ? designation
                  ? `${capitalizeWords(designation)}${companyName ? ` at ${capitalizeWords(companyName)}` : ''}`
                  : 'Designation / Role'
                : `${capitalizeWords(localContact.designation) || 'Specialist'}${displayCompanyName ? ` at ${capitalizeWords(displayCompanyName)}` : ''}`}
            </p>
          </div>

          {/* Close button top-right */}
          <button className="cvd-close-btn" onClick={onClose} title="Close">
            <span style={{ fontSize: 18, lineHeight: 1, color: '#94a3b8' }}>×</span>
          </button>
        </div>

        {/* ── ACTION BUTTONS ROW ── */}
        {!isEditing ? (
          <div className="cvd-actions-row">
            <button className="cvd-btn-primary" onClick={handleStartEdit}>
              <Edit2 size={13} />
              <span>Edit</span>
            </button>
            <button className="cvd-btn-outline">
              <Plus size={13} />
              <span>Create Lead</span>
            </button>
            <button className="cvd-btn-outline">
              <Plus size={13} />
              <span>Create Project</span>
            </button>
            <div style={{ position: 'relative', marginLeft: 'auto' }}>
              <button className="cvd-btn-outline" onClick={() => setShowMoreMenu(!showMoreMenu)}>
                <MoreHorizontal size={13} />
                <span>More</span>
              </button>
              {showMoreMenu && (
                <div
                  className="dropdown-menu animate-fade-in"
                  style={{ right: 0, top: '100%', marginTop: 4, zIndex: 50 }}
                >
                  {localContact.status === 'Archived' ? (
                    <button
                      className="dropdown-item text-success"
                      onClick={() => { setShowMoreMenu(false); onRestore(localContact.id) }}
                    >
                      <RotateCcw size={14} /> Restore Contact
                    </button>
                  ) : (
                    <button
                      className="dropdown-item text-danger"
                      onClick={() => { setShowMoreMenu(false); onDelete(localContact.id) }}
                    >
                      <Trash2 size={14} /> Delete Contact
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── EDIT MODE SAVE BAR ── */
          <div className="cvd-edit-bar">
            <div className="flex items-center gap-2">
              <span className="contact-edit-badge">Edit Mode</span>
              <span className="text-xs text-gray-500">Updating {contactFullName}</span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="btn btn-outline btn-sm" onClick={handleCancelEdit} disabled={saveLoading}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm flex items-center gap-1.5"
                onClick={handleSaveClick}
                disabled={saveLoading}
              >
                {saveLoading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        )}

        {/* Validation error */}
        {validationError && (
          <div className="cvd-validation-error">
            <AlertCircle size={13} />
            <span>{validationError}</span>
          </div>
        )}

        {/* ── TAB BAR ── */}
        <div className="cvd-tabs">
          <button
            className={`cvd-tab${activeTab === 'overview' ? ' cvd-tab-active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            {isEditing ? 'Edit Information' : 'Overview'}
          </button>
          {!isEditing && (
            <>
              <button
                className={`cvd-tab${activeTab === 'activities' ? ' cvd-tab-active' : ''}`}
                onClick={() => setActiveTab('activities')}
              >
                Activities
              </button>
              <button
                className={`cvd-tab${activeTab === 'projects' ? ' cvd-tab-active' : ''}`}
                onClick={() => setActiveTab('projects')}
              >
                Projects ({localContact.projects_count ?? projects.length})
              </button>
              <button
                className={`cvd-tab${activeTab === 'deals' ? ' cvd-tab-active' : ''}`}
                onClick={() => setActiveTab('deals')}
              >
                Deals ({localContact.deals_count ?? 0})
              </button>
              <button
                className={`cvd-tab${activeTab === 'notes' ? ' cvd-tab-active' : ''}`}
                onClick={() => setActiveTab('notes')}
              >
                Notes
              </button>
              <button
                className={`cvd-tab${activeTab === 'files' ? ' cvd-tab-active' : ''}`}
                onClick={() => setActiveTab('files')}
              >
                Files
              </button>
            </>
          )}
        </div>

        {/* ── TAB CONTENT ── */}
        <div className="cvd-body">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="cvd-tab-pane">

              {/* CONTACT INFORMATION CARD */}
              <div className="cvd-card">
                <div className="cvd-card-header">
                  <span className="cvd-card-title">Contact Information</span>
                  {!isEditing && (
                    <button type="button" className="cvd-section-edit-btn" onClick={handleStartEdit}>
                      <Edit2 size={12} />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {isEditing ? (
                  /* ── EDIT FORM ── */
                  <div className="space-y-3.5 pt-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="form-group">
                        <label className="form-label text-xs">Designation / Role</label>
                        <input
                          type="text"
                          className="form-input form-input-sm"
                          placeholder="e.g. Chief Operations Officer"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label text-xs">
                          Associated Company <span className="text-danger">*</span>
                        </label>
                        <CompanySelect
                          value={companyId}
                          companyName={companyName}
                          onChange={handleCompanyChange}
                          placeholder="Select active company..."
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="form-group">
                        <label className="form-label text-xs">
                          Email Address <span className="text-danger">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          className={`form-input form-input-sm ${touched.email && emailError ? 'input-error' : touched.email && !emailError ? 'input-valid' : ''}`}
                          placeholder="sarah.c@apexlogistics.com"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); if (touched.email) setEmailError(validateEmail(e.target.value)) }}
                          onBlur={() => { setTouched((t) => ({ ...t, email: true })); setEmailError(validateEmail(email)) }}
                          autoComplete="email"
                        />
                        {touched.email && emailError && (
                          <div className="field-error-msg">
                            <AlertCircle size={12} />
                            <span>{emailError}</span>
                          </div>
                        )}
                      </div>
                      <div className="form-group">
                        <label className="form-label text-xs">Phone Number</label>
                        <PhoneInput
                          dialCode={phoneCountryCode}
                          number={phone}
                          onDialCodeChange={(c) => { setPhoneCountryCode(c); if (touched.phone) setPhoneError(validatePhone(phone, c)) }}
                          onNumberChange={(n) => { setPhone(n); if (touched.phone) setPhoneError(validatePhone(n, phoneCountryCode)) }}
                          size="sm"
                          showError={touched.phone}
                          error={phoneError}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label text-xs">Street Address</label>
                      <input
                        type="text"
                        className="form-input form-input-sm"
                        placeholder="e.g. 45 Colombo Business Tower"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="form-group">
                        <label className="form-label text-xs">State / Province</label>
                        <select
                          className="form-select form-input-sm"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                        >
                          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label text-xs">Country</label>
                        <select
                          className="form-select form-input-sm"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                        >
                          {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label text-xs">Date of Birth</label>
                        <input
                          type="date"
                          className="form-input form-input-sm"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label text-xs">Status</label>
                      <div className="pt-1">
                        <StatusToggle status={status} onChange={setStatus} isEditing={true} size="md" />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label text-xs">Notes & Remarks</label>
                      <textarea
                        rows={3}
                        className="form-input form-input-sm resize-none"
                        placeholder="Add background notes or client context..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  /* ── READ-ONLY VIEW ── */
                  <div className="cvd-info-list">
                    <div className="cvd-info-row">
                      <div className="cvd-info-label"><Mail size={15} /><span>Email</span></div>
                      <div className="cvd-info-value">
                        <a href={`mailto:${localContact.email}`} className="link-primary">{localContact.email}</a>
                      </div>
                    </div>
                    <div className="cvd-info-row">
                      <div className="cvd-info-label"><Phone size={15} /><span>Phone</span></div>
                      <div className="cvd-info-value">
                        {localContact.phone || (localContact.primary_phone_number?.phone_number ?? '—')}
                      </div>
                    </div>
                    <div className="cvd-info-row">
                      <div className="cvd-info-label"><Building2 size={15} /><span>Company</span></div>
                      <div className="cvd-info-value">{capitalizeWords(displayCompanyName)}</div>
                    </div>
                    <div className="cvd-info-row">
                      <div className="cvd-info-label"><Briefcase size={15} /><span>Designation</span></div>
                      <div className="cvd-info-value">
                        {capitalizeWords(localContact.designation) || '—'}
                      </div>
                    </div>
                    {(companyObj?.website || localContact.website) && (
                      <div className="cvd-info-row">
                        <div className="cvd-info-label"><Globe size={15} /><span>Website</span></div>
                        <div className="cvd-info-value">
                          <a
                            href={companyObj?.website || localContact.website || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="link-primary inline-flex items-center gap-1"
                          >
                            {companyObj?.website || localContact.website}
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      </div>
                    )}
                    <div className="cvd-info-row">
                      <div className="cvd-info-label"><MapPin size={15} /><span>Address</span></div>
                      <div className="cvd-info-value">
                        {localContact.address ||
                          [localContact.state, localContact.country].filter(Boolean).join(', ') ||
                          '—'}
                      </div>
                    </div>
                    {(localContact.birthday || localContact.date_of_birth) && (
                      <div className="cvd-info-row">
                        <div className="cvd-info-label"><Calendar size={15} /><span>Birthday</span></div>
                        <div className="cvd-info-value">{localContact.birthday || localContact.date_of_birth}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* LINKED ITEMS CARD — view only */}
              {!isEditing && (
                <div className="cvd-card">
                  <div className="cvd-card-header">
                    <span className="cvd-card-title">Linked Items</span>
                  </div>
                  <div className="cvd-linked-grid">
                    <div className="cvd-linked-item">
                      <div className="cvd-linked-item-header">
                        <div className="cvd-linked-header-left">
                          <div className="cvd-linked-icon icon-blue"><FileText size={14} /></div>
                          <span className="cvd-linked-label">Related Leads</span>
                        </div>
                        <a href="#leads" className="cvd-linked-view">View All</a>
                      </div>
                      <div className="cvd-linked-count">{localContact.leads_count ?? 2}</div>
                    </div>
                    <div className="cvd-linked-item">
                      <div className="cvd-linked-item-header">
                        <div className="cvd-linked-header-left">
                          <div className="cvd-linked-icon icon-green"><FolderKanban size={14} /></div>
                          <span className="cvd-linked-label">Related Projects</span>
                        </div>
                        <button type="button" className="cvd-linked-view" onClick={() => setActiveTab('projects')}>View All</button>
                      </div>
                      <div className="cvd-linked-count">{localContact.projects_count ?? projects.length}</div>
                    </div>
                    <div className="cvd-linked-item">
                      <div className="cvd-linked-item-header">
                        <div className="cvd-linked-header-left">
                          <div className="cvd-linked-icon icon-purple"><DollarSign size={14} /></div>
                          <span className="cvd-linked-label">Related Deals</span>
                        </div>
                        <a href="#deals" className="cvd-linked-view">View All</a>
                      </div>
                      <div className="cvd-linked-count">{localContact.deals_count ?? 1}</div>
                    </div>
                    <div className="cvd-linked-item">
                      <div className="cvd-linked-item-header">
                        <div className="cvd-linked-header-left">
                          <div className="cvd-linked-icon icon-amber"><CheckSquare size={14} /></div>
                          <span className="cvd-linked-label">Related Tasks</span>
                        </div>
                        <a href="#tasks" className="cvd-linked-view">View All</a>
                      </div>
                      <div className="cvd-linked-count">{localContact.tasks_count ?? 3}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* LAST ACTIVITY — view only */}
              {!isEditing && (
                <div className="cvd-card">
                  <div className="cvd-card-header">
                    <span className="cvd-card-title">Last Activity</span>
                  </div>
                  <div className="cvd-last-activity-box">
                    <div className="cvd-last-activity-icon"><Users size={16} /></div>
                    <div className="cvd-last-activity-info">
                      <div className="cvd-last-activity-text">
                        {localContact.last_activity?.action || 'Last contacted'}{' '}
                        <strong>{localContact.last_activity?.timestamp || '2 days ago'}</strong>
                      </div>
                      <div className="cvd-last-activity-author">
                        By {localContact.last_activity?.by || 'John Doe'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PROJECTS TAB */}
          {activeTab === 'projects' && !isEditing && (
            <div className="cvd-tab-pane">
              <div className="cvd-card">
                <div className="cvd-card-header">
                  <div>
                    <span className="cvd-card-title">Project History & Portfolio</span>
                    <p className="text-xs text-muted mt-0.5">
                      Associated projects for {capitalizeWords(displayCompanyName)}
                    </p>
                  </div>
                  <button className="btn btn-primary btn-sm">
                    <Plus size={14} /> Add Project
                  </button>
                </div>
                {projectsLoading ? (
                  <div className="flex items-center justify-center py-8 gap-2 text-muted text-sm">
                    <Loader2 size={16} className="animate-spin text-primary-500" /> Loading...
                  </div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    No projects linked to this contact yet.
                  </div>
                ) : (
                  <div className="contact-projects-list space-y-3 pt-2">
                    {projects.map((proj) => (
                      <div key={proj.id} className="contact-project-card">
                        <div className="contact-project-header">
                          <div className="flex items-center gap-2">
                            <span className="contact-project-title">
                              {proj.project_title || proj.name || 'Enterprise Project'}
                            </span>
                            {proj.project_code && (
                              <span style={{ fontSize: 10.5, padding: '1px 5px', borderRadius: 4, background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                                {proj.project_code}
                              </span>
                            )}
                          </div>
                          <span className={`contact-status-pill ${proj.status === 'Completed' ? 'status-active' : proj.status === 'In Progress' ? 'status-warning' : 'status-neutral'}`}>
                            {proj.status}
                          </span>
                        </div>
                        <div className="contact-project-meta-row">
                          {proj.stage && <span><strong>Stage:</strong> {proj.stage}</span>}
                          <span><strong>Budget:</strong> {proj.budget ? (typeof proj.budget === 'number' ? `$${proj.budget.toLocaleString()}` : `$${proj.budget}`) : 'N/A'}</span>
                          {proj.quoted_amount && <span><strong>Quoted:</strong> ${proj.quoted_amount}</span>}
                          <span><strong>Timeline:</strong> {proj.start_date || '2026-04-01'} {proj.expected_end_date || proj.end_date ? `to ${proj.expected_end_date || proj.end_date}` : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ACTIVITIES TAB */}
          {activeTab === 'activities' && !isEditing && (
            <div className="cvd-tab-pane">
              <div className="cvd-card">
                <div className="cvd-card-header"><span className="cvd-card-title">Activity Log</span></div>
                <div className="contact-timeline">
                  <div className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <p className="timeline-title">Follow-up Call Scheduled</p>
                      <p className="timeline-meta">Scheduled by Account Manager • Today at 10:30 AM</p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <p className="timeline-title">Quotation for Q3 Services Sent</p>
                      <p className="timeline-meta">Sent via Communication Hub • 2 days ago</p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <p className="timeline-title">Contact Profile Synchronized</p>
                      <p className="timeline-meta">Updated via CRM API • Recently</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DEALS / NOTES / FILES TABS */}
          {(activeTab === 'deals' || activeTab === 'notes' || activeTab === 'files') && !isEditing && (
            <div className="cvd-tab-pane">
              <div className="cvd-card">
                <div className="cvd-card-header">
                  <span className="cvd-card-title capitalize">{activeTab} Details</span>
                </div>
                <p className="text-muted text-sm">
                  {activeTab === 'notes'
                    ? localContact.notes || 'No notes currently attached to this contact.'
                    : `Active records and linked attachments for ${contactFullName}.`}
                </p>
                {activeTab === 'files' && localContact.documents && localContact.documents.length > 0 && (
                  <div className="uploaded-docs-list mt-3">
                    {localContact.documents.map((doc) => (
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

        </div>{/* /cvd-body */}
      </div>{/* /cvd-panel */}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={handleExecuteSave}
        variant="primary"
        title="Save Contact Profile"
        itemName={contactFullName}
        message="Are you sure you want to save all changes and update this contact profile in the system?"
        confirmText="Save Changes"
        cancelText="Cancel"
      />
    </SlideDrawer>
  )
}
