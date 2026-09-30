import React, { useState, useEffect } from 'react'
import {
  Camera,
  User,
  Building2,
  MapPin,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import type {
  Contact,
  CreateContactPayload,
  UpdateContactPayload,
  ContactDocument,
} from '@/apis/contactsApi'
import type { CompanyLookupItem } from '@/apis/companiesApi'
import SlideDrawer from '@/components/common/SlideDrawer'
import StatusToggle from '@/components/common/StatusToggle'
import CompanySelect from '@/components/companies/CompanySelect'
import PhoneInput, { validatePhone, validateEmail } from '@/components/common/PhoneInput'
import { capitalizeWords } from '@/lib/utils'

interface ContactFormDrawerProps {
  isOpen: boolean
  onClose: () => void
  contact?: Contact | null // If null, mode is Create; otherwise Edit
  onSubmit: (payload: CreateContactPayload | UpdateContactPayload, isEdit: boolean) => Promise<void>
}

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
  const [phoneCountryCode, setPhoneCountryCode] = useState('+94')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active')

  // Validation errors
  const [emailError, setEmailError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [touched, setTouched] = useState({ email: false, phone: false })

  // Company Selection (ID and Name)
  const [companyId, setCompanyId] = useState<number | undefined>(undefined)
  const [companyName, setCompanyName] = useState<string>('')

  // Address & Details
  const [address, setAddress] = useState('')
  const [state, setState] = useState('Western Province')
  const [country, setCountry] = useState('Sri Lanka')
  const [notes, setNotes] = useState('')

  // Documents
  const [documents, setDocuments] = useState<ContactDocument[]>([])

  // Avatar
  const [avatar, setAvatar] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  )

  // Sync state when contact prop changes
  useEffect(() => {
    if (contact) {
      const defaultName = contact.full_name || contact.name || ''
      const nameParts = defaultName.split(' ')
      setFirstName(contact.first_name || nameParts[0] || '')
      setLastName(contact.last_name || nameParts.slice(1).join(' ') || '')
      setDesignation(contact.designation || '')
      setEmail(contact.email || '')

      if (contact.phone) {
        const phoneMatch = contact.phone.match(/^(\+\d+)\s*(.*)$/)
        if (phoneMatch) {
          setPhoneCountryCode(phoneMatch[1])
          setPhone(phoneMatch[2])
        } else {
          setPhone(contact.phone)
        }
      } else {
        setPhone('')
      }

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
      setState(contact.state || 'Western Province')
      setCountry(contact.country || 'Sri Lanka')
      setNotes(contact.notes || '')
      setDocuments(contact.documents || [])
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
      setPhone('')
      setPhoneCountryCode('+94')
      setDateOfBirth('')
      setStatus('Active')
      setCompanyId(undefined)
      setCompanyName('')
      setAddress('')
      setState('Western Province')
      setCountry('Sri Lanka')
      setNotes('')
      setDocuments([])
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

  const handlePhoneBlur = () => {
    setTouched((t) => ({ ...t, phone: true }))
    setPhoneError(validatePhone(phone, phoneCountryCode))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Force validate both fields
    const eErr = validateEmail(email)
    const pErr = validatePhone(phone, phoneCountryCode)
    setEmailError(eErr)
    setPhoneError(pErr)
    setTouched({ email: true, phone: true })

    if (!firstName.trim() || !lastName.trim()) {
      alert('Please fill in required fields: First Name and Last Name')
      return
    }
    if (eErr || pErr) return

    const formattedPhone = phone.trim()
      ? `${phoneCountryCode} ${phone.trim()}`.trim()
      : ''

    const payload: CreateContactPayload = {
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
      documents,
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

              <div className="form-group">
                <label className="form-label">
                  Phone Number <span className="text-danger">*</span>
                </label>
                <PhoneInput
                  dialCode={phoneCountryCode}
                  number={phone}
                  onDialCodeChange={(c) => { setPhoneCountryCode(c); if (touched.phone) setPhoneError(validatePhone(phone, c)) }}
                  onNumberChange={(n) => { setPhone(n); if (touched.phone) setPhoneError(validatePhone(n, phoneCountryCode)) }}
                  onBlur={handlePhoneBlur}
                  required
                  showError={touched.phone}
                  error={phoneError}
                />
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

              <div className="contact-form-two-col">
                <div className="form-group">
                  <label className="form-label">State / Province</label>
                  <select
                    className="form-select"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  >
                    {STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <select
                    className="form-select"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    {COUNTRIES.map((ct) => (
                      <option key={ct} value={ct}>
                        {ct}
                      </option>
                    ))}
                  </select>
                </div>
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
