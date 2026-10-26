import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Menu,
  Search,
  Mail,
  Bell,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Shield,
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  Info,
  CheckCheck,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'
import { capitalizeWords, getAvatarUrl } from '@/lib/utils'

interface TopbarProps {
  onMenuClick: () => void
}

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return 'Just now'
  try {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 172800) return 'Yesterday'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return 'Recently'
  }
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const extractString = (val: any): string => {
    if (!val) return ''
    if (typeof val === 'string') return val
    if (typeof val === 'object') {
      return val.name || val.title || val.slug || val.label || ''
    }
    return String(val)
  }

  const displayName = capitalizeWords(extractString(user?.name)) || 'Alex Morgan'
  const displayRole =
    capitalizeWords(extractString(user?.role) || extractString(user?.designation)) || 'Super Admin'
  const displayEmail = user?.email || 'admin@ooralabz.com'

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'project':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FolderKanban size={15} />
          </div>
        )
      case 'task':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckSquare size={15} />
          </div>
        )
      case 'warning':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={15} />
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Info size={15} />
          </div>
        )
    }
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-hamburger" onClick={onMenuClick}>
          <Menu size={20} />
        </button>

        <div className="topbar-search">
          <Search className="topbar-search-icon" />
          <input
            type="text"
            className="topbar-search-input"
            placeholder="Search leads, contacts, accounts, projects..."
          />
          <div className="topbar-search-shortcut">
            <kbd>⌘</kbd>
            <kbd>K</kbd>
          </div>
        </div>
      </div>

      <div className="topbar-right">
        {/* Real-time Notifications Bell */}
        <div style={{ position: 'relative' }}>
          <button
            className="topbar-icon-btn relative cursor-pointer"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="topbar-badge animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-[90]" onClick={() => setShowNotifications(false)} />
              <div className="notification-dropdown animate-fade-in shadow-2xl border border-slate-200 rounded-2xl overflow-hidden z-[100] w-[370px]">
              <div className="notification-header bg-slate-50/80 backdrop-blur-xs px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="notification-header-title text-sm font-bold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <CheckCheck size={13} />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="notification-list max-h-[380px] overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-12 px-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                      <Bell size={18} />
                    </div>
                    <div className="text-xs font-bold text-slate-700">No notifications</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">You're completely caught up!</div>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => {
                        if (!notification.is_read) {
                          markAsRead(notification.id)
                        }
                        setShowNotifications(false)
                        if (notification.action_url) {
                          navigate(notification.action_url)
                        }
                      }}
                      className={`notification-item flex items-start gap-3 p-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                        !notification.is_read ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'bg-white'
                      }`}
                    >
                      {getNotificationIcon(notification.type)}
                      <div className="notification-item-content flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <div className={`text-xs ${!notification.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                            {notification.title}
                          </div>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {formatRelativeTime(notification.created_at)}
                          </span>
                        </div>
                        <div className="notification-item-text text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </div>
                      </div>
                      {!notification.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="notification-footer bg-slate-50 px-4 py-2.5 border-t border-slate-100 text-center">
                <span className="text-[11px] text-slate-500 font-medium">
                  Real-time notifications powered by OOLA CRM
                </span>
              </div>
            </div>
            </>
          )}
        </div>

        <button className="topbar-icon-btn" title="Messages">
          <Mail size={18} />
        </button>

        <div className="topbar-divider" />

        {/* User Profile & Logout Menu */}
        <div style={{ position: 'relative' }}>
          <div
            className="topbar-user cursor-pointer"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <img
              src={getAvatarUrl(
                user?.avatar,
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
              )}
              alt={displayName}
              className="topbar-user-avatar-img"
            />
            <div className="topbar-user-info">
              <div className="topbar-user-name">{displayName}</div>
              <div className="topbar-user-role">{displayRole}</div>
            </div>
            <ChevronDown className="topbar-user-chevron" size={14} />
          </div>

          {showUserMenu && (
            <div
              className="dropdown-menu animate-fade-in"
              style={{
                right: 0,
                top: 'calc(100% + 8px)',
                width: 220,
                padding: '6px 0',
              }}
            >
              <div
                style={{
                  padding: '8px 14px',
                  borderBottom: '1px solid var(--color-gray-100)',
                  marginBottom: 4,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b' }}>
                  {displayEmail}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: '#2563eb',
                    background: '#eff6ff',
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}
                >
                  <Shield size={11} />
                  {displayRole}
                </div>
              </div>

              <button
                className="dropdown-item"
                onClick={() => {
                  setShowUserMenu(false)
                  navigate('/settings')
                }}
              >
                <UserIcon size={14} />
                My Profile
              </button>

              <button
                className="dropdown-item text-danger"
                onClick={async () => {
                  setShowUserMenu(false)
                  await logout()
                }}
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
