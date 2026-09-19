"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Building2,
  Hash,
  CheckCircle,
  AlertTriangle,
  FileText,
  Activity,
} from "lucide-react"
import StatusBadge from "@/components/ui/StatusBadge"
import PatientLayout from "@/components/layout/PatientLayout"
import { useAuth } from "@/context/AuthContext"

export default function AppointmentDetailsPage({ params }) {
  const router = useRouter()
  const unwrappedParams =
    typeof params?.then === "function" ? use(params) : params
  const id = unwrappedParams?.id

  const { appointments, updateAppointmentStatus } = useAuth()
  const appt = appointments.find((a) => a.id === id) ?? appointments[0]

  if (!appt) {
    return (
      <PatientLayout>
        <div className="p-12 text-center">
          <p className="text-slate-500">Appointment not found.</p>
          <button
            onClick={() => router.push("/my-appointments")}
            className="mt-4 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer"
          >
            Back to Appointments
          </button>
        </div>
      </PatientLayout>
    )
  }

  const isActive = appt.status === "upcoming" || appt.status === "confirmed"
  const isCompleted = appt.status === "completed"

  const timelineSteps = [
    { label: "Booked", done: true },
    { label: "Confirmed", done: appt.status !== "cancelled" },
    { label: "Completed", done: isCompleted },
  ]

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      updateAppointmentStatus(appt.id, "cancelled")
    }
  }

  return (
    <PatientLayout>
      <div className="max-w-2xl space-y-6">
        <button
          onClick={() => router.push("/my-appointments")}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Appointments
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold text-slate-900"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Appointment Details
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Booking Reference: #{appt.id}
            </p>
          </div>
          <StatusBadge status={appt.status} />
        </div>

        {}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4 text-sm">
            Consultation Progress
          </h2>
          <div className="flex items-center gap-2">
            {timelineSteps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2 flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.done ? "bg-teal-600 shadow-xs" : "bg-slate-100"
                    }`}
                  >
                    {step.done ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-300" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      step.done ? "text-teal-600" : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < timelineSteps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mb-4 ${
                      step.done && timelineSteps[i + 1].done
                        ? "bg-teal-400"
                        : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {}
        {appt.consultationDetails && (
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-emerald-800">
              <FileText className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-sm">
                Doctor's Medical Prescription & Advice
              </h2>
            </div>
            <div className="bg-white rounded-lg p-4 border border-emerald-100 space-y-3 text-xs">
              <div>
                <p className="font-bold text-slate-700 uppercase tracking-wider">
                  Diagnosis
                </p>
                <p className="text-slate-800 font-semibold mt-0.5">
                  {appt.consultationDetails.diagnosis}
                </p>
              </div>
              <div>
                <p className="font-bold text-slate-700 uppercase tracking-wider">
                  Prescribed Medication (Rx)
                </p>
                <pre className="text-slate-800 font-mono text-xs whitespace-pre-wrap mt-0.5 bg-slate-50 p-2.5 rounded border border-slate-200">
                  {appt.consultationDetails.prescription}
                </pre>
              </div>
              {appt.consultationDetails.instructions && (
                <div>
                  <p className="font-bold text-slate-700 uppercase tracking-wider">
                    Doctor's Advice
                  </p>
                  <p className="text-slate-700 mt-0.5">
                    {appt.consultationDetails.instructions}
                  </p>
                </div>
              )}
              {appt.consultationDetails.followUpDate && (
                <div className="pt-1 flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <Activity className="w-3.5 h-3.5" /> Next Follow-up:{" "}
                  {appt.consultationDetails.followUpDate}
                </div>
              )}
            </div>
          </div>
        )}

        {}
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-3">
          <h2 className="font-semibold text-slate-900 mb-2">
            Appointment Information
          </h2>
          {[
            { icon: Hash, label: "Appointment ID", value: appt.id },
            { icon: User, label: "Patient", value: appt.patientName },
            { icon: User, label: "Doctor", value: appt.doctorName },
            { icon: Building2, label: "Department", value: appt.department },
            { icon: Calendar, label: "Date", value: appt.date },
            { icon: Clock, label: "Time", value: appt.time },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0"
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
          {appt.reason && (
            <div className="pt-2">
              <p className="text-xs text-slate-400 mb-1">Reason for Visit</p>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-100">
                {appt.reason}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {isActive && (
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 border border-red-200 hover:bg-red-50 text-red-600 font-semibold py-2.5 px-5 rounded-lg text-sm transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" /> Cancel Appointment
            </button>
          )}
          <button
            onClick={() => router.push("/my-appointments")}
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-5 rounded-lg text-sm transition-colors cursor-pointer"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    </PatientLayout>
  )
}
