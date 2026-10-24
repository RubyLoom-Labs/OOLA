import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Upload,
  Link2,
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileImage,
  X,
  Save,
  Loader2,
  AlertCircle,
  FolderKanban,
} from 'lucide-react'
import { projectsApi, type ProjectAttachment } from '@/apis/projectsApi'

export interface UploadProjectDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: number
  projectTitle: string
  projectCode: string
  onSuccess: (newDoc: ProjectAttachment) => void
}

const DOCUMENT_TYPES = [
  'Technical Specification',
  'Architecture & Design',
  'Contract & Agreement',
  'Client Deliverable',
  'Invoice & Quotation',
  'Requirement Document',
  'Meeting Notes',
  'General Reference',
  'Other',
]

export default function UploadProjectDocumentModal({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  projectCode,
  onSuccess,
}: UploadProjectDocumentModalProps) {
  const [uploadType, setUploadType] = useState<'file' | 'link'>('file')
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [docType, setDocType] = useState('Technical Specification')
  const [customType, setCustomType] = useState('')
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset state when opened/closed
  useEffect(() => {
    if (isOpen) {
      setUploadType('file')
      setFile(null)
      setTitle('')
      setDocType('Technical Specification')
      setCustomType('')
      setUrl('')
      setError(null)
      setSaving(false)
      setIsDragging(false)
    } else {
      setFile(null)
      setTitle('')
      setDocType('Technical Specification')
      setCustomType('')
      setUrl('')
      setError(null)
      setSaving(false)
      setIsDragging(false)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !saving) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, saving, onClose])

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getDocIcon = (fileName?: string, mimeType?: string) => {
    const ext = (fileName || '').split('.').pop()?.toLowerCase() || ''
    if (ext === 'pdf' || (mimeType && mimeType.includes('pdf'))) {
      return <FileText size={20} className="text-rose-500 shrink-0" />
    }
    if (['xls', 'xlsx', 'csv'].includes(ext) || (mimeType && mimeType.includes('sheet'))) {
      return <FileSpreadsheet size={20} className="text-emerald-500 shrink-0" />
    }
    if (['doc', 'docx'].includes(ext) || (mimeType && mimeType.includes('word'))) {
      return <FileText size={20} className="text-blue-500 shrink-0" />
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <FileArchive size={20} className="text-amber-500 shrink-0" />
    }
    if (
      ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext) ||
      (mimeType && mimeType.includes('image'))
    ) {
      return <FileImage size={20} className="text-purple-500 shrink-0" />
    }
    return <FileText size={20} className="text-slate-500 shrink-0" />
  }

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setError(null)
    if (!title.trim()) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (uploadType === 'file' && !file) {
      setError('Please choose a file to upload.')
      return
    }

    if (uploadType === 'link' && !url.trim()) {
      setError('Please enter a valid document URL / link.')
      return
    }

    const finalType = docType === 'Other' ? customType.trim() : docType.trim()

    if (docType === 'Other' && !finalType) {
      setError('Please specify the custom document type.')
      return
    }

    setSaving(true)

    try {
      let createdDoc: ProjectAttachment | null = null

      if (uploadType === 'file' && file) {
        const formData = new FormData()
        formData.append('file', file)
        if (title.trim()) {
          formData.append('document_name', title.trim())
          formData.append('document_title', title.trim())
        }
        formData.append('type', finalType)
        formData.append('category', finalType)

        const res = await projectsApi.uploadAttachment(projectId, formData)
        createdDoc = (res as any)?.data?.data || res?.data
      } else {
        const res = await projectsApi.createAttachmentLink(projectId, {
          file_name: title.trim() || 'Project Document',
          document_name: title.trim() || 'Project Document',
          document_title: title.trim() || undefined,
          file_url: url.trim(),
          type: finalType,
          category: finalType,
        })
        createdDoc = (res as any)?.data?.data || res?.data
      }

      if (createdDoc) {
        onSuccess(createdDoc)
        onClose()
      } else {
        throw new Error('Failed to parse uploaded document response.')
      }
    } catch (err: any) {
      console.error('Failed to save project document:', err)
      setError(
        err?.response?.data?.message || err?.message || 'Failed to save document. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
      style={{ zIndex: 1200 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) {
          onClose()
        }
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-xl overflow-hidden animate-scale-up flex flex-col"
        style={{ minHeight: '520px', maxHeight: '92vh' }}
      >
        {/* Modal Header */}
        <div className="p-4 pb-3 flex items-start justify-between border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs">
              <FolderKanban size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Add Project Document</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Attach files and technical resources to{' '}
                <span className="font-semibold text-slate-700">{projectTitle}</span>{' '}
                <span className="font-mono text-[11px] text-blue-600 font-bold">
                  ({projectCode})
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
            onClick={onClose}
            disabled={saving}
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Upload Method Switcher */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Document Source
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${uploadType === 'file'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
                onClick={() => {
                  setUploadType('file')
                  setError(null)
                }}
              >
                <Upload size={14} />
                <span>Upload Local File</span>
              </button>
              <button
                type="button"
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${uploadType === 'link'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
                onClick={() => {
                  setUploadType('link')
                  setError(null)
                }}
              >
                <Link2 size={14} />
                <span>Document Link / URL</span>
              </button>
            </div>
          </div>

          {/* File Picker Section */}
          {uploadType === 'file' ? (
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Select File <span className="text-rose-500">*</span>
              </label>

              {file ? (
                <div className="flex items-center justify-between p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-xs shrink-0">
                      {getDocIcon(file.name, file.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {formatFileSize(file.size)} • {file.type || 'Document'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-7 h-7 rounded-full bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors shadow-2xs"
                    onClick={() => setFile(null)}
                    title="Remove file"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/20'
                  }`}
                >
                  <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 shadow-2xs">
                    <Upload size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    Click to choose file or drag and drop
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    PDF, Word, Excel, Images, ZIP archives (up to 50MB)
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const selected = e.target.files?.[0]
                      if (selected) {
                        handleFileSelect(selected)
                      }
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Document URL / Link <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Link2 size={14} />
                </span>
                <input
                  type="url"
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:outline-none focus:ring-0 focus:border-slate-300 shadow-2xs text-slate-800 font-medium placeholder:text-slate-400"
                  placeholder="https://docs.google.com/... or Figma / Notion link"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Title and Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Document Title
              </label>
              <input
                type="text"
                className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:outline-none focus:ring-0 focus:border-slate-300 shadow-2xs text-slate-800 font-medium placeholder:text-slate-400"
                placeholder="e.g. Technical Specifications"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Auto-filled from file name if left blank
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Document Type <span className="text-rose-500">*</span>
              </label>
              <select
                className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:outline-none focus:ring-0 focus:border-slate-300 shadow-2xs text-slate-800 font-medium"
                value={docType}
                onChange={(e) => {
                  setDocType(e.target.value)
                  if (error) setError(null)
                }}
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Type text box when 'Other' is selected */}
          {docType === 'Other' && (
            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/80 animate-fade-in space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Specify Custom Document Type <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:outline-none focus:ring-0 focus:border-slate-300 shadow-2xs text-slate-800 font-medium placeholder:text-slate-400"
                placeholder="Type document type (e.g. Security Audit Report, Wireframes...)"
                value={customType}
                onChange={(e) => {
                  setCustomType(e.target.value)
                  if (error) setError(null)
                }}
                autoFocus
                required
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Hidden submit trigger */}
          <button type="submit" className="hidden" aria-hidden="true" />
        </form>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {uploadType === 'file'
              ? file
                ? `${file.name} ready to upload`
                : 'Choose a file to attach'
              : url
                ? 'Document link ready to save'
                : 'Enter a valid URL to attach'}
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="btn btn-outline btn-sm text-xs px-4 rounded-xl"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm text-xs px-4 flex items-center gap-1.5 rounded-xl shadow-xs"
              onClick={handleSubmit}
              disabled={
                saving ||
                (uploadType === 'file' && !file) ||
                (uploadType === 'link' && !url.trim()) ||
                (docType === 'Other' && !customType.trim())
              }
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              <span>{saving ? 'Saving...' : 'Save Document'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}
