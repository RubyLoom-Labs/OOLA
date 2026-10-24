import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Download,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileImage,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Check,
} from 'lucide-react'
import type { ProjectAttachment } from '@/apis/projectsApi'

export interface DocumentViewerModalProps {
  isOpen: boolean
  onClose: () => void
  document: ProjectAttachment | null
  onDownload?: (doc: ProjectAttachment) => void
}

export const downloadDocumentFile = async (filePath: string, fileName: string) => {
  try {
    const res = await fetch(filePath)
    if (!res.ok) throw new Error('Fetch failed')
    const blob = await res.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = blobUrl
    link.download = fileName || 'document'
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
  } catch {
    const link = window.document.createElement('a')
    link.href = filePath
    link.download = fileName || 'document'
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
  }
}

export default function DocumentViewerModal({
  isOpen,
  onClose,
  document: doc,
  onDownload,
}: DocumentViewerModalProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  // Reset controls on open
  useEffect(() => {
    if (isOpen) {
      setZoom(1)
      setRotation(0)
      setDownloading(false)
      setDownloadSuccess(false)
    }
  }, [isOpen, doc])

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !doc) return null

  const docTitle = doc.document_name || doc.document_title || doc.file_name || 'Project Document'
  const docType = doc.type || doc.category
  const filePath = doc.file_path || ''
  const mimeType = (doc.mime_type || '').toLowerCase()
  const ext = (filePath.split('?')[0].split('.').pop() || '').toLowerCase()

  const isImage =
    mimeType.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'avif'].includes(ext)

  const isPdf = mimeType.includes('pdf') || ext === 'pdf'
  const isVideo = mimeType.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov'].includes(ext)
  const isAudio = mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac'].includes(ext)

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getDocIcon = () => {
    if (isPdf) return <FileText size={22} className="text-rose-500 shrink-0" />
    if (['xls', 'xlsx', 'csv'].includes(ext) || mimeType.includes('sheet')) {
      return <FileSpreadsheet size={22} className="text-emerald-500 shrink-0" />
    }
    if (['doc', 'docx'].includes(ext) || mimeType.includes('word')) {
      return <FileText size={22} className="text-blue-500 shrink-0" />
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <FileArchive size={22} className="text-amber-500 shrink-0" />
    }
    if (isImage) return <FileImage size={22} className="text-purple-500 shrink-0" />
    return <FileText size={22} className="text-slate-500 shrink-0" />
  }

  const handleDownload = async () => {
    if (!filePath) return
    setDownloading(true)
    try {
      if (onDownload) {
        onDownload(doc)
      } else {
        await downloadDocumentFile(filePath, docTitle)
      }
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 2500)
    } finally {
      setDownloading(false)
    }
  }

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-fade-in"
      style={{ zIndex: 1300 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-5xl overflow-hidden flex flex-col animate-scale-up"
        style={{ height: '88vh', maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 px-5 border-b border-slate-200/80 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0">
              {getDocIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate" title={docTitle}>
                  {docTitle}
                </h3>
                {docType && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                    {docType}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                {doc.file_size ? <span>{formatFileSize(doc.file_size)}</span> : null}
                {doc.created_at && (
                  <>
                    <span>•</span>
                    <span>
                      {new Date(doc.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </>
                )}
                {doc.uploader?.name && (
                  <>
                    <span>•</span>
                    <span>Uploaded by {doc.uploader.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Image zoom controls */}
            {isImage && (
              <div className="hidden sm:flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs mr-1">
                <button
                  type="button"
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                  onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                  title="Zoom Out"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="text-[11px] font-mono px-1.5 text-slate-600 min-w-10 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                  onClick={() => setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
                  title="Zoom In"
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  type="button"
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  title="Rotate 90°"
                >
                  <RotateCw size={14} />
                </button>
              </div>
            )}

            {/* Download button */}
            {filePath && (
              <button
                type="button"
                className={`btn btn-sm flex items-center gap-1.5 font-semibold transition-all ${
                  downloadSuccess
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'btn-primary shadow-2xs'
                }`}
                onClick={handleDownload}
                disabled={downloading}
                title="Download document file"
              >
                {downloadSuccess ? <Check size={14} /> : <Download size={14} />}
                <span>{downloadSuccess ? 'Downloaded' : 'Download'}</span>
              </button>
            )}

            {/* Open Original / New Tab */}
            {filePath && (
              <a
                href={filePath}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm hidden sm:flex items-center gap-1.5"
                title="Open in new window"
              >
                <ExternalLink size={13} />
                <span>Open Original</span>
              </a>
            )}

            {/* Close button */}
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors ml-1"
              onClick={onClose}
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body / Viewer */}
        <div className="flex-1 bg-slate-900/90 overflow-auto p-4 flex items-center justify-center relative custom-scrollbar">
          {isImage && filePath ? (
            <div className="max-w-full max-h-full flex items-center justify-center overflow-auto p-2">
              <img
                src={filePath}
                alt={docTitle}
                className="max-h-[72vh] max-w-full object-contain rounded-lg shadow-2xl transition-transform duration-200 ease-out"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                }}
              />
            </div>
          ) : isPdf && filePath ? (
            <div className="w-full h-full bg-white rounded-xl overflow-hidden shadow-lg border border-slate-700">
              <iframe
                src={filePath}
                title={docTitle}
                className="w-full h-full border-0"
              />
            </div>
          ) : isVideo && filePath ? (
            <div className="max-w-full max-h-full flex items-center justify-center">
              <video
                src={filePath}
                controls
                autoPlay
                className="max-h-[72vh] max-w-full rounded-xl shadow-2xl"
              />
            </div>
          ) : isAudio && filePath ? (
            <div className="bg-white p-8 rounded-2xl shadow-2xl border border-slate-200 flex flex-col items-center gap-4 w-full max-w-md">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText size={32} />
              </div>
              <h4 className="text-sm font-bold text-slate-900 text-center">{docTitle}</h4>
              <audio src={filePath} controls className="w-full" autoPlay />
            </div>
          ) : (
            /* Fallback Card for Word, Excel, ZIP or general links */
            <div className="bg-white p-8 rounded-2xl shadow-2xl border border-slate-200 flex flex-col items-center text-center max-w-md w-full animate-fade-in">
              <div className="w-18 h-18 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-xs">
                {getDocIcon()}
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">{docTitle}</h4>
              {docType && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-3">
                  {docType}
                </span>
              )}
              <p className="text-xs text-slate-500 mb-6 max-w-xs">
                This document format cannot be previewed directly in the browser window. You can download the file to view on your device or open its source link.
              </p>
              <div className="flex items-center gap-3 w-full">
                {filePath && (
                  <button
                    type="button"
                    className="btn btn-primary flex-1 flex items-center justify-center gap-2 py-2.5 shadow-xs"
                    onClick={handleDownload}
                  >
                    <Download size={15} />
                    <span>Download File</span>
                  </button>
                )}
                {filePath && (
                  <a
                    href={filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline flex-1 flex items-center justify-center gap-2 py-2.5"
                  >
                    <ExternalLink size={15} />
                    <span>Open URL</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return typeof window !== 'undefined' ? createPortal(modalContent, window.document.body) : null
}
