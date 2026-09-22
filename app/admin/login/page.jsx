"use client"

import { useState, useEffect, Suspense } from "react"

import Link from "next/link"

import { useRouter, useSearchParams } from "next/navigation"

import {
  Calendar,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  AlertCircle,
} from "lucide-react"

import { useAuth } from "@/context/AuthContext"

function AdminLoginFormContent() {
  const [showPw, setShowPw] = useState(false)

  const [email, setEmail] = useState("admin@medislot.com")

  const [password, setPassword] = useState("admin123")

  const [loading, setLoading] = useState(false)

  const [errorMsg, setErrorMsg] = useState("")

  const router = useRouter()

  const searchParams = useSearchParams()

  const { user, isAuthenticated, isLoaded, loginWithCredentials, logout } =
    useAuth()

  const alertMessage = searchParams.get("message")

  const handleSubmit = async (e) => {
    e.preventDefault()

    setErrorMsg("")

    setLoading(true)

    try {
      const res = await loginWithCredentials(
        email.trim().toLowerCase(),

        password,

        "admin",
      )

      if (!res.success) {
        setErrorMsg(
          res.error || res.message || "Invalid administrator credentials.",
        )

        setLoading(false)

        return
      }

      window.location.href = "/admin/dashboard"
    } catch (err) {
      setErrorMsg("Failed to authenticate administrator.")

      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center shadow-xs">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <span
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Medi<span className="text-teal-400">Slot</span>
          </span>
        </Link>
        <div className="flex items-center justify-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-teal-400" />
          <h1 className="text-2xl font-bold text-white">
            Hospital Administration
          </h1>
        </div>
        <p className="text-slate-400 text-sm">
          Restricted access — authorized personnel only
        </p>
      </div>

      {alertMessage && (
        <div className="mb-6 p-4 bg-teal-950/80 border border-teal-500/40 rounded-xl text-teal-300 text-sm shadow-sm flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{alertMessage}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-950/80 border border-red-500/40 rounded-xl text-red-300 text-sm shadow-sm font-medium">
          {errorMsg}
        </div>
      )}

      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email address"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPw ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPw ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{loading ? "Authenticating..." : "Admin Login"}</span>
          </button>
        </form>
      </div>

      <div className="flex items-center justify-center gap-4 text-xs text-slate-400 mt-6">
        <Link href="/" className="hover:text-white transition-colors">
          ← Return to Home
        </Link>
        <span className="text-slate-700">•</span>
        <Link href="/login" className="text-teal-400 hover:underline">
          Patient Login
        </Link>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="text-slate-400 text-sm">Loading admin login...</div>
        }
      >
        <AdminLoginFormContent />
      </Suspense>
    </div>
  )
}
