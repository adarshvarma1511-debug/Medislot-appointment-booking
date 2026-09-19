"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  User,
  Shield,
  Stethoscope,
  UserCheck,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export default function RegisterPage() {
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [role, setRole] = useState("patient")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [errorMsg, setErrorMsg] = useState("")
  const [confirmError, setConfirmError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const { registerAccount } = useAuth()

  const handleRoleChange = (newRole) => {
    setRole(newRole)
    setErrorMsg("")
    setSuccessMsg("")
    setConfirmError("")
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (loading) return

    setErrorMsg("")
    setSuccessMsg("")
    setConfirmError("")

    if (!name.trim()) {
      setErrorMsg("Please enter your full name.")
      return
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.")
      return
    }
    if (!password || password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.")
      return
    }
    if (!confirmPassword) {
      setConfirmError("Please confirm your password.")
      setErrorMsg("Please confirm your password.")
      return
    }
    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match.")
      setErrorMsg("Passwords do not match.")
      return
    }

    setLoading(true)

    const accountData = {
      role,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone.trim(),
    }

    try {
      const res = await registerAccount(accountData)
      if (!res.success) {
        setErrorMsg(res.error || "Registration failed. Please try again.")
        setLoading(false)
        return
      }

      // Successful registration:
      // 1. Show success message
      setSuccessMsg("Patient account created successfully.")
      setErrorMsg("")
      setConfirmError("")

      // 2. Clear ALL form fields completely
      setName("")
      setEmail("")
      setPhone("")
      setPassword("")
      setConfirmPassword("")

      // 3. Reset password visibility state to hidden
      setShowPw(false)
      setShowConfirmPw(false)
    } catch (err) {
      setErrorMsg("Failed to register account in database.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
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
          <h1 className="text-2xl font-bold text-slate-900">
            Create Your Account
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            All registered data is securely saved directly in the MongoDB
            database
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm shadow-sm font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm shadow-sm font-medium flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <Link
              href="/login"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline whitespace-nowrap"
            >
              Sign In →
            </Link>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          {/* Role selector tabs */}
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

          {role === "doctor" ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto border border-teal-100">
                <Stethoscope className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Doctor Registration Not Required
                </h3>
                <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                  Doctor accounts are provisioned directly by hospital
                  administrators from the Admin Dashboard.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Please use the official credentials provided by your
                  administrator to sign in.
                </p>
              </div>
              <div className="pt-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-xs"
                >
                  Go to Doctor Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example123@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (confirmError && confirmPassword && e.target.value === confirmPassword) {
                        setConfirmError("")
                      }
                    }}
                    placeholder="Min. 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirmPw ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (confirmError) setConfirmError("")
                    }}
                    placeholder="Confirm your password"
                    className={`w-full pl-10 pr-10 py-2.5 border ${
                      confirmError
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                        : "border-slate-200 focus:border-teal-500 focus:ring-teal-500"
                    } rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-1 transition`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showConfirmPw ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPw ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {confirmError && (
                  <p className="text-xs text-red-600 font-medium mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {confirmError}
                  </p>
                )}
              </div>

              <div className="flex items-start gap-2 p-3 bg-teal-50 rounded-lg border border-teal-100">
                <Shield className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                <p className="text-xs text-teal-700 leading-relaxed">
                  Your account data is encrypted and saved directly in the
                  hospital MongoDB database.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {loading ? "Creating Account..." : "Create Patient Account"}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-slate-500 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-teal-600 font-semibold hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
