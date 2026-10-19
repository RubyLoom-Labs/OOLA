import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Building2,
  FolderKanban,
  CheckSquare,
  Calendar,
  Mail,
  FileText,
  FileSpreadsheet,
  Package,
  BarChart3,
  Settings,
  ChevronRight,
  ChevronLeft,
  Crown,
} from 'lucide-react'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

interface NavItem {
  label: string
  icon: React.ElementType
  path: string
  badge?: number
  children?: { label: string; path: string }[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Leads', icon: Users, path: '/leads' },
  { label: 'Companies', icon: Building2, path: '/companies' },
  { label: 'Contacts', icon: Users, path: '/contacts' },
  { label: 'Projects', icon: FolderKanban, path: '/projects' },
  { label: 'Tasks', icon: CheckSquare, path: '/tasks' },
  { label: 'Calendar', icon: Calendar, path: '/calendar' },
  { label: 'Communication Hub', icon: Mail, path: '/emails' },
  { label: 'Payments', icon: FileText, path: '/invoices' },
  {
    label: 'Quotation Generator',
    icon: FileSpreadsheet,
    path: '/quotes',
    children: [
      { label: 'All Quotes', path: '/quotes' },
      { label: 'Drafts', path: '/quotes/drafts' },
      { label: 'Sent', path: '/quotes/sent' },
      { label: 'Accepted', path: '/quotes/accepted' },
      { label: 'Rejected', path: '/quotes/rejected' },
    ],
  },
  { label: 'Hosting Information', icon: Package, path: '/products' },
  { label: 'Employees', icon: Users, path: '/accounts' },
  { label: 'Reports', icon: BarChart3, path: '/reports' },
  { label: 'Settings', icon: Settings, path: '/settings' },
]

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()
  const [expandedItems, setExpandedItems] = useState<string[]>(['Quotes'])

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    )
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const isChildActive = (item: NavItem) => {
    return item.children?.some((child) => location.pathname === child.path) ?? false
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <FolderKanban size={18} />
        </div>
        <span className="sidebar-logo-text">OOLA CRM</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon
          const hasChildren = item.children && item.children.length > 0
          const isExpanded = expandedItems.includes(item.label)
          const active = isActive(item.path) || isChildActive(item)

          return (
            <div key={item.label} className="sidebar-nav-section">
              {hasChildren ? (
                <div
                  className={`sidebar-nav-item ${active ? 'active' : ''} ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => toggleExpand(item.label)}
                >
                  <Icon className="sidebar-nav-icon" />
                  <span className="sidebar-nav-label">{item.label}</span>
                  {item.badge && <span className="sidebar-nav-badge">{item.badge}</span>}
                  <ChevronRight className="sidebar-nav-chevron" />
                </div>
              ) : (
                <Link
                  to={item.path}
                  className={`sidebar-nav-item ${active ? 'active' : ''}`}
                >
                  <Icon className="sidebar-nav-icon" />
                  <span className="sidebar-nav-label">{item.label}</span>
                  {item.badge && <span className="sidebar-nav-badge">{item.badge}</span>}
                </Link>
              )}

              {/* Sub-navigation */}
              {hasChildren && isExpanded && (
                <div className="sidebar-subnav">
                  {item.children!.map((child) => (
                    <Link
                      key={child.path}
                      to={child.path}
                      className={`sidebar-subnav-item ${location.pathname === child.path ? 'active' : ''}`}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-plan-card">
            <div className="sidebar-plan-header">
              <div className="sidebar-plan-icon">
                <Crown size={15} />
              </div>
              <div className="sidebar-plan-info">
                <span className="sidebar-plan-label">Your Plan</span>
                <span className="sidebar-plan-name">Professional</span>
              </div>
            </div>
            <button className="sidebar-plan-btn">Upgrade</button>
          </div>
        )}
        <button
          className="sidebar-collapse-btn"
          onClick={onToggle}
          style={{ marginTop: collapsed ? 0 : 8 }}
        >
          <ChevronLeft size={18} style={{ transform: collapsed ? 'rotate(180deg)' : 'none' }} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
