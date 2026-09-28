import React, { useEffect } from 'react'
import { X } from 'lucide-react'

interface SlideDrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  subtitle?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  width?: string | number
  className?: string
}

export default function SlideDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = '640px',
  className = '',
}: SlideDrawerProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="slide-drawer-overlay animate-fade-in" onClick={onClose}>
      <div
        className={`slide-drawer-container animate-slide-left ${className}`}
        style={{ width: typeof width === 'number' ? `${width}px` : width }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="slide-drawer-header">
          <div className="slide-drawer-title-box">
            {title && <div className="slide-drawer-title">{title}</div>}
            {subtitle && <div className="slide-drawer-subtitle">{subtitle}</div>}
          </div>
          <button
            type="button"
            className="slide-drawer-close-btn"
            onClick={onClose}
            aria-label="Close panel"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="slide-drawer-body">{children}</div>

        {/* Drawer Footer */}
        {footer && <div className="slide-drawer-footer">{footer}</div>}
      </div>
    </div>
  )
}
