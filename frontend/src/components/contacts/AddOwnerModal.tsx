import React, { useState } from 'react'
import { X, UserPlus } from 'lucide-react'
import type { Contact, AddOwnerPayload } from '@/apis/contactsApi'

interface AddOwnerModalProps {
  contact: Contact | null
  isOpen: boolean
  onClose: () => void
  onAddOwner: (contactId: number, payload: AddOwnerPayload) => Promise<void>
}

export default function AddOwnerModal({
  contact,
  isOpen,
  onClose,
  onAddOwner,
}: AddOwnerModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [residence, setResidence] = useState('')
  const [role, setRole] = useState('Account Executive')
  const [loading, setLoading] = useState(false)

  if (!isOpen || !contact) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      await onAddOwner(contact.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        residence: residence.trim(),
        role: role.trim(),
      })
      onClose()
    } catch (err: any) {
      alert(err?.message || 'Failed to add owner')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div
        className="modal-content animate-slide-up"
        style={{ maxWidth: 460 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-primary-500" />
            <h3 className="modal-title">Add Additional Owner</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-3">
            <p className="text-xs text-muted">
              Add a co-owner or account manager for <strong>{contact.name}</strong> ({contact.company}).
            </p>

            <div className="form-group">
              <label className="form-label">
                Owner Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="text"
                className="form-input"
                placeholder="+1 415 555 0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Residence / Location</label>
              <input
                type="text"
                className="form-input"
                placeholder="San Francisco, CA"
                value={residence}
                onChange={(e) => setResidence(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Account Executive">Account Executive</option>
                <option value="Relationship Manager">Relationship Manager</option>
                <option value="Technical Advisor">Technical Advisor</option>
                <option value="Customer Success">Customer Success</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
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
              {loading ? 'Adding...' : 'Add Owner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
