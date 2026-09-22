"use client"

// Reset form when modal opens/closes

// Live password validation criteria

// Session invalidated: logout and redirect to login after short delay

import { useState, useEffect } from "react"

import { useRouter } from "next/navigation"

import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  ShieldCheck,
} from "lucide-react"

import { useAuth } from "@/context/AuthContext"

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [currentPassword, setCurrentPassword] = useState("")

  const [newPassword, setNewPassword] = useState("")

  const [confirmPassword, setConfirmPassword] = useState("")

  const [showCurrent, setShowCurrent] = useState(false)

  const [showNew, setShowNew] = useState(false)

  const [showConfirm, setShowConfirm] = useState(false)

  const [loading, setLoading] = useState(false)

  const [errorMsg, setErrorMsg] = useState("")

  const [successMsg, setSuccessMsg] = useState("")

  const router = useRouter()

  const { user, logout } = useAuth()

  useEffect(() => {
    if (isOpen) {
      setCurrentPassword("")

      setNewPassword("")

      setConfirmPassword("")

      setErrorMsg("")

      setSuccessMsg("")

      setLoading(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const hasMinLength = newPassword.length >= 8

  const hasUppercase = /[A-Z]/.test(newPassword)

  const hasLowercase = /[a-z]/.test(newPassword)

  const hasNumber = /[0-9]/.test(newPassword)

  const isPolicySatisfied =
    hasMinLength && hasUppercase && hasLowercase && hasNumber

  const handleSubmit = async (e) => {
    e.preventDefault()

    setErrorMsg("")

    setSuccessMsg("")

    if (!currentPassword) {
      setErrorMsg("Please enter your current password.")

      return
    }

    if (!isPolicySatisfied) {
      setErrorMsg("Password does not meet security requirements.")

      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.")

      return
    }

    if (currentPassword === newPassword) {
      setErrorMsg("New password must be different from your current password.")

      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PUT",

        headers: { "Content-Type": "application/json" },

        credentials: "include",

        body: JSON.stringify({
          currentPassword,

          newPassword,

          confirmPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || data.error || "Failed to update password.")

        setLoading(false)

        return
      }

      setSuccessMsg(
        data.message || "Password changed successfully. Please log in again.",
      )

      setLoading(false)

      setTimeout(() => {
        logout()

        if (user?.role === "admin") {
          router.push(
            "/admin/login?message=Password+changed+successfully.+Please+log+in+again.",
          )
        } else {
          router.push(
            "/login?message=Password+changed+successfully.+Please+log+in+again.",
          )
        }
      }, 1500)
    } catch (err) {
      setErrorMsg("An unexpected error occurred while changing password.")

      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
      >
        {}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="change-password-title"
                className="text-base font-bold text-slate-900"
              >
                Reset Password
              </h2>
              <p className="text-xs text-slate-500">
                Update your credentials to keep your account secure
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p>{successMsg}</p>
                <p className="text-[11px] text-emerald-700 font-normal mt-0.5">
                  Redirecting to login...
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showCurrent ? "text" : "password"}
                  required
                  disabled={loading || !!successMsg}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition disabled:bg-slate-50 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showCurrent ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showNew ? "text" : "password"}
                  required
                  disabled={loading || !!successMsg}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="e.g. MediSlot@123"
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition disabled:bg-slate-50 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNew ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {}
              <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Password Requirements:
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <div
                    className={`flex items-center gap-1.5 ${
                      hasMinLength
                        ? "text-emerald-700 font-semibold"
                        : "text-slate-500"
                    }`}
                  >
                    {hasMinLength ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0" />
                    )}
                    <span>Minimum 8 characters</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      hasUppercase
                        ? "text-emerald-700 font-semibold"
                        : "text-slate-500"
                    }`}
                  >
                    {hasUppercase ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0" />
                    )}
                    <span>Uppercase letter</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      hasLowercase
                        ? "text-emerald-700 font-semibold"
                        : "text-slate-500"
                    }`}
                  >
                    {hasLowercase ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0" />
                    )}
                    <span>Lowercase letter</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      hasNumber
                        ? "text-emerald-700 font-semibold"
                        : "text-slate-500"
                    }`}
                  >
                    {hasNumber ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0" />
                    )}
                    <span>At least one number</span>
                  </div>
                </div>
              </div>
            </div>

            {}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  disabled={loading || !!successMsg}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition disabled:bg-slate-50 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {confirmPassword && newPassword && (
                <p
                  className={`text-[11px] mt-1 font-semibold flex items-center gap-1 ${
                    newPassword === confirmPassword
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  {newPassword === confirmPassword
                    ? "✓ Passwords match"
                    : "✗ Passwords do not match"}
                </p>
              )}
            </div>

            {}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !!successMsg}
                className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
              >
                {loading && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>
                  {loading ? "Resetting password..." : "Reset Password"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
