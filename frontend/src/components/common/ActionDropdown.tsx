import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical } from 'lucide-react'

export interface ActionDropdownItem {
  key?: string | number
  label: React.ReactNode
  icon?: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
  disabled?: boolean
  danger?: boolean
  success?: boolean
  divider?: boolean
}

export interface ActionDropdownProps {
  /** Optional array of items to render */
  items?: ActionDropdownItem[]
  /** Custom children to render inside dropdown menu (if items is not provided) */
  children?: React.ReactNode
  /** Custom trigger node, or defaults to 3-dots button */
  trigger?: React.ReactNode
  /** Minimum width of the dropdown menu */
  minWidth?: number | string
  /** Custom class name for the trigger container */
  className?: string
  /** Custom class name for the floating menu */
  menuClassName?: string
  /** Alignment relative to trigger */
  align?: 'right' | 'left'
  /** Controlled open state (optional) */
  isOpen?: boolean
  /** Controlled onOpenChange callback (optional) */
  onOpenChange?: (open: boolean) => void
  /** Tooltip or aria-label for default trigger */
  ariaLabel?: string
}

export const ActionDropdown: React.FC<ActionDropdownProps> = ({
  items,
  children,
  trigger,
  minWidth = 170,
  className = '',
  menuClassName = '',
  align = 'right',
  isOpen: controlledIsOpen,
  onOpenChange,
  ariaLabel = 'Actions',
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const isControlled = controlledIsOpen !== undefined
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen

  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [menuPosition, setMenuPosition] = useState<{
    top?: number
    bottom?: number
    left?: number
    right?: number
    placement: 'bottom' | 'top'
  }>({ placement: 'bottom' })

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const menuHeight = 220 // Estimated height for boundary check

    const shouldFlipTop = spaceBelow < menuHeight && spaceAbove > spaceBelow

    if (shouldFlipTop) {
      setMenuPosition({
        bottom: window.innerHeight - rect.top + 6,
        ...(align === 'right'
          ? { right: Math.max(8, window.innerWidth - rect.right) }
          : { left: Math.max(8, rect.left) }),
        placement: 'top',
      })
    } else {
      setMenuPosition({
        top: rect.bottom + 6,
        ...(align === 'right'
          ? { right: Math.max(8, window.innerWidth - rect.right) }
          : { left: Math.max(8, rect.left) }),
        placement: 'bottom',
      })
    }
  }, [align])

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalIsOpen(nextOpen)
      }
      onOpenChange?.(nextOpen)
    },
    [isControlled, onOpenChange]
  )

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!isOpen) {
      updatePosition()
    }
    setOpen(!isOpen)
  }

  // Update position on scroll, resize, or open
  useEffect(() => {
    if (!isOpen) return

    updatePosition()

    const handleScrollOrResize = () => {
      updatePosition()
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, updatePosition, setOpen])

  const portalContent = isOpen && typeof document !== 'undefined' ? (
    createPortal(
      <div
        ref={menuRef}
        role="menu"
        aria-orientation="vertical"
        className={`floating-action-portal-menu animate-fade-in ${menuClassName}`}
        style={{
          position: 'fixed',
          top: menuPosition.top !== undefined ? `${menuPosition.top}px` : undefined,
          bottom: menuPosition.bottom !== undefined ? `${menuPosition.bottom}px` : undefined,
          left: menuPosition.left !== undefined ? `${menuPosition.left}px` : undefined,
          right: menuPosition.right !== undefined ? `${menuPosition.right}px` : undefined,
          minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth,
          zIndex: 99999,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {items ? (
          items.map((item, idx) => {
            if (item.divider) {
              return <div key={`divider-${idx}`} className="dropdown-divider" />
            }
            return (
              <button
                key={item.key ?? idx}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                className={`dropdown-item ${item.danger ? 'text-danger' : ''} ${
                  item.success ? 'text-success' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  setOpen(false)
                  item.onClick?.(e)
                }}
              >
                {item.icon && <span className="dropdown-item-icon">{item.icon}</span>}
                <span className="dropdown-item-label">{item.label}</span>
              </button>
            )
          })
        ) : (
          children
        )}
      </div>,
      document.body
    )
  ) : null

  return (
    <div className={`action-dropdown-wrapper inline-block ${className}`} onClick={(e) => e.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        className={`table-action-dots-btn ${isOpen ? 'active' : ''}`}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={handleToggle}
      >
        {trigger || <MoreVertical size={16} />}
      </button>

      {portalContent}
    </div>
  )
}

export default ActionDropdown
