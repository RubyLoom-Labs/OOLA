import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import {
  notificationsApi,
  type CrmNotificationItem,
} from '@/apis/notificationsApi'
import { useAuth } from './AuthContext'
import { CheckCircle2, AlertTriangle, Info, X, FolderKanban, CheckSquare } from 'lucide-react'

interface ToastItem {
  id: string
  title: string
  message: string
  type: string
  actionUrl?: string | null
}

interface NotificationContextType {
  notifications: CrmNotificationItem[]
  unreadCount: number
  isLoading: boolean
  markAsRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState<CrmNotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const eventSourceRef = useRef<EventSource | null>(null)
  const seenIdsRef = useRef<Set<number>>(new Set())

  // Trigger floating toast
  const showToast = useCallback((title: string, message: string, type: string, actionUrl?: string | null) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, title, message, type, actionUrl }])

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 6000)
  }, [])

  // Fetch full notification list
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const [listRes, count] = await Promise.all([
        notificationsApi.getNotifications({ per_page: 20 }),
        notificationsApi.getUnreadCount(),
      ])

      const rawItems = (listRes as any)?.data?.data || listRes?.data || []
      if (Array.isArray(rawItems)) {
        setNotifications(rawItems)
        rawItems.forEach((item: CrmNotificationItem) => {
          seenIdsRef.current.add(item.id)
        })
      }
      setUnreadCount(count)
    } catch (err) {
      console.warn('Failed to refresh notifications:', err)
    }
  }, [isAuthenticated])

  // Mark single as read
  const markAsRead = useCallback(async (id: number) => {
    try {
      await notificationsApi.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead()
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }, [])

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true)
      refreshNotifications().finally(() => setIsLoading(false))
    } else {
      setNotifications([])
      setUnreadCount(0)
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [isAuthenticated, refreshNotifications])

  // Real-time EventSource (Server-Sent Events) Connection
  useEffect(() => {
    if (!isAuthenticated || !token) return

    const streamUrl = notificationsApi.getStreamUrl(token)

    try {
      const es = new EventSource(streamUrl)
      eventSourceRef.current = es

      // Initial stream event
      es.addEventListener('init', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data)
          if (typeof data.unread_count === 'number') {
            setUnreadCount(data.unread_count)
          }
          if (Array.isArray(data.notifications)) {
            setNotifications(data.notifications)
            data.notifications.forEach((item: CrmNotificationItem) => {
              seenIdsRef.current.add(item.id)
            })
          }
        } catch {
          // Fallback
        }
      })

      // Real-time new notification event
      es.addEventListener('notification', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data)
          if (typeof data.unread_count === 'number') {
            setUnreadCount(data.unread_count)
          }
          if (data.notification) {
            const newItem: CrmNotificationItem = data.notification
            if (!seenIdsRef.current.has(newItem.id)) {
              seenIdsRef.current.add(newItem.id)
              setNotifications((prev) => [newItem, ...prev.filter((p) => p.id !== newItem.id)])
              showToast(newItem.title, newItem.message, newItem.type, newItem.action_url)
            }
          }
        } catch {
          // Fallback
        }
      })

      es.onerror = () => {
        // EventSource automatically retries on disconnect
      }
    } catch (err) {
      console.warn('EventSource initialization failed, relying on background polling:', err)
    }

    // Background polling fallback every 8 seconds
    const interval = setInterval(() => {
      refreshNotifications()
    }, 8000)

    return () => {
      clearInterval(interval)
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [isAuthenticated, token, refreshNotifications, showToast])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
      }}
    >
      {children}

      {/* Real-time Toast Notifications Portal */}
      {toasts.length > 0 && (
        <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
          {toasts.map((toast) => {
            const getIcon = () => {
              switch (toast.type) {
                case 'project':
                  return <FolderKanban className="text-blue-500 shrink-0" size={18} />
                case 'task':
                  return <CheckSquare className="text-emerald-500 shrink-0" size={18} />
                case 'warning':
                  return <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                case 'success':
                  return <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
                default:
                  return <Info className="text-blue-500 shrink-0" size={18} />
              }
            }

            return (
              <div
                key={toast.id}
                className="pointer-events-auto bg-white border border-slate-200/90 shadow-xl rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300"
              >
                <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl mt-0.5">
                  {getIcon()}
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <div className="text-xs font-bold text-slate-900 leading-snug">
                    {toast.title}
                  </div>
                  <div className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {toast.message}
                  </div>
                  {toast.actionUrl && (
                    <a
                      href={toast.actionUrl}
                      onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                      className="inline-block mt-2 text-[11px] font-semibold text-blue-600 hover:text-blue-700 underline"
                    >
                      View Details &rarr;
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
