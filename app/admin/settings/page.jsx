"use client"

import {
  ShieldCheck,
  Mail,
  Phone,
  Lock,
  Server,
  CheckCircle2,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import AdminLayout from "@/components/layout/AdminLayout"
import PasswordSecurityCard from "@/components/security/PasswordSecurityCard"

export default function AdminSettingsPage() {
  const { user } = useAuth()

  return (
    <AdminLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1
            className="text-2xl font-bold text-slate-900"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Admin Settings & Security
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage administrative credentials, hospital security policies, and
            password controls
          </p>
        </div>

        {}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-slate-900 text-teal-400 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm border border-slate-800">
              AD
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Hospital Administrator
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  Superadmin
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                MediSlot Central Hospital System
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-semibold block mb-1">
                Administrative Email
              </span>
              <div className="flex items-center gap-2 font-mono font-medium text-slate-800">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">
                  {user?.email || "admin@medislot.com"}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-semibold block mb-1">
                Contact Phone
              </span>
              <div className="flex items-center gap-2 font-medium text-slate-800">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{user?.phone || "+91 99999 88888"}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-semibold block mb-1">
                Access Level
              </span>
              <div className="flex items-center gap-2 font-semibold text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Full System Access</span>
              </div>
            </div>
          </div>
        </div>

        {}
        <PasswordSecurityCard
          title="Password & Security"
          description="Protect hospital administration privileges. Updating your password invalidates all active sessions."
        />

        {}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Active Hospital Security Controls
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800">
                  Bcrypt Password Hashing
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Passwords never stored in plain text. Salted rounds enforce
                  cryptographically secure storage.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800">
                  Rate Limiting Protection
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Sliding window limiter blocks automated brute-force attacks on
                  login and reset APIs.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800">
                  Single-Use Reset Tokens
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  64-character random tokens hashed with SHA-256, 15-minute
                  expiration, strictly single-use.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800">
                  Immediate Session Invalidation
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Changing account password instantly revokes all prior session
                  tokens and cookies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
