"use client"

// Weekly schedule map

// Saving state

// Live Slot Inspection state

// Load doctors on mount

// Selected doctor object

// Synchronize doctor schedule when selectedDoctorId or doctors list changes

// Load dynamic slots for selected doctor and date

// Handle Save Availability to MongoDB
// Refresh live slots for current view

// Update local doctor object


import { useState, useEffect } from "react"
import {
  Save,
  ChevronDown,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  User,
  Building2,
  Sparkles,
} from "lucide-react"
import AdminLayout from "@/components/layout/AdminLayout"

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]

const TIME_OPTIONS = [
  "Not Available",
  "8:00 AM – 12:00 PM",
  "9:00 AM – 1:00 PM",
  "10:00 AM – 1:00 PM",
  "2:00 PM – 5:00 PM",
  "3:00 PM – 6:00 PM",
  "10:00 AM – 5:00 PM",
  "9:00 AM – 5:00 PM",
]

export default function AdminAvailabilityPage() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDoctorId, setSelectedDoctorId] = useState("")
  const [schedule, setSchedule] = useState({
    Monday: "10:00 AM – 1:00 PM",
    Tuesday: "10:00 AM – 1:00 PM",
    Wednesday: "Not Available",
    Thursday: "2:00 PM – 5:00 PM",
    Friday: "10:00 AM – 1:00 PM",
    Saturday: "Not Available",
    Sunday: "Not Available",
  })
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState("")
  const [saveError, setSaveError] = useState("")
  const todayStr = new Date().toISOString().split("T")[0]
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsData, setSlotsData] = useState(null)
  useEffect(() => {
    async function loadDocs() {
      setLoading(true)
      try {
        const res = await fetch("/api/doctors")
        const data = await res.json()
        if (data.success && Array.isArray(data.doctors)) {
          setDoctors(data.doctors)
          if (
            data.doctors.length >
            0
          ) {
            setSelectedDoctorId(
              data.doctors[0].id ||
                data.doctors[0]._id,
            )
          }
        }
      } catch (err) {
        console.error("Failed to load doctors:", err)
      } finally {
        setLoading(false)
      }
    }
    loadDocs()
  }, [])
  const currentDoctor =
    doctors.find(
      (d) =>
        d.id ===
          selectedDoctorId ||
        d._id ===
          selectedDoctorId,
    ) ||
    doctors[0] ||
    null
  useEffect(() => {
    if (!currentDoctor) return

    const initialSched = {
      Monday: "Not Available",
      Tuesday: "Not Available",
      Wednesday: "Not Available",
      Thursday: "Not Available",
      Friday: "Not Available",
      Saturday: "Not Available",
      Sunday: "Not Available",
    }

    if (
      currentDoctor.weeklySchedule &&
      typeof currentDoctor.weeklySchedule ===
        "object"
    ) {
      DAYS.forEach((day) => {
        if (currentDoctor.weeklySchedule[day]) {
          initialSched[day] = currentDoctor.weeklySchedule[day]
        }
      })
    } else if (Array.isArray(currentDoctor.availableDays)) {
      const shift = `${
        currentDoctor.startTime ||
        "10:00 AM"
      } – ${
        currentDoctor.endTime ||
        "01:00 PM"
      }`
      currentDoctor.availableDays.forEach((day) => {
        initialSched[day] = shift
      })
    }

    setSchedule(initialSched)
    setSaveSuccess("")
    setSaveError("")
  }, [selectedDoctorId, currentDoctor])
  const loadDynamicSlots = async (docId, date) => {
    if (!docId || !date) return
    setSlotsLoading(true)
    try {
      const res = await fetch(`/api/doctors/${docId}/availability?date=${date}`)
      const data = await res.json()
      if (data.success) {
        setSlotsData(data)
      } else {
        setSlotsData(null)
      }
    } catch (err) {
      console.error("Failed to load doctor slots:", err)
      setSlotsData(null)
    } finally {
      setSlotsLoading(false)
    }
  }

  useEffect(() => {
    if (currentDoctor?.id && selectedDate) {
      loadDynamicSlots(currentDoctor.id, selectedDate)
    }
  }, [currentDoctor?.id, selectedDate])
  const handleSaveAvailability = async () => {
    if (!currentDoctor) return

    setSaving(true)
    setSaveSuccess("")
    setSaveError("")

    const activeDays = DAYS.filter(
      (day) =>
        schedule[day] &&
        schedule[day] !==
          "Not Available",
    )

    try {
      const res = await fetch("/api/doctor/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: currentDoctor.id,
          weeklySchedule: schedule,
          availableDays: activeDays,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        setSaveError(
          data.error ||
            "Failed to update availability schedule.",
        )
      } else {
        setSaveSuccess(
          `Availability updated successfully for ${currentDoctor.name}.`,
        )
        loadDynamicSlots(currentDoctor.id, selectedDate)
        setDoctors((prev) =>
          prev.map((d) =>
            d.id === currentDoctor.id
              ? { ...d, weeklySchedule: schedule, availableDays: activeDays }
              : d,
          ),
        )

        setTimeout(() => setSaveSuccess(""), 4000)
      }
    } catch (err) {
      setSaveError("Network error updating doctor availability.")
    } finally {
      setSaving(false)
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
            Availability Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Configure weekly clinic shifts, operating days, and inspect live
            appointment slots in MongoDB
          </p>
        </div>

        {}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Select Hospital Doctor
              </label>
              <div className="relative inline-block w-full sm:w-auto">
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  disabled={loading || doctors.length === 0}
                  className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-semibold text-slate-800 focus:outline-none focus:border-teal-500 min-w-72 cursor-pointer transition-colors shadow-xs"
                >
                  {loading ? (
                    <option>Loading doctors...</option>
                  ) : doctors.length === 0 ? (
                    <option>No doctors registered</option>
                  ) : (
                    doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} – {d.specialization} ({d.department})
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {currentDoctor && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-10 h-10 bg-teal-600 text-white rounded-xl flex items-center justify-center font-bold text-xs shadow-xs">
                  {currentDoctor.avatar || "DR"}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {currentDoctor.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-medium text-teal-700">
                      {currentDoctor.department}
                    </span>
                    <span>·</span>
                    <span>{currentDoctor.experience} yrs experience</span>
                    <span>·</span>
                    <span>{currentDoctor.hospital || "City Hospital"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" /> Weekly Operating
                Hours & Practice Shifts
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Set consultation time windows for each day of the week. Days set
                to &quot;Not Available&quot; will be marked off-duty.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              {
                DAYS.filter(
                  (d) => schedule[d] && schedule[d] !== "Not Available",
                ).length
              }{" "}
              Active Days / Week
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {DAYS.map((day) => {
              const isWorking =
                schedule[day] && schedule[day] !== "Not Available"
              return (
                <div
                  key={day}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isWorking
                      ? "bg-teal-50/40 border-teal-200 shadow-xs"
                      : "bg-slate-50 border-slate-200/80 opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">
                      {day}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isWorking
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {isWorking ? "Duty" : "Off"}
                    </span>
                  </div>

                  <div className="relative">
                    <select
                      value={schedule[day] ?? "Not Available"}
                      onChange={(e) =>
                        setSchedule((prev) => ({
                          ...prev,
                          [day]: e.target.value,
                        }))
                      }
                      className={`w-full appearance-none text-xs font-medium border rounded-lg px-3 py-2 pr-7 outline-none cursor-pointer transition ${
                        isWorking
                          ? "bg-white border-teal-300 text-teal-900 font-semibold focus:border-teal-500"
                          : "bg-white border-slate-200 text-slate-500"
                      }`}
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )
            })}
          </div>

          {}
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {saveError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
            <button
              onClick={handleSaveAvailability}
              disabled={saving || !currentDoctor}
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer active:scale-[0.99]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving to Database...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Weekly Schedule
                </>
              )}
            </button>

            <span className="text-xs text-slate-400">
              Changes update appointment slot generation across patient booking
              views instantly.
            </span>
          </div>
        </div>

        {}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-teal-600" /> Live Date
                Slot Inspector
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect dynamic time slots, patient bookings, and availability
                for any specific date
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-teal-500 cursor-pointer shadow-xs"
              />
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="text-xs font-semibold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={() => {
                  const d = new Date()
                  d.setDate(d.getDate() + 1)
                  setSelectedDate(d.toISOString().split("T")[0])
                }}
                className="text-xs font-semibold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Tomorrow
              </button>
            </div>
          </div>

          {slotsLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              <span>Querying appointment slots for {selectedDate}...</span>
            </div>
          ) : !slotsData ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              Select a doctor and date to preview slots.
            </div>
          ) : !slotsData.isWorkingDay ? (
            <div className="py-8 px-4 bg-amber-50/60 border border-amber-200/80 rounded-xl text-center space-y-1">
              <p className="text-sm font-bold text-amber-900">
                Doctor is Not Scheduled on {slotsData.dayName}s
              </p>
              <p className="text-xs text-amber-700">
                {currentDoctor?.name} does not accept appointments on this day
                according to the weekly schedule.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold text-slate-800">
                  {slotsData.dayName}, {slotsData.friendlyDate || selectedDate}
                </span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                    <span>
                      {
                        slotsData.slots.filter((s) => s.status === "Available")
                          .length
                      }{" "}
                      Available
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>
                      {
                        slotsData.slots.filter((s) => s.status === "Booked")
                          .length
                      }{" "}
                      Booked
                    </span>
                  </span>
                  <span className="text-slate-400">
                    ({slotsData.slots.length} Total Slots)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {slotsData.slots.map((slot) => {
                  const isAvailable = slot.status === "Available"
                  return (
                    <div
                      key={slot.time}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isAvailable
                          ? "bg-teal-50/60 border-teal-200 text-teal-900"
                          : "bg-amber-50/80 border-amber-200 text-amber-900"
                      }`}
                    >
                      <div className="font-bold text-xs">{slot.time}</div>
                      <div
                        className={`text-[10px] font-bold mt-1 uppercase tracking-wider inline-block px-2 py-0.5 rounded-full ${
                          isAvailable
                            ? "bg-teal-200/60 text-teal-800"
                            : "bg-amber-200/70 text-amber-800"
                        }`}
                      >
                        {slot.status}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
