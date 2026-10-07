import React, { useState, useEffect } from 'react'
import {
  Edit2,
  Plus,
  MoreHorizontal,
  Mail,
  Phone,
  MessageCircle,
  Star,
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
  type ContactPhoneNumber,
  type ContactSite,
  type UpdateContactPayload,
  contactsApi,
} from '@/apis/contactsApi'
import type { CompanyLookupItem } from '@/apis/companiesApi'
import SlideDrawer from '@/components/common/SlideDrawer'
import StatusToggle from '@/components/common/StatusToggle'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import CompanySelect from '@/components/companies/CompanySelect'
import PhoneInput, { validateEmail } from '@/components/common/PhoneInput'
import { capitalizeWords } from '@/lib/utils'

interface ContactViewDrawerProps {
  contact: Contact | null
  isOpen: boolean
  onClose: () => void
  initialEditMode?: boolean
  onSave?: (updatedContact: Contact) => void
  onDelete: (contactId: number) => void
  onRestore?: (contactId: number) => void
}

type TabType = 'overview' | 'activities' | 'projects' | 'deals' | 'notes' | 'files'

export interface PhoneNumberInputState {
  id?: number
  country_code: string
  number: string
  type: string
  is_primary: boolean
  is_whatsapp: boolean
  notes?: string
}

export interface SiteInputState {
  id?: number
  name: string
  url: string
  status?: boolean
}

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

  // Multi Phone Numbers State
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberInputState[]>([
    { country_code: '+94', number: '', type: 'Mobile', is_primary: true, is_whatsapp: false, notes: '' }
  ])

  // Multi Websites & Social State
  const [sites, setSites] = useState<SiteInputState[]>([
    { name: 'Website', url: '', status: true }
  ])

  const [companyId, setCompanyId] = useState<number | undefined>(undefined)
  const [companyName, setCompanyName] = useState<string>('')
  const [address, setAddress] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active')
  const [notes, setNotes] = useState('')
  const [avatar, setAvatar] = useState('')

  const [validationError, setValidationError] = useState<string | null>(null)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)

  // Validation state for edit mode
  const [emailError, setEmailError] = useState<string | null>(null)
  const [touched, setTouched] = useState({ email: false })

  const handleAddSite = () => {
    setSites((prev) => [...prev, { name: 'LinkedIn', url: '', status: true }])
  }

  const handleRemoveSite = (index: number) => {
    setSites((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const handleSiteNameChange = (index: number, name: string) => {
    setSites((prev) => prev.map((item, i) => (i === index ? { ...item, name } : item)))
  }

  const handleSiteUrlChange = (index: number, url: string) => {
    setSites((prev) => prev.map((item, i) => (i === index ? { ...item, url } : item)))
  }

  const handleAddPhoneNumber = () => {
    setPhoneNumbers((prev) => [
      ...prev,
      { country_code: '+94', number: '', type: 'Work', is_primary: prev.length === 0, is_whatsapp: false, notes: '' }
    ])
  }

  const handleRemovePhoneNumber = (index: number) => {
    setPhoneNumbers((prev) => {
      if (prev.length <= 1) return prev
      const updated = prev.filter((_, i) => i !== index)
      // If we removed the primary number, make the first one primary
      if (!updated.some((p) => p.is_primary) && updated.length > 0) {
        updated[0].is_primary = true
      }
      return updated
    })
  }

  const handleSetPrimaryPhone = (index: number) => {
    setPhoneNumbers((prev) =>
      prev.map((item, i) => ({
        ...item,
        is_primary: i === index,
      }))
    )
  }

  const handlePhoneCountryCodeChange = (index: number, code: string) => {
    setPhoneNumbers((prev) =>
      prev.map((item, i) => (i === index ? { ...item, country_code: code } : item))
    )
  }

  const handlePhoneNumberChange = (index: number, num: string) => {
    setPhoneNumbers((prev) =>
      prev.map((item, i) => (i === index ? { ...item, number: num } : item))
    )
  }

  const handlePhoneTypeChange = (index: number, type: string) => {
    setPhoneNumbers((prev) =>
      prev.map((item, i) => (i === index ? { ...item, type } : item))
    )
  }

  const handlePhoneWhatsAppChange = (index: number, is_whatsapp: boolean) => {
    setPhoneNumbers((prev) =>
      prev.map((item, i) => (i === index ? { ...item, is_whatsapp } : item))
    )
  }

  const handlePhoneNotesChange = (index: number, noteVal: string) => {
    setPhoneNumbers((prev) =>
      prev.map((item, i) => (i === index ? { ...item, notes: noteVal } : item))
    )
  }

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

    // Parse Phone Numbers
    let parsedPhones: PhoneNumberInputState[] = []
    if (c.phone_numbers && c.phone_numbers.length > 0) {
      const hasExplicitPrimary = c.phone_numbers.some((p) => p.is_primary)
      parsedPhones = c.phone_numbers.map((p, idx) => {
        let cCode = p.country_code || '+94'
        let num = p.number || p.phone_number || ''
        num = num.replace(/^(\+\d+)\s*/, '')
        return {
          id: p.id,
          country_code: cCode,
          number: num,
          type: p.type || 'Mobile',
          is_primary: Boolean(p.is_primary ?? (!hasExplicitPrimary && idx === 0)),
          is_whatsapp: Boolean(p.is_whatsapp),
          notes: p.notes || '',
        }
      })
    } else if (c.phone) {
      const match = c.phone.match(/^(\+\d+)\s*(.*)$/)
      parsedPhones = [
        {
          country_code: match ? match[1] : '+94',
          number: match ? match[2] : c.phone,
          type: 'Mobile',
          is_primary: true,
          is_whatsapp: false,
          notes: '',
        }
      ]
    }

    if (parsedPhones.length === 0) {
      parsedPhones = [{ country_code: '+94', number: '', type: 'Mobile', is_primary: true, is_whatsapp: false, notes: '' }]
    }

    setPhoneNumbers(parsedPhones)

    // Parse Sites / Websites & Social links
    let parsedSites: SiteInputState[] = []
    if (c.sites && Array.isArray(c.sites) && c.sites.length > 0) {
      parsedSites = c.sites.map((s) => ({
        id: s.id,
        name: s.name || 'Website',
        url: s.url || '',
        status: s.status !== false,
      }))
    } else if (c.company_web || c.website) {
      parsedSites = [{ name: 'Website', url: c.company_web || c.website || '', status: true }]
    }
    if (parsedSites.length === 0) {
      parsedSites = [{ name: 'Website', url: '', status: true }]
    }
    setSites(parsedSites)

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
    setTouched({ email: false })
    setEmailError(null)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    if (localContact) {
      populateForm(localContact)
    }
    setValidationError(null)
    setTouched({ email: false })
    setEmailError(null)
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
    setEmailError(eErr)
    setTouched((t) => ({ ...t, email: true }))

    if (!firstName.trim() || !lastName.trim()) {
      setValidationError('Please fill in required fields: First Name and Last Name')
      return
    }
    if (eErr) {
      setValidationError(eErr)
      return
    }
    setValidationError(null)
    setShowSaveConfirm(true)
  }

  const handleExecuteSave = async () => {
    if (!localContact) return
    setSaveLoading(true)
    try {
      const validPhones = phoneNumbers.filter((p) => p.number.trim() !== '')
      const hasExplicitPrimary = validPhones.some((p) => p.is_primary)
      const formattedPhoneNumbers: ContactPhoneNumber[] = validPhones.map((p, idx) => ({
        id: p.id,
        company_id: companyId,
        customer_id: localContact.customer_id || 1,
        country_code: p.country_code,
        phone_number: p.number.replace(/\s+/g, ''),
        type: p.type || 'Mobile',
        is_primary: Boolean(p.is_primary ?? (!hasExplicitPrimary && idx === 0)),
        is_whatsapp: Boolean(p.is_whatsapp),
        notes: p.notes || undefined,
      }))

      const primaryPhoneObj = formattedPhoneNumbers.find((p) => p.is_primary) || formattedPhoneNumbers[0]
      const primaryPhoneStr = primaryPhoneObj
        ? `${primaryPhoneObj.country_code} ${primaryPhoneObj.phone_number}`
        : ''

      const validSites = sites.filter((s) => s.url.trim() !== '')
      const formattedSites: ContactSite[] = validSites.map((s) => ({
        ...(s.id ? { id: s.id } : {}),
        name: s.name || 'Website',
        url: s.url.trim().startsWith('http') ? s.url.trim() : `https://${s.url.trim()}`,
        status: true,
      }))

      const payload: UpdateContactPayload = {
        company_id: companyId,
        customer_id: localContact.customer_id || 1,
        company: companyName,
        company_name: companyName,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        designation: designation.trim(),
        email: email.trim(),
        address: address.trim(),
        birthday: dateOfBirth || undefined,
        date_of_birth: dateOfBirth || undefined,
        status: status === 'Active',
        phone: primaryPhoneStr,
        phone_country_code: primaryPhoneObj?.country_code || '+94',
        phone_numbers: formattedPhoneNumbers,
        sites: formattedSites,
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
                  style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 50 }}
                >
                  {localContact.status === 'Archived' ? (
                    <button
                      className="dropdown-item text-success"
                      onClick={() => { setShowMoreMenu(false); if (onRestore) onRestore(localContact.id) }}
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

                    {/* ── MULTIPLE PHONE NUMBERS ── */}
                    <div className="form-group space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="form-label text-xs font-semibold text-gray-700 m-0">
                          Phone Numbers
                        </label>
                        <button
                          type="button"
                          onClick={handleAddPhoneNumber}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <Plus size={13} />
                          <span>Add Phone Number</span>
                        </button>
                      </div>

                      <div className="space-y-2.5 pt-1">
                        {phoneNumbers.map((pItem, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border space-y-2.5 relative transition-all ${
                              pItem.is_primary
                                ? 'bg-blue-50/40 border-blue-200 shadow-2xs'
                                : 'bg-slate-50/80 border-slate-200/90'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {/* Type Dropdown */}
                              <select
                                className="form-select form-input-sm shrink-0 text-xs font-medium rounded-md border-slate-300"
                                style={{ width: '105px', minWidth: '105px', flexShrink: 0 }}
                                value={pItem.type || 'Mobile'}
                                onChange={(e) => handlePhoneTypeChange(idx, e.target.value)}
                              >
                                <option value="Mobile">Mobile</option>
                                <option value="Work">Work</option>
                                <option value="Personal">Personal</option>
                                <option value="Other">Other</option>
                              </select>

                              {/* Phone Input */}
                              <div className="flex-1 min-w-0">
                                <PhoneInput
                                  dialCode={pItem.country_code}
                                  number={pItem.number}
                                  onDialCodeChange={(code) => handlePhoneCountryCodeChange(idx, code)}
                                  onNumberChange={(num) => handlePhoneNumberChange(idx, num)}
                                  size="sm"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200/60 text-xs flex-wrap">
                              <div className="flex items-center gap-2">
                                {/* Primary Radio Pill */}
                                <label className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-all select-none ${
                                  pItem.is_primary
                                    ? 'bg-blue-100/80 text-blue-700 border border-blue-300 font-semibold'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                }`}>
                                  <input
                                    type="radio"
                                    name="primary_phone_select_drawer"
                                    checked={pItem.is_primary}
                                    onChange={() => handleSetPrimaryPhone(idx)}
                                    className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                                  />
                                  <Star size={13} className={pItem.is_primary ? 'text-blue-600 fill-blue-600' : 'text-slate-400'} />
                                  <span>Primary</span>
                                </label>

                                {/* WhatsApp Checkbox Pill */}
                                <label className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-all select-none ${
                                  pItem.is_whatsapp
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300/80 shadow-2xs font-semibold'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                }`}>
                                  <input
                                    type="checkbox"
                                    checked={pItem.is_whatsapp}
                                    onChange={(e) => handlePhoneWhatsAppChange(idx, e.target.checked)}
                                    className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                                  />
                                  <MessageCircle size={13} className={pItem.is_whatsapp ? 'text-emerald-600 fill-emerald-600/20' : 'text-slate-400'} />
                                  <span>WhatsApp</span>
                                </label>
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Notes input */}
                                <input
                                  type="text"
                                  className="form-input form-input-sm text-xs py-0.5 px-2 w-36 sm:w-44 bg-white border-slate-200"
                                  placeholder="Note (e.g. Executive Hotline)"
                                  value={pItem.notes || ''}
                                  onChange={(e) => handlePhoneNotesChange(idx, e.target.value)}
                                />

                                {/* Delete Row button */}
                                {phoneNumbers.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePhoneNumber(idx)}
                                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded transition-colors"
                                    title="Remove phone number"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ── WEBSITES & SOCIAL MEDIA ── */}
                    <div className="form-group space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="form-label text-xs font-semibold text-gray-700 m-0">
                          Websites & Social Media
                        </label>
                        <button
                          type="button"
                          onClick={handleAddSite}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <Plus size={13} />
                          <span>Add Link</span>
                        </button>
                      </div>

                      <div className="space-y-2 pt-0.5">
                        {sites.map((sItem, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-xl border border-slate-200/90 bg-slate-50/80 flex items-center gap-2"
                          >
                            {/* Type Dropdown (mapped to name property) */}
                            <select
                              className="form-select form-input-sm shrink-0 text-xs font-medium rounded-md border-slate-300"
                              style={{ width: '115px', minWidth: '115px', flexShrink: 0 }}
                              value={sItem.name || 'Website'}
                              onChange={(e) => handleSiteNameChange(idx, e.target.value)}
                            >
                              <option value="Website">Website</option>
                              <option value="Facebook">Facebook</option>
                              <option value="Instagram">Instagram</option>
                              <option value="LinkedIn">LinkedIn</option>
                              <option value="Twitter / X">Twitter / X</option>
                              <option value="YouTube">YouTube</option>
                              <option value="Other">Other</option>
                            </select>

                            {/* URL Input */}
                            <input
                              type="url"
                              className="form-input form-input-sm flex-1 min-w-0 text-xs bg-white"
                              placeholder="https://facebook.com/user or URL..."
                              value={sItem.url}
                              onChange={(e) => handleSiteUrlChange(idx, e.target.value)}
                            />

                            {/* Delete Row button */}
                            {sites.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSite(idx)}
                                className="inline-flex items-center justify-center p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors shrink-0"
                                title="Remove link"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label text-xs">Address</label>
                      <input
                        type="text"
                        className="form-input form-input-sm"
                        placeholder="e.g. 45 Colombo Business Tower"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
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
                    <div className="cvd-info-row cvd-info-row-top">
                      <div className="cvd-info-label"><Phone size={15} /><span>Phone Numbers</span></div>
                      <div className="cvd-info-value space-y-2">
                        {((localContact.phone_numbers && localContact.phone_numbers.length > 0)
                          ? localContact.phone_numbers
                          : localContact.phone
                          ? [{ phone_number: localContact.phone, type: 'Mobile', is_primary: true, is_whatsapp: false }]
                          : []
                        ).map((p, idx) => {
                          const fullNum = p.phone_number ? (p.country_code ? `${p.country_code} ${p.phone_number}` : p.phone_number) : `${p.country_code || ''} ${p.number || ''}`.trim()
                          const rawDigits = fullNum.replace(/[^0-9]/g, '')
                          return (
                            <div key={idx} className="space-y-0.5 pb-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <a
                                  href={`tel:${fullNum}`}
                                  className="link-primary font-semibold text-[13.5px] text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                  {fullNum || '—'}
                                </a>

                                {/* Primary Badge */}
                                {p.is_primary && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                    <Star size={10} className="text-blue-600 fill-blue-600" />
                                    <span>Primary</span>
                                  </span>
                                )}

                                {/* Type Badge */}
                                {p.type && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                    {p.type}
                                  </span>
                                )}

                                {/* WhatsApp Badge */}
                                {p.is_whatsapp && (
                                  <a
                                    href={`https://wa.me/${rawDigits}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Open WhatsApp Chat"
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                                  >
                                    <MessageCircle size={12} className="text-emerald-600 fill-emerald-600/20" />
                                    <span>WhatsApp</span>
                                  </a>
                                )}
                              </div>

                              {/* Notes */}
                              {p.notes && (
                                <div className="text-xs text-slate-400 italic font-normal pl-0.5">
                                  ({p.notes})
                                </div>
                              )}
                            </div>
                          )
                        })}
                        {!(localContact.phone_numbers && localContact.phone_numbers.length > 0) && !localContact.phone && (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </div>
                    <div className="cvd-info-row cvd-info-row-top">
                      <div className="cvd-info-label"><Globe size={15} /><span>Websites & Links</span></div>
                      <div className="cvd-info-value space-y-1.5">
                        {((sites && sites.length > 0 && sites.some((s) => s.url))
                          ? sites.filter((s) => s.url.trim() !== '')
                          : localContact.sites && localContact.sites.length > 0
                          ? localContact.sites.filter((s) => s.url)
                          : (localContact.website || localContact.company_web)
                          ? [{ name: 'Website', url: localContact.website || localContact.company_web }]
                          : []
                        ).map((st, idx) => {
                          if (!st.url) return null
                          const formattedUrl = st.url.startsWith('http') ? st.url : `https://${st.url}`
                          return (
                            <div key={idx} className="flex items-center gap-2 flex-wrap">
                              <a
                                href={formattedUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="link-primary inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                              >
                                <span>{st.name || 'Website'}</span>
                                <ExternalLink size={11} className="text-blue-500" />
                              </a>
                              <span className="text-xs text-slate-400 truncate max-w-[240px]">
                                ({st.url.replace(/^https?:\/\/(www\.)?/, '')})
                              </span>
                            </div>
                          )
                        })}
                        {!(localContact.sites && localContact.sites.length > 0) && !localContact.website && !localContact.company_web && !sites.some((s) => s.url) && (
                          <span className="text-gray-400">—</span>
                        )}
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
                        {localContact.address || localContact.country || '—'}
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
