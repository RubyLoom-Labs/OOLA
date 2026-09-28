import React, { useState, useEffect } from 'react'
import {
  X,
  Camera,
  UploadCloud,
  Download,
  Trash2,
  Plus,
  User,
  Building,
  Tag,
  Info,
} from 'lucide-react'
import type {
  Contact,
  CreateContactPayload,
  UpdateContactPayload,
  ContactOwner,
  ContactDocument,
} from '@/apis/contactsApi'
import SlideDrawer from '@/components/common/SlideDrawer'

interface ContactFormDrawerProps {
  isOpen: boolean
  onClose: () => void
  contact?: Contact | null // If null, mode is Create; otherwise Edit
  onSubmit: (payload: CreateContactPayload | UpdateContactPayload, isEdit: boolean) => Promise<void>
}

const AVAILABLE_OWNERS: ContactOwner[] = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah@techsolutions.com', phone: '+1 415 555 0123', residence: 'San Francisco, CA' },
  { id: 2, name: 'Michael Brown', email: 'mbrown@oola.io', phone: '+1 415 555 0999', residence: 'San Jose, CA' },
  { id: 3, name: 'David Park', email: 'dpark@oola.io', phone: '+1 415 555 0888', residence: 'Oakland, CA' },
  { id: 4, name: 'Mary Jane', email: 'mjane@oola.io', phone: '+1 415 555 0777', residence: 'Palo Alto, CA' },
]

const COMPANY_TYPES = [
  'Technology',
  'Digital Marketing',
  'Software Services',
  'Mobile Apps',
  'Creative Agency',
  'Consulting',
  'IT Infrastructure',
  'Healthcare',
  'Financial Services',
  'Other',
]

const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'Singapore',
  'United Arab Emirates',
  'Other',
]

const STATES = [
  'California',
  'New York',
  'Texas',
  'Washington',
  'Florida',
  'Illinois',
  'Massachusetts',
  'Colorado',
  'Georgia',
]

export default function ContactFormDrawer({
  isOpen,
  onClose,
  contact,
  onSubmit,
}: ContactFormDrawerProps) {
  const isEdit = Boolean(contact && contact.id)

  const [activeTab, setActiveTab] = useState('Details')
  const [loading, setLoading] = useState(false)

  // Form State
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [designation, setDesignation] = useState('')
  const [email, setEmail] = useState('')
  const [phoneCountryCode, setPhoneCountryCode] = useState('+1')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')

  // Additional Information
  const [companyType, setCompanyType] = useState('Technology')
  const [owners, setOwners] = useState<ContactOwner[]>([])
  const [ownerPhone, setOwnerPhone] = useState('+1 415 555 0123')
  const [ownerResidence, setOwnerResidence] = useState('San Francisco, CA')
  const [companyWeb, setCompanyWeb] = useState('')
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active')

  // Contact Details
  const [company, setCompany] = useState('')
  const [website, setWebsite] = useState('')
  const [address, setAddress] = useState('')
  const [state, setState] = useState('California')
  const [country, setCountry] = useState('United States')

  // Tags & Notes
  const [tags, setTags] = useState<string[]>(['VIP', 'Enterprise', 'High Value'])
  const [newTagInput, setNewTagInput] = useState('')
  const [showTagInput, setShowTagInput] = useState(false)
  const [notes, setNotes] = useState('')

  // Documents
  const [documents, setDocuments] = useState<ContactDocument[]>([
    { id: 1, name: 'Company Profile.pdf', size: '2.4 MB', type: 'PDF' },
    { id: 2, name: 'Business Card.jpg', size: '1.2 MB', type: 'JPG' },
  ])

  // Avatar
  const [avatar, setAvatar] = useState(
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  )

  // Sync state when contact prop changes
  useEffect(() => {
    if (contact) {
      setFirstName(contact.first_name || contact.name.split(' ')[0] || '')
      setLastName(contact.last_name || contact.name.split(' ').slice(1).join(' ') || '')
      setDesignation(contact.designation || 'CEO')
      setEmail(contact.email || '')
      setPhone(contact.phone ? contact.phone.replace(/^\+\d+\s*/, '') : '415 555 0123')
      setPhoneCountryCode(contact.phone_country_code || '+1')
      setDateOfBirth(contact.date_of_birth || '1990-05-12')
      setCompanyType(contact.company_type || 'Technology')
      setOwners(
        contact.owners && contact.owners.length > 0
          ? contact.owners
          : [AVAILABLE_OWNERS[0], AVAILABLE_OWNERS[1]]
      )
      setOwnerPhone(contact.owner_phone || '+1 415 555 0123')
      setOwnerResidence(contact.owner_residence || 'San Francisco, CA')
      setCompanyWeb(contact.company_web || contact.website || 'https://techsolutions.com')
      setStatus(contact.status === 'Inactive' ? 'Inactive' : 'Active')
      setCompany(contact.company || 'TechSolutions Inc.')
      setWebsite(contact.website || contact.company_web || 'https://techsolutions.com')
      setAddress(contact.address || '123 Business St, San Francisco, CA 94105')
      setState(contact.state || 'California')
      setCountry(contact.country || 'United States')
      setTags(contact.tags && contact.tags.length > 0 ? contact.tags : ['VIP', 'Enterprise', 'High Value'])
      setNotes(contact.notes || '')
      setDocuments(
        contact.documents && contact.documents.length > 0
          ? contact.documents
          : [
              { id: 1, name: 'Company Profile.pdf', size: '2.4 MB', type: 'PDF' },
              { id: 2, name: 'Business Card.jpg', size: '1.2 MB', type: 'JPG' },
            ]
      )
      setAvatar(
        contact.avatar ||
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
      )
    } else {
      // Defaults for Create New Contact
      setFirstName('')
      setLastName('')
      setDesignation('')
      setEmail('')
      setPhone('')
      setPhoneCountryCode('+1')
      setDateOfBirth('')
      setCompanyType('Technology')
      setOwners([AVAILABLE_OWNERS[0]])
      setOwnerPhone('+1 415 555 0123')
      setOwnerResidence('San Francisco, CA')
      setCompanyWeb('')
      setStatus('Active')
      setCompany('')
      setWebsite('')
      setAddress('')
      setState('California')
      setCountry('United States')
      setTags(['VIP'])
      setNotes('')
      setDocuments([])
      setAvatar(
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      )
    }
  }, [contact, isOpen])

  const handleAddOwner = (owner: ContactOwner) => {
    if (!owners.some((o) => o.id === owner.id)) {
      setOwners([...owners, owner])
    }
  }

  const handleRemoveOwner = (id: number) => {
    setOwners(owners.filter((o) => o.id !== id))
  }

  const handleAddTag = () => {
    if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
      setTags([...tags, newTagInput.trim()])
      setNewTagInput('')
      setShowTagInput(false)
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const newDoc: ContactDocument = {
        id: Date.now(),
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
      }
      setDocuments([...documents, newDoc])
    }
  }

  const handleDeleteDocument = (id: string | number) => {
    setDocuments(documents.filter((d) => d.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      alert('Please fill in required fields: First Name, Last Name, and Email')
      return
    }

    const payload: CreateContactPayload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      designation: designation.trim(),
      email: email.trim(),
      phone: `${phoneCountryCode} ${phone.trim()}`.trim(),
      phone_country_code: phoneCountryCode,
      date_of_birth: dateOfBirth,
      company: company.trim() || 'TechSolutions Inc.',
      company_type: companyType,
      company_web: companyWeb || website,
      website: website || companyWeb,
      address: address.trim(),
      state,
      country,
      status,
      owners,
      owner_phone: ownerPhone,
      owner_residence: ownerResidence,
      tags,
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
      width="820px"
      className="contact-form-drawer"
    >
      <form onSubmit={handleSubmit} className="contact-form-panel">
        {/* Drawer Header with Title */}
        <div className="contact-form-header">
          <div className="flex items-center gap-2">
            <User size={20} className="text-primary-500" />
            <h2 className="contact-form-title">
              {isEdit ? 'Edit Contact' : 'Add Contact'}
            </h2>
          </div>
        </div>

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
            <div className="flex items-center gap-2">
              <span className="contact-form-profile-name">
                {firstName || lastName ? `${firstName} ${lastName}`.trim() : 'New Contact'}
              </span>
              <span
                className={`contact-status-pill ${
                  status === 'Active' ? 'status-active' : 'status-inactive'
                }`}
              >
                {status}
              </span>
            </div>
            <span className="contact-form-profile-sub">
              {designation || 'Specialist'} at {company || 'TechSolutions Inc.'}
            </span>
          </div>
        </div>

        {/* Form Tabs */}
        <div className="contact-tabs-nav">
          {['Details', 'Company', 'Projects & Deals', 'Notes', 'Documents', 'Activities'].map(
            (tab) => (
              <button
                key={tab}
                type="button"
                className={`contact-tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            )
          )}
        </div>

        {/* 2-Column Form Body */}
        <div className="contact-form-grid-layout">
          {/* Column 1: Personal Information & Additional Information */}
          <div className="contact-form-column">
            {/* Section: Personal Information */}
            <div className="contact-form-card">
              <div className="contact-form-section-title">
                <User size={16} />
                <span>Personal Information</span>
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
                    placeholder="First Name"
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
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Designation</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. CEO, Director"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Email <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="sarah@techsolutions.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Phone <span className="text-danger">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    className="form-select w-24 flex-shrink-0"
                    value={phoneCountryCode}
                    onChange={(e) => setPhoneCountryCode(e.target.value)}
                  >
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                    <option value="+61">+61</option>
                    <option value="+49">+49</option>
                    <option value="+971">+971</option>
                    <option value="+94">+94</option>
                  </select>
                  <input
                    type="tel"
                    required
                    className="form-input flex-1"
                    placeholder="415 555 0123"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <div className="relative">
                  <input
                    type="date"
                    className="form-input"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section: Additional Information */}
            <div className="contact-form-card">
              <div className="contact-form-section-title">
                <Info size={16} />
                <span>Additional Information</span>
              </div>

              <div className="form-group">
                <label className="form-label">Company Type</label>
                <select
                  className="form-select"
                  value={companyType}
                  onChange={(e) => setCompanyType(e.target.value)}
                >
                  {COMPANY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Owner(s) Multi-Select with pills */}
              <div className="form-group">
                <label className="form-label">Owner(s)</label>
                <div className="contact-owners-input-box">
                  <div className="flex flex-wrap gap-1.5 items-center flex-1">
                    {owners.map((owner) => (
                      <span key={owner.id} className="owner-chip">
                        <span>{owner.name}</span>
                        <button
                          type="button"
                          className="owner-chip-remove"
                          onClick={() => handleRemoveOwner(owner.id)}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    <select
                      className="owner-select-inline"
                      value=""
                      onChange={(e) => {
                        const sel = AVAILABLE_OWNERS.find((o) => o.name === e.target.value)
                        if (sel) handleAddOwner(sel)
                      }}
                    >
                      <option value="" disabled>
                        + Add Owner...
                      </option>
                      {AVAILABLE_OWNERS.filter(
                        (ao) => !owners.some((o) => o.id === ao.id)
                      ).map((ao) => (
                        <option key={ao.id} value={ao.name}>
                          {ao.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Owner's Phone</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+1 415 555 0123"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Owner's Residence</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="San Francisco, CA"
                  value={ownerResidence}
                  onChange={(e) => setOwnerResidence(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Company Web</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://techsolutions.com"
                  value={companyWeb}
                  onChange={(e) => setCompanyWeb(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Column 2: Contact Details, Tags, Notes & Upload Documents */}
          <div className="contact-form-column">
            {/* Section: Contact Details */}
            <div className="contact-form-card">
              <div className="contact-form-section-title">
                <Building size={16} />
                <span>Contact Details</span>
              </div>

              <div className="form-group">
                <label className="form-label">Company</label>
                <div className="relative">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="TechSolutions Inc."
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                  {company && (
                    <button
                      type="button"
                      className="input-clear-btn"
                      onClick={() => setCompany('')}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Website</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://techsolutions.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="123 Business St, San Francisco, CA 94105"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="contact-form-two-col">
                <div className="form-group">
                  <label className="form-label">State</label>
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

            {/* Section: Tags */}
            <div className="contact-form-card">
              <div className="contact-form-section-title">
                <Tag size={16} />
                <span>Tags</span>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {tags.map((tag) => (
                  <span key={tag} className="contact-tag-badge">
                    <span>{tag}</span>
                    <button
                      type="button"
                      className="ml-1 hover:text-danger-500"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {showTagInput ? (
                  <div className="flex gap-1 items-center">
                    <input
                      type="text"
                      className="form-input form-input-xs"
                      placeholder="Tag name"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag()
                        }
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn btn-primary btn-xs"
                      onClick={handleAddTag}
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="contact-add-tag-btn"
                    onClick={() => setShowTagInput(true)}
                  >
                    <Plus size={12} />
                    Add Tag
                  </button>
                )}
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
                placeholder="Add any additional notes about this contact..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Section: Upload Documents */}
            <div className="contact-form-card">
              <div className="contact-form-section-title">
                <UploadCloud size={16} />
                <span>Upload Documents</span>
              </div>
              <p className="text-xs text-muted mb-2">
                Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
              </p>

              {/* Upload Drop Zone */}
              <label className="upload-dropzone">
                <UploadCloud size={24} className="upload-dropzone-icon" />
                <span className="upload-dropzone-text">
                  Drag & drop files here or click to upload
                </span>
                <span className="upload-dropzone-btn">Choose Files</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </label>

              {/* Uploaded Documents List */}
              {documents.length > 0 && (
                <div className="uploaded-docs-list mt-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="doc-item-row">
                      <div className="doc-item-info">
                        <span className="doc-file-badge">{doc.type}</span>
                        <div>
                          <div className="doc-item-name">{doc.name}</div>
                          <div className="doc-item-size">{doc.size}</div>
                        </div>
                      </div>
                      <div className="doc-item-actions">
                        <button
                          type="button"
                          className="doc-action-btn"
                          title="Download"
                          onClick={() => alert(`Downloading ${doc.name}`)}
                        >
                          <Download size={14} />
                        </button>
                        <button
                          type="button"
                          className="doc-action-btn text-danger"
                          title="Delete"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Action Bar */}
        <div className="contact-form-bottom-bar">
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
            className="btn btn-primary"
            disabled={loading}
          >
            {loading
              ? 'Saving...'
              : isEdit
              ? 'Update Contact'
              : 'Create Contact'}
          </button>
        </div>
      </form>
    </SlideDrawer>
  )
}
