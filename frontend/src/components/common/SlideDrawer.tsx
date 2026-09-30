import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export interface SlideDrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  subtitle?: React.ReactNode
  headerActions?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  width?: string | number
  placement?: 'right' | 'left'
  hideHeader?: boolean
  showCloseButton?: boolean
  closeOnBackdropClick?: boolean
  closeOnEsc?: boolean
  className?: string
  overlayClassName?: string
  bodyClassName?: string
  headerClassName?: string
  footerClassName?: string
  zIndex?: number
}

export default function SlideDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  headerActions,
  children,
  footer,
  width = '640px',
  placement = 'right',
  hideHeader = false,
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEsc = true,
  className = '',
  overlayClassName = '',
  bodyClassName = '',
  headerClassName = '',
  footerClassName = '',
  zIndex = 1000,
}: SlideDrawerProps) {
  const [mounted, setMounted] = useState(isOpen)
  const [active, setActive] = useState(false)
  const closeTimeoutRef = useRef<number | null>(null)

  // Handle entry and exit animations smoothly
  useEffect(() => {
    if (isOpen) {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
      setMounted(true)
      // Double RAF ensures DOM node is painted before the transition class triggers animation
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => {
          setActive(true)
        })
        return () => cancelAnimationFrame(raf2)
      })
      return () => cancelAnimationFrame(raf1)
    } else {
      setActive(false)
      closeTimeoutRef.current = window.setTimeout(() => {
        setMounted(false)
        closeTimeoutRef.current = null
      }, 450) // Wait for slide exit transition to complete (450ms)
    }
  }, [isOpen])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

  // Lock body scroll when drawer is visible
  useEffect(() => {
    if (mounted) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [mounted])

  // Close on Escape key
  useEffect(() => {
    if (!mounted || !closeOnEsc) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mounted, closeOnEsc, onClose])

  if (!mounted) return null

  const drawerContent = (
    <div
      className={`slide-drawer-overlay slide-drawer-placement-${placement} ${
        active ? 'slide-drawer-overlay--active' : ''
      } ${overlayClassName}`}
      style={{ zIndex }}
      onClick={() => {
        if (closeOnBackdropClick) {
          onClose()
        }
      }}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`slide-drawer-container ${className}`}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        {!hideHeader && (title || subtitle || showCloseButton || headerActions) && (
          <div className={`slide-drawer-header ${headerClassName}`}>
            <div className="slide-drawer-title-box">
              {title && <div className="slide-drawer-title">{title}</div>}
              {subtitle && <div className="slide-drawer-subtitle">{subtitle}</div>}
            </div>
            <div className="slide-drawer-actions">
              {headerActions}
              {showCloseButton && (
                <button
                  type="button"
                  className="slide-drawer-close-btn"
                  onClick={onClose}
                  aria-label="Close panel"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Drawer Body */}
        <div className={`slide-drawer-body ${bodyClassName}`}>{children}</div>

        {/* Drawer Footer */}
        {footer && <div className={`slide-drawer-footer ${footerClassName}`}>{footer}</div>}
      </div>
    </div>
  )

  return typeof document !== 'undefined'
    ? createPortal(drawerContent, document.body)
    : drawerContent
}
