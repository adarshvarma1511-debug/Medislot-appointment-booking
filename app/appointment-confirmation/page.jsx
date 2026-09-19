"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  CheckCircle,
  Calendar,
  Clock,
  Building2,
  User,
  Hash,
  LayoutDashboard,
} from "lucide-react"
import PatientLayout from "@/components/layout/PatientLayout"
import { useAuth } from "@/context/AuthContext"

function AppointmentConfirmationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const { appointments } = useAuth()

  const foundAppt = appointments.find((a) => a.id === id)

  const appt = foundAppt || {
    id: id || "MED1025",
    doctorName: "Dr. Amit Sharma",
    department: "Cardiology",
    date: "15 September 2026",
    time: "11:00 AM",
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="max-w-md w-full space-y-6">
        {}
        <div className="text-center">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-teal-600" />
          </div>
          <h1
            className="text-2xl font-bold text-slate-900"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Appointment Confirmed!
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Your appointment has been successfully booked. A confirmation has
            been sent to your email.
          </p>
        </div>

        {}
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-3">
          {[
            { icon: Hash, label: "Appointment ID", value: appt.id },
            { icon: User, label: "Doctor", value: appt.doctorName },
            { icon: Building2, label: "Department", value: appt.department },
            { icon: Calendar, label: "Date", value: appt.date },
            { icon: Clock, label: "Time", value: appt.time },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
            >
              <div className="flex items-center gap-2 text-slate-500">
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">
                {item.value}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-slate-500">Status</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />{" "}
              Confirmed
            </span>
          </div>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-center">
          <p className="text-xs text-amber-700">
            Please arrive <strong>10 minutes before</strong> your appointment at
            MediSlot City Hospital.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/my-appointments")}
            className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-lg text-sm transition-colors cursor-pointer"
          >
            View My Appointments
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AppointmentConfirmationPage() {
  return (
    <PatientLayout>
      <Suspense
        fallback={
          <div className="text-slate-400 text-sm">Loading confirmation...</div>
        }
      >
        <AppointmentConfirmationContent />
      </Suspense>
    </PatientLayout>
  )
}
