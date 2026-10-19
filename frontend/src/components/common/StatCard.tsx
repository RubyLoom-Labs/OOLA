import React from 'react'

export type StatCardVariant = 'blue' | 'green' | 'amber' | 'purple' | 'gray'

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode | React.ComponentType<{ size?: number; className?: string }>
  variant?: StatCardVariant
  subtext?: string
  onClick?: () => void
  active?: boolean
  change?: string
  iconColor?: string
}

export default function StatCard({
  label,
  value,
  icon,
  variant = 'blue',
  subtext,
  change,
  onClick,
  active = false,
}: StatCardProps) {
  const renderedIcon =
    typeof icon === 'function' ? React.createElement(icon, { size: 20 }) : icon

  return (
    <div
      className={`stat-card stat-card-${variant} ${active ? 'stat-card-active' : ''} ${
        onClick ? 'stat-card-clickable' : ''
      }`}
      onClick={onClick}
    >
      <div className={`stat-card-icon-box stat-card-icon-box-${variant}`}>
        {renderedIcon}
      </div>
      <div className="stat-card-content">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">{value}</div>
        {(subtext || change) && <div className="stat-card-subtext">{subtext || change}</div>}
      </div>
    </div>
  )
}
