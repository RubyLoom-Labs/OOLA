import React, { useState, useEffect } from 'react'
import {
  Edit2,
  MoreHorizontal,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Globe,
  MapPin,
  FolderKanban,
  FileText,
  Trash2,
  Save,
  Users,
  ExternalLink,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Layers,
  UserCheck,
  Camera,
  Upload,
} from 'lucide-react'
import type {
  Company,
  CompanyTypeItem,
  CompanySizeItem,
  UpdateCompanyPayload,
  CompanyContact,
} from '@/apis/companiesApi'
import { companiesApi } from '@/apis/companiesApi'
import SlideDrawer from '@/components/common/SlideDrawer'
import StatusToggle from '@/components/common/StatusToggle'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import { capitalizeWords, getCompanyLogoUrl, fileToBase64 } from '@/lib/utils'

// Permissive company email validation without requiring .com
export function validateCompanyEmail(email: string): string | null {
  if (!email || !email.trim()) return null
  const emailRegex = /^[^\s@]+@[^\s@]+$/
  if (!emailRegex.test(email.trim())) return 'Please enter a valid email address'
  return null
}

interface CompanyViewDrawerProps {
  company: Company | null
  isOpen: boolean
  onClose: () => void
  initialEditMode?: boolean
  onSave?: (updatedCompany: Company) => void
  onDelete: (companyId: number) => void
  onRestore?: (companyId: number) => void
}

type TabType = 'overview' | 'contacts' | 'projects' | 'leads' | 'notes'

export default function CompanyViewDrawer({
  company,
  isOpen,
  onClose,
  initialEditMode = false,
  onSave,
  onDelete,
}: CompanyViewDrawerProps) {
  const [localCompany, setLocalCompany] = useState<Company | null>(company)
  const [isEditing, setIsEditing] = useState(initialEditMode)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Logo upload and edit states
  const [logoBase64, setLogoBase64] = useState<string | null | undefined>(undefined)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const logoInputRef = React.useRef<HTMLInputElement>(null)

  // Company Types and Sizes loaded dynamically from Backend API
  const [companyTypes, setCompanyTypes] = useState<CompanyTypeItem[]>([])
  const [companySizes, setCompanySizes] = useState<CompanySizeItem[]>([])

  // Form edit states
  const [companyName, setCompanyName] = useState('')
  const [companyTypeId, setCompanyTypeId] = useState<number | undefined>(undefined)
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [industry, setIndustry] = useState('')
  const [companySizeId, setCompanySizeId] = useState<number | ''>('')
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active')
  const [website, setWebsite] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerBirthday, setOwnerBirthday] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('Sri Lanka')
  const [companyDescription, setCompanyDescription] = useState('')

  // Validation flags
  const [emailError, setEmailError] = useState<string | null>(null)
  const [touched, setTouched] = useState({ email: false })

  // Fetch dynamic types and sizes when opened
  useEffect(() => {
    if (!isOpen) return
    const fetchMetadata = async () => {
      try {
        const [typesRes, sizesRes] = await Promise.allSettled([
          companiesApi.getCompanyTypes(),
          companiesApi.getCompanySizes(),
        ])
        if (typesRes.status === 'fulfilled') {
          const rawTypes = (typesRes.value as any)?.data?.data || typesRes.value?.data
          if (Array.isArray(rawTypes) && rawTypes.length > 0) {
            setCompanyTypes(rawTypes)
          }
        }
        if (sizesRes.status === 'fulfilled') {
          const rawSizes = (sizesRes.value as any)?.data?.data || sizesRes.value?.data
          if (Array.isArray(rawSizes) && rawSizes.length > 0) {
            setCompanySizes(rawSizes)
          }
        }
      } catch (err) {
        console.error('Failed to load company metadata:', err)
      }
    }
    fetchMetadata()
  }, [isOpen])

  // Populate local form fields from Company object
  const populateForm = (c: Company) => {
    setCompanyName(c.company_name || '')
    const cTypeId =
      c.company_type_id ||
      (typeof c.company_type === 'object' ? c.company_type?.id : 1) ||
      1
    setCompanyTypeId(Number(cTypeId))
    setEmail(c.email || '')
    setPhoneNumber(c.phone_number || c.phone || '')
    setIndustry(c.industry || '')
    const cSizeId =
      c.company_size_id ||
      (typeof c.company_size === 'object' ? c.company_size?.id : '') ||
      ''
    setCompanySizeId(cSizeId ? Number(cSizeId) : '')
    const isActive =
      c.status === 'Active' ||
      c.status === true ||
      String(c.status) === '1' ||
      c.status_bool === true
    setStatus(isActive ? 'Active' : 'Inactive')
    setWebsite(c.website || '')
    setOwnerName(c.owner_name || '')
    setOwnerBirthday(c.owner_birthday || '')
    setAddressLine1(c.address_line_1 || '')
    setAddressLine2(c.address_line_2 || '')
    setCity(c.city || '')
    setState(c.state || '')
    setPostalCode(c.postal_code || '')
    setCountry(c.country || 'Sri Lanka')
    setCompanyDescription(c.company_description || '')

    const initialLogo = getCompanyLogoUrl(c.logo, c.logo_url)
    setLogoPreview(initialLogo || null)
    setLogoBase64(undefined)

    setEmailError(null)
    setValidationError(null)
    setTouched({ email: false })
  }

  // Update on prop changes
  useEffect(() => {
    if (company && isOpen) {
      setIsEditing(initialEditMode)
      setLocalCompany(company)
      populateForm(company)
      fetchFullCompany(company.id)
    } else {
      setIsEditing(false)
      setActiveTab('overview')
    }
  }, [company?.id, isOpen, initialEditMode])

  const fetchFullCompany = async (id: number) => {
    try {
      setDetailsLoading(true)
      const res = await companiesApi.getCompany(id)
      if (res.data) {
        setLocalCompany(res.data)
      }
    } catch (err) {
      console.error('Failed to load full company details:', err)
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleStartEdit = () => {
    setIsEditing(true)
    if (localCompany) populateForm(localCompany)
    setActiveTab('overview')
    setShowMoreMenu(false)
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setValidationError('Company logo must be under 5MB')
      return
    }
    try {
      const base64 = await fileToBase64(file)
      setLogoBase64(base64)
      setLogoPreview(base64)
      setValidationError(null)
    } catch (err) {
      console.error('Error reading logo file:', err)
      setValidationError('Failed to read image file')
    }
  }

  const handleRemoveLogo = () => {
    setLogoBase64(null)
    setLogoPreview(null)
    if (logoInputRef.current) {
      logoInputRef.current.value = ''
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setValidationError(null)
    setLogoBase64(undefined)
    if (localCompany) populateForm(localCompany)
  }

  const handleSaveClick = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!localCompany) return

    const err = validateCompanyEmail(email)
    setEmailError(err)
    setTouched({ email: Boolean(email.trim()) })

    if (err) {
      setValidationError(err)
      return
    }
    if (!companyName.trim()) {
      setValidationError('Please provide Company Name')
      return
    }

    setValidationError(null)
    setShowSaveConfirm(true)
  }

  const handleExecuteSave = async () => {
    setShowSaveConfirm(false)
    if (!localCompany) return

    const formattedWebsite = website.trim()
      ? website.trim().startsWith('http')
        ? website.trim()
        : `https://${website.trim()}`
      : undefined

    try {
      setSaveLoading(true)
      const payload: UpdateCompanyPayload = {
        company_name: companyName.trim(),
        company_type_id: Number(companyTypeId) || 1,
        email: email.trim(),
        phone_number: phoneNumber.trim() || undefined,
        industry: industry.trim() || undefined,
        company_size_id: companySizeId ? Number(companySizeId) : null,
        status: status === 'Active',
        website: formattedWebsite,
        owner_name: ownerName.trim() || undefined,
        owner_birthday: ownerBirthday || undefined,
        address_line_1: addressLine1.trim() || undefined,
        address_line_2: addressLine2.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        postal_code: postalCode.trim() || undefined,
        country: country.trim() || 'Sri Lanka',
        company_description: companyDescription.trim() || undefined,
        ...(logoBase64 !== undefined ? { logo: logoBase64 } : {}),
      }

      const res = await companiesApi.updateCompany(localCompany.id, payload)
      if (res.data) {
        setLocalCompany(res.data)
        populateForm(res.data)
        if (onSave) onSave(res.data)
      }
      setLogoBase64(undefined)
      setIsEditing(false)
      setValidationError(null)
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to save company changes')
    } finally {
      setSaveLoading(false)
    }
  }

  if (!localCompany) return null

  const displayCompanyName = capitalizeWords(localCompany.company_name) || 'Company Account'
  const companyTypeName =
    typeof localCompany.company_type === 'object'
      ? localCompany.company_type?.name
      : localCompany.company_type || 'Company'
  const companySizeName =
    typeof localCompany.company_size === 'object'
      ? localCompany.company_size?.name
      : localCompany.company_size || undefined

  const fullAddress = [
    localCompany.address_line_1,
    localCompany.address_line_2,
    localCompany.city,
    localCompany.state,
    localCompany.postal_code,
    localCompany.country,
  ]
    .filter(Boolean)
    .join(', ') || localCompany.address || '—'

  const contactsList: CompanyContact[] = localCompany.contacts || []

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
          {/* ── HERO HEADER ── */}
          <div className="cvd-hero">
            <div className="cvd-avatar-wrap relative group">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleLogoChange}
              />
              {logoPreview ? (
                <img
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0 bg-white shadow-sm"
                  src={logoPreview}
                  alt={displayCompanyName}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const fb = e.currentTarget.nextElementSibling as HTMLElement
                    if (fb) fb.style.display = 'flex'
                  }}
                />
              ) : null}
              <div
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white items-center justify-center font-bold text-lg shadow-sm border border-blue-400/30"
                style={{ display: logoPreview ? 'none' : 'flex' }}
              >
                {displayCompanyName.slice(0, 2).toUpperCase()}
              </div>

              {/* Edit / Change Logo Camera Button */}
              {isEditing && (
                <button
                  type="button"
                  className="cvd-avatar-camera"
                  onClick={() => logoInputRef.current?.click()}
                  title="Upload / Change Company Logo"
                >
                  <Camera size={12} />
                </button>
              )}
            </div>

            <div className="cvd-hero-info">
              {isEditing ? (
                <div>
                  <div className="cvd-name-edit-row items-center gap-2">
                    <input
                      type="text"
                      className="form-input form-input-sm flex-1 font-semibold text-sm"
                      placeholder="Company Name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                    <div
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-mono text-xs font-bold border border-slate-200 shrink-0"
                      title="Company code is system generated"
                    >
                      <ShieldCheck size={12} className="text-blue-600" />
                      <span>{localCompany.company_code}</span>
                    </div>
                  </div>
                  {/* Quick logo controls row in edit mode */}
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 hover:underline"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <Upload size={11} />
                      {logoPreview ? 'Change Logo' : 'Upload Logo'}
                    </button>
                    {logoPreview && (
                      <>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1 hover:underline"
                          onClick={handleRemoveLogo}
                        >
                          <Trash2 size={11} />
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="cvd-name-row flex items-center gap-2 flex-wrap">
                  <h2 className="cvd-name font-bold text-lg text-slate-900">{displayCompanyName}</h2>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {localCompany.company_code}
                  </span>
                  {detailsLoading && <Loader2 size={13} className="animate-spin text-primary-500" />}
                  <span
                    className={`contact-status-pill ${localCompany.status === 'Active' || localCompany.status === true
                        ? 'status-active'
                        : 'status-neutral'
                      }`}
                  >
                    {localCompany.status === 'Active' || localCompany.status === true
                      ? 'Active'
                      : 'Inactive'}
                  </span>
                </div>
              )}

              <p className="cvd-subtitle text-xs text-muted mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="font-medium text-slate-700">{companyTypeName}</span>
                {localCompany.industry && (
                  <>
                    <span>•</span>
                    <span>{localCompany.industry}</span>
                  </>
                )}
                {localCompany.city && (
                  <>
                    <span>•</span>
                    <span>{localCompany.city}</span>
                  </>
                )}
              </p>
            </div>

            <button className="cvd-close-btn" onClick={onClose} title="Close">
              <span style={{ fontSize: 18, lineHeight: 1, color: '#94a3b8' }}>×</span>
            </button>
          </div>

          {/* ── ACTION BUTTONS ROW / EDIT BAR ── */}
          {!isEditing ? (
            <div className="cvd-actions-row">
              <button className="cvd-btn-primary" onClick={handleStartEdit}>
                <Edit2 size={13} />
                <span>Edit Company</span>
              </button>

              {localCompany.email && (
                <a
                  href={`mailto:${localCompany.email}`}
                  className="cvd-btn-outline inline-flex items-center gap-1.5"
                >
                  <Mail size={13} />
                  <span>Email</span>
                </a>
              )}

              {(localCompany.phone_number || localCompany.phone) && (
                <a
                  href={`tel:${localCompany.phone_number || localCompany.phone}`}
                  className="cvd-btn-outline inline-flex items-center gap-1.5"
                >
                  <Phone size={13} />
                  <span>Call</span>
                </a>
              )}

              {localCompany.website && (
                <a
                  href={
                    localCompany.website.startsWith('http')
                      ? localCompany.website
                      : `https://${localCompany.website}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="cvd-btn-outline inline-flex items-center gap-1.5"
                >
                  <Globe size={13} />
                  <span>Website</span>
                </a>
              )}

              <div style={{ position: 'relative', marginLeft: 'auto' }}>
                <button
                  className="cvd-btn-outline"
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                >
                  <MoreHorizontal size={13} />
                  <span>More</span>
                </button>
                {showMoreMenu && (
                  <div
                    className="dropdown-menu animate-fade-in"
                    style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 50 }}
                  >
                    <button
                      className="dropdown-item text-danger"
                      onClick={() => {
                        setShowMoreMenu(false)
                        onDelete(localCompany.id)
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Delete Company</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── EDIT MODE BAR ── */
            <div className="cvd-edit-bar">
              <div className="flex items-center gap-2">
                <span className="contact-edit-badge">Edit Mode</span>
                <span className="text-xs text-gray-500">Updating {displayCompanyName}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleCancelEdit}
                  disabled={saveLoading}
                >
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

          {/* Validation Error Banner */}
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
              {isEditing ? 'Edit Profile' : 'Overview'}
            </button>
            {!isEditing && (
              <>
                <button
                  className={`cvd-tab${activeTab === 'contacts' ? ' cvd-tab-active' : ''}`}
                  onClick={() => setActiveTab('contacts')}
                >
                  Contacts ({localCompany.contacts_count ?? contactsList.length})
                </button>
                <button
                  className={`cvd-tab${activeTab === 'projects' ? ' cvd-tab-active' : ''}`}
                  onClick={() => setActiveTab('projects')}
                >
                  Projects ({localCompany.projects_count ?? 0})
                </button>
                <button
                  className={`cvd-tab${activeTab === 'leads' ? ' cvd-tab-active' : ''}`}
                  onClick={() => setActiveTab('leads')}
                >
                  Leads ({localCompany.leads_count ?? 0})
                </button>
                <button
                  className={`cvd-tab${activeTab === 'notes' ? ' cvd-tab-active' : ''}`}
                  onClick={() => setActiveTab('notes')}
                >
                  Description & Notes
                </button>
              </>
            )}
          </div>

          {/* ── TAB CONTENT ── */}
          <div className="cvd-body">
            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="cvd-tab-pane">
                <div className="cvd-card">
                  <div className="cvd-card-header">
                    <span className="cvd-card-title">Company Profile</span>
                  </div>

                  {isEditing ? (
                    /* EDIT FORM */
                    <div className="space-y-3.5 pt-1">
                      {/* Company Code & Company Type */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="form-group min-w-0">
                          <label className="form-label text-xs">
                            Company Code <span className="text-xs text-muted font-normal">(System Generated)</span>
                          </label>
                          <input
                            type="text"
                            className="form-input form-input-sm bg-slate-50 text-slate-600 font-mono font-medium cursor-not-allowed border-slate-200"
                            value={localCompany.company_code}
                            disabled
                            readOnly
                          />
                        </div>
                        <div className="form-group min-w-0">
                          <label className="form-label text-xs">
                            Company Type <span className="text-danger">*</span>
                          </label>
                          <select
                            className="form-select form-input-sm"
                            value={companyTypeId || ''}
                            onChange={(e) => setCompanyTypeId(Number(e.target.value))}
                            disabled={companyTypes.length === 0}
                          >
                            {companyTypes.length === 0 ? (
                              <option value="" disabled>Loading types...</option>
                            ) : (
                              companyTypes.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                      </div>

                      {/* Email & Phone */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="form-group">
                          <label className="form-label text-xs">
                            Email Address
                          </label>
                          <input
                            type="email"
                            className={`form-input form-input-sm ${touched.email && emailError ? 'input-error' : ''
                              }`}
                            placeholder="e.g. hello@zenithtech.io"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value)
                              if (touched.email) setEmailError(validateCompanyEmail(e.target.value))
                            }}
                            onBlur={() => {
                              if (email.trim()) {
                                setTouched((t) => ({ ...t, email: true }))
                                setEmailError(validateCompanyEmail(email))
                              } else {
                                setEmailError(null)
                              }
                            }}
                          />
                          {touched.email && emailError && (
                            <div className="field-error-msg">
                              <AlertCircle size={12} />
                              <span>{emailError}</span>
                            </div>
                          )}
                        </div>

                        <div className="form-group min-w-0">
                          <label className="form-label text-xs">Phone Number</label>
                          <input
                            type="tel"
                            className="form-input form-input-sm min-w-0"
                            placeholder="+94 11 999 8888"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Industry & Company Size */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="form-group min-w-0">
                          <label className="form-label text-xs">Industry</label>
                          <input
                            type="text"
                            className="form-input form-input-sm min-w-0"
                            placeholder="e.g. Information Technology"
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                          />
                        </div>

                        <div className="form-group min-w-0">
                          <label className="form-label text-xs">Company Size</label>
                          <select
                            className="form-select form-input-sm"
                            value={companySizeId}
                            onChange={(e) =>
                              setCompanySizeId(e.target.value ? Number(e.target.value) : '')
                            }
                          >
                            <option value="">Select Company Size (optional)...</option>
                            {companySizes.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Website & Owner Name */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="form-group min-w-0">
                          <label className="form-label text-xs">Website</label>
                          <input
                            type="url"
                            className="form-input form-input-sm min-w-0"
                            placeholder="https://company.com"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                          />
                        </div>

                        <div className="form-group min-w-0">
                          <label className="form-label text-xs">Owner / Key Person</label>
                          <input
                            type="text"
                            className="form-input form-input-sm min-w-0"
                            placeholder="e.g. Marcus Aurelius"
                            value={ownerName}
                            onChange={(e) => setOwnerName(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Owner Birthday & Status */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="form-group min-w-0">
                          <label className="form-label text-xs">Owner Birthday / Founded</label>
                          <input
                            type="date"
                            className="form-input form-input-sm min-w-0"
                            value={ownerBirthday}
                            onChange={(e) => setOwnerBirthday(e.target.value)}
                          />
                        </div>

                        <div className="form-group min-w-0">
                          <label className="form-label text-xs">Status</label>
                          <div className="pt-1">
                            <StatusToggle
                              status={status}
                              onChange={setStatus}
                              isEditing={true}
                              size="md"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Address Lines */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="form-group min-w-0">
                          <label className="form-label text-xs">Address Line 1</label>
                          <input
                            type="text"
                            className="form-input form-input-sm min-w-0"
                            placeholder="Suite 500, Cyber Tower"
                            value={addressLine1}
                            onChange={(e) => setAddressLine1(e.target.value)}
                          />
                        </div>
                        <div className="form-group min-w-0">
                          <label className="form-label text-xs">Address Line 2 / Suite</label>
                          <input
                            type="text"
                            className="form-input form-input-sm min-w-0"
                            placeholder="Silicon Boulevard"
                            value={addressLine2}
                            onChange={(e) => setAddressLine2(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* City, State, Postal Code, Country */}
                      <div className="grid grid-cols-4 gap-2">
                        <div className="form-group min-w-0">
                          <label className="form-label text-xs">City</label>
                          <input
                            type="text"
                            className="form-input form-input-sm min-w-0"
                            placeholder="Colombo"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                          />
                        </div>
                        <div className="form-group min-w-0">
                          <label className="form-label text-xs">State</label>
                          <input
                            type="text"
                            className="form-input form-input-sm min-w-0"
                            placeholder="Western Province"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                          />
                        </div>
                        <div className="form-group min-w-0">
                          <label className="form-label text-xs">Postal Code</label>
                          <input
                            type="text"
                            className="form-input form-input-sm min-w-0"
                            placeholder="00100"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                          />
                        </div>
                        <div className="form-group min-w-0">
                          <label className="form-label text-xs">Country</label>
                          <input
                            type="text"
                            className="form-input form-input-sm min-w-0"
                            placeholder="Sri Lanka"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div className="form-group">
                        <label className="form-label text-xs">Company Description</label>
                        <textarea
                          rows={3}
                          className="form-input form-input-sm resize-none"
                          placeholder="Overview of company services..."
                          value={companyDescription}
                          onChange={(e) => setCompanyDescription(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    /* READ-ONLY VIEW */
                    <div className="cvd-info-list">
                      <div className="cvd-info-row">
                        <div className="cvd-info-label">
                          <ShieldCheck size={15} />
                          <span>Company Code</span>
                        </div>
                        <div className="cvd-info-value">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {localCompany.company_code}
                          </span>
                        </div>
                      </div>

                      <div className="cvd-info-row">
                        <div className="cvd-info-label">
                          <Building2 size={15} />
                          <span>Company Name</span>
                        </div>
                        <div className="cvd-info-value font-semibold text-slate-900">
                          {displayCompanyName}
                        </div>
                      </div>

                      <div className="cvd-info-row">
                        <div className="cvd-info-label">
                          <Briefcase size={15} />
                          <span>Company Type</span>
                        </div>
                        <div className="cvd-info-value">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                            {companyTypeName}
                          </span>
                        </div>
                      </div>

                      {localCompany.industry && (
                        <div className="cvd-info-row">
                          <div className="cvd-info-label">
                            <Layers size={15} />
                            <span>Industry</span>
                          </div>
                          <div className="cvd-info-value">{localCompany.industry}</div>
                        </div>
                      )}

                      {companySizeName && (
                        <div className="cvd-info-row">
                          <div className="cvd-info-label">
                            <Users size={15} />
                            <span>Company Size</span>
                          </div>
                          <div className="cvd-info-value">{companySizeName}</div>
                        </div>
                      )}

                      <div className="cvd-info-row">
                        <div className="cvd-info-label">
                          <Mail size={15} />
                          <span>Email Address</span>
                        </div>
                        <div className="cvd-info-value">
                          {localCompany.email ? (
                            <a
                              href={`mailto:${localCompany.email}`}
                              className="link-primary font-medium text-blue-600 hover:underline"
                            >
                              {localCompany.email}
                            </a>
                          ) : (
                            '—'
                          )}
                        </div>
                      </div>

                      <div className="cvd-info-row">
                        <div className="cvd-info-label">
                          <Phone size={15} />
                          <span>Phone Number</span>
                        </div>
                        <div className="cvd-info-value">
                          {localCompany.phone_number || localCompany.phone ? (
                            <a
                              href={`tel:${localCompany.phone_number || localCompany.phone}`}
                              className="link-primary font-medium text-blue-600 hover:underline"
                            >
                              {localCompany.phone_number || localCompany.phone}
                            </a>
                          ) : (
                            '—'
                          )}
                        </div>
                      </div>

                      {localCompany.website && (
                        <div className="cvd-info-row">
                          <div className="cvd-info-label">
                            <Globe size={15} />
                            <span>Website</span>
                          </div>
                          <div className="cvd-info-value">
                            <a
                              href={
                                localCompany.website.startsWith('http')
                                  ? localCompany.website
                                  : `https://${localCompany.website}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="link-primary inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
                            >
                              <span>{localCompany.website}</span>
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        </div>
                      )}

                      {localCompany.owner_name && (
                        <div className="cvd-info-row">
                          <div className="cvd-info-label">
                            <UserCheck size={15} />
                            <span>Owner / Lead Contact</span>
                          </div>
                          <div className="cvd-info-value font-medium">
                            {localCompany.owner_name}
                            {localCompany.owner_birthday && (
                              <span className="text-muted text-xs ml-2 font-normal">
                                (Birthday: {localCompany.owner_birthday})
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="cvd-info-row">
                        <div className="cvd-info-label">
                          <MapPin size={15} />
                          <span>Address</span>
                        </div>
                        <div className="cvd-info-value">{fullAddress}</div>
                      </div>

                      {localCompany.company_description && (
                        <div className="cvd-info-row cvd-info-row-top">
                          <div className="cvd-info-label">
                            <FileText size={15} />
                            <span>Description</span>
                          </div>
                          <div className="cvd-info-value text-slate-600 text-xs leading-relaxed">
                            {localCompany.company_description}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* LINKED METRICS CARD */}
                {!isEditing && (
                  <div className="cvd-card">
                    <div className="cvd-card-header">
                      <span className="cvd-card-title">Associated Records</span>
                    </div>
                    <div className="cvd-linked-grid">
                      <div
                        className="cvd-linked-item cursor-pointer hover:border-blue-300 transition-colors"
                        onClick={() => setActiveTab('contacts')}
                      >
                        <div className="cvd-linked-item-header">
                          <div className="cvd-linked-header-left">
                            <div className="cvd-linked-icon icon-blue">
                              <Users size={14} />
                            </div>
                            <span className="cvd-linked-label">Associated Contacts</span>
                          </div>
                          <span className="cvd-linked-view">View</span>
                        </div>
                        <div className="cvd-linked-count">
                          {localCompany.contacts_count ?? contactsList.length}
                        </div>
                      </div>

                      <div
                        className="cvd-linked-item cursor-pointer hover:border-emerald-300 transition-colors"
                        onClick={() => setActiveTab('projects')}
                      >
                        <div className="cvd-linked-item-header">
                          <div className="cvd-linked-header-left">
                            <div className="cvd-linked-icon icon-green">
                              <FolderKanban size={14} />
                            </div>
                            <span className="cvd-linked-label">Related Projects</span>
                          </div>
                          <span className="cvd-linked-view">View</span>
                        </div>
                        <div className="cvd-linked-count">
                          {localCompany.projects_count ?? 0}
                        </div>
                      </div>

                      <div
                        className="cvd-linked-item cursor-pointer hover:border-purple-300 transition-colors"
                        onClick={() => setActiveTab('leads')}
                      >
                        <div className="cvd-linked-item-header">
                          <div className="cvd-linked-header-left">
                            <div className="cvd-linked-icon icon-purple">
                              <FileText size={14} />
                            </div>
                            <span className="cvd-linked-label">Related Leads</span>
                          </div>
                          <span className="cvd-linked-view">View</span>
                        </div>
                        <div className="cvd-linked-count">
                          {localCompany.leads_count ?? 0}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. CONTACTS TAB */}
            {activeTab === 'contacts' && !isEditing && (
              <div className="cvd-tab-pane">
                <div className="cvd-card">
                  <div className="cvd-card-header flex items-center justify-between">
                    <div>
                      <span className="cvd-card-title">Contacts at {displayCompanyName}</span>
                      <p className="text-xs text-muted mt-0.5">
                        Team members and personnel linked with this organization
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {contactsList.length} Total
                    </span>
                  </div>

                  {contactsList.length === 0 ? (
                    <div className="text-center py-10 px-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                        <Users size={22} />
                      </div>
                      <h4 className="text-sm font-semibold text-slate-800 mb-1">
                        No contacts associated yet
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        There are currently no individual contacts linked to {displayCompanyName}. You
                        can associate contacts from the Contacts module.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {contactsList.map((contact) => {
                        const cName =
                          contact.name ||
                          contact.full_name ||
                          `${contact.first_name || ''} ${contact.last_name || ''}`.trim() ||
                          'Contact'
                        const cPhone = contact.phone_number || contact.mobile_no || contact.phone

                        return (
                          <div
                            key={contact.id}
                            className="py-3 px-1 flex items-center justify-between gap-3 hover:bg-slate-50/60 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {contact.avatar_url ? (
                                <img
                                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                                  src={contact.avatar_url}
                                  alt={cName}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                  {cName.slice(0, 2)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-900 truncate">
                                  {cName}
                                </div>
                                <div className="text-xs text-muted truncate">
                                  {contact.designation || 'Associated Contact'}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {contact.email && (
                                <a
                                  href={`mailto:${contact.email}`}
                                  className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                  title={`Email ${contact.email}`}
                                >
                                  <Mail size={15} />
                                </a>
                              )}
                              {cPhone && (
                                <a
                                  href={`tel:${cPhone}`}
                                  className="p-1.5 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                  title={`Call ${cPhone}`}
                                >
                                  <Phone size={15} />
                                </a>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. PROJECTS TAB */}
            {activeTab === 'projects' && !isEditing && (
              <div className="cvd-tab-pane">
                <div className="cvd-card">
                  <div className="cvd-card-header">
                    <span className="cvd-card-title">Projects Portfolio</span>
                    <p className="text-xs text-muted mt-0.5">
                      Projects and engagements associated with {displayCompanyName}
                    </p>
                  </div>

                  <div className="text-center py-10 px-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <FolderKanban size={22} />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-1">
                      {localCompany.projects_count && localCompany.projects_count > 0
                        ? `${localCompany.projects_count} Project(s) linked`
                        : 'No projects on record'}
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      All ongoing and completed client projects for this company will be tracked here.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. LEADS TAB */}
            {activeTab === 'leads' && !isEditing && (
              <div className="cvd-tab-pane">
                <div className="cvd-card">
                  <div className="cvd-card-header">
                    <span className="cvd-card-title">Sales Opportunities & Leads</span>
                    <p className="text-xs text-muted mt-0.5">
                      Prospect inquiries and deal pipelines for {displayCompanyName}
                    </p>
                  </div>

                  <div className="text-center py-10 px-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <FileText size={22} />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-1">
                      {localCompany.leads_count && localCompany.leads_count > 0
                        ? `${localCompany.leads_count} Active Lead(s) linked`
                        : 'No active leads on record'}
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Qualified opportunities and pipeline progression will be summarized here.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 5. NOTES / DESCRIPTION TAB */}
            {activeTab === 'notes' && !isEditing && (
              <div className="cvd-tab-pane">
                <div className="cvd-card">
                  <div className="cvd-card-header">
                    <span className="cvd-card-title">Company Overview & Notes</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-sm text-slate-700 leading-relaxed">
                    {localCompany.company_description ? (
                      <p className="whitespace-pre-wrap">{localCompany.company_description}</p>
                    ) : (
                      <p className="text-muted italic">
                        No description or notes have been added for this company yet. Click "Edit Company" to add details.
                      </p>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400 space-y-1">
                    {localCompany.created_at && (
                      <div>Record Created: {new Date(localCompany.created_at).toLocaleString()}</div>
                    )}
                    {localCompany.updated_at && (
                      <div>Last Modified: {new Date(localCompany.updated_at).toLocaleString()}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </SlideDrawer>

      <ConfirmationModal
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={handleExecuteSave}
        title="Save Company Changes"
        itemName={displayCompanyName}
        message="Are you sure you want to update this company's details?"
        confirmText="Save Changes"
        cancelText="Discard"
      />
    </>
  )
}
