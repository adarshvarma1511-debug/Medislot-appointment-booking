"use client"

// Selected appointment modal

// Handle appointment status update

// Refresh list in background

import { useState, useEffect } from "react"

import {
  Search,
  Filter,
  Loader2,
  Calendar,
  Eye,
  X,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  Phone,
  Mail,
  Ban,
  Check,
} from "lucide-react"

import StatusBadge from "@/components/ui/StatusBadge"

import AdminLayout from "@/components/layout/AdminLayout"

const statuses = ["All", "confirmed", "upcoming", "completed", "cancelled"]

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([])

  const [doctors, setDoctors] = useState([])

  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState("")

  const [statusFilter, setStatusFilter] = useState("All")

  const [doctorFilter, setDoctorFilter] = useState("All")

  const [deptFilter, setDeptFilter] = useState("All")

  const [selectedAppt, setSelectedAppt] = useState(null)

  const [updating, setUpdating] = useState(false)

  const [actionSuccess, setActionSuccess] = useState("")

  const [actionError, setActionError] = useState("")

  const loadData = async () => {
    setLoading(true)

    try {
      const [apptsRes, docsRes] = await Promise.all([
        fetch("/api/appointments"),

        fetch("/api/doctors"),
      ])

      const apptsData = await apptsRes.json()

      const docsData = await docsRes.json()

      if (apptsData.success && Array.isArray(apptsData.appointments)) {
        setAppointments(apptsData.appointments)
      }

      if (docsData.success && Array.isArray(docsData.doctors)) {
        setDoctors(docsData.doctors)
      }
    } catch (err) {
      console.error("Failed to load appointments or doctors:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const departmentList = Array.from(
    new Set([
      ...doctors.map((d) => d.department).filter(Boolean),

      ...appointments.map((a) => a.department).filter(Boolean),
    ]),
  )

  const filtered = appointments.filter((a) => {
    const apptId = (a.appointmentId || a.id || "").toLowerCase()

    const patient = (a.patientName || "")

      .toLowerCase()

    const doctor = (a.doctorName || "")

      .toLowerCase()

    const q = query.toLowerCase()

    const matchQ =
      query === "" ||
      apptId.includes(q) ||
      patient.includes(q) ||
      doctor.includes(q)

    const matchStatus =
      statusFilter === "All" ||
      (a.status || "")

        .toLowerCase() === statusFilter.toLowerCase()

    const matchDoctor =
      doctorFilter === "All" ||
      a.doctorId === doctorFilter ||
      (a.doctorUserId && a.doctorUserId === doctorFilter)

    const matchDept =
      deptFilter === "All" ||
      (a.department || "")

        .toLowerCase() === deptFilter.toLowerCase()

    return matchQ && matchStatus && matchDoctor && matchDept
  })

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedAppt) return

    setUpdating(true)

    setActionSuccess("")

    setActionError("")

    const targetId =
      selectedAppt.appointmentId || selectedAppt.id || selectedAppt._id

    try {
      const res = await fetch(`/api/appointments/${targetId}/status`, {
        method: "PATCH",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ status: newStatus }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setActionError(
          data.error || "Failed to update appointment status.",
        )
      } else {
        setActionSuccess(
          `Appointment status successfully updated to ${newStatus}.`,
        )

        setSelectedAppt((prev) => ({ ...prev, status: newStatus }))

        setAppointments((prev) =>
          prev.map((item) =>
            (item.appointmentId || item.id) === targetId
              ? { ...item, status: newStatus }
              : item,
          ),
        )

        setTimeout(() => setActionSuccess(""), 3500)
      }
    } catch (err) {
      setActionError("Network error updating status.")
    } finally {
      setUpdating(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1
            className="text-2xl font-bold text-slate-900"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Appointments
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            View, audit, and manage hospital clinical bookings and patient
            consultation records
          </p>
        </div>

        {}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-48 shadow-xs">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by appointment ID, patient or doctor name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="text-sm text-slate-700 bg-transparent outline-none w-full"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-teal-500 cursor-pointer shadow-xs"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s === "All"
                    ? "All Statuses"
                    : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-teal-500 cursor-pointer shadow-xs"
            >
              <option value="All">All Doctors</option>
              {doctors.map((d) => (
                <option key={d.id || d._id} value={d.id || d._id}>
                  {d.name}
                </option>
              ))}
            </select>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-teal-500 cursor-pointer shadow-xs"
            >
              <option value="All">All Departments</option>
              {departmentList.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs font-semibold text-slate-500 self-center ml-auto bg-slate-100 px-2.5 py-1 rounded-full">
            {filtered.length} {filtered.length === 1 ? "record" : "records"}
          </span>
        </div>

        {}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
              <span>Loading appointments from MongoDB...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {[
                      "Appointment ID",

                      "Patient",

                      "Doctor",

                      "Department",

                      "Date",

                      "Time",

                      "Status",

                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((a) => (
                    <tr
                      key={a._id || a.id || a.appointmentId}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-4 py-3.5 text-xs font-mono font-bold text-teal-800 whitespace-nowrap">
                        {a.appointmentId || a.id}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-semibold text-slate-900 leading-tight">
                          {a.patientName}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {a.patientEmail || a.patientPhone || "Patient"}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium text-slate-800 whitespace-nowrap">
                        {a.doctorName}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                          {a.department}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-700 whitespace-nowrap font-medium">
                        {a.date
                          ? new Date(a.date).toLocaleDateString("en-IN", {
                              day: "numeric",

                              month: "short",

                              year: "numeric",
                            })
                          : "-"}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-700 whitespace-nowrap font-medium">
                        {a.time}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedAppt(a)

                            setActionSuccess("")

                            setActionError("")
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className="text-center py-20 text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400 mb-3">
                    <Calendar className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-slate-800 font-semibold text-base mb-1">
                    No appointments found
                  </p>
                  <p className="text-slate-400 text-xs max-w-sm mx-auto">
                    {appointments.length === 0
                      ? "No appointments are currently recorded in MongoDB. Bookings made by patients will appear here automatically."
                      : "No appointments match your active search and filter criteria."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {}
        {selectedAppt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95">
              <div className="p-5 bg-teal-600 text-white flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">Appointment Details</h2>
                    <span className="font-mono text-xs bg-teal-800/80 text-teal-200 px-2 py-0.5 rounded">
                      {selectedAppt.appointmentId || selectedAppt.id}
                    </span>
                  </div>
                  <p className="text-xs text-teal-100 mt-0.5">
                    Clinical consultation file and status controls
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAppt(null)}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
                {actionSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-semibold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{actionSuccess}</span>
                  </div>
                )}

                {actionError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl font-semibold flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{actionError}</span>
                  </div>
                )}

                {}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2.5">
                  <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-teal-800">
                    <User className="w-3.5 h-3.5 text-teal-600" /> Patient
                    Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px]">
                        Patient Name
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {selectedAppt.patientName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">
                        Contact Phone
                      </span>
                      <span className="font-medium text-slate-800">
                        {selectedAppt.patientPhone || "+91 98765 43210"}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px]">
                        Email Address
                      </span>
                      <span className="font-mono text-slate-800">
                        {selectedAppt.patientEmail || "Not provided"}
                      </span>
                    </div>
                  </div>
                </div>

                {}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2.5">
                  <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-teal-800">
                    <Clock className="w-3.5 h-3.5 text-teal-600" /> Consultation
                    Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px]">
                        Doctor
                      </span>
                      <span className="font-bold text-slate-900">
                        {selectedAppt.doctorName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">
                        Department
                      </span>
                      <span className="font-semibold text-slate-800">
                        {selectedAppt.department}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">
                        Appointment Date
                      </span>
                      <span className="font-medium text-slate-800">
                        {selectedAppt.date
                          ? new Date(selectedAppt.date).toLocaleDateString(
                              "en-IN",

                              {
                                day: "numeric",

                                month: "long",

                                year: "numeric",
                              },
                            )
                          : "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">
                        Time Slot
                      </span>
                      <span className="font-bold text-teal-700">
                        {selectedAppt.time}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-slate-400 text-[10px]">
                        Current Status
                      </span>
                      <StatusBadge status={selectedAppt.status} />
                    </div>
                  </div>
                </div>

                {}
                {selectedAppt.consultationDetails && (
                  <div className="bg-teal-50/60 rounded-xl p-4 border border-teal-200/80 space-y-2">
                    <h3 className="font-bold text-teal-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-teal-600" />{" "}
                      Clinical Notes & Prescription
                    </h3>
                    {selectedAppt.consultationDetails.diagnosis && (
                      <p className="text-slate-800">
                        <span className="font-bold text-teal-950">
                          Diagnosis:
                        </span>{" "}
                        {selectedAppt.consultationDetails.diagnosis}
                      </p>
                    )}
                    {selectedAppt.consultationDetails.prescription && (
                      <p className="text-slate-800 font-mono text-[11px] bg-white p-2.5 rounded-lg border border-teal-200">
                        {selectedAppt.consultationDetails.prescription}
                      </p>
                    )}
                    {selectedAppt.consultationDetails.instructions && (
                      <p className="text-slate-600 italic">
                        <span className="font-bold text-slate-800">
                          Instructions:
                        </span>{" "}
                        {selectedAppt.consultationDetails.instructions}
                      </p>
                    )}
                  </div>
                )}

                {}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-600 block">
                    Manage Status:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedAppt.status !== "confirmed" && (
                      <button
                        onClick={() => handleUpdateStatus("confirmed")}
                        disabled={updating}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Confirm Appointment
                      </button>
                    )}
                    {selectedAppt.status !== "completed" && (
                      <button
                        onClick={() => handleUpdateStatus("completed")}
                        disabled={updating}
                        className="px-3 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark as
                        Completed
                      </button>
                    )}
                    {selectedAppt.status !== "cancelled" && (
                      <button
                        onClick={() => handleUpdateStatus("cancelled")}
                        disabled={updating}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Ban className="w-3.5 h-3.5" /> Cancel Appointment
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedAppt(null)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
