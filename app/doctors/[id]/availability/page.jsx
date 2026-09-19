"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
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

function formatDate(date) {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export default function DoctorAvailabilityPage({ params }) {
  const router = useRouter()
  const unwrappedParams =
    typeof params?.then === "function" ? use(params) : params
  const id = unwrappedParams?.id

  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [availData, setAvailData] = useState(null)
  const [errorMsg, setErrorMsg] = useState("")

  const fetchAvailability = async (date) => {
    if (!id) return
    setLoading(true)
    setSelected(null)
    setErrorMsg("")

    try {
      const dateStr = toISODate(date)
      const res = await fetch(`/api/doctors/${id}/availability?date=${dateStr}`)
      const data = await res.json()
      if (data.success) {
        setAvailData(data)
      } else {
        setErrorMsg(data.error || "Failed to load doctor availability.")
      }
    } catch (err) {
      setErrorMsg("Unable to retrieve availability from database.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAvailability(currentDate)
  }, [id, currentDate])

  const prevDay = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() - 1)
    setCurrentDate(d)
  }

  const nextDay = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + 1)
    setCurrentDate(d)
  }

  const handleContinueBooking = () => {
    if (!availData?.doctor || !selected) return
    const doc = availData.doctor
    const dateStr = toISODate(currentDate)
    const query = new URLSearchParams({
      doctorId: doc.id,
      doctorName: doc.name,
      specialization: doc.specialization || "",
      department: doc.department || "",
      date: dateStr,
      friendlyDate: formatDate(currentDate),
      time: selected,
    }).toString()
    router.push(`/book-appointment?${query}`)
  }

  const doctor = availData?.doctor
  const initials = doctor?.name
    ? doctor.name
        .replace(/^Dr\.\s*/i, "")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "DR"
  const color = avatarColors[initials] ?? "bg-teal-600"
  const isWorkingDay = availData?.isWorkingDay ?? true
  const slots = Array.isArray(availData?.slots) ? availData.slots : []

  return (
    <PatientLayout>
      <div className="space-y-6 max-w-2xl">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Doctor Profile
        </button>

        <h1
          className="text-2xl font-bold text-slate-900"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Check Doctor Availability
        </h1>

        {}
        {doctor && (
          <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
            <div
              className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-xs`}
            >
              {initials}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{doctor.name}</p>
              <p className="text-sm text-teal-600 font-medium">
                {doctor.specialization} • {doctor.department}
              </p>
            </div>
            <div className="ml-auto text-right hidden sm:block">
              <p className="text-xs text-slate-400">Consultation</p>
              <p className="text-sm font-semibold text-slate-700">
                {doctor.consultationDuration || 30} mins
              </p>
            </div>
          </div>
        )}

        {}
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <button
              onClick={prevDay}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span className="font-bold text-slate-900">
                  {formatDate(currentDate)}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                {currentDate.toLocaleDateString("en-US", { weekday: "long" })}
              </p>
            </div>
            <button
              onClick={nextDay}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">
              Available Time Slots
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-teal-100 border border-teal-300" />
                Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-200 border border-slate-300" />
                Booked
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-teal-600" />
                Selected
              </span>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">
                Checking real-time schedule & bookings...
              </p>
            </div>
          ) : errorMsg ? (
            <div className="p-4 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : !isWorkingDay ? (
            <div className="py-10 text-center text-slate-400">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50 text-amber-500" />
              <p className="font-semibold text-slate-700 text-sm">
                {availData?.message ||
                  `${doctor?.name || "Doctor"} is not available on this day.`}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Please navigate to another date using the arrows above.
              </p>
            </div>
          ) : slots.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <p className="text-sm font-medium">
                No slots scheduled for this day.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {slots.map((slot) => {
                const isSelected = selected === slot.time
                const isBooked = !slot.isAvailable || slot.status === "Booked"

                return (
                  <button
                    key={slot.time}
                    disabled={isBooked}
                    onClick={() => setSelected(isSelected ? null : slot.time)}
                    className={`py-2.5 px-2 rounded-xl text-sm font-medium text-center transition-all border ${
                      isBooked
                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through opacity-70"
                        : isSelected
                          ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-100 cursor-pointer"
                          : "bg-teal-50/70 text-teal-800 border-teal-200 hover:bg-teal-100 hover:border-teal-400 cursor-pointer"
                    }`}
                  >
                    <div className="font-semibold text-xs">{slot.time}</div>
                    <div
                      className={`text-[10px] mt-0.5 font-medium ${
                        isBooked
                          ? "text-slate-400"
                          : isSelected
                            ? "text-teal-100"
                            : "text-teal-600"
                      }`}
                    >
                      {slot.status}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {isWorkingDay &&
            slots.length > 0 &&
            slots.every((s) => !s.isAvailable) && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-center mt-4">
                All time slots for this date have been booked by other patients.
                Please choose another date.
              </div>
            )}
        </div>

        {}
        {selected && (
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 animate-in fade-in">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-teal-700 font-bold uppercase tracking-wide mb-1">
                  Selected Time Slot
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    <span className="font-medium text-sm">
                      {formatDate(currentDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span className="font-bold text-sm text-teal-800">
                      {selected}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleContinueBooking}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer shadow-sm active:scale-[0.99]"
              >
                Continue Booking →
              </button>
            </div>
          </div>
        )}

        <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Real-Time Schedule:</strong> Slots marked as{" "}
            <strong>Booked</strong> are already reserved in MongoDB and cannot
            be selected. Choose an available slot to proceed with booking.
          </p>
        </div>
      </div>
    </PatientLayout>
  )
}
