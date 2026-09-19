"use client"

// Fetch doctor's availability from database

// Build weeklySchedule map and availableDays


import { useState, useEffect } from "react"
import {
  Clock,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Loader2,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import DoctorLayout from "@/components/layout/DoctorLayout"

const DEFAULT_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]

function convertTo24Hour(timeStr) {
  if (!timeStr) return "10:00"
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  if (!match) return "10:00"
  let hours = parseInt(match[1], 10)
  const minutes = match[2]
  const modifier = match[3] ? match[3].toUpperCase() : null

  if (
    modifier ===
      "PM" &&
    hours <
      12
  )
    hours += 12
  if (
    modifier ===
      "AM" &&
    hours ===
      12
  )
    hours = 0
  return `${hours.toString().padStart(2, "0")}:${minutes}`
}

function convertTo12Hour(time24) {
  if (!time24) return "10:00 AM"
  const [hStr, mStr] = time24.split(":")
  let hours = parseInt(hStr, 10)
  const minutes =
    mStr ||
    "00"
  const modifier =
    hours >=
    12
      ? "PM"
      : "AM"
  if (
    hours >
    12
  )
    hours -= 12
  if (
    hours ===
    0
  )
    hours = 12
  return `${hours.toString().padStart(2, "0")}:${minutes} ${modifier}`
}

export default function DoctorSchedulePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState("")
  const [saveError, setSaveError] = useState("")

  const [slotDuration, setSlotDuration] = useState("30")
  const [breakTime, setBreakTime] = useState("1:00 PM - 2:00 PM")

  const [schedules, setSchedules] = useState(
    DEFAULT_DAYS.map((day) => ({
      day,
      enabled: ["Monday", "Tuesday", "Thursday", "Friday"].includes(day),
      startTime: "10:00",
      endTime: "13:00",
    })),
  )
  useEffect(() => {
    async function loadDoctorSchedule() {
      if (!user?.email && !user?.doctorId) return
      setLoading(true)
      try {
        const query = user?.doctorId
          ? `doctorId=${user.doctorId}`
          : `email=${encodeURIComponent(user.email)}`
        const res = await fetch(`/api/doctor/availability?${query}`)
        const data = await res.json()

        if (data.success && data.weeklySchedule) {
          const availDays =
            data.availableDays ||
            []
          const updated = DEFAULT_DAYS.map((day) => {
            const entry = data.weeklySchedule[day]
            const isEnabled =
              entry &&
              entry !==
                "Not Available"
            let sTime = "10:00"
            let eTime = "13:00"

            if (
              isEnabled &&
              typeof entry ===
                "string" &&
              entry.includes("–")
            ) {
              const parts = entry.split("–").map((p) => p.trim())
              if (
                parts.length ===
                2
              ) {
                sTime = convertTo24Hour(parts[0])
                eTime = convertTo24Hour(parts[1])
              }
            } else if (data.startTime && data.endTime) {
              sTime = convertTo24Hour(data.startTime)
              eTime = convertTo24Hour(data.endTime)
            }

            return {
              day,
              enabled:
                isEnabled ||
                availDays.includes(day),
              startTime: sTime,
              endTime: eTime,
            }
          })

          setSchedules(updated)
        }
      } catch (err) {
        console.error("Failed to load doctor schedule:", err)
      } finally {
        setLoading(false)
      }
    }
    loadDoctorSchedule()
  }, [user])

  const handleToggleDay = (day) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.day ===
        day
          ? { ...s, enabled: !s.enabled }
          : s,
      ),
    )
  }

  const handleTimeChange = (day, field, value) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.day ===
        day
          ? { ...s, [field]: value }
          : s,
      ),
    )
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaved("")
    setSaveError("")
    const weeklySchedule = {}
    const availableDays = []

    schedules.forEach((s) => {
      if (s.enabled) {
        const sTime12 = convertTo12Hour(s.startTime)
        const eTime12 = convertTo12Hour(s.endTime)
        weeklySchedule[s.day] = `${sTime12} – ${eTime12}`
        availableDays.push(s.day)
      } else {
        weeklySchedule[s.day] = "Not Available"
      }
    })

    const primaryShift = schedules.find((s) => s.enabled) || schedules[0]

    try {
      const res = await fetch("/api/doctor/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: user?.doctorId,
          email: user?.email,
          availableDays,
          weeklySchedule,
          startTime: convertTo12Hour(primaryShift.startTime),
          endTime: convertTo12Hour(primaryShift.endTime),
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        setSaveError(data.error || "Failed to save schedule.")
      } else {
        setSaved(
          "Your weekly consultation schedule has been saved to the database.",
        )
        setTimeout(() => setSaved(""), 4000)
      }
    } catch (err) {
      setSaveError("Network error saving consultation schedule.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <DoctorLayout>
      <div className="max-w-4xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1
              className="text-2xl font-bold text-slate-900"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              My Consultation Schedule
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Configure your clinic hours, slot durations, and working days in
              MongoDB
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="self-start sm:self-auto flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer active:scale-[0.99]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Schedule
              </>
            )}
          </button>
        </div>

        {saved && (
          <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-sm font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{saved}</span>
          </div>
        )}

        {saveError && (
          <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-xl text-sm font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-teal-600" /> General Practice
            Preferences
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Standard Consultation Duration
              </label>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:border-teal-500 font-medium text-slate-800"
              >
                <option value="15">15 minutes / patient</option>
                <option value="20">20 minutes / patient</option>
                <option value="30">30 minutes / patient (Recommended)</option>
                <option value="45">45 minutes / patient</option>
                <option value="60">60 minutes / patient</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Daily Break / Lunch Interval
              </label>
              <input
                type="text"
                value={breakTime}
                onChange={(e) => setBreakTime(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:border-teal-500 font-medium text-slate-800"
              />
            </div>
          </div>
        </div>

        {}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                Weekly Operating Hours
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Toggle days you accept appointments and specify shifts
              </p>
            </div>
            {loading && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                <span>Loading schedule...</span>
              </div>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {schedules.map((s) => (
              <div
                key={s.day}
                className={`p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  s.enabled ? "bg-white" : "bg-slate-50/70 opacity-60"
                }`}
              >
                <div className="flex items-center gap-4 min-w-[140px]">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={s.enabled}
                      onChange={() => handleToggleDay(s.day)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600" />
                  </label>
                  <span className="text-sm font-bold text-slate-800">
                    {s.day}
                  </span>
                </div>

                {s.enabled ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">
                        From:
                      </span>
                      <input
                        type="time"
                        value={s.startTime}
                        onChange={(e) =>
                          handleTimeChange(s.day, "startTime", e.target.value)
                        }
                        className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-500 bg-white font-medium"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">
                        To:
                      </span>
                      <input
                        type="time"
                        value={s.endTime}
                        onChange={(e) =>
                          handleTimeChange(s.day, "endTime", e.target.value)
                        }
                        className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-500 bg-white font-medium"
                      />
                    </div>
                    <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-md">
                      Open for Bookings
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-medium italic">
                    Off-duty / No consultations scheduled
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DoctorLayout>
  )
}
