"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Star,
  Briefcase,
  Building2,
  Clock,
  Calendar,
  ChevronRight,
  AlertCircle,
} from "lucide-react"
import PatientLayout from "@/components/layout/PatientLayout"

const avatarColors = {
  AS: "bg-teal-600",
  PN: "bg-violet-600",
  RK: "bg-blue-600",
  SM: "bg-rose-600",
  VP: "bg-amber-600",
  AR: "bg-emerald-600",
}

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]

export default function DoctorDetailsPage({ params }) {
  const router = useRouter()
  const unwrappedParams =
    typeof params?.then === "function" ? use(params) : params
  const id = unwrappedParams?.id

  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!id) return
    const fetchDoc = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/doctors/${id}`)
        const data = await res.json()
        if (data.success && data.doctor) {
          setDoctor(data.doctor)
        } else {
          setError(data.error || "Doctor not found in database.")
        }
      } catch (err) {
        setError("Unable to load doctor details.")
      } finally {
        setLoading(false)
      }
    }
    fetchDoc()
  }, [id])

  if (loading) {
    return (
      <PatientLayout>
        <div className="text-center py-24 text-slate-400">
          <div className="inline-block w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="font-semibold text-slate-700 text-sm">
            Loading doctor profile from database...
          </p>
        </div>
      </PatientLayout>
    )
  }

  if (error || !doctor) {
    return (
      <PatientLayout>
        <div className="max-w-md mx-auto text-center py-16 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {error || "Doctor Not Found"}
          </h2>
          <p className="text-xs text-slate-500">
            The requested doctor does not exist in the hospital registry.
          </p>
          <button
            onClick={() => router.push("/find-doctors")}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            ← Back to Doctors Directory
          </button>
        </div>
      </PatientLayout>
    )
  }

  const initials =
    doctor.avatar ||
    (doctor.name
      ? doctor.name
          .replace(/^Dr\.\s*/i, "")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "DR")
  const color = avatarColors[initials] ?? "bg-teal-600"
  const availableDaysList = Array.isArray(doctor.availableDays)
    ? doctor.availableDays
    : []
  const scheduleObj = doctor.weeklySchedule || {}
  const defaultHours = `${doctor.startTime || "10:00 AM"} – ${doctor.endTime || "01:00 PM"}`

  return (
    <PatientLayout>
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div
              className={`w-20 h-20 ${color} rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-sm`}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1
                    className="text-2xl font-bold text-slate-900"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {doctor.name}
                  </h1>
                  <p className="text-teal-600 font-medium mt-0.5">
                    {doctor.specialization}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-semibold text-slate-800">
                    {doctor.rating || 4.8}
                  </span>
                  <span className="text-xs text-slate-500">
                    ({doctor.reviewCount || 100} reviews)
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    icon: Building2,
                    label: "Department",
                    value: doctor.department,
                  },
                  {
                    icon: Briefcase,
                    label: "Experience",
                    value: `${doctor.experience} Years`,
                  },
                  {
                    icon: Clock,
                    label: "Consultation",
                    value: `${doctor.consultationDuration || 30} mins`,
                  },
                  {
                    icon: Calendar,
                    label: "Available Days",
                    value: `${availableDaysList.length} days/wk`,
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-2">
                    <item.icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">{item.label}</p>
                      <p className="text-sm font-medium text-slate-800">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{doctor.hospital || "MediSlot Hospital"}</span>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">
            Weekly Availability & Shift Hours
          </h2>
          <div className="divide-y divide-slate-50">
            {days.map((day) => {
              const isWorking = availableDaysList.some(
                (d) => d.toLowerCase() === day.toLowerCase(),
              )
              const schedule =
                scheduleObj[day] || (isWorking ? defaultHours : null)

              return (
                <div
                  key={day}
                  className="flex items-center justify-between py-3"
                >
                  <span className="text-sm font-medium text-slate-700 w-28">
                    {day}
                  </span>
                  {isWorking && schedule ? (
                    <span className="text-sm text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1 rounded-lg font-medium">
                      {schedule}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400 italic">
                      Not Available
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() =>
              router.push(`/doctors/${doctor.id || doctor._id}/availability`)
            }
            className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 py-3 rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            Check Available Slots <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </PatientLayout>
  )
}
