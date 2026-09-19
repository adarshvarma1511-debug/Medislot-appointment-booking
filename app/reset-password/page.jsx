"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Calendar,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  KeyRound,
} from "lucide-react"

function ResetPasswordFormContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(
    !token
      ? "This password reset link is invalid or has expired. Please request a new one."
      : "",
  )
  const [successMsg, setSuccessMsg] = useState("")

  const router = useRouter()

  const hasMinLength = newPassword.length >= 8
  const hasUppercase = /[A-Z]/.test(newPassword)
  const hasLowercase = /[a-z]/.test(newPassword)
  const hasNumber = /[0-9]/.test(newPassword)
  const isPolicySatisfied =
    hasMinLength && hasUppercase && hasLowercase && hasNumber

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")

    if (!token) {
      setErrorMsg(
        "This password reset link is invalid or has expired. Please request a new one.",
      )
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

    setLoading(true)

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrorMsg(
          data.error ||
            data.message ||
            "This password reset link is invalid or has expired. Please request a new one.",
        )
        setLoading(false)
        return
      }

      setSuccessMsg(
        data.message ||
          "Password reset successful! Please log in with your new password.",
      )
      setLoading(false)

      setTimeout(() => {
        router.push(
          "/login?message=Password+has+been+reset+successfully.+Please+log+in+with+your+new+password.",
        )
      }, 2000)
    } catch (err) {
      setErrorMsg("An unexpected error occurred. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center shadow-sm">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <span
            className="text-2xl font-bold text-slate-900"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Medi<span className="text-teal-600">Slot</span>
          </span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Create a new, secure password for your MediSlot account.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        {errorMsg && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p>{errorMsg}</p>
              {errorMsg.includes("invalid or has expired") && (
                <div className="mt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-800 font-bold underline"
                  >
                    Return to login →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {successMsg ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-sm space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Password Reset Complete!</span>
            </div>
            <p className="text-xs text-emerald-700">{successMsg}</p>
            <p className="text-xs text-slate-500 pt-1">
              Redirecting you to login automatically...
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-lg text-xs"
              >
                Proceed to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  disabled={loading || !token}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="e.g. MediSlot@123"
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition disabled:bg-slate-50"
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
              <div className="mt-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
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
                  disabled={loading || !token}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition disabled:bg-slate-50"
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

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Resetting Password...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Reset Password</span>
                </>
              )}
            </button>

            <div className="pt-3 border-t border-slate-100 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="text-slate-400 text-sm">Loading reset form...</div>
        }
      >
        <ResetPasswordFormContent />
      </Suspense>
    </div>
  )
}
