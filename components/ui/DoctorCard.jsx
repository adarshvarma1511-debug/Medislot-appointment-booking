"use client"

import Link from "next/link"
import { Star, Briefcase, MapPin, Calendar, UserCheck } from "lucide-react"

const avatarColors = {
  AS: "bg-teal-600",
  PN: "bg-violet-600",
  RK: "bg-blue-600",
  SM: "bg-rose-600",
  VP: "bg-amber-600",
  AR: "bg-emerald-600",
}

export default function DoctorCard({ doctor }) {
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
  const docId = doctor.id || doctor._id
  const isAvailable = doctor.availableToday ?? true

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:border-teal-100 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start gap-4">
          <div
            className={`w-14 h-14 ${color} rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-xs`}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-base leading-tight">
              {doctor.name}
            </h3>
            <p className="text-sm text-teal-600 font-medium mt-0.5">
              {doctor.specialization}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{doctor.department}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-slate-800">
              {doctor.rating || 4.8}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {doctor.experience}{" "}
              {Number(doctor.experience) === 1 ? "Year" : "Years"} Experience
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[160px]">
              {doctor.hospital || "MediSlot Hospital"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3.5 border-t border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
            isAvailable ? "text-teal-600" : "text-slate-400"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isAvailable ? "bg-teal-500 animate-pulse" : "bg-slate-300"
            }`}
          />
          {isAvailable ? "Available Today" : "Off Today"}
        </span>

        <div className="flex items-center gap-2">
          <Link
            href={`/doctors/${docId}`}
            className="text-xs font-semibold text-slate-700 hover:text-teal-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
          >
            View Profile
          </Link>
          <Link
            href={`/doctors/${docId}/availability`}
            className="text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 shadow-xs"
          >
            <Calendar className="w-3 h-3" /> Check Availability
          </Link>
        </div>
      </div>
    </div>
  )
}
