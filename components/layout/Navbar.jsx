"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Calendar, Menu, X, LogOut, LogIn } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { isAuthenticated, user, logout } = useAuth()

  const handleLogout = async () => {
    setOpen(false)
    await logout("/")
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AS"

  // Only show active user session for patient and doctor accounts on the public navbar.
  // Admin accounts belong to the backoffice portal, so keep only the "Login" button on the public landing page.
  const isPatientOrDoctor = isAuthenticated && user?.role !== "admin"

  const dashboardHref =
    user?.role === "doctor"
      ? "/doctor/dashboard"
      : "/dashboard"

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shadow-xs">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span
              className="text-xl font-bold text-slate-900"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Medi<span className="text-teal-600">Slot</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm text-slate-600 hover:text-teal-600 transition-colors"
            >
              Home
            </Link>
            <a
              href="#how-it-works"
              className="text-sm text-slate-600 hover:text-teal-600 transition-colors"
            >
              How It Works
            </a>
            <a
              href="#about"
              className="text-sm text-slate-600 hover:text-teal-600 transition-colors"
            >
              About
            </a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isPatientOrDoctor ? (
              <div className="flex items-center gap-3">
                <Link
                  href={dashboardHref}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                >
                  <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-xs">
                    {initials}
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold text-slate-800 block leading-tight">
                      {user?.name}
                    </span>
                    <span className="text-[10px] text-teal-600 font-semibold uppercase tracking-wider">
                      {user?.role === "doctor" ? "Doctor" : "Patient"}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-all duration-150 cursor-pointer shadow-xs hover:shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer"
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 flex flex-col gap-4">
          <Link
            href="/"
            className="text-sm text-slate-700"
            onClick={() => setOpen(false)}
          >
            Home
          </Link>
          <a
            href="#how-it-works"
            className="text-sm text-slate-700"
            onClick={() => setOpen(false)}
          >
            How It Works
          </a>
          <a
            href="#about"
            className="text-sm text-slate-700"
            onClick={() => setOpen(false)}
          >
            About
          </a>

          {isPatientOrDoctor ? (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-slate-800 block">
                  {user?.name}
                </span>
                <span className="text-xs text-teal-600 font-semibold uppercase">
                  {user?.role === "doctor" ? "Doctor" : "Patient"}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs font-semibold text-red-600 flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg text-center cursor-pointer shadow-xs transition-colors"
              onClick={() => setOpen(false)}
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
