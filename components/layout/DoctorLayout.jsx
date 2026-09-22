"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Menu, Stethoscope, CheckCircle2, Moon } from "lucide-react"
import DoctorSidebar from "./DoctorSidebar"
import { useAuth } from "../../context/AuthContext"
import NotificationBell from "../ui/NotificationBell"

export default function DoctorLayout({ children }) {
  const {
    isAuthenticated,
    isLoaded,
    isLoggingOut,
    user,
    doctorAvailabilities,
    toggleDoctorAvailability,
  } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isLoaded || isLoggingOut) return
    if (!isAuthenticated) {
      router.replace("/login")
    } else if (user?.role !== "doctor") {
      if (user?.role === "admin") {
        router.replace("/admin/dashboard")
      } else {
        router.replace("/dashboard")
      }
    }
  }, [isAuthenticated, isLoaded, isLoggingOut, user, router])

  if (isLoggingOut) {
    return <div className="min-h-screen bg-white" />
  }

  if (!isLoaded || !isAuthenticated || user?.role !== "doctor") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">
            Verifying Doctor Authorization...
          </p>
        </div>
      </div>
    )
  }

  const doctorId = user?.doctorId || user?._id || user?.id || ""
  const isAvailableToday = doctorId
    ? (doctorAvailabilities[doctorId] ?? true)
    : true

  const initials = user?.name
    ? user.name
        .replace(/^Dr\.\s*/i, "")
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "DR"

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <div className="hidden md:flex flex-shrink-0">
        <DoctorSidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10">
            <DoctorSidebar mobile onClose={() => setSidebarOpen(false)} />
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
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 w-72">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, symptoms, or ID..."
                className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {}
            <button
              onClick={() => toggleDoctorAvailability(doctorId)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                isAvailableToday
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
              }`}
              title="Click to toggle your availability today"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isAvailableToday
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-amber-500"
                }`}
              />
              {isAvailableToday
                ? "Accepting Patients Today"
                : "Away / Not Available"}
            </button>

            <NotificationBell />

            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-slate-900 leading-tight">
                  {user?.name || "Dr. Amit Sharma"}
                </p>
                <p className="text-[11px] text-teal-600 font-medium">
                  {user?.department || "Cardiology"} Specialist
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
