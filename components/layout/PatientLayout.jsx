"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Menu } from "lucide-react"
import PatientSidebar from "./PatientSidebar"
import { useAuth } from "../../context/AuthContext"
import DatabaseBadge from "../ui/DatabaseBadge"
import NotificationBell from "../ui/NotificationBell"

export default function PatientLayout({ children }) {
  const { isAuthenticated, isLoaded, isLoggingOut, user } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isLoaded || isLoggingOut) return
    if (!isAuthenticated) {
      router.replace("/login")
    } else if (user?.role !== "patient") {
      if (user?.role === "doctor") {
        router.replace("/doctor/dashboard")
      } else if (user?.role === "admin") {
        router.replace("/admin/dashboard")
      }
    }
  }, [isAuthenticated, isLoaded, isLoggingOut, user, router])

  if (isLoggingOut) {
    return <div className="min-h-screen bg-white" />
  }

  if (!isLoaded || !isAuthenticated || user?.role !== "patient") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AS"

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <div className="hidden md:flex flex-shrink-0">
        <PatientSidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10">
            <PatientSidebar mobile onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-100 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 cursor-pointer"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 w-64">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search appointments, tests..."
                className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DatabaseBadge />
            <NotificationBell />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-xs">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 leading-tight">
                  {user?.name || "Patient"}
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  {user?.role === "admin" ? "Administrator" : "Patient Account"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
