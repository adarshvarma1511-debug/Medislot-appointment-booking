"use client"

// Form state for consultation notes

// Filter appointments for this logged-in doctor

import { useState, useEffect } from "react"

import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Star,
  FileText,
  Activity,
  AlertCircle,
  Check,
  X,
  Phone,
  Mail,
  Edit3,
} from "lucide-react"

import { useAuth } from "@/context/AuthContext"

import StatusBadge from "@/components/ui/StatusBadge"

import DoctorLayout from "@/components/layout/DoctorLayout"

export default function DoctorDashboardPage() {
  const {
    user,

    appointments,

    updateAppointmentStatus,

    doctorAvailabilities,

    toggleDoctorAvailability,

    fetchAppointments,
  } = useAuth()

  const [filter, setFilter] = useState("all")

  const [selectedAppt, setSelectedAppt] = useState(null)

  const [noteModalOpen, setNoteModalOpen] = useState(false)

  useEffect(() => {
    if (user && fetchAppointments) {
      fetchAppointments(user)
    }
  }, [user, fetchAppointments])

  const [diagnosis, setDiagnosis] = useState("")

  const [prescription, setPrescription] = useState("")

  const [instructions, setInstructions] = useState("")

  const [followUpDate, setFollowUpDate] = useState("")

  const [savedSuccess, setSavedSuccess] = useState(false)

  const doctorId = user?.doctorId || user?._id || user?.id || ""

  const isAvailableToday = doctorId
    ? (doctorAvailabilities[doctorId] ?? true)
    : true

  const docNameClean = user?.name
    ? user.name

        .replace(/^Dr\.\s*/i, "")

        .trim()

        .toLowerCase()
    : ""

  const doctorAppointments = appointments.filter((a) => {
    if (user?._id && (a.doctorUserId === user._id || a.doctorId === user._id))
      return true

    if (user?.doctorId && a.doctorId === user.doctorId) return true

    if (doctorId && a.doctorId === doctorId) return true

    if (user?.name && a.doctorName?.toLowerCase() === user.name.toLowerCase())
      return true

    if (docNameClean && a.doctorName?.toLowerCase().includes(docNameClean))
      return true

    return false
  })

  const todayAppts = doctorAppointments.filter(
    (a) => a.status === "confirmed" || a.status === "upcoming",
  )

  const completedAppts = doctorAppointments.filter(
    (a) => a.status === "completed",
  )

  const cancelledAppts = doctorAppointments.filter(
    (a) => a.status === "cancelled",
  )

  const filteredAppointments = doctorAppointments.filter((a) => {
    if (filter === "all") return true

    return a.status === filter
  })

  const nextPatient = todayAppts[0]

  const handleOpenNoteModal = (appt) => {
    setSelectedAppt(appt)

    setDiagnosis(appt.consultationDetails?.diagnosis || "")

    setPrescription(appt.consultationDetails?.prescription || "")

    setInstructions(appt.consultationDetails?.instructions || "")

    setFollowUpDate(appt.consultationDetails?.followUpDate || "")

    setNoteModalOpen(true)

    setSavedSuccess(false)
  }

  const handleSaveConsultation = (e) => {
    e.preventDefault()

    if (!selectedAppt) return

    const note = {
      diagnosis,

      prescription,

      instructions,

      followUpDate,

      addedAt: new Date().toLocaleDateString("en-US", {
        month: "short",

        day: "numeric",

        year: "numeric",
      }),
    }

    updateAppointmentStatus(selectedAppt.id, "completed", note)

    setSavedSuccess(true)

    setTimeout(() => {
      setNoteModalOpen(false)

      setSavedSuccess(false)
    }, 1200)
  }

  const handleQuickComplete = (id) => {
    updateAppointmentStatus(id, "completed")
  }

  const handleQuickCancel = (id) => {
    updateAppointmentStatus(id, "cancelled")
  }

  return (
    <DoctorLayout>
      <div className="space-y-6">
        {}
        <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm mb-2">
              <Activity className="w-3.5 h-3.5" />
              {user?.department || "Cardiology"} Department
            </div>
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Welcome, {user?.name || "Doctor"} 👋
            </h1>
            <p className="text-teal-100 text-sm mt-1 max-w-xl">
              Specialization:{" "}
              <span className="font-semibold text-white">
                {user?.specialization || "Specialist"}
              </span>{" "}
              • Department:{" "}
              <span className="font-semibold text-white">
                {user?.department || "General"}
              </span>{" "}
              • Experience:{" "}
              <span className="font-semibold text-white">
                {user?.experience ?? 5} Years
              </span>{" "}
              • Hospital:{" "}
              <span className="font-semibold text-white">
                {user?.hospital || "MediSlot Hospital"}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/20 text-center">
              <p className="text-xs text-teal-100">Available Today</p>
              <p className="text-sm font-bold flex items-center gap-1.5 justify-center mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isAvailableToday ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
                {isAvailableToday
                  ? user?.startTime && user?.endTime
                    ? `${user.startTime} – ${user.endTime}`
                    : "10:00 AM – 01:00 PM"
                  : "Off-Duty"}
              </p>
            </div>
            <button
              onClick={() => toggleDoctorAvailability(doctorId)}
              className="bg-white text-teal-700 hover:bg-teal-50 font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              {isAvailableToday ? "Go Off-Duty" : "Go Available"}
            </button>
          </div>
        </div>

        {}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Specialization
            </p>
            <p className="text-base font-bold text-slate-900 mt-1 truncate">
              {user?.specialization || "Cardiologist"}
            </p>
            <p className="text-xs text-teal-600 mt-0.5 font-medium">
              {user?.department || "Cardiology"}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Experience
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {user?.experience || 8}{" "}
              <span className="text-xs text-slate-500 font-normal">Years</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              {user?.hospital || "MediSlot Hospital"}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Today's Appointments
              </p>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {todayAppts.length}
            </p>
            <p className="text-xs text-blue-600 mt-0.5 font-medium">
              Pending queue today
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Upcoming Appointments
              </p>
              <Calendar className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {doctorAppointments.length}
            </p>
            <p className="text-xs text-teal-600 mt-0.5 font-medium">
              Active bookings total
            </p>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Available Today
            </p>
            <p className="text-sm font-bold text-slate-900 mt-1 truncate">
              {isAvailableToday
                ? user?.startTime && user?.endTime
                  ? `${user.startTime} – ${user.endTime}`
                  : "10:00 AM – 1:00 PM"
                : "Not Available"}
            </p>
            <p
              className={`text-xs mt-0.5 font-medium ${
                isAvailableToday ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {isAvailableToday ? "Active on OPD shift" : "Currently Off-Duty"}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {}
          <div className="lg:col-span-1 bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping" />
                  <h2 className="font-bold text-slate-900">
                    Current / Next Patient
                  </h2>
                </div>
                <span className="text-xs bg-teal-50 text-teal-700 font-semibold px-2.5 py-1 rounded-full border border-teal-100">
                  In Queue
                </span>
              </div>

              {nextPatient ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 rounded-xl">
                    <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm">
                      {nextPatient.patientName

                        .split(" ")

                        .map((n) => n[0])

                        .join("")

                        .slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {nextPatient.patientName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Appointment ID: {nextPatient.id}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-teal-600 font-medium mt-0.5">
                        <Clock className="w-3.5 h-3.5" /> {nextPatient.time} •
                        Today
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-xl text-xs space-y-1.5 text-amber-900">
                    <p className="font-semibold flex items-center gap-1.5 text-amber-800">
                      <AlertCircle className="w-3.5 h-3.5" /> Chief Complaint:
                    </p>
                    <p className="text-slate-700 italic">
                      "
                      {nextPatient.reason ||
                        "General cardiac examination and routine health checkup"}
                      "
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {nextPatient.patientPhone || "+91 98765 43210"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{nextPatient.patientEmail}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-teal-500 opacity-60" />
                  <p className="font-medium text-slate-700">
                    All Consultations Completed
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    No pending patients in the waiting queue.
                  </p>
                </div>
              )}
            </div>

            {nextPatient && (
              <div className="pt-5 mt-5 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => handleOpenNoteModal(nextPatient)}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                  <Edit3 className="w-4 h-4" /> Start Consultation & Notes
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleQuickComplete(nextPatient.id)}
                    className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold py-2 rounded-lg transition-colors cursor-pointer border border-emerald-200 flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" /> Mark Done
                  </button>
                  <button
                    onClick={() => handleQuickCancel(nextPatient.id)}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold py-2 rounded-lg transition-colors cursor-pointer border border-red-200 flex items-center justify-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col">
            <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900">
                  Doctor's Appointment Queue
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage consultations, write prescriptions, and update statuses
                </p>
              </div>

              {}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-medium">
                {["all", "confirmed", "completed", "cancelled"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-md capitalize transition-all cursor-pointer ${
                      filter === f
                        ? "bg-white text-teal-700 font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500">
                      Patient
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500">
                      Schedule
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500">
                      Chief Reason
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredAppointments.length > 0 ? (
                    filteredAppointments.map((a) => (
                      <tr
                        key={a.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900">
                            {a.patientName}
                          </div>
                          <div className="text-xs text-slate-400">
                            {a.patientPhone || a.patientEmail}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="text-slate-800 font-medium">
                            {a.time}
                          </div>
                          <div className="text-xs text-slate-400">{a.date}</div>
                        </td>
                        <td className="px-4 py-3.5 max-w-[200px] truncate text-slate-600 text-xs">
                          {a.reason || "Routine Consultation"}
                          {a.consultationDetails && (
                            <span className="block text-[11px] text-teal-600 font-semibold">
                              ✓ Prescription recorded
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusBadge status={a.status} />
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenNoteModal(a)}
                              className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                              title="Add / View Prescription & Consultation Note"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              {a.consultationDetails ? "View Notes" : "Add Rx"}
                            </button>
                            {a.status !== "completed" && (
                              <button
                                onClick={() => handleQuickComplete(a.id)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Mark Consultation Completed"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            {a.status !== "cancelled" &&
                              a.status !== "completed" && (
                                <button
                                  onClick={() => handleQuickCancel(a.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Cancel Consultation"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-12 text-center text-slate-400"
                      >
                        No appointments matching this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {}
        {noteModalOpen && selectedAppt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-5 bg-teal-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <div>
                    <h3 className="font-bold text-base">
                      Doctor Consultation & Prescription
                    </h3>
                    <p className="text-xs text-teal-100">
                      Patient: {selectedAppt.patientName} ({selectedAppt.id})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setNoteModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveConsultation} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Clinical Diagnosis / Findings *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stage 1 Hypertension with sinus tachycardia"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Prescription & Medication (Rx) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Tab Telmisartan 40mg (1-0-0) after breakfast for 30 days&#10;Tab Amlodipine 5mg at bedtime"
                    value={prescription}
                    onChange={(e) => setPrescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Dietary & Lifestyle Advice
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Low sodium diet, 30 mins brisk walking daily, maintain blood pressure log"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                      Follow-Up Date
                    </label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                      Status
                    </label>
                    <div className="text-xs font-semibold py-2 px-3 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> Marked as Completed
                    </div>
                  </div>
                </div>

                {savedSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Prescription saved &
                    appointment marked completed!
                  </div>
                )}

                <div className="pt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setNoteModalOpen(false)}
                    className="flex-1 py-2.5 px-4 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Check className="w-4 h-4" /> Save Prescription
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DoctorLayout>
  )
}
