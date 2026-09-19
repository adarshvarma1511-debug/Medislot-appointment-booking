"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Users, Calendar, Clock, Activity, Plus } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { chartData, deptChartData } from "@/data/mockData"
import StatusBadge from "@/components/ui/StatusBadge"
import AdminLayout from "@/components/layout/AdminLayout"

const PIE_COLORS = [
  "#0D9488",
  "#3B82F6",
  "#8B5CF6",
  "#F59E0B",
  "#EF4444",
  "#6366F1",
]

export default function AdminDashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [recentAppointments, setRecentAppointments] = useState([])
  const [totalDoctors, setTotalDoctors] = useState(0)

  useEffect(() => {
    setMounted(true)
    async function loadStats() {
      try {
        const [apptsRes, docsRes] = await Promise.all([
          fetch("/api/appointments"),
          fetch("/api/doctors"),
        ])
        const apptsData = await apptsRes.json()
        const docsData = await docsRes.json()

        if (apptsData.success && Array.isArray(apptsData.appointments)) {
          setRecentAppointments(apptsData.appointments.slice(0, 10))
        }
        if (docsData.success && Array.isArray(docsData.doctors)) {
          setTotalDoctors(docsData.doctors.length)
        }
      } catch (err) {
        console.error("Failed to load admin dashboard stats:", err)
      }
    }
    loadStats()
  }, [])

  const statCards = [
    {
      label: "Total Doctors",
      value: totalDoctors.toString(),
      icon: Users,
      color: "text-teal-600",
      bg: "bg-teal-50",
      change: "Active in MongoDB",
    },
    {
      label: "Total Appointments",
      value: recentAppointments.length.toString(),
      icon: Calendar,
      color: "text-blue-600",
      bg: "bg-blue-50",
      change: "Recorded in DB",
    },
    {
      label: "Upcoming Queue",
      value: recentAppointments
        .filter((a) => a.status === "confirmed" || a.status === "upcoming")
        .length.toString(),
      icon: Clock,
      color: "text-violet-600",
      bg: "bg-violet-50",
      change: "Active slots",
    },
    {
      label: "Completed",
      value: recentAppointments
        .filter((a) => a.status === "completed")
        .length.toString(),
      icon: Activity,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      change: "Consultations done",
    },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-bold text-slate-900"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Admin Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Overview of hospital operations – 16 September 2026
            </p>
          </div>
          <Link
            href="/admin/doctors?action=add"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-colors cursor-pointer shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Doctor
          </Link>
        </div>

        {}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((c) => (
            <div
              key={c.label}
              className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-9 h-9 ${c.bg} rounded-lg flex items-center justify-center`}
                >
                  <c.icon className={`w-4 h-4 ${c.color}`} />
                </div>
                <Activity className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{c.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{c.label}</p>
              <p className="text-xs text-teal-600 mt-1 font-medium">
                {c.change}
              </p>
            </div>
          ))}
        </div>

        {}
        {mounted && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900 mb-4">
                Appointments by Day (This Week)
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barSize={28}>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#94A3B8" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#94A3B8" }}
                  />
                  <Tooltip
                    contentStyle={{
                      border: "1px solid #E2E8F0",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    cursor={{ fill: "#F1F5F9" }}
                  />
                  <Bar
                    dataKey="appointments"
                    fill="#0D9488"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900 mb-4">
                Department-wise Appointments
              </h2>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie
                      data={deptChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {deptChartData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {deptChartData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PIE_COLORS[i] }}
                      />
                      <span className="text-xs text-slate-600 flex-1">
                        {d.name}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">
                        {d.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <h2 className="font-semibold text-slate-900">
              Recent Appointments
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  {[
                    "ID",
                    "Patient",
                    "Doctor",
                    "Department",
                    "Date",
                    "Time",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentAppointments.map((a) => (
                  <tr
                    key={a._id || a.id || a.appointmentId}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-mono text-slate-600">
                      {a.appointmentId || a.id}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {a.patientName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {a.doctorName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {a.department}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {a.date
                        ? new Date(a.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {a.time}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {recentAppointments.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">
              No appointments recorded in the database yet.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
