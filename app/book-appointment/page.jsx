"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Building2,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import PatientLayout from "@/components/layout/PatientLayout"
import { useAuth } from "@/context/AuthContext"

function BookAppointmentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, addAppointment } = useAuth()

  const doctorId = searchParams.get("doctorId") || ""
  const doctorName = searchParams.get("doctorName") || "Doctor"
  const specialization = searchParams.get("specialization") || "Specialist"
  const department = searchParams.get("department") || "General Medicine"
  const date =
    searchParams.get("date") || new Date().toISOString().split("T")[0]
  const friendlyDate = searchParams.get("friendlyDate") || date
  const time = searchParams.get("time") || "10:00 AM"

  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [phone, setPhone] = useState(user?.phone || "")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name)
      if (user.email) setEmail(user.email)
      if (user.phone) setPhone(user.phone)
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    setLoading(true)

    try {
      const createdAppt = await addAppointment({
        patientId: user?._id || user?.id,
        patientName: name.trim() || user?.name || "Patient",
        patientEmail: email.trim() || user?.email || "patient@example.com",
        patientPhone: phone.trim() || user?.phone || "+91 98765 43210",
        doctorId,
        doctorName,
        department,
        specialization,
        date,
        time,
        status: "confirmed",
        reason: reason.trim() || "Regular checkup",
      })

      router.push(
        `/appointment-confirmation?id=${createdAppt?.id || createdAppt?.appointmentId || "confirmed"}`,
      )
    } catch (err) {
      setErrorMsg(
        err.message ||
          "This time slot is no longer available. Please select another slot.",
      )
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Availability
      </button>

      <div>
        <h1
          className="text-2xl font-bold text-slate-900"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Confirm Appointment
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Review your consultation slot and confirm booking
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() =>
              router.push(`/doctors/${doctorId}/availability?date=${date}`)
            }
            className="text-xs text-red-700 underline font-bold hover:text-red-900 cursor-pointer"
          >
            ← Return to doctor availability to select another time slot
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {}
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900 text-base">
            Patient Information
          </h2>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
              Patient Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
              Contact Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {}
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900 text-base">
            Appointment Details
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: User, label: "Doctor", value: doctorName },
              { icon: Building2, label: "Department", value: department },
              { icon: Calendar, label: "Date", value: friendlyDate },
              { icon: Clock, label: "Time Slot", value: time },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
              >
                <item.icon className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 font-medium">
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
              Reason for Visit / Symptoms{" "}
              <span className="text-slate-400 font-normal lowercase">
                (optional)
              </span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Regular health examination, cardiac checkup, routine follow-up..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
            />
          </div>
        </div>

        {}
        <div className="flex items-start gap-3 p-4 bg-teal-50/70 rounded-xl border border-teal-100">
          <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-teal-800 leading-relaxed">
            <strong>Real-Time Verification:</strong> MediSlot verifies time slot
            availability in the database before booking to guarantee no
            overlapping consultations.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          {loading && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {loading ? "Verifying & Saving Booking..." : "Confirm Appointment"}
        </button>
      </form>
    </div>
  )
}

export default function BookAppointmentPage() {
  return (
    <PatientLayout>
      <Suspense
        fallback={
          <div className="text-slate-400 text-sm">
            Loading appointment form...
          </div>
        }
      >
        <BookAppointmentContent />
      </Suspense>
    </PatientLayout>
  )
}
