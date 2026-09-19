"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Clock, Eye, X, FileText, AlertCircle } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import StatusBadge from "@/components/ui/StatusBadge"
import PatientLayout from "@/components/layout/PatientLayout"

const tabs = ["upcoming", "completed", "cancelled"]

const tabLabels = {
  upcoming: "Upcoming & Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
}

export default function MyAppointmentsPage() {
  const [activeTab, setActiveTab] = useState("upcoming")
  const router = useRouter()
  const { user, cancelAppointment } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPatientAppts = async () => {
    if (!user?.email && !user?.id && !user?._id) return
    try {
      setLoading(true)
      const email = user.email || ""
      const pId = user._id || user.id || ""
      const res = await fetch(
        `/api/patient/appointments?email=${encodeURIComponent(email)}&patientId=${encodeURIComponent(pId)}`,
      )
      const data = await res.json()
      if (data.success && Array.isArray(data.appointments)) {
        setAppointments(data.appointments)
      } else {
        setAppointments([])
      }
    } catch (e) {
      console.warn("Failed to load patient appointments:", e)
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatientAppts()
  }, [user])

  const filtered = appointments.filter((a) =>
    activeTab === "upcoming"
      ? a.status === "upcoming" || a.status === "confirmed"
      : a.status === activeTab,
  )

  const handleCancelAppointment = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to cancel this appointment? The slot will become available again.",
      )
    ) {
      await cancelAppointment(id)
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id || a.appointmentId === id
            ? { ...a, status: "cancelled" }
            : a,
        ),
      )
    }
  }

  return (
    <PatientLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1
              className="text-2xl font-bold text-slate-900"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              My Appointments
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Track and manage your bookings saved in MongoDB
            </p>
          </div>
          <button
            onClick={() => router.push("/find-doctors")}
            className="self-start sm:self-auto bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-sm"
          >
            + Book New Appointment
          </button>
        </div>

        {}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-white text-teal-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-xl border border-slate-100">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading appointments from database...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-12 text-center shadow-sm">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">
              No {tabLabels[activeTab].toLowerCase()} appointments
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === "upcoming"
                ? "You do not have any pending appointments scheduled."
                : `No appointments marked as ${activeTab}.`}
            </p>
            {activeTab === "upcoming" && (
              <button
                onClick={() => router.push("/find-doctors")}
                className="mt-4 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                Book an Appointment
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((appt) => {
              const displayId = appt.appointmentId || appt.id
              return (
                <div
                  key={appt.id || appt._id}
                  className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 transition-all hover:border-slate-200"
                >
                  <div className="flex-1 grid sm:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">
                        Appointment ID
                      </p>
                      <p className="text-sm font-bold text-slate-900 font-mono">
                        {displayId}
                      </p>
                      {appt.consultationDetails && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-teal-700 font-semibold mt-1">
                          <FileText className="w-3 h-3" /> Rx Available
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Doctor</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {appt.doctorName}
                      </p>
                      <p className="text-xs text-teal-600 font-medium">
                        {appt.specialization || appt.department}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Date & Time</p>
                      <div className="flex items-center gap-1.5 text-sm text-slate-700 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {appt.date}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {appt.time}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Status</p>
                      <StatusBadge status={appt.status} />
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() =>
                        router.push(`/appointment/${appt.id || displayId}`)
                      }
                      className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50 border border-teal-200 px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    {(appt.status === "upcoming" ||
                      appt.status === "confirmed") && (
                      <button
                        onClick={() =>
                          handleCancelAppointment(appt.id || displayId)
                        }
                        className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PatientLayout>
  )
}
