import React, { useState, useEffect } from 'react'
import {
  Camera,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  MessageCircle,
  Star,
  Save,
} from 'lucide-react'
import type {
  Contact,
  CreateContactPayload,
  UpdateContactPayload,
  ContactPhoneNumber,
  ContactSite,
} from '@/apis/contactsApi'
import type { PhoneNumberInputState, SiteInputState } from './ContactViewDrawer'
import type { CompanyLookupItem } from '@/apis/companiesApi'
import SlideDrawer from '@/components/common/SlideDrawer'
import StatusToggle from '@/components/common/StatusToggle'
import CompanySelect from '@/components/companies/CompanySelect'
import PhoneInput, { validateEmail } from '@/components/common/PhoneInput'
import { capitalizeWords, getAvatarUrl, DEFAULT_AVATAR } from '@/lib/utils'

interface ContactFormDrawerProps {
  isOpen: boolean
  onClose: () => void
  contact?: Contact | null // If null, mode is Create; otherwise Edit
  onSubmit: (payload: CreateContactPayload | UpdateContactPayload, isEdit: boolean) => Promise<void>
}

export default function ContactFormDrawer({
  isOpen,
  onClose,
  contact,
  onSubmit,
}: ContactFormDrawerProps) {
  const isEdit = Boolean(contact && contact.id)
  const [loading, setLoading] = useState(false)

  // Basic Information
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [designation, setDesignation] = useState('')
  const [email, setEmail] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active')

  // Multi Phone Numbers State
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberInputState[]>([
    { country_code: '+94', number: '', type: 'Mobile', is_primary: true, is_whatsapp: false, notes: '' },
  ])

  // Multi Websites & Social State
  const [sites, setSites] = useState<SiteInputState[]>([
    { name: 'Website', url: '', status: true },
  ])

  // Validation errors
  const [firstNameError, setFirstNameError] = useState<string | null>(null)
  const [lastNameError, setLastNameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [touched, setTouched] = useState({ email: false, firstName: false, lastName: false })

  // Company Selection (ID and Name)
  const [companyId, setCompanyId] = useState<number | undefined>(undefined)
  const [companyName, setCompanyName] = useState<string>('')

  // Address & Details
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  // Avatar
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR)

  const handleAddPhoneNumber = () => {
    setPhoneNumbers((prev) => [
      ...prev,
      { country_code: '+94', number: '', type: 'Work', is_primary: prev.length === 0, is_whatsapp: false, notes: '' },
    ])
  }

  const handleRemovePhoneNumber = (index: number) => {
    setPhoneNumbers((prev) => {
      if (prev.length <= 1) return prev
      const updated = prev.filter((_, i) => i !== index)
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

  const handleCompanyChange = (id: number | undefined, comp: CompanyLookupItem | null) => {
    setCompanyId(id)
    setCompanyName(comp ? comp.company_name : '')
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setAvatar(ev.target.result as string)
        }
      }
      reader.readAsDataURL(e.target.files[0])
    }
  }

  // Populate or reset form when drawer opens or contact changes
  useEffect(() => {
    if (contact && isOpen) {
      const fullName =
        contact.full_name ||
        contact.name ||
        `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
      const nameParts = fullName.split(' ')
      setFirstName(contact.first_name || nameParts[0] || '')
      setLastName(contact.last_name || nameParts.slice(1).join(' ') || '')
      setDesignation(contact.designation || '')
      setEmail(contact.email || '')

      // Parse phone numbers
      let parsedPhones: PhoneNumberInputState[] = []
      if (contact.phone_numbers && contact.phone_numbers.length > 0) {
        const hasExplicitPrimary = contact.phone_numbers.some((p) => p.is_primary)
        parsedPhones = contact.phone_numbers.map((p, idx) => {
          const cCode = p.country_code || '+94'
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
      } else if (contact.phone) {
        const match = contact.phone.match(/^(\+\d+)\s*(.*)$/)
        parsedPhones = [
          {
            country_code: match ? match[1] : '+94',
            number: match ? match[2] : contact.phone,
            type: 'Mobile',
            is_primary: true,
            is_whatsapp: false,
            notes: '',
          },
        ]
      }
      if (parsedPhones.length === 0) {
        parsedPhones = [
          { country_code: '+94', number: '', type: 'Mobile', is_primary: true, is_whatsapp: false, notes: '' },
        ]
      }
      setPhoneNumbers(parsedPhones)

      // Parse sites
      let parsedSites: SiteInputState[] = []
      if (contact.sites && Array.isArray(contact.sites) && contact.sites.length > 0) {
        parsedSites = contact.sites.map((s) => ({
          id: s.id,
          name: s.name || 'Website',
          url: s.url || '',
          status: s.status !== false,
        }))
      } else if (contact.company_web || contact.website) {
        parsedSites = [{ name: 'Website', url: contact.company_web || contact.website || '', status: true }]
      }
      if (parsedSites.length === 0) {
        parsedSites = [{ name: 'Website', url: '', status: true }]
      }
      setSites(parsedSites)

      const compId =
        contact.company_id || (contact.company && typeof contact.company === 'object' ? contact.company.id : undefined)
      const compName =
        contact.company_name ||
        (typeof contact.company === 'string' ? contact.company : contact.company?.company_name) ||
        ''
      setCompanyId(compId)
      setCompanyName(compName)
      setAddress(contact.address || '')
      setDateOfBirth(contact.date_of_birth || contact.birthday || '')
      setStatus(contact.status === 'Inactive' ? 'Inactive' : 'Active')
      setNotes(contact.notes || '')
      setAvatar(getAvatarUrl(contact.avatar))
      setFirstNameError(null)
      setLastNameError(null)
      setEmailError(null)
      setValidationError(null)
      setTouched({ email: false, firstName: false, lastName: false })
    } else if (isOpen && !contact) {
      // Defaults for Create New Contact
      setAvatar(DEFAULT_AVATAR)
      setFirstName('')
      setLastName('')
      setDesignation('')
      setEmail('')
      setPhoneNumbers([
        { country_code: '+94', number: '', type: 'Mobile', is_primary: true, is_whatsapp: false, notes: '' },
      ])
      setSites([
        { name: 'Website', url: '', status: true },
      ])
      setDateOfBirth('')
      setStatus('Active')
      setCompanyId(undefined)
      setCompanyName('')
      setAddress('')
      setNotes('')
      setFirstNameError(null)
      setLastNameError(null)
      setEmailError(null)
      setValidationError(null)
      setTouched({ email: false, firstName: false, lastName: false })
    }
  }, [contact, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const eErr = validateEmail(email)
    setEmailError(eErr)
    setTouched((t) => ({ ...t, email: true, firstName: true, lastName: true }))

    let hasErr = false
    if (!firstName.trim()) {
      setFirstNameError('First name is required.')
      hasErr = true
    } else {
      setFirstNameError(null)
    }

    if (!lastName.trim()) {
      setLastNameError('Last name is required.')
      hasErr = true
    } else {
      setLastNameError(null)
    }

    if (hasErr || eErr) {
      if (!firstName.trim() || !lastName.trim()) {
        setValidationError('Please fill in required fields: First Name and Last Name')
      } else if (eErr) {
        setValidationError(eErr)
      }
      return
    }

    setValidationError(null)

    const validPhones = phoneNumbers.filter((p) => p.number.trim() !== '')
    const hasExplicitPrimary = validPhones.some((p) => p.is_primary)
    const formattedPhoneNumbers: ContactPhoneNumber[] = validPhones.map((p, idx) => ({
      id: p.id,
      company_id: companyId,
      customer_id: contact?.customer_id || 1,
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

    const payload: CreateContactPayload = {
      company_id: companyId,
      customer_id: contact?.customer_id || 1,
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

    setLoading(true)
    try {
      await onSubmit(payload, isEdit)
      onClose()
    } catch (error: any) {
      setValidationError(error?.message || 'Failed to save contact')
    } finally {
      setLoading(false)
    }
  }

  const displayName = firstName || lastName
    ? capitalizeWords(`${firstName} ${lastName}`.trim())
    : 'New Contact'

  return (
    <SlideDrawer
      isOpen={isOpen}
      onClose={onClose}
      width="620px"
      title=""
      subtitle=""
      className="contact-view-drawer contact-form-drawer"
      hideHeader
    >
      <form onSubmit={handleSubmit} noValidate className="cvd-panel">
        {/* ── HERO HEADER ── */}
        <div className="cvd-hero">
          {/* Avatar */}
          <div className="cvd-avatar-wrap">
            <img
              className="cvd-avatar"
              src={getAvatarUrl(avatar)}
              alt={displayName}
            />
            <label className="cvd-avatar-camera" title="Change photo">
              <Camera size={11} />
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </label>
          </div>

          {/* Name + Meta */}
          <div className="cvd-hero-info">
            <div className="cvd-name-edit-row">
              <input
                type="text"
                className={`form-input form-input-sm ${firstNameError ? 'input-error' : ''}`}
                placeholder="First Name *"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value)
                  if (firstNameError && e.target.value.trim()) setFirstNameError(null)
                  if (validationError) setValidationError(null)
                }}
                style={{ maxWidth: 140 }}
              />
              <input
                type="text"
                className={`form-input form-input-sm ${lastNameError ? 'input-error' : ''}`}
                placeholder="Last Name *"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value)
                  if (lastNameError && e.target.value.trim()) setLastNameError(null)
                  if (validationError) setValidationError(null)
                }}
                style={{ maxWidth: 140 }}
              />
            </div>
            <p className="cvd-subtitle">
              {designation
                ? `${capitalizeWords(designation)}${companyName ? ` at ${capitalizeWords(companyName)}` : ''}`
                : companyName
                ? `Associated with ${capitalizeWords(companyName)}`
                : 'Designation / Role'}
            </p>
          </div>

          {/* Close button top-right */}
          <button type="button" className="cvd-close-btn" onClick={onClose} title="Close">
            <span style={{ fontSize: 18, lineHeight: 1, color: '#94a3b8' }}>×</span>
          </button>
        </div>

        {/* ── ACTION BAR ── */}
        <div className="cvd-edit-bar">
          <div className="flex items-center gap-2">
            <span className="contact-edit-badge">{isEdit ? 'Edit Mode' : 'Create Mode'}</span>
            <span className="text-xs text-gray-500">
              {isEdit
                ? `Updating ${firstName || ''} ${lastName || ''}`.trim()
                : 'New Contact'}
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
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              <span>{isEdit ? 'Save Changes' : 'Create Contact'}</span>
            </button>
          </div>
        </div>

        {/* Validation error */}
        {validationError && (
          <div className="cvd-validation-error">
            <AlertCircle size={13} />
            <span>{validationError}</span>
          </div>
        )}

        {/* ── TAB BAR ── */}
        <div className="cvd-tabs">
          <button type="button" className="cvd-tab cvd-tab-active">
            {isEdit ? 'Edit Information' : 'Contact Information'}
          </button>
        </div>

        {/* ── BODY ── */}
        <div className="cvd-body">
          <div className="cvd-tab-pane">
            {/* CONTACT INFORMATION CARD */}
            <div className="cvd-card">
              <div className="cvd-card-header">
                <span className="cvd-card-title">Contact Information</span>
              </div>

              <div className="space-y-3.5 pt-1">
                {/* Designation & Associated Company */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group min-w-0">
                    <label className="form-label text-xs">Designation / Role</label>
                    <input
                      type="text"
                      className="form-input form-input-sm min-w-0"
                      placeholder="e.g. Chief Operations Officer"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                    />
                  </div>
                  <div className="form-group min-w-0">
                    <label className="form-label text-xs">
                      Associated Company <span className="text-danger">*</span>
                    </label>
                    <CompanySelect
                      value={companyId}
                      companyName={companyName}
                      onChange={handleCompanyChange}
                      placeholder="Select active company..."
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="form-group">
                  <label className="form-label text-xs">
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className={`form-input form-input-sm ${touched.email && emailError ? 'input-error' : touched.email && !emailError ? 'input-valid' : ''}`}
                    placeholder="sarah.c@apexlogistics.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (touched.email) setEmailError(validateEmail(e.target.value))
                      if (validationError) setValidationError(null)
                    }}
                    onBlur={() => {
                      setTouched((t) => ({ ...t, email: true }))
                      setEmailError(validateEmail(email))
                    }}
                    autoComplete="email"
                  />
                  {touched.email && emailError && (
                    <div className="field-error-msg">
                      <AlertCircle size={12} />
                      <span>{emailError}</span>
                    </div>
                  )}
                </div>

                {/* Phone Numbers */}
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
                            <label className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-all select-none ${
                              pItem.is_primary
                                ? 'bg-blue-100/80 text-blue-700 border border-blue-300 font-semibold'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}>
                              <input
                                type="radio"
                                name="primary_phone_select_create_form"
                                checked={pItem.is_primary}
                                onChange={() => handleSetPrimaryPhone(idx)}
                                className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                              />
                              <Star size={13} className={pItem.is_primary ? 'text-blue-600 fill-blue-600' : 'text-slate-400'} />
                              <span>Primary</span>
                            </label>

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

                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="text"
                              className="form-input form-input-sm text-xs py-0.5 px-2 w-32 sm:w-40 min-w-0 bg-white border-slate-200"
                              placeholder="Note (e.g. Executive Hotline)"
                              value={pItem.notes || ''}
                              onChange={(e) => handlePhoneNotesChange(idx, e.target.value)}
                            />

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

                {/* Websites & Social Media */}
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

                        <input
                          type="url"
                          className="form-input form-input-sm flex-1 min-w-0 text-xs bg-white"
                          placeholder="https://facebook.com/user or URL..."
                          value={sItem.url}
                          onChange={(e) => handleSiteUrlChange(idx, e.target.value)}
                        />

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

                {/* Address */}
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

                {/* Date of Birth */}
                <div className="form-group">
                  <label className="form-label text-xs">Date of Birth</label>
                  <input
                    type="date"
                    className="form-input form-input-sm"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>

                {/* Status */}
                <div className="form-group">
                  <label className="form-label text-xs">Status</label>
                  <div className="pt-1">
                    <StatusToggle status={status} onChange={setStatus} isEditing={true} size="md" />
                  </div>
                </div>


              </div>
            </div>
          </div>
        </div>
      </form>
    </SlideDrawer>
  )
}
