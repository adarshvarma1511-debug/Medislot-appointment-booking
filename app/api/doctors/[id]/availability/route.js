import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Doctor from "@/models/Doctor"
import Appointment from "@/models/Appointment"

export const dynamic = "force-dynamic"

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  if (!match) return null
  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const modifier = match[3] ? match[3].toUpperCase() : null

  if (modifier === "PM" && hours < 12) hours += 12
  if (modifier === "AM" && hours === 12) hours = 0
  return hours * 60 + minutes
}

function formatMinutesToTime(totalMinutes) {
  let hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const modifier = hours >= 12 ? "PM" : "AM"
  if (hours > 12) hours -= 12
  if (hours === 0) hours = 12
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes
  const formattedHours = hours < 10 ? `0${hours}` : hours
  return `${formattedHours}:${formattedMinutes} ${modifier}`
}

export async function GET(req, { params }) {
  try {
    await connectToDatabase()
    const resolvedParams = await params
    const { id } = resolvedParams

    const { searchParams } = new URL(req.url)
    const dateParam =
      searchParams.get("date") || new Date().toISOString().split("T")[0]

    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/)
    const doctor = await Doctor.findOne({
      $or: [{ id }, ...(isObjectId ? [{ _id: id }] : [])],
    })

    if (!doctor) {
      return NextResponse.json({ success: false, error: "Doctor not found" }, {
        status: 404,
      })
    }

    // Parse target date and day of week
    let dateObj = new Date(dateParam)
    if (isNaN(dateObj.getTime())) {
      dateObj = new Date()
    }

    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" })
    const formattedDate = dateObj.toISOString().split("T")[0]
    const friendlyDate = dateObj.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    // Check if doctor works on this day
    const availableDays = Array.isArray(doctor.availableDays)
      ? doctor.availableDays
      : []
    const isWorkingDay = availableDays.some(
      (d) => d.toLowerCase() === dayName.toLowerCase(),
    )

    if (!isWorkingDay) {
      return NextResponse.json({
        success: true,
        doctor: {
          id: doctor.id,
          name: doctor.name,
          specialization: doctor.specialization,
          department: doctor.department,
          hospital: doctor.hospital,
        },
        date: formattedDate,
        dayName,
        isWorkingDay: false,
        message: `${doctor.name} is not available on ${dayName}s.`,
        slots: [],
      })
    }

    // Determine shift hours for this day
    let startTimeStr = doctor.startTime || "10:00 AM"
    let endTimeStr = doctor.endTime || "01:00 PM"

    if (doctor.weeklySchedule && typeof doctor.weeklySchedule === "object") {
      const scheduleEntry =
        doctor.weeklySchedule[dayName] ||
        (doctor.weeklySchedule.get && doctor.weeklySchedule.get(dayName))
      if (typeof scheduleEntry === "string" && scheduleEntry.includes("–")) {
        const parts = scheduleEntry.split("–").map((s) => s.trim())
        if (parts.length === 2) {
          startTimeStr = parts[0]
          endTimeStr = parts[1]
        }
      }
    }

    const startMinutes = parseTimeToMinutes(startTimeStr) ?? 600 // 10:00 AM
    const endMinutes = parseTimeToMinutes(endTimeStr) ?? 780 // 1:00 PM
    const duration = doctor.consultationDuration || 30

    // Generate slots
    const generatedTimes = []
    for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
      generatedTimes.push(formatMinutesToTime(m))
    }

    // Query active appointments in MongoDB for this doctor on this date
    // We match by formattedDate (YYYY-MM-DD), friendlyDate, or raw dateParam
    const dateQueryValues = [
      formattedDate,
      dateParam,
      friendlyDate,
      dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    ]

    const activeAppointments = await Appointment.find({
      $or: [{ doctorId: doctor.id }, { doctorId: doctor._id.toString() }],
      date: { $in: dateQueryValues },
      status: { $in: ["confirmed", "upcoming"] },
    })

    const bookedTimesSet = new Set(
      activeAppointments.map((a) =>
        a.time.replace(/\s+/g, " ").trim().toUpperCase(),
      ),
    )

    const slots = generatedTimes.map((time) => {
      const normalized = time.replace(/\s+/g, " ").trim().toUpperCase()
      const isBooked = bookedTimesSet.has(normalized)
      return {
        time,
        status: isBooked ? "Booked" : "Available",
        isAvailable: !isBooked,
      }
    })

    return NextResponse.json({
      success: true,
      doctor: {
        id: doctor.id,
        name: doctor.name,
        specialization: doctor.specialization,
        department: doctor.department,
        hospital: doctor.hospital,
        consultationDuration: duration,
      },
      date: formattedDate,
      friendlyDate,
      dayName,
      isWorkingDay: true,
      slots,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve doctor availability",
      },
      { status: 500 },
    )
  }
}
