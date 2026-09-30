import React, { useState } from 'react'
import { X, Building2, Plus, Loader2 } from 'lucide-react'
import { companiesApi, type CreateCompanyPayload, type CompanyLookupItem } from '@/apis/companiesApi'
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
  const [companyName, setCompanyName] = useState(initialName)
  const [companyCode, setCompanyCode] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [industry, setIndustry] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('Sri Lanka')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync initial name when opened
  React.useEffect(() => {
    if (isOpen) {
      setCompanyName(initialName)
      setError(null)
    }
  }, [isOpen, initialName])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim()) {
      setError('Company Name is required.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const payload: CreateCompanyPayload = {
        company_name: capitalizeWords(companyName.trim()),
        company_code: companyCode.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        industry: industry.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        country: country.trim() || undefined,
        status: 1,
      }

      const res = await companiesApi.createCompany(payload)
      const createdData = res.data as any

      const resultItem: CompanyLookupItem = {
        id: createdData.id || Date.now(),
        company_name: createdData.company_name || payload.company_name,
        company_code: createdData.company_code || payload.company_code || 'CO000000',
      }

      onSuccess(resultItem)
      onClose()
    } catch (err: any) {
      console.error('Failed to create company:', err)
      setError(err?.message || 'Failed to create company. Please verify the input and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop animate-fade-in" style={{ zIndex: 9999 }}>
      <div
        className="confirm-modal-card animate-scale-up"
        style={{ maxWidth: 540, padding: '24px 28px 20px', width: '92vw' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-gray-900)' }}>
                Create New Company
              </h3>
              <p style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>
                Add a new company to associate with contacts & deals
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            disabled={loading}
            style={{ color: 'var(--color-gray-400)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              borderRadius: 6,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: 12.5,
            }}
          >
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group col-span-2">
              <label className="form-label text-xs font-semibold">
                Company Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                className="form-input form-input-sm"
                placeholder="e.g. Apex Global Logistics"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label text-xs">Email Address</label>
              <input
                type="email"
                className="form-input form-input-sm"
                placeholder="contact@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label text-xs">Phone Number</label>
              <input
                type="tel"
                className="form-input form-input-sm"
                placeholder="+94 77 987 6543"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label text-xs">Industry</label>
              <input
                type="text"
                className="form-input form-input-sm"
                placeholder="e.g. Logistics, Technology"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label text-xs">Website</label>
              <input
                type="url"
                className="form-input form-input-sm"
                placeholder="https://company.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label text-xs">Company Code</label>
              <input
                type="text"
                className="form-input form-input-sm"
                placeholder="e.g. CO000001 (Optional)"
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value)}
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

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 mt-4">
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
              disabled={loading || !companyName.trim()}
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
}
