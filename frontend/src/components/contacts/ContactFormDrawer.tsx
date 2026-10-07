import React, { useState, useEffect } from 'react'
import {
  Camera,
  User,
  Building2,
  MapPin,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  MessageCircle,
  Star,
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
import { capitalizeWords } from '@/lib/utils'

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
    { country_code: '+94', number: '', type: 'Mobile', is_primary: true, is_whatsapp: false, notes: '' }
  ])

  // Multi Websites & Social State
  const [sites, setSites] = useState<SiteInputState[]>([
    { name: 'Website', url: '', status: true }
  ])

  // Validation errors
  const [emailError, setEmailError] = useState<string | null>(null)
  const [touched, setTouched] = useState({ email: false })

  // Company Selection (ID and Name)
  const [companyId, setCompanyId] = useState<number | undefined>(undefined)
  const [companyName, setCompanyName] = useState<string>('')

  // Address & Details
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  // Avatar
  const [avatar, setAvatar] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  )

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

  // Sync state when contact prop changes
  useEffect(() => {
    if (contact) {
      const defaultName = contact.full_name || contact.name || ''
      const nameParts = defaultName.split(' ')
      setFirstName(contact.first_name || nameParts[0] || '')
      setLastName(contact.last_name || nameParts.slice(1).join(' ') || '')
      setDesignation(contact.designation || '')
      setEmail(contact.email || '')

      let parsedPhones: PhoneNumberInputState[] = []
      if (contact.phone_numbers && contact.phone_numbers.length > 0) {
        const hasExplicitPrimary = contact.phone_numbers.some((p) => p.is_primary)
        parsedPhones = contact.phone_numbers.map((p, idx) => {
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
          }
        ]
      }

      if (parsedPhones.length === 0) {
        parsedPhones = [{ country_code: '+94', number: '', type: 'Mobile', is_primary: true, is_whatsapp: false, notes: '' }]
      }
      setPhoneNumbers(parsedPhones)

      // Parse Sites / Websites & Social links
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

      setDateOfBirth(contact.date_of_birth || contact.birthday || '')
      setStatus(contact.status === 'Inactive' ? 'Inactive' : 'Active')

      // Company
      const compId =
        contact.company_id ||
        (contact.company && typeof contact.company === 'object' ? contact.company.id : undefined)
      const compName =
        contact.company_name ||
        (typeof contact.company === 'string' ? contact.company : contact.company?.company_name) ||
        ''

      setCompanyId(compId)
      setCompanyName(compName)

      setAddress(contact.address || '')
      setNotes(contact.notes || '')
      setAvatar(
        contact.avatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      )
    } else {
      // Defaults for Create New Contact
      setFirstName('')
      setLastName('')
      setDesignation('')
      setEmail('')
      setPhoneNumbers([{ country_code: '+94', number: '', type: 'Mobile', is_primary: true, is_whatsapp: false, notes: '' }])
      setSites([{ name: 'Website', url: '', status: true }])
      setDateOfBirth('')
      setStatus('Active')
      setCompanyId(undefined)
      setCompanyName('')
      setAddress('')
      setNotes('')
      setAvatar(
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      )
    }
  }, [contact, isOpen])

  const handleCompanyChange = (id: number | undefined, comp: CompanyLookupItem | null) => {
    setCompanyId(id)
    setCompanyName(comp ? comp.company_name : '')
  }

  const handleEmailBlur = () => {
    setTouched((t) => ({ ...t, email: true }))
    setEmailError(validateEmail(email))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const eErr = validateEmail(email)
    setEmailError(eErr)
    setTouched({ email: true })

    if (!firstName.trim() || !lastName.trim()) {
      alert('Please fill in required fields: First Name and Last Name')
      return
    }
    if (eErr) return

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
      alert(error?.message || 'Failed to save contact')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SlideDrawer
      isOpen={isOpen}
      onClose={onClose}
      width="680px"
      title={
        <div className="flex items-center gap-2">
          <User size={18} className="text-primary-600" />
          <span>{isEdit ? 'Edit Contact' : 'Create Contact'}</span>
        </div>
      }
      subtitle={
        isEdit
          ? `Update profile and company association for ${contact?.full_name || contact?.name || 'contact'}`
          : 'Fill in the contact information and assign to an active company.'
      }
      className="contact-form-drawer"
    >
      <form onSubmit={handleSubmit} className="contact-form-panel">
        {/* Profile Card / Avatar Bar */}
        <div className="contact-form-profile-bar">
          <div className="relative">
            <img
              src={avatar}
              alt="Profile avatar"
              className="contact-form-avatar"
            />
            <label className="contact-form-avatar-edit" title="Change photo">
              <Camera size={14} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const reader = new FileReader()
                    reader.onload = (ev) => {
                      if (ev.target?.result) {
                        setAvatar(ev.target.result as string)
                      }
                    }
                    reader.readAsDataURL(e.target.files[0])
                  }
                }}
              />
            </label>
          </div>

          <div className="contact-form-profile-info">
            <h4 className="contact-form-profile-name">
              {firstName || lastName
                ? capitalizeWords(`${firstName} ${lastName}`.trim())
                : 'New Customer Contact'}
            </h4>
            <p className="contact-form-profile-desc">
              {designation ? capitalizeWords(designation) : 'Designation / Role'}
              {companyName ? ` • ${capitalizeWords(companyName)}` : ''}
            </p>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="contact-form-grid">
          {/* Column 1: Personal / Contact Information */}
          <div className="contact-form-column">
            <div className="contact-form-card">
              <div className="contact-form-section-title">
                <User size={16} />
                <span>Contact Information</span>
              </div>

              <div className="contact-form-two-col">
                <div className="form-group">
                  <label className="form-label">
                    First Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Sarah"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Last Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Connor"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Designation / Role</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Chief Operations Officer"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Email Address <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  required
                  className={`form-input ${touched.email && emailError ? 'input-error' : touched.email && !emailError ? 'input-valid' : ''}`}
                  placeholder="sarah.c@apexlogistics.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (touched.email) setEmailError(validateEmail(e.target.value)) }}
                  onBlur={handleEmailBlur}
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
                  <label className="form-label font-semibold text-gray-700 m-0">
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
                          value={pItem.type || 'Work'}
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
                              name="primary_phone_select_form"
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
                            placeholder="Note (e.g. Executive Line)"
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
                  <label className="form-label font-semibold text-gray-700 m-0 text-xs">
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
                      {/* Type Dropdown */}
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
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  className="form-input"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
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

          {/* Column 2: Company Association & Address Details */}
          <div className="contact-form-column">
            {/* Section: Company Association */}
            <div className="contact-form-card">
              <div className="contact-form-section-title">
                <Building2 size={16} />
                <span>Company Association</span>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Associated Company <span className="text-danger">*</span>
                </label>
                <CompanySelect
                  value={companyId}
                  companyName={companyName}
                  onChange={handleCompanyChange}
                  placeholder="Select or search active company..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Select an active company or click &ldquo;+ Create New Company&rdquo; to add a new one.
                </p>
              </div>
            </div>

            {/* Section: Address & Location */}
            <div className="contact-form-card">
              <div className="contact-form-section-title">
                <MapPin size={16} />
                <span>Location & Address</span>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 45 Colombo Business Tower"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            {/* Section: Notes */}
            <div className="contact-form-card">
              <div className="flex justify-between items-center mb-1.5">
                <label className="form-label mb-0">Notes</label>
                <span className="text-xs text-muted">{notes.length}/500</span>
              </div>
              <textarea
                className="form-textarea"
                rows={3}
                maxLength={500}
                placeholder="Add any internal notes about this contact..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="contact-form-footer">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving Contact...</span>
              </>
            ) : (
              <span>{isEdit ? 'Save Changes' : 'Create Contact'}</span>
            )}
          </button>
        </div>
      </form>
    </SlideDrawer>
  )
}
