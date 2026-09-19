"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Search,
  Calendar,
  User,
  LogOut,
  Calendar as CalIcon,
  X,
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/find-doctors", label: "Find Doctors", icon: Search },
  { href: "/my-appointments", label: "My Appointments", icon: Calendar },
  { href: "/profile", label: "Profile", icon: User },
]

export default function PatientSidebar({ mobile, onClose }) {
  const router = useRouter()
  const pathname = usePathname()
  const { logout } = useAuth()

  const handleLogout = async () => {
    if (onClose) onClose()
    await logout("/")
  }

  return (
    <aside
      className={`bg-white border-r border-slate-100 flex flex-col ${
        mobile ? "w-64" : "w-60"
      } h-full`}
    >
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center shadow-xs">
            <CalIcon className="w-4 h-4 text-white" />
          </div>
          <span
            className="font-bold text-slate-900"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Medi<span className="text-teal-600">Slot</span>
          </span>
        </Link>
        {mobile && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 flex flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-teal-50 text-teal-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
              onClick={onClose}
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
