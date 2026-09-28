import { useState } from 'react'
import {
  Menu,
  Search,
  Mail,
  Bell,
  ChevronDown,
} from 'lucide-react'

interface TopbarProps {
  onMenuClick: () => void
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false)

  const notifications = [
    {
      id: 1,
      icon: '📋',
      text: 'Task assigned to you — Prepare proposal for ABC Ltd',
      time: '2 minutes ago',
      unread: true,
    },
    {
      id: 2,
      icon: '💰',
      text: 'Payment received for Website Redesign Project',
      time: '10 minutes ago',
      unread: true,
    },
    {
      id: 3,
      icon: '📅',
      text: 'Meeting with TechNova Inc. starts in 30 minutes',
      time: '20 minutes ago',
      unread: false,
    },
    {
      id: 4,
      icon: '🎯',
      text: 'Lead "XYZ Corp" moved to Proposal stage',
      time: '1 hour ago',
      unread: false,
    },
    {
      id: 5,
      icon: '⏰',
      text: 'Reminder: Follow-up call with DEF Ltd',
      time: '2 hours ago',
      unread: false,
    },
  ]

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
        <div style={{ position: 'relative' }}>
          <button
            className="topbar-icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            <Bell size={18} />
            <span className="topbar-badge">3</span>
          </button>

          {showNotifications && (
            <div className="notification-dropdown animate-fade-in">
              <div className="notification-header">
                <span className="notification-header-title">Notifications</span>
                <button className="btn btn-ghost btn-sm">Mark all read</button>
              </div>
              <div className="notification-list">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.unread ? 'unread' : ''}`}
                  >
                    <div className="notification-item-icon">{notification.icon}</div>
                    <div className="notification-item-content">
                      <div className="notification-item-text">{notification.text}</div>
                      <div className="notification-item-time">{notification.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="notification-footer">
                <a href="/notifications">View all notifications</a>
              </div>
            </div>
          )}
        </div>

        <button className="topbar-icon-btn" title="Messages">
          <Mail size={18} />
        </button>

        <div className="topbar-divider" />

        <div className="topbar-user">
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
            alt="John Doe"
            className="topbar-user-avatar-img"
          />
          <div className="topbar-user-info">
            <div className="topbar-user-name">John Doe</div>
            <div className="topbar-user-role">Admin</div>
          </div>
          <ChevronDown className="topbar-user-chevron" size={14} />
        </div>
      </div>
    </header>
  )
}
