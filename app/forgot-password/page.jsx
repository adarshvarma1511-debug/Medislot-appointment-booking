"use client"

import { Suspense } from "react"

import Link from "next/link"

import { useSearchParams } from "next/navigation"

import { Calendar, ArrowLeft, ShieldCheck } from "lucide-react"

function ForgotPasswordContent() {
  const searchParams = useSearchParams()

  const role = searchParams.get("role") || "patient"

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
        <h1 className="text-2xl font-bold text-slate-900">Password Reset</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Password changes and resets are managed securely inside Account
          Settings.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-bold text-slate-800">
            Managed via Account Settings
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            To reset or change your password, please sign in to your account and
            navigate to{" "}
            <strong>Profile & Settings &rarr; Password & Security</strong>.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href={role === "admin" ? "/admin/login" : "/login"}
            className="w-full inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg text-sm transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Go to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="text-slate-400 text-sm">
            Loading password reset...
          </div>
        }
      >
        <ForgotPasswordContent />
      </Suspense>
    </div>
  )
}
