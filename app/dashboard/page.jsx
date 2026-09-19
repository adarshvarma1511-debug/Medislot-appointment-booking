"use client"

import { useRouter } from "next/navigation"
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Search,
} from "lucide-react"
import PatientLayout from "@/components/layout/PatientLayout"
import StatusBadge from "@/components/ui/StatusBadge"
import { useAuth } from "@/context/AuthContext"

export default function DashboardPage() {
  const router = useRouter()
  const { user, appointments } = useAuth()

  const userAppointments = appointments.filter(
    (a) =>
      (user?.email &&
        a.patientEmail?.toLowerCase() === user.email.toLowerCase()) ||
      (user?._id &&
        (a.patientId === user._id || a.patientId === user._id.toString())) ||
      (user?.id &&
        (a.patientId === user.id || a.patientId === user.id.toString())) ||
      (user?.name && a.patientName?.toLowerCase() === user.name.toLowerCase()),
  )

  const upcoming = userAppointments.find(
    (a) => a.status === "confirmed" || a.status === "upcoming",
  )
  const totalCount = userAppointments.length
  const completedCount = userAppointments.filter(
    (a) => a.status === "completed",
  ).length
  const cancelledCount = userAppointments.filter(
    (a) => a.status === "cancelled",
  ).length

  const firstName = user?.name ? user.name.split(" ")[0] : "Patient"

  const statCards = [
    {
      label: "Upcoming Appointment",
      value: upcoming ? upcoming.date : "None Scheduled",
      icon: Calendar,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "Total Appointments",
      value: totalCount.toString(),
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Completed",
      value: completedCount.toString(),
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Cancelled",
      value: cancelledCount.toString(),
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-50",
    },
  ]

  return (
    <PatientLayout>
      <div className="space-y-6">
        {}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-bold text-slate-900"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Good Morning, {firstName} 👋
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Here is an overview of your health appointments.
            </p>
          </div>
          <button
            onClick={() => router.push("/find-doctors")}
            className="self-start sm:self-auto bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Search className="w-4 h-4" /> Find a Doctor
          </button>
        </div>

        {}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((c) => (
            <div
              key={c.label}
              className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm"
            >
              <div
                className={`w-9 h-9 ${c.bg} rounded-lg flex items-center justify-center mb-3`}
              >
                <c.icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <p className="text-xl font-bold text-slate-900 truncate">
                {c.value}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {}
          <div className="lg:col-span-1 bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900">
                  Upcoming Appointment
                </h2>
                {upcoming && <StatusBadge status={upcoming.status} />}
              </div>

              {upcoming ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm">
                      {upcoming.doctorName
                        .replace(/^Dr\.\s*/i, "")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        {upcoming.doctorName}
                      </p>
                      <p className="text-sm text-teal-600 font-medium">
                        {upcoming.department}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-5 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {upcoming.date}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {upcoming.time}
                    </div>
                    {upcoming.reason && (
                      <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        Reason: "{upcoming.reason}"
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">
                    No Upcoming Appointments
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Book an appointment with a specialist today.
                  </p>
                </div>
              )}
            </div>

            {upcoming ? (
              <button
                onClick={() => router.push(`/appointment/${upcoming.id}`)}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                View Appointment <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => router.push("/find-doctors")}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                Book Now <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
              <h2 className="font-bold text-slate-900">Recent Appointments</h2>
              <button
                onClick={() => router.push("/my-appointments")}
                className="text-xs text-teal-600 hover:underline font-semibold cursor-pointer"
              >
                View All
              </button>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Doctor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 hidden sm:table-cell">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 hidden sm:table-cell">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {userAppointments.length > 0 ? (
                    userAppointments.slice(0, 5).map((a) => (
                      <tr
                        key={a.id}
                        className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/appointment/${a.id}`)}
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-slate-900">
                            {a.doctorName}
                          </p>
                          <p className="text-xs text-slate-400">
                            {a.department}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 hidden sm:table-cell">
                          {a.date}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 hidden sm:table-cell">
                          {a.time}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={a.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-10 text-xs text-slate-400"
                      >
                        No appointments booked yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PatientLayout>
  )
}
