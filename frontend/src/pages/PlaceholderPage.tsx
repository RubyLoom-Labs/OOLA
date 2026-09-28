import Breadcrumb from '@/components/ui/Breadcrumb'
import { Construction } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  description: string
  breadcrumb: { label: string; path?: string }[]
}

export default function PlaceholderPage({ title, description, breadcrumb }: PlaceholderPageProps) {
  return (
    <div className="animate-fade-in">
      <Breadcrumb items={breadcrumb} />

      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{title}</h1>
          <p className="page-description">{description}</p>
        </div>
      </div>

      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">
            <Construction size={28} />
          </div>
          <h3 className="empty-state-title">Coming Soon</h3>
          <p className="empty-state-text">
            This module is under development. The interface will follow the same design system used across the entire platform.
          </p>
          <button className="btn btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
