"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  UserPlus,
  Stethoscope,
  Info,
  X,
  Clock,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"

function formatRelativeTime(dateString) {
  if (!dateString) return ""
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 30) return "Just now"
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays === 1) return "Yesterday"
  if (diffInDays < 7) return `${diffInDays}d ago`

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function getNotificationIcon(type, relatedType) {
  if (type.includes("appointment") || relatedType === "appointment") {
    return <Calendar className="w-4 h-4 text-teal-600" />
  }
  if (type.includes("doctor") || relatedType === "doctor") {
    return <Stethoscope className="w-4 h-4 text-emerald-600" />
  }
  if (type.includes("patient") || relatedType === "patient") {
    return <UserPlus className="w-4 h-4 text-indigo-600" />
  }
  return <Info className="w-4 h-4 text-slate-600" />
}

export default function NotificationBell() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const dropdownRef = useRef(null)

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const res = await fetch("/api/notifications/unread-count", {
        headers: { "Cache-Control": "no-cache" },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setUnreadCount(Number(data.count) || 0)
        }
      }
    } catch (err) {
      console.error("[NotificationBell] Error fetching unread count:", err)
    }
  }, [isAuthenticated])

  // Fetch full notification list
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const res = await fetch("/api/notifications?limit=40", {
        headers: { "Cache-Control": "no-cache" },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.notifications)) {
          setNotifications(data.notifications)
          const unread = data.notifications.filter((n) => !n.isRead).length
          setUnreadCount(unread)
        }
      }
    } catch (err) {
      console.error("[NotificationBell] Error fetching notifications:", err)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  // Initial load and periodic polling (every 30 seconds)
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0)
      setNotifications([])
      return
    }

    fetchUnreadCount()

    // 30 seconds interval polling
    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 30000)

    // Re-check on tab focus / window visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [isAuthenticated, fetchUnreadCount])

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  // Toggle dropdown
  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications()
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }

  // Mark single notification as read
  const handleMarkAsRead = async (notif, e) => {
    if (e) e.stopPropagation()
    if (notif.isRead) return

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n)),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))

    try {
      await fetch(`/api/notifications/${notif._id}/read`, {
        method: "PUT",
      })
    } catch (err) {
      console.error("[NotificationBell] Error marking as read:", err)
      // Re-fetch on error to ensure sync
      fetchUnreadCount()
    }
  }

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || markingAll) return
    setMarkingAll(true)

    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)

    try {
      await fetch("/api/notifications/mark-all-read", {
        method: "PUT",
      })
    } catch (err) {
      console.error("[NotificationBell] Error marking all as read:", err)
      fetchUnreadCount()
    } finally {
      setMarkingAll(false)
    }
  }

  // Delete notification
  const handleDelete = async (notif, e) => {
    if (e) e.stopPropagation()

    // Optimistic UI update
    setNotifications((prev) => prev.filter((n) => n._id !== notif._id))
    if (!notif.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }

    try {
      await fetch(`/api/notifications/${notif._id}`, {
        method: "DELETE",
      })
    } catch (err) {
      console.error("[NotificationBell] Error deleting notification:", err)
      fetchNotifications()
    }
  }

  // Handle notification click: mark as read and navigate
  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif)
    }
    setIsOpen(false)

    // Role-based navigation based on relatedType
    const userRole = user?.role || "patient"

    if (notif.relatedType === "appointment") {
      if (userRole === "patient") {
        router.push("/my-appointments")
      } else if (userRole === "doctor") {
        router.push("/doctor/dashboard")
      } else if (userRole === "admin") {
        router.push("/admin/appointments")
      }
    } else if (notif.relatedType === "doctor") {
      if (userRole === "admin") {
        router.push("/admin/doctors")
      } else {
        router.push("/find-doctors")
      }
    } else if (notif.relatedType === "patient") {
      if (userRole === "admin") {
        router.push("/admin/dashboard")
      }
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={handleToggle}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className={`relative p-2 rounded-xl transition-all cursor-pointer ${
          isOpen
            ? "bg-slate-100 text-teal-700 shadow-xs"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/80"
        }`}
      >
        <Bell className="w-5 h-5 transition-transform active:scale-95" />

        {/* Unread Count Badge (Only rendered when unreadCount > 0, NEVER shows '0') */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs border-2 border-white animate-in zoom-in-50 duration-200">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-[330px] sm:w-[400px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden flex flex-col animate-in fade-in-50 slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="bg-teal-100 text-teal-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:bg-teal-50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all as read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification List Body */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">
                  Loading notifications...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  No notifications yet
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto">
                  When updates about your appointments or system activity occur, they will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.isRead
                return (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 transition-all cursor-pointer group flex items-start gap-3 border-l-[3px] ${
                      isUnread
                        ? "bg-teal-50/40 hover:bg-teal-50/80 border-teal-600"
                        : "bg-white hover:bg-slate-50 border-transparent text-slate-600"
                    }`}
                  >
                    {/* Event Icon */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isUnread
                          ? "bg-white text-teal-600 shadow-xs border border-teal-100"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {getNotificationIcon(notif.type, notif.relatedType)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p
                          className={`text-xs tracking-tight truncate ${
                            isUnread
                              ? "font-bold text-slate-900"
                              : "font-semibold text-slate-700"
                          }`}
                        >
                          {notif.title}
                        </p>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-teal-600 flex-shrink-0" />
                        )}
                      </div>

                      <p
                        className={`text-[12px] leading-relaxed line-clamp-2 ${
                          isUnread ? "text-slate-800 font-medium" : "text-slate-500"
                        }`}
                      >
                        {notif.message}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/60 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(notif.createdAt)}
                        </span>

                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          {isUnread && (
                            <button
                              onClick={(e) => handleMarkAsRead(notif, e)}
                              className="p-1 rounded hover:bg-slate-200/70 text-slate-500 hover:text-teal-700 transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(notif, e)}
                            className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Dropdown Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 text-center text-[11px] text-slate-400 font-medium">
              Click an appointment notification to view its details
            </div>
          )}
        </div>
      )}
    </div>
  )
}
