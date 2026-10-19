import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Building2,
  Plus,
  Loader2,
  MapPin,
  User,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react'
import {
  companiesApi,
  type CreateCompanyPayload,
  type CompanyLookupItem,
  type CompanyTypeItem,
  type CompanySizeItem,
} from '@/apis/companiesApi'
import { capitalizeWords } from '@/lib/utils'

interface CreateCompanyModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newCompany: CompanyLookupItem) => void
  initialName?: string
}

export default function CreateCompanyModal({
  isOpen,
  onClose,
  onSuccess,
  initialName = '',
}: CreateCompanyModalProps) {
  // Form values
  const [companyName, setCompanyName] = useState(initialName)
  const [companyTypeId, setCompanyTypeId] = useState<string>('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [industry, setIndustry] = useState('')
  const [companySizeId, setCompanySizeId] = useState<string>('')
  const [status, setStatus] = useState<boolean>(true)
  const [companyDescription, setCompanyDescription] = useState('')
  const [website, setWebsite] = useState('')

  // Logo
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  // Ownership Details
  const [ownerName, setOwnerName] = useState('')
  const [ownerBirthday, setOwnerBirthday] = useState('')

  // Address Details
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('Sri Lanka')

  // Validation & error states
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  // Network & UI states
  const [loading, setLoading] = useState(false)
  const [companyTypes, setCompanyTypes] = useState<CompanyTypeItem[]>([])
  const [companySizes, setCompanySizes] = useState<CompanySizeItem[]>([])
  const [loadingMeta, setLoadingMeta] = useState(false)

  // Element refs for auto-focusing on error
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch company-types and company-sizes on open
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true

    const fetchMeta = async () => {
      setLoadingMeta(true)
      try {
        const [typesRes, sizesRes] = await Promise.allSettled([
          companiesApi.getCompanyTypes(),
          companiesApi.getCompanySizes(),
        ])

        if (!isMounted) return

        let loadedTypes: CompanyTypeItem[] = []
        if (typesRes.status === 'fulfilled') {
          const raw = (typesRes.value as any)?.data ?? typesRes.value
          if (Array.isArray(raw) && raw.length > 0) {
            loadedTypes = raw
            setCompanyTypes(raw)
          }
        }

        if (sizesRes.status === 'fulfilled') {
          const raw = (sizesRes.value as any)?.data ?? sizesRes.value
          if (Array.isArray(raw) && raw.length > 0) {
            setCompanySizes(raw)
          }
        }

        // Pre-select default type from API response if none chosen
        if (loadedTypes.length > 0) {
          setCompanyTypeId((prev) => prev || String(loadedTypes[0].id))
        }
      } catch (err) {
        console.error('Failed to load company metadata:', err)
      } finally {
        if (isMounted) setLoadingMeta(false)
      }
    }

    fetchMeta()

    return () => {
      isMounted = false
    }
  }, [isOpen])

  // Reset & sync state when opened
  useEffect(() => {
    if (isOpen) {
      setCompanyName(initialName)
      setEmail('')
      setPhoneNumber('')
      setIndustry('')
      setCompanySizeId('')
      setStatus(true)
      setCompanyDescription('')
      setWebsite('')
      setLogoFile(null)
      setLogoPreview(null)
      setOwnerName('')
      setOwnerBirthday('')
      setAddressLine1('')
      setAddressLine2('')
      setCity('')
      setState('')
      setPostalCode('')
      setCountry('Sri Lanka')
      setFieldErrors({})
      setTouched({})
      setGeneralError(null)
      setLoading(false)

      const timer = setTimeout(() => {
        fieldRefs.current['company_name']?.focus()
      }, 60)
      return () => clearTimeout(timer)
    }
  }, [isOpen, initialName])

  // Clean up object URL on unmount/change
  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview)
      }
    }
  }, [logoPreview])

  // Prevent background scroll while modal is active
  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen])

  // Handle ESC key dismiss
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, loading, onClose])

  if (!isOpen) return null

  const availableTypes = companyTypes
  const availableSizes = companySizes

  // Validation rules engine
  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'company_name':
        if (!value || !String(value).trim()) return 'Company Name is required.'
        if (String(value).trim().length > 255) return 'Company Name cannot exceed 255 characters.'
        return ''

      case 'company_type_id':
        if (!value || value === '') return 'Company Type is required.'
        return ''

      case 'email':
        if (!value || !String(value).trim()) return 'Email Address is required.'
        if (String(value).trim().length > 255) return 'Email cannot exceed 255 characters.'
        if (!/^[^\s@]+@[^\s@]+$/.test(String(value).trim())) {
          return 'Please enter a valid email address.'
        }
        return ''

      case 'phone_number':
        if (value && String(value).trim().length > 50) {
          return 'Phone number cannot exceed 50 characters.'
        }
        return ''

      case 'industry':
        if (value && String(value).trim().length > 100) {
          return 'Industry cannot exceed 100 characters.'
        }
        return ''

      case 'website':
        if (value && String(value).trim().length > 255) {
          return 'Website URL cannot exceed 255 characters.'
        }
        return ''

      case 'owner_name':
        if (value && String(value).trim().length > 255) {
          return 'Owner name cannot exceed 255 characters.'
        }
        return ''

      case 'address_line_1':
        if (value && String(value).trim().length > 255) {
          return 'Address Line 1 cannot exceed 255 characters.'
        }
        return ''

      case 'address_line_2':
        if (value && String(value).trim().length > 255) {
          return 'Address Line 2 cannot exceed 255 characters.'
        }
        return ''

      case 'city':
        if (value && String(value).trim().length > 100) {
          return 'City cannot exceed 100 characters.'
        }
        return ''

      case 'state':
        if (value && String(value).trim().length > 100) {
          return 'State cannot exceed 100 characters.'
        }
        return ''

      case 'postal_code':
        if (value && String(value).trim().length > 50) {
          return 'Postal code cannot exceed 50 characters.'
        }
        return ''

      case 'country':
        if (value && String(value).trim().length > 100) {
          return 'Country cannot exceed 100 characters.'
        }
        return ''

      default:
        return ''
    }
  }

  const getFieldValue = (name: string) => {
    switch (name) {
      case 'company_name':
        return companyName
      case 'company_type_id':
        return companyTypeId
      case 'email':
        return email
      case 'phone_number':
        return phoneNumber
      case 'industry':
        return industry
      case 'website':
        return website
      case 'owner_name':
        return ownerName
      case 'address_line_1':
        return addressLine1
      case 'address_line_2':
        return addressLine2
      case 'city':
        return city
      case 'state':
        return state
      case 'postal_code':
        return postalCode
      case 'country':
        return country
      default:
        return ''
    }
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const errorMsg = validateField(field, getFieldValue(field))
    setFieldErrors((prev) => {
      if (errorMsg) return { ...prev, [field]: errorMsg }
      const copy = { ...prev }
      delete copy[field]
      return copy
    })
  }

  const handleChange = (field: string, value: any, setter: (val: any) => void) => {
    setter(value)
    if (touched[field] || fieldErrors[field]) {
      const errorMsg = validateField(field, value)
      setFieldErrors((prev) => {
        if (errorMsg) return { ...prev, [field]: errorMsg }
        const copy = { ...prev }
        delete copy[field]
        return copy
      })
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setFieldErrors((prev) => ({ ...prev, logo: 'Logo file size must be less than 2MB.' }))
        return
      }
      setLogoFile(file)
      const previewUrl = URL.createObjectURL(file)
      setLogoPreview(previewUrl)
      setFieldErrors((prev) => {
        const copy = { ...prev }
        delete copy.logo
        return copy
      })
    }
  }

  const handleRemoveLogo = () => {
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview)
    }
    setLogoFile(null)
    setLogoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    const fieldsToValidate = [
      'company_name',
      'company_type_id',
      'email',
      'phone_number',
      'industry',
      'website',
      'owner_name',
      'address_line_1',
      'address_line_2',
      'city',
      'state',
      'postal_code',
      'country',
    ]

    const errors: Record<string, string> = {}
    fieldsToValidate.forEach((f) => {
      const err = validateField(f, getFieldValue(f))
      if (err) errors[f] = err
    })

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setTouched((prev) => ({
        ...prev,
        ...Object.fromEntries(Object.keys(errors).map((k) => [k, true])),
      }))

      // Scroll and focus first invalid input smoothly
      const firstErrorKey = Object.keys(errors)[0]
      const el = fieldRefs.current[firstErrorKey]
      if (el) {
        el.focus()
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    setLoading(true)
    setGeneralError(null)

    try {
      let res: any

      if (logoFile) {
        // Multipart FormData payload for logo file upload
        const formData = new FormData()
        formData.append('company_name', capitalizeWords(companyName.trim()))
        formData.append('company_type_id', String(companyTypeId))
        formData.append('email', email.trim())

        if (phoneNumber.trim()) {
          formData.append('phone_number', phoneNumber.trim())
        }

        if (industry.trim()) formData.append('industry', industry.trim())
        if (companySizeId) formData.append('company_size_id', String(companySizeId))
        formData.append('status', status ? '1' : '0')
        if (companyDescription.trim()) formData.append('company_description', companyDescription.trim())
        if (website.trim()) formData.append('website', website.trim())
        formData.append('logo', logoFile)
        if (ownerName.trim()) formData.append('owner_name', ownerName.trim())
        if (ownerBirthday.trim()) formData.append('owner_birthday', ownerBirthday.trim())
        if (addressLine1.trim()) formData.append('address_line_1', addressLine1.trim())
        if (addressLine2.trim()) formData.append('address_line_2', addressLine2.trim())
        if (city.trim()) formData.append('city', city.trim())
        if (state.trim()) formData.append('state', state.trim())
        if (postalCode.trim()) formData.append('postal_code', postalCode.trim())
        if (country.trim()) formData.append('country', country.trim())

        res = await companiesApi.createCompany(formData)
      } else {
        // Standard JSON payload matching official POST /api/v1/companies documentation
        const payload: CreateCompanyPayload = {
          company_name: capitalizeWords(companyName.trim()),
          company_type_id: Number(companyTypeId),
          email: email.trim(),
          phone_number: phoneNumber.trim() || undefined,
          industry: industry.trim() || undefined,
          company_size_id: companySizeId ? Number(companySizeId) : undefined,
          status: status,
          company_description: companyDescription.trim() || undefined,
          website: website.trim() || undefined,
          owner_name: ownerName.trim() || undefined,
          owner_birthday: ownerBirthday.trim() || undefined,
          address_line_1: addressLine1.trim() || undefined,
          address_line_2: addressLine2.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          postal_code: postalCode.trim() || undefined,
          country: country.trim() || undefined,
        }

        res = await companiesApi.createCompany(payload)
      }

      const createdData = res?.data?.data || res?.data

      const resultItem: CompanyLookupItem = {
        id: createdData?.id || Date.now(),
        company_name: createdData?.company_name || capitalizeWords(companyName.trim()),
        company_code: createdData?.company_code || 'CO000000',
      }

      onSuccess(resultItem)
      onClose()
    } catch (err: any) {
      console.error('Failed to create company:', err)

      // Handle backend 422 validation errors with inline field indicators
      if (err?.errors && typeof err.errors === 'object') {
        const serverFieldErrors: Record<string, string> = {}
        Object.entries(err.errors).forEach(([field, msgs]) => {
          const msg = Array.isArray(msgs) ? msgs[0] : String(msgs)
          serverFieldErrors[field] = msg
        })
        setFieldErrors(serverFieldErrors)

        const firstKey = Object.keys(serverFieldErrors)[0]
        if (firstKey && fieldRefs.current[firstKey]) {
          fieldRefs.current[firstKey]?.focus()
          fieldRefs.current[firstKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      } else {
        setGeneralError(err?.message || 'Failed to create company. Please check your inputs and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const modalContent = (
    <div
      className="modal-overlay confirm-modal-overlay animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose()
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-company-modal-title"
    >
      <div
        className="confirm-modal-card animate-scale-in"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 640,
          background: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(0, 0, 0, 0.06)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'min(94vh, 840px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
          style={{ background: '#ffffff' }}
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Building2 size={20} />
            </div>
            <div>
              <h3
                id="create-company-modal-title"
                style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-gray-900)', margin: 0 }}
              >
                Create New Company
              </h3>
              <p style={{ fontSize: 12, color: 'var(--color-gray-500)', margin: '2px 0 0' }}>
                Add complete company profile, ownership & location details
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            disabled={loading}
            aria-label="Close dialog"
            style={{
              color: 'var(--color-gray-400)',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 overflow-hidden m-0">
          <div
            className="px-6 py-4 overflow-y-auto custom-scrollbar flex-1 space-y-4"
            style={{ maxHeight: 'calc(88vh - 130px)' }}
          >
            {/* Top General Error Banner (No alert popups) */}
            {generalError && (
              <div
                className="flex items-start gap-2.5 p-3 rounded-lg text-xs animate-fade-in"
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                }}
              >
                <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-red-600" />
                <div className="flex-1">
                  <span className="font-semibold block">Failed to save company:</span>
                  <span>{generalError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setGeneralError(null)}
                  className="text-red-400 hover:text-red-700"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Logo Upload Card */}
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50/80 border border-slate-200/80">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-14 h-14 rounded-xl border border-dashed border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/30 flex items-center justify-center cursor-pointer overflow-hidden transition-all flex-shrink-0 group"
                title="Upload company logo"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-blue-600">
                    <Building2 size={20} />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">Company Logo</span>
                  <span className="text-[11px] text-slate-400">(Optional)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">PNG, JPG, or SVG up to 2MB</p>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {logoFile ? 'Change logo' : 'Upload logo'}
                  </button>
                  {logoFile && (
                    <>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="text-[11px] font-medium text-red-500 hover:text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
                {fieldErrors.logo && (
                  <div className="field-error-msg">
                    <AlertCircle size={12} />
                    <span>{fieldErrors.logo}</span>
                  </div>
                )}
              </div>
            </div>

            {/* General Info Grid */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Company Name (Required, max 255) */}
              <div className="form-group col-span-2">
                <label className="form-label text-xs font-semibold">
                  Company Name <span className="text-danger">*</span>
                </label>
                <input
                  ref={(el) => { fieldRefs.current['company_name'] = el }}
                  type="text"
                  maxLength={255}
                  className={`form-input form-input-sm ${
                    fieldErrors.company_name
                      ? 'input-error'
                      : touched.company_name
                      ? 'input-valid'
                      : ''
                  }`}
                  placeholder="e.g. Zenith Tech Solutions"
                  value={companyName}
                  onChange={(e) => handleChange('company_name', e.target.value, setCompanyName)}
                  onBlur={() => handleBlur('company_name')}
                />
                {fieldErrors.company_name && (
                  <div className="field-error-msg">
                    <AlertCircle size={12} />
                    <span>{fieldErrors.company_name}</span>
                  </div>
                )}
              </div>

              {/* Company Type (Required, ID) */}
              <div className="form-group">
                <label className="form-label text-xs font-semibold">
                  Company Type <span className="text-danger">*</span>
                </label>
                <select
                  ref={(el) => { fieldRefs.current['company_type_id'] = el }}
                  className={`form-select form-input-sm w-full text-xs ${
                    fieldErrors.company_type_id
                      ? 'input-error'
                      : touched.company_type_id
                      ? 'input-valid'
                      : ''
                  }`}
                  value={companyTypeId}
                  onChange={(e) =>
                    handleChange('company_type_id', e.target.value, setCompanyTypeId)
                  }
                  onBlur={() => handleBlur('company_type_id')}
                  disabled={loadingMeta}
                >
                  <option value="" disabled>
                    {loadingMeta ? 'Loading types...' : 'Select company type...'}
                  </option>
                  {availableTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.company_type_id && (
                  <div className="field-error-msg">
                    <AlertCircle size={12} />
                    <span>{fieldErrors.company_type_id}</span>
                  </div>
                )}
              </div>

              {/* Company Size (Optional, ID) */}
              <div className="form-group">
                <label className="form-label text-xs font-medium">Company Size</label>
                <select
                  ref={(el) => { fieldRefs.current['company_size_id'] = el }}
                  className="form-select form-input-sm w-full text-xs"
                  value={companySizeId}
                  onChange={(e) => setCompanySizeId(e.target.value)}
                  disabled={loadingMeta}
                >
                  <option value="">
                    {loadingMeta ? 'Loading sizes...' : 'Select company size (optional)'}
                  </option>
                  {availableSizes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.company_size_id && (
                  <div className="field-error-msg">
                    <AlertCircle size={12} />
                    <span>{fieldErrors.company_size_id}</span>
                  </div>
                )}
              </div>

              {/* Email Address (Required, max 255) */}
              <div className="form-group">
                <label className="form-label text-xs font-semibold">
                  Email Address <span className="text-danger">*</span>
                </label>
                <input
                  ref={(el) => { fieldRefs.current['email'] = el }}
                  type="email"
                  maxLength={255}
                  className={`form-input form-input-sm ${
                    fieldErrors.email
                      ? 'input-error'
                      : touched.email
                      ? 'input-valid'
                      : ''
                  }`}
                  placeholder="hello@zenithtech.io"
                  value={email}
                  onChange={(e) => handleChange('email', e.target.value, setEmail)}
                  onBlur={() => handleBlur('email')}
                />
                {fieldErrors.email && (
                  <div className="field-error-msg">
                    <AlertCircle size={12} />
                    <span>{fieldErrors.email}</span>
                  </div>
                )}
              </div>

              {/* Phone Number (Optional, max 50) */}
              <div className="form-group">
                <label className="form-label text-xs font-medium">Phone Number</label>
                <input
                  ref={(el) => { fieldRefs.current['phone_number'] = el }}
                  type="tel"
                  maxLength={50}
                  className={`form-input form-input-sm ${
                    fieldErrors.phone_number ? 'input-error' : ''
                  }`}
                  placeholder="+94 11 999 8888"
                  value={phoneNumber}
                  onChange={(e) =>
                    handleChange('phone_number', e.target.value, setPhoneNumber)
                  }
                  onBlur={() => handleBlur('phone_number')}
                />
                {fieldErrors.phone_number && (
                  <div className="field-error-msg">
                    <AlertCircle size={12} />
                    <span>{fieldErrors.phone_number}</span>
                  </div>
                )}
              </div>

              {/* Industry (Optional, max 100) */}
              <div className="form-group">
                <label className="form-label text-xs font-medium">Industry</label>
                <input
                  ref={(el) => { fieldRefs.current['industry'] = el }}
                  type="text"
                  maxLength={100}
                  className={`form-input form-input-sm ${
                    fieldErrors.industry ? 'input-error' : ''
                  }`}
                  placeholder="e.g. Information Technology"
                  value={industry}
                  onChange={(e) => handleChange('industry', e.target.value, setIndustry)}
                  onBlur={() => handleBlur('industry')}
                />
                {fieldErrors.industry && (
                  <div className="field-error-msg">
                    <AlertCircle size={12} />
                    <span>{fieldErrors.industry}</span>
                  </div>
                )}
              </div>

              {/* Website (Optional, max 255) */}
              <div className="form-group">
                <label className="form-label text-xs font-medium">Website</label>
                <input
                  ref={(el) => { fieldRefs.current['website'] = el }}
                  type="url"
                  maxLength={255}
                  className={`form-input form-input-sm ${
                    fieldErrors.website ? 'input-error' : ''
                  }`}
                  placeholder="https://zenithtech.io"
                  value={website}
                  onChange={(e) => handleChange('website', e.target.value, setWebsite)}
                  onBlur={() => handleBlur('website')}
                />
                {fieldErrors.website && (
                  <div className="field-error-msg">
                    <AlertCircle size={12} />
                    <span>{fieldErrors.website}</span>
                  </div>
                )}
              </div>

              {/* Company Description (Optional) */}
              <div className="form-group col-span-2">
                <label className="form-label text-xs font-medium">Company Description</label>
                <textarea
                  className="form-textarea text-xs w-full rounded-md border-gray-300 p-2.5"
                  rows={2}
                  placeholder="Cloud and cybersecurity consulting services..."
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  style={{ minHeight: 64, resize: 'vertical' }}
                />
              </div>

              {/* Status Switch (Optional, defaults to true) */}
              <div className="col-span-2 flex items-center justify-between p-3 rounded-xl bg-slate-50/90 border border-slate-200/80">
                <div>
                  <span className="text-xs font-semibold text-slate-800">Company Status</span>
                  <p className="text-[11px] text-slate-500">
                    Active companies can immediately be associated with contacts & deals
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={status}
                    onChange={(e) => setStatus(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                  <span
                    className={`ml-2 text-xs font-semibold ${
                      status ? 'text-primary-700' : 'text-slate-400'
                    }`}
                  >
                    {status ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>
            </div>

            {/* Section: Ownership Details */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 mb-2.5">
                <User size={13} className="text-primary-600" />
                <span>Ownership Information</span>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                {/* Owner Name (Optional, max 255) */}
                <div className="form-group">
                  <label className="form-label text-xs font-medium">Owner Name</label>
                  <input
                    ref={(el) => { fieldRefs.current['owner_name'] = el }}
                    type="text"
                    maxLength={255}
                    className={`form-input form-input-sm ${
                      fieldErrors.owner_name ? 'input-error' : ''
                    }`}
                    placeholder="e.g. Marcus Aurelius"
                    value={ownerName}
                    onChange={(e) => handleChange('owner_name', e.target.value, setOwnerName)}
                    onBlur={() => handleBlur('owner_name')}
                  />
                  {fieldErrors.owner_name && (
                    <div className="field-error-msg">
                      <AlertCircle size={12} />
                      <span>{fieldErrors.owner_name}</span>
                    </div>
                  )}
                </div>

                {/* Owner Birthday (Optional, format YYYY-MM-DD) */}
                <div className="form-group">
                  <label className="form-label text-xs font-medium">Owner Birthday</label>
                  <input
                    ref={(el) => { fieldRefs.current['owner_birthday'] = el }}
                    type="date"
                    className={`form-input form-input-sm ${
                      fieldErrors.owner_birthday ? 'input-error' : ''
                    }`}
                    value={ownerBirthday}
                    onChange={(e) => setOwnerBirthday(e.target.value)}
                  />
                  {fieldErrors.owner_birthday && (
                    <div className="field-error-msg">
                      <AlertCircle size={12} />
                      <span>{fieldErrors.owner_birthday}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section: Address & Location */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 mb-2.5">
                <MapPin size={13} className="text-primary-600" />
                <span>Address & Location</span>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                {/* Address Line 1 (Optional, max 255) */}
                <div className="form-group col-span-2">
                  <label className="form-label text-xs font-medium">Address Line 1</label>
                  <input
                    ref={(el) => { fieldRefs.current['address_line_1'] = el }}
                    type="text"
                    maxLength={255}
                    className={`form-input form-input-sm ${
                      fieldErrors.address_line_1 ? 'input-error' : ''
                    }`}
                    placeholder="e.g. Suite 500, Cyber Tower"
                    value={addressLine1}
                    onChange={(e) =>
                      handleChange('address_line_1', e.target.value, setAddressLine1)
                    }
                    onBlur={() => handleBlur('address_line_1')}
                  />
                  {fieldErrors.address_line_1 && (
                    <div className="field-error-msg">
                      <AlertCircle size={12} />
                      <span>{fieldErrors.address_line_1}</span>
                    </div>
                  )}
                </div>

                {/* Address Line 2 (Optional, max 255) */}
                <div className="form-group col-span-2">
                  <label className="form-label text-xs font-medium">Address Line 2</label>
                  <input
                    ref={(el) => { fieldRefs.current['address_line_2'] = el }}
                    type="text"
                    maxLength={255}
                    className={`form-input form-input-sm ${
                      fieldErrors.address_line_2 ? 'input-error' : ''
                    }`}
                    placeholder="e.g. Silicon Boulevard (Optional)"
                    value={addressLine2}
                    onChange={(e) =>
                      handleChange('address_line_2', e.target.value, setAddressLine2)
                    }
                    onBlur={() => handleBlur('address_line_2')}
                  />
                  {fieldErrors.address_line_2 && (
                    <div className="field-error-msg">
                      <AlertCircle size={12} />
                      <span>{fieldErrors.address_line_2}</span>
                    </div>
                  )}
                </div>

                {/* City (Optional, max 100) */}
                <div className="form-group">
                  <label className="form-label text-xs font-medium">City</label>
                  <input
                    ref={(el) => { fieldRefs.current['city'] = el }}
                    type="text"
                    maxLength={100}
                    className={`form-input form-input-sm ${
                      fieldErrors.city ? 'input-error' : ''
                    }`}
                    placeholder="e.g. Colombo"
                    value={city}
                    onChange={(e) => handleChange('city', e.target.value, setCity)}
                    onBlur={() => handleBlur('city')}
                  />
                  {fieldErrors.city && (
                    <div className="field-error-msg">
                      <AlertCircle size={12} />
                      <span>{fieldErrors.city}</span>
                    </div>
                  )}
                </div>

                {/* State (Optional, max 100) */}
                <div className="form-group">
                  <label className="form-label text-xs font-medium">State / Province</label>
                  <input
                    ref={(el) => { fieldRefs.current['state'] = el }}
                    type="text"
                    maxLength={100}
                    className={`form-input form-input-sm ${
                      fieldErrors.state ? 'input-error' : ''
                    }`}
                    placeholder="e.g. Western Province"
                    value={state}
                    onChange={(e) => handleChange('state', e.target.value, setState)}
                    onBlur={() => handleBlur('state')}
                  />
                  {fieldErrors.state && (
                    <div className="field-error-msg">
                      <AlertCircle size={12} />
                      <span>{fieldErrors.state}</span>
                    </div>
                  )}
                </div>

                {/* Postal Code (Optional, max 50) */}
                <div className="form-group">
                  <label className="form-label text-xs font-medium">Postal Code</label>
                  <input
                    ref={(el) => { fieldRefs.current['postal_code'] = el }}
                    type="text"
                    maxLength={50}
                    className={`form-input form-input-sm ${
                      fieldErrors.postal_code ? 'input-error' : ''
                    }`}
                    placeholder="e.g. 00100"
                    value={postalCode}
                    onChange={(e) => handleChange('postal_code', e.target.value, setPostalCode)}
                    onBlur={() => handleBlur('postal_code')}
                  />
                  {fieldErrors.postal_code && (
                    <div className="field-error-msg">
                      <AlertCircle size={12} />
                      <span>{fieldErrors.postal_code}</span>
                    </div>
                  )}
                </div>

                {/* Country (Optional, max 100) */}
                <div className="form-group">
                  <label className="form-label text-xs font-medium">Country</label>
                  <input
                    ref={(el) => { fieldRefs.current['country'] = el }}
                    type="text"
                    maxLength={100}
                    className={`form-input form-input-sm ${
                      fieldErrors.country ? 'input-error' : ''
                    }`}
                    placeholder="e.g. Sri Lanka"
                    value={country}
                    onChange={(e) => handleChange('country', e.target.value, setCountry)}
                    onBlur={() => handleBlur('country')}
                  />
                  {fieldErrors.country && (
                    <div className="field-error-msg">
                      <AlertCircle size={12} />
                      <span>{fieldErrors.country}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-gray-100 bg-gray-50/70"
            style={{ borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}
          >
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
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Create & Select Company</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent
}
