"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Users,
  LogOut,
  Stethoscope,
  X,
  User,
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"

const links = [
  { to: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/doctor/schedule", label: "My Schedule", icon: Clock },
  { to: "/doctor/patients", label: "Patient Records", icon: Users },
  { to: "/doctor/profile", label: "My Profile", icon: User },
]

export default function DoctorSidebar({ mobile, onClose }) {
  const router = useRouter()
  const pathname = usePathname()
  const { logout, user } = useAuth()

  const handleLogout = async () => {
    if (onClose) onClose()
    await logout("/")
  }

  return (
    <aside
      className={`bg-white border-r border-slate-100 flex flex-col ${
        mobile ? "w-64" : "w-64"
      } h-full`}
    >
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white shadow-sm">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <div
              className="font-bold text-slate-900 leading-none"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Medi<span className="text-teal-600">Slot</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-teal-600">
              Doctor Portal
            </span>
          </div>
        </div>
        {mobile && (
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        )}
      </div>

      {}
      <div className="p-4 mx-3 my-3 bg-gradient-to-br from-teal-50 to-emerald-50/50 rounded-xl border border-teal-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {user?.avatar || "AS"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {user?.name || "Dr. Amit Sharma"}
            </p>
            <p className="text-xs text-teal-700 truncate font-medium">
              {user?.specialization || "Cardiologist"}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 flex flex-col gap-1">
        {links.map(({ to, label, icon: Icon }) => {
          const isActive = pathname === to
          return (
            <Link
              key={to}
              href={to}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-teal-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 w-full transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
