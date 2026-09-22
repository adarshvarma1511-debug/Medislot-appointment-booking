"use client"

// Auto-redirect if already signed in (stored in cache memory) - do not ask again

// Load remembered email for this role from cache

// Save or remove remembered email in cache

import { useState, useEffect, Suspense } from "react"

import Link from "next/link"

import { useRouter, useSearchParams } from "next/navigation"

import {
  Calendar,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Stethoscope,
  UserCheck,
  AlertCircle,
} from "lucide-react"

import { useAuth } from "@/context/AuthContext"

function LoginFormContent() {
  const [showPw, setShowPw] = useState(false)

  const [role, setRole] = useState("patient")

  const [email, setEmail] = useState("")

  const [password, setPassword] = useState("")

  const [errorMsg, setErrorMsg] = useState("")

  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const searchParams = useSearchParams()

  const { user, isAuthenticated, isLoaded, loginWithCredentials, logout } =
    useAuth()

  const alertMessage = searchParams.get("message")

  const searchError = searchParams.get("error")

  const redirectFrom = searchParams.get("from")

  useEffect(() => {
    setEmail("")

    setPassword("")

    try {
      localStorage.removeItem("medislot_remembered_patient")

      localStorage.removeItem("medislot_remembered_doctor")
    } catch (e) {}
  }, [])

  const handleRoleChange = (newRole) => {
    setRole(newRole)

    setEmail("")

    setPassword("")

    setErrorMsg("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setErrorMsg("")

    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.")

      return
    }

    if (!password) {
      setErrorMsg("Please enter your password.")

      return
    }

    setLoading(true)

    try {
      const cleanEmail = email.trim().toLowerCase()

      const result = await loginWithCredentials(cleanEmail, password, role)

      if (!result.success) {
        setErrorMsg(
          result.error ||
            "Authentication failed. Please check your credentials.",
        )

        setLoading(false)

        return
      }

      if (role === "doctor") {
        router.replace("/doctor/dashboard")
      } else {
        if (redirectFrom && !redirectFrom.startsWith("/doctor")) {
          router.replace(redirectFrom)
        } else {
          router.replace("/dashboard")
        }
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred during login.")

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
        <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Sign in to access your{" "}
          {role === "doctor" ? "Doctor Portal" : "Patient Dashboard"}
        </p>
      </div>

      {alertMessage && (
        <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-sm shadow-sm flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{alertMessage}</span>
        </div>
      )}

      {(errorMsg || searchError) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm shadow-sm font-medium flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg || searchError}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        {}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6 text-sm font-semibold">
          <button
            type="button"
            onClick={() => handleRoleChange("patient")}
            className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              role === "patient"
                ? "bg-white text-teal-700 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <UserCheck className="w-4 h-4" /> Patient
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange("doctor")}
            className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              role === "doctor"
                ? "bg-white text-teal-700 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Stethoscope className="w-4 h-4" /> Doctor
          </button>
        </div>

        <form
          key={role}
          onSubmit={handleSubmit}
          autoComplete="off"
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              {role === "doctor" ? "Doctor Email" : "Email Address"}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                key={`email_${role}`}
                name={`login_user_${role}`}
                type="email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  role === "doctor"
                    ? "Enter doctor email address"
                    : "Enter your email address"
                }
                required
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                key={`password_${role}`}
                name={`login_secret_${role}`}
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
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
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {loading
              ? "Authenticating..."
              : role === "doctor"
                ? "Sign In to Doctor Dashboard"
                : "Sign In to Patient Dashboard"}
          </button>
        </form>

        {role === "patient" ? (
          <p className="text-center text-xs text-slate-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-teal-600 font-semibold hover:underline"
            >
              Create Account
            </Link>
          </p>
        ) : (
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600 font-medium">
              Doctor accounts are provisioned via the Admin Dashboard.
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Please use the official hospital credentials assigned to you.
            </p>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-slate-400 mt-6">
        Are you a hospital administrator?{" "}
        <Link
          href="/admin/login"
          className="text-slate-600 hover:text-teal-600 font-medium"
        >
          Admin Login →
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="text-slate-400 text-sm">Loading login...</div>
        }
      >
        <LoginFormContent />
      </Suspense>
    </div>
  )
}
