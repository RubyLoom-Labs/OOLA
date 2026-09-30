import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, AlertCircle, CheckCircle, Save, X, Loader2 } from 'lucide-react'

export type ConfirmationVariant = 'danger' | 'warning' | 'primary' | 'success' | 'info'

export interface ConfirmationModalProps {
  /** Controls modal visibility */
  isOpen: boolean
  /** Callback when user cancels or dismisses */
  onClose: () => void
  /** Callback when user confirms */
  onConfirm: () => Promise<void> | void
  /** Modal header title */
  title?: string
  /** Detailed description or confirmation message */
  message?: React.ReactNode
  /** Name of item or entity being acted upon (optional highlight) */
  itemName?: string
  /** Text for confirm button */
  confirmText?: string
  /** Text for cancel button */
  cancelText?: string
  /** Visual variant affecting colors and icon */
  variant?: ConfirmationVariant
  /** Custom icon override */
  icon?: React.ReactNode
  /** External loading state (optional) */
  loading?: boolean
  /** Close when clicking overlay */
  closeOnBackdrop?: boolean
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  confirmText,
  cancelText = 'Cancel',
  variant = 'danger',
  icon,
  loading: externalLoading,
  closeOnBackdrop = true,
}) => {
  const [internalLoading, setInternalLoading] = useState(false)
  const isLoading = externalLoading ?? internalLoading

  // Default title and button text based on variant
  const defaultTitle =
    variant === 'danger'
      ? 'Confirm Deletion'
      : variant === 'warning'
      ? 'Warning'
      : variant === 'success'
      ? 'Action Successful'
      : 'Confirm Changes'

  const defaultConfirmText =
    variant === 'danger'
      ? 'Delete'
      : variant === 'warning'
      ? 'Proceed'
      : variant === 'success'
      ? 'Done'
      : 'Save Changes'

  const displayTitle = title || defaultTitle
  const displayConfirmText = confirmText || defaultConfirmText

  // Default Icon by variant
  const renderIcon = () => {
    if (icon) return icon
    switch (variant) {
      case 'danger':
        return <AlertTriangle size={24} className="confirm-icon-danger" />
      case 'warning':
        return <AlertCircle size={24} className="confirm-icon-warning" />
      case 'success':
        return <CheckCircle size={24} className="confirm-icon-success" />
      case 'primary':
      case 'info':
      default:
        return <Save size={24} className="confirm-icon-primary" />
    }
  }

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isLoading, onClose])

  if (!isOpen) return null

  const handleConfirmClick = async () => {
    try {
      setInternalLoading(true)
      await onConfirm()
    } catch (err) {
      console.error('Confirmation action error:', err)
    } finally {
      setInternalLoading(false)
    }
  }

  const modalContent = (
    <div
      className="modal-overlay confirm-modal-overlay animate-fade-in"
      onClick={() => {
        if (closeOnBackdrop && !isLoading) {
          onClose()
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="modal confirm-modal-card animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close confirm-modal-close-btn"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="confirm-modal-body">
          {/* Variant Icon Badge */}
          <div className={`confirm-icon-badge confirm-badge-${variant}`}>
            {renderIcon()}
          </div>

          <div className="confirm-modal-text">
            <div className="confirm-modal-header-row">
              <h3 id="confirm-modal-title" className="confirm-modal-title">
                {displayTitle}
              </h3>
              {itemName && (
                <span className="confirm-modal-item-pill">
                  {itemName}
                </span>
              )}
            </div>

            <div className="confirm-modal-message">
              {message || (
                variant === 'danger'
                  ? 'Are you sure you want to proceed with this action? This change cannot be undone.'
                  : 'Are you sure you want to save these changes to the system?'
              )}
            </div>
          </div>
        </div>

        <div className="confirm-modal-footer">
          <button
            type="button"
            className="btn btn-outline confirm-btn-cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={`btn confirm-btn-action ${
              variant === 'danger'
                ? 'btn-danger'
                : variant === 'warning'
                ? 'btn-warning'
                : 'btn-primary'
            }`}
            onClick={handleConfirmClick}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span>Processing...</span>
              </span>
            ) : (
              displayConfirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent
}

export default ConfirmationModal
