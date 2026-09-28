import React from 'react'

export type StatCardVariant = 'blue' | 'green' | 'amber' | 'purple' | 'gray'

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  variant?: StatCardVariant
  subtext?: string
  onClick?: () => void
  active?: boolean
}

export default function StatCard({
  label,
  value,
  icon,
  variant = 'blue',
  subtext,
  onClick,
  active = false,
}: StatCardProps) {
  return (
    <div
      className={`stat-card stat-card-${variant} ${active ? 'stat-card-active' : ''} ${
        onClick ? 'stat-card-clickable' : ''
      }`}
      onClick={onClick}
    >
      <div className={`stat-card-icon-box stat-card-icon-box-${variant}`}>
        {icon}
      </div>
      <div className="stat-card-content">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">{value}</div>
        {subtext && <div className="stat-card-subtext">{subtext}</div>}
      </div>
    </div>
  )
}
