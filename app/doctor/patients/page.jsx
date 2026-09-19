"use client"

// Extract unique patients from appointments


import { useState } from "react"
import { Search, Mail, Phone, Calendar } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import DoctorLayout from "@/components/layout/DoctorLayout"

export default function DoctorPatientsPage() {
  const { appointments } = useAuth()
  const [query, setQuery] = useState("")
  const uniquePatientsMap = new Map()
  appointments.forEach((a) => {
    if (a.patientEmail && !uniquePatientsMap.has(a.patientEmail)) {
      uniquePatientsMap.set(a.patientEmail, {
        name: a.patientName,
        email: a.patientEmail,
        phone: a.patientPhone,
        appointmentsCount: appointments.filter(
          (x) => x.patientEmail === a.patientEmail,
        ).length,
        lastVisit: a.date,
        lastReason: a.reason,
        consultationDetails: a.consultationDetails,
      })
    }
  })

  const patientList = Array.from(uniquePatientsMap.values()).filter(
    (p) =>
      p.name?.toLowerCase().includes(query.toLowerCase()) ||
      p.email?.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <DoctorLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1
              className="text-2xl font-bold text-slate-900"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              My Patient Directory
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Registered patients with prior and upcoming medical consultations
            </p>
          </div>
          <div className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 font-semibold self-start sm:self-auto shadow-xs">
            Total Patients: {patientList.length}
          </div>
        </div>

        {}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patients by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm text-slate-700 bg-transparent outline-none"
          />
        </div>

        {}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {patientList.map((p) => {
            const initials = p.name
              ? p.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
              : "PT"

            return (
              <div
                key={p.email}
                className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3.5 mb-3">
                    <div className="w-11 h-11 bg-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        {p.name}
                      </h3>
                      <span className="text-xs text-teal-600 font-semibold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                        {p.appointmentsCount} Appointments
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{p.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.phone || "+91 98765 43210"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Last visit: {p.lastVisit}</span>
                    </div>
                  </div>

                  {p.consultationDetails && (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1 mb-2">
                      <p className="font-semibold text-slate-800">
                        Latest Prescription:
                      </p>
                      <p className="text-slate-600 font-mono text-[11px] truncate">
                        {p.consultationDetails.prescription}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Blood Type: A+ (Typical)</span>
                  <span className="text-teal-600 font-medium">
                    Verified Patient
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </DoctorLayout>
  )
}
