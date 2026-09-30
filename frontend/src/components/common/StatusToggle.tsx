import React from 'react'
import { Check, X } from 'lucide-react'
import { capitalizeWords } from '@/lib/utils'

export interface StatusToggleProps {
  /** Current status value ('Active' | 'Inactive' | string) */
  status: 'Active' | 'Inactive' | string
  /** Callback triggered on toggle when in edit/interactive mode */
  onChange?: (newStatus: 'Active' | 'Inactive') => void
  /** When false or when readOnly is true, renders a non-interactive status pill */
  isEditing?: boolean
  /** Read-only mode flag */
  readOnly?: boolean
  /** Label describing the field (e.g. 'Customer Status' or 'Status') */
  label?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Custom class name */
  className?: string
  /** Text for active state (default: 'Active') */
  activeLabel?: string
  /** Text for inactive state (default: 'Inactive') */
  inactiveLabel?: string
  /** Show the text badge alongside the toggle switch */
  showBadge?: boolean
  /** HTML element ID for accessibility */
  id?: string
}

export const StatusToggle: React.FC<StatusToggleProps> = ({
  status,
  onChange,
  isEditing = true,
  readOnly = false,
  label,
  size = 'md',
  className = '',
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
  showBadge = true,
  id,
}) => {
  const isActive = String(status).trim().toLowerCase() === 'active'
  const isInteractive = isEditing && !readOnly && typeof onChange === 'function'

  const handleToggle = () => {
    if (!isInteractive) return
    const nextStatus: 'Active' | 'Inactive' = isActive ? 'Inactive' : 'Active'
    onChange(nextStatus)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isInteractive) return
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      handleToggle()
    }
  }

  // Non-interactive view mode: clean professional status pill
  if (!isInteractive) {
    return (
      <div className={`status-toggle-wrapper status-toggle-readonly ${className}`}>
        {label && <span className="status-toggle-label">{label}</span>}
        <span
          className={`contact-status-pill status-pill-modern ${
            isActive ? 'status-active' : 'status-inactive'
          } ${size === 'sm' ? 'status-pill-sm' : ''}`}
        >
          <span
            className={`status-pill-dot ${isActive ? 'dot-active' : 'dot-inactive'}`}
            aria-hidden="true"
          />
          {capitalizeWords(isActive ? activeLabel : inactiveLabel)}
        </span>
      </div>
    )
  }

  // Interactive edit mode: professional toggle switch with smooth slide animation
  return (
    <div className={`status-toggle-wrapper status-toggle-interactive ${className}`}>
      {label && (
        <label htmlFor={id} className="status-toggle-label" onClick={handleToggle}>
          {label}
        </label>
      )}

      <div className="status-toggle-control-group">
        <button
          type="button"
          id={id}
          role="switch"
          aria-checked={isActive}
          aria-label={label || 'Status'}
          className={`status-switch-track status-switch-${size} ${
            isActive ? 'status-switch-active' : 'status-switch-inactive'
          }`}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
        >
          <span className="status-switch-thumb">
            {isActive ? (
              <Check size={size === 'sm' ? 10 : 12} className="status-switch-icon icon-active" />
            ) : (
              <X size={size === 'sm' ? 10 : 12} className="status-switch-icon icon-inactive" />
            )}
          </span>
        </button>

        {showBadge && (
          <span
            className={`contact-status-pill status-pill-interactive ${
              isActive ? 'status-active' : 'status-inactive'
            } ${size === 'sm' ? 'status-pill-sm' : ''}`}
            onClick={handleToggle}
            role="button"
            tabIndex={-1}
          >
            <span
              className={`status-pill-dot ${isActive ? 'dot-active' : 'dot-inactive'}`}
              aria-hidden="true"
            />
            {capitalizeWords(isActive ? activeLabel : inactiveLabel)}
          </span>
        )}
      </div>
    </div>
  )
}

export default StatusToggle
