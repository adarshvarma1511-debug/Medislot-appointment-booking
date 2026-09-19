"use client"

import { useState } from "react"
import { Shield, KeyRound, Calendar } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import ChangePasswordModal from "./ChangePasswordModal"

export default function PasswordSecurityCard({
  title = "Password & Security",
  description = "Protect your MediSlot account.",
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user } = useAuth()

  const formatLastUpdated = (dateVal) => {
    if (!dateVal) return "Initial password set on creation"
    try {
      const d = new Date(dateVal)
      if (isNaN(d.getTime())) return "Recently updated"
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    } catch {
      return "Recently updated"
    }
  }

  const lastUpdateText = formatLastUpdated(user?.passwordUpdatedAt)

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2
                className="text-base font-bold text-slate-900"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>

              <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Last password update:</span>
                <span className="font-semibold text-slate-700">
                  {lastUpdateText}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-teal-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Reset Password</span>
          </button>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
