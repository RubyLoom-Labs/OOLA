import React from 'react'

interface PageHeaderProps {
  icon?: React.ReactNode
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export default function PageHeader({
  icon,
  title,
  description,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`module-page-header ${className}`}>
      <div className="module-page-header-left">
        {icon && <div className="module-page-header-icon">{icon}</div>}
        <div>
          <h1 className="module-page-title">{title}</h1>
          {description && (
            <p className="module-page-description">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="module-page-header-actions">{actions}</div>}
    </div>
  )
}
