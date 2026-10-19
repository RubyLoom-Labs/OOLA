import React, { useState, useEffect } from 'react'
import {
  Loader2,
  AlertCircle,
  Save,
  Building2,
  Mail,
  MapPin,
  FileText,
  User,
  Upload,
  Trash2,
  Camera,
} from 'lucide-react'
import type {
  Company,
  CompanyTypeItem,
  CompanySizeItem,
  CreateCompanyPayload,
  UpdateCompanyPayload,
} from '@/apis/companiesApi'
import { companiesApi } from '@/apis/companiesApi'
import SlideDrawer from '@/components/common/SlideDrawer'
import StatusToggle from '@/components/common/StatusToggle'
import { validateCompanyEmail } from './CompanyViewDrawer'
import { getCompanyLogoUrl, fileToBase64 } from '@/lib/utils'

interface CompanyFormDrawerProps {
  isOpen: boolean
  onClose: () => void
  company?: Company | null
  onSubmit: (
    payload: CreateCompanyPayload | UpdateCompanyPayload,
    isEdit: boolean
  ) => Promise<void>
}

export default function CompanyFormDrawer({
  isOpen,
  onClose,
  company,
  onSubmit,
}: CompanyFormDrawerProps) {
  const isEdit = Boolean(company && company.id)
  const [loading, setLoading] = useState(false)

  // Company Types and Sizes dynamically from Backend API
  const [companyTypes, setCompanyTypes] = useState<CompanyTypeItem[]>([])
  const [companySizes, setCompanySizes] = useState<CompanySizeItem[]>([])
  const [metaLoading, setMetaLoading] = useState(false)

  // Form Fields
  const [companyName, setCompanyName] = useState('')
  const [companyTypeId, setCompanyTypeId] = useState<number | ''>('')
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

  // Logo upload state
  const [logoBase64, setLogoBase64] = useState<string | null | undefined>(undefined)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const logoInputRef = React.useRef<HTMLInputElement>(null)

  // Validation
  const [companyNameError, setCompanyNameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [touched, setTouched] = useState({ email: false, companyName: false })

  // Load types & sizes on open
  useEffect(() => {
    if (!isOpen) return
    const fetchMeta = async () => {
      setMetaLoading(true)
      try {
        const [typesRes, sizesRes] = await Promise.allSettled([
          companiesApi.getCompanyTypes(),
          companiesApi.getCompanySizes(),
        ])
        let types: CompanyTypeItem[] = []
        if (typesRes.status === 'fulfilled') {
          const rawTypes = (typesRes.value as any)?.data?.data || typesRes.value?.data
          if (Array.isArray(rawTypes) && rawTypes.length > 0) {
            types = rawTypes
            setCompanyTypes(types)
          }
        }
        if (sizesRes.status === 'fulfilled') {
          const rawSizes = (sizesRes.value as any)?.data?.data || sizesRes.value?.data
          if (Array.isArray(rawSizes) && rawSizes.length > 0) {
            setCompanySizes(rawSizes)
          }
        }

        // Set default company type from API response if none chosen
        if (!company && types.length > 0) {
          setCompanyTypeId((prev) => (prev ? prev : types[0].id))
        }
      } catch (err) {
        console.error('Error loading company types/sizes:', err)
      } finally {
        setMetaLoading(false)
      }
    }
    fetchMeta()
  }, [isOpen, company])

  // Reset or populate fields
  useEffect(() => {
    if (company && isOpen) {
      setCompanyName(company.company_name || '')
      const cTypeId =
        company.company_type_id ||
        (typeof company.company_type === 'object' ? company.company_type?.id : 1) ||
        1
      setCompanyTypeId(Number(cTypeId))
      setEmail(company.email || '')
      setPhoneNumber(company.phone_number || company.phone || '')
      setIndustry(company.industry || '')
      const cSizeId =
        company.company_size_id ||
        (typeof company.company_size === 'object' ? company.company_size?.id : '') ||
        ''
      setCompanySizeId(cSizeId ? Number(cSizeId) : '')
      const isActive =
        company.status === 'Active' ||
        company.status === true ||
        String(company.status) === '1' ||
        company.status_bool === true
      setStatus(isActive ? 'Active' : 'Inactive')
      setWebsite(company.website || '')
      setOwnerName(company.owner_name || '')
      setOwnerBirthday(company.owner_birthday || '')
      setAddressLine1(company.address_line_1 || '')
      setAddressLine2(company.address_line_2 || '')
      setCity(company.city || '')
      setState(company.state || '')
      setPostalCode(company.postal_code || '')
      setCountry(company.country || 'Sri Lanka')
      setCompanyDescription(company.company_description || '')

      const initialLogo = getCompanyLogoUrl(company.logo, company.logo_url)
      setLogoPreview(initialLogo || null)
      setLogoBase64(undefined)

      setCompanyNameError(null)
      setEmailError(null)
      setValidationError(null)
      setTouched({ email: false, companyName: false })
    } else if (isOpen && !company) {
      setCompanyName('')
      setLogoPreview(null)
      setLogoBase64(undefined)
      setCompanyTypeId(companyTypes[0]?.id || '')
      setEmail('')
      setPhoneNumber('')
      setIndustry('')
      setCompanySizeId('')
      setStatus('Active')
      setWebsite('')
      setOwnerName('')
      setOwnerBirthday('')
      setAddressLine1('')
      setAddressLine2('')
      setCity('')
      setState('')
      setPostalCode('')
      setCountry('Sri Lanka')
      setCompanyDescription('')

      setCompanyNameError(null)
      setEmailError(null)
      setValidationError(null)
      setTouched({ email: false, companyName: false })
    }
  }, [company, isOpen, companyTypes])

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setValidationError('Company logo must be under 5MB.')
      return
    }
    try {
      const base64 = await fileToBase64(file)
      setLogoBase64(base64)
      setLogoPreview(base64)
      setValidationError(null)
    } catch (err) {
      console.error('Error reading logo file:', err)
      setValidationError('Failed to read logo image')
    }
  }

  const handleRemoveLogo = () => {
    setLogoBase64(null)
    setLogoPreview(null)
    if (logoInputRef.current) {
      logoInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const eErr = validateCompanyEmail(email)
    setEmailError(eErr)
    setTouched({ email: Boolean(email.trim()), companyName: true })

    let hasErr = false
    if (!companyName.trim()) {
      setCompanyNameError('Company Name is required.')
      hasErr = true
    } else {
      setCompanyNameError(null)
    }

    if (hasErr || eErr) {
      if (!companyName.trim()) {
        setValidationError('Please enter a Company name.')
      } else if (eErr) {
        setValidationError(eErr)
      }
      return
    }

    setValidationError(null)

    const formattedWebsite = website.trim()
      ? website.trim().startsWith('http')
        ? website.trim()
        : `https://${website.trim()}`
      : undefined

    const payload: CreateCompanyPayload = {
      company_name: companyName.trim(),
      company_type_id: Number(companyTypeId) || (companyTypes[0]?.id ?? 1),
      email: email.trim(),
      phone_number: phoneNumber.trim() || undefined,
      industry: industry.trim() || undefined,
      company_size_id: companySizeId ? Number(companySizeId) : null,
      status: status === 'Active',
      company_description: companyDescription.trim() || undefined,
      website: formattedWebsite,
      owner_name: ownerName.trim() || undefined,
      owner_birthday: ownerBirthday || undefined,
      address_line_1: addressLine1.trim() || undefined,
      address_line_2: addressLine2.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      postal_code: postalCode.trim() || undefined,
      country: country.trim() || 'Sri Lanka',
      ...(logoBase64 !== undefined ? { logo: logoBase64 } : {}),
    }

    setLoading(true)
    try {
      await onSubmit(payload, isEdit)
      onClose()
    } catch (error: any) {
      if (error?.errors && typeof error.errors === 'object') {
        const errorList: string[] = []
        Object.entries(error.errors).forEach(([field, msgs]) => {
          const msg = Array.isArray(msgs) ? msgs.join(', ') : String(msgs)
          if (field === 'company_name') setCompanyNameError(msg)
          if (field === 'email') setEmailError(msg)
          errorList.push(`${field.replace(/_/g, ' ')}: ${msg}`)
        })
        setValidationError(errorList.length > 0 ? errorList.join(' | ') : 'Validation failed')
      } else {
        const msg = error?.message || 'Failed to save company'
        setValidationError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const displayName = companyName.trim() || (isEdit ? 'Edit Company' : 'Add New Company')

  return (
    <SlideDrawer
      isOpen={isOpen}
      onClose={onClose}
      width="640px"
      title=""
      subtitle=""
      className="contact-view-drawer contact-form-drawer"
      hideHeader
    >
      <form onSubmit={handleSubmit} noValidate className="cvd-panel">
        {/* ── HEADER ── */}
        <div className="cvd-hero">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
            <Building2 size={22} />
          </div>

          <div className="cvd-hero-info">
            <div className="text-base font-bold text-slate-900">{displayName}</div>
            <div className="text-xs text-muted">
              {isEdit
                ? `Update organization profile and details for ${company?.company_code || ''}`
                : 'Create a new company in the system'}
            </div>
          </div>

          <button type="button" className="cvd-close-btn" onClick={onClose} title="Close">
            <span style={{ fontSize: 18, lineHeight: 1, color: '#94a3b8' }}>×</span>
          </button>
        </div>

        {/* ── SAVE BAR ── */}
        <div className="cvd-edit-bar">
          <div className="flex items-center gap-2">
            <span className="contact-edit-badge">{isEdit ? 'Edit Company' : 'New Company'}</span>
            <span className="text-xs text-gray-500">
              {isEdit ? `Updating ${companyName || 'company'}` : 'All marked fields are required'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm flex items-center gap-1.5"
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Save size={13} />
              )}
              <span>{isEdit ? 'Save Changes' : 'Create Company'}</span>
            </button>
          </div>
        </div>

        {/* ── VALIDATION ERROR BANNER ── */}
        {validationError && (
          <div className="cvd-validation-error">
            <AlertCircle size={13} />
            <span>{validationError}</span>
          </div>
        )}

        {/* ── FORM CONTENT ── */}
        <div className="cvd-body space-y-4">
          {/* Card 1: Core Company Details */}
          <div className="cvd-card">
            <div className="cvd-card-header">
              <span className="cvd-card-title flex items-center gap-1.5">
                <Building2 size={14} className="text-blue-600" />
                <span>Company Details</span>
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {/* Company Logo Section */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-4">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleLogoChange}
                />
                <div className="relative shrink-0">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Company Logo"
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 bg-white shadow-2xs"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white items-center justify-center font-bold text-base shadow-2xs"
                    style={{ display: logoPreview ? 'none' : 'flex' }}
                  >
                    {companyName.trim() ? companyName.trim().slice(0, 2).toUpperCase() : <Building2 size={20} />}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-800 mb-0.5">Company Logo</div>
                  <div className="text-[11px] text-muted mb-2">Upload a logo (PNG, JPG, SVG, WEBP up to 5MB)</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-outline btn-xs flex items-center gap-1"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <Upload size={12} />
                      {logoPreview ? 'Change Logo' : 'Upload Logo'}
                    </button>
                    {logoPreview && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center gap-1"
                        onClick={handleRemoveLogo}
                      >
                        <Trash2 size={12} />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Company Name */}
              <div className="form-group">
                <label className="form-label text-xs">
                  Company Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`form-input form-input-sm ${
                    companyNameError ? 'input-error' : ''
                  }`}
                  placeholder="e.g. Zenith Tech Solutions"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value)
                    if (touched.companyName && e.target.value.trim()) {
                      setCompanyNameError(null)
                    }
                  }}
                  onBlur={() => setTouched((t) => ({ ...t, companyName: true }))}
                />
                {companyNameError && (
                  <div className="field-error-msg">
                    <AlertCircle size={12} />
                    <span>{companyNameError}</span>
                  </div>
                )}
              </div>

              {/* Company Type & Company Size */}
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group min-w-0">
                  <label className="form-label text-xs">
                    Company Type <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select form-input-sm"
                    value={companyTypeId}
                    onChange={(e) => setCompanyTypeId(Number(e.target.value))}
                    disabled={metaLoading || companyTypes.length === 0}
                  >
                    <option value="" disabled>
                      {metaLoading ? 'Loading company types...' : 'Select Company Type...'}
                    </option>
                    {companyTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group min-w-0">
                  <label className="form-label text-xs">Company Size</label>
                  <select
                    className="form-select form-input-sm"
                    value={companySizeId}
                    onChange={(e) =>
                      setCompanySizeId(e.target.value ? Number(e.target.value) : '')
                    }
                    disabled={metaLoading}
                  >
                    <option value="">
                      {metaLoading ? 'Loading company sizes...' : 'Select Employee Size...'}
                    </option>
                    {companySizes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Industry & Status */}
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
            </div>
          </div>

          {/* Card 2: Contact Information */}
          <div className="cvd-card">
            <div className="cvd-card-header">
              <span className="cvd-card-title flex items-center gap-1.5">
                <Mail size={14} className="text-emerald-600" />
                <span>Contact Details</span>
              </span>
            </div>

            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label text-xs">
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className={`form-input form-input-sm ${
                      emailError ? 'input-error' : ''
                    }`}
                    placeholder="e.g. contact@company.io"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (touched.email) {
                        setEmailError(validateCompanyEmail(e.target.value))
                      }
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
                  {emailError && (
                    <div className="field-error-msg">
                      <AlertCircle size={12} />
                      <span>{emailError}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label text-xs">Phone Number</label>
                  <input
                    type="tel"
                    className="form-input form-input-sm"
                    placeholder="e.g. +94 11 999 8888"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label text-xs">Website URL</label>
                <input
                  type="url"
                  className="form-input form-input-sm"
                  placeholder="https://example.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Location / Address */}
          <div className="cvd-card">
            <div className="cvd-card-header">
              <span className="cvd-card-title flex items-center gap-1.5">
                <MapPin size={14} className="text-amber-600" />
                <span>Location & Address</span>
              </span>
            </div>

            <div className="space-y-3 pt-1">
              <div className="form-group">
                <label className="form-label text-xs">Address Line 1</label>
                <input
                  type="text"
                  className="form-input form-input-sm"
                  placeholder="Street address, building, suite"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label text-xs">Address Line 2</label>
                <input
                  type="text"
                  className="form-input form-input-sm"
                  placeholder="Floor, unit, district"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label text-xs">City</label>
                  <input
                    type="text"
                    className="form-input form-input-sm"
                    placeholder="e.g. Colombo"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label text-xs">State / Province</label>
                  <input
                    type="text"
                    className="form-input form-input-sm"
                    placeholder="e.g. Western Province"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label text-xs">Postal Code</label>
                  <input
                    type="text"
                    className="form-input form-input-sm"
                    placeholder="e.g. 00100"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label text-xs">Country</label>
                  <input
                    type="text"
                    className="form-input form-input-sm"
                    placeholder="e.g. Sri Lanka"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Owner / Representative Information */}
          <div className="cvd-card">
            <div className="cvd-card-header">
              <span className="cvd-card-title flex items-center gap-1.5">
                <User size={14} className="text-violet-600" />
                <span>Representative / Owner Information</span>
              </span>
            </div>

            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label text-xs">Owner Name</label>
                  <input
                    type="text"
                    className="form-input form-input-sm"
                    placeholder="e.g. Marcus Aurelius"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label text-xs">Owner Birthday</label>
                  <input
                    type="date"
                    className="form-input form-input-sm"
                    value={ownerBirthday}
                    onChange={(e) => setOwnerBirthday(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Company Description */}
          <div className="cvd-card">
            <div className="cvd-card-header">
              <span className="cvd-card-title flex items-center gap-1.5">
                <FileText size={14} className="text-blue-500" />
                <span>Description</span>
              </span>
            </div>

            <div className="pt-1">
              <div className="form-group">
                <textarea
                  className="form-textarea form-input-sm"
                  rows={3}
                  placeholder="Overview of the company, service offerings, business domain, or notes..."
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </SlideDrawer>
  )
}
