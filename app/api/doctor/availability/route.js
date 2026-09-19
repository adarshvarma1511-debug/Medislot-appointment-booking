import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Doctor from "@/models/Doctor"
import User from "@/models/User"

export async function GET(req) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(req.url)
    const doctorId = searchParams.get("doctorId") || searchParams.get("id")
    const email = searchParams.get("email")

    const query = []
    if (doctorId) query.push({ id: doctorId })
    if (email) query.push({ email: email.trim().toLowerCase() })

    let doctor = query.length > 0 ? await Doctor.findOne({ $or: query }) : null

    if (!doctor && email) {
      const user = await User.findOne({
        email: email.trim().toLowerCase(),
        role: "doctor",
      })
      if (user) {
        doctor = await Doctor.findOne({
          $or: [{ id: user.doctorId }, { userId: user._id }],
        })
      }
    }

    if (!doctor) {
      doctor = await Doctor.findOne({ id: "d1" })
    }

    const availableDays = doctor?.availableDays || [
      "Monday",
      "Tuesday",
      "Thursday",
      "Friday",
    ]
    const startTime = doctor?.startTime || "10:00 AM"
    const endTime = doctor?.endTime || "01:00 PM"
    const weeklySchedule = doctor?.weeklySchedule || {
      Monday: `${startTime} – ${endTime}`,
      Tuesday: `${startTime} – ${endTime}`,
      Wednesday: "Not Available",
      Thursday: "2:00 PM – 5:00 PM",
      Friday: `${startTime} – ${endTime}`,
      Saturday: "Not Available",
      Sunday: "Not Available",
    }

    return NextResponse.json({
      success: true,
      doctorId: doctor?.id || "d1",
      availableDays,
      startTime,
      endTime,
      availableToday: doctor?.availableToday ?? true,
      weeklySchedule,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch doctor availability",
      },
      { status: 500 },
    )
  }
}

export async function PUT(req) {
  try {
    await connectToDatabase()
    const body = await req.json()
    const {
      doctorId,
      email,
      availableDays,
      startTime,
      endTime,
      availableToday,
      weeklySchedule,
    } = body

    const query = []
    if (doctorId) query.push({ id: doctorId })
    if (email) query.push({ email: email.trim().toLowerCase() })

    let doctor = query.length > 0 ? await Doctor.findOne({ $or: query }) : null

    if (!doctor && email) {
      const user = await User.findOne({
        email: email.trim().toLowerCase(),
        role: "doctor",
      })
      if (user) {
        doctor = await Doctor.findOne({
          $or: [{ id: user.doctorId }, { userId: user._id }],
        })
      }
    }

    if (!doctor) {
      doctor = await Doctor.findOne({ id: "d1" })
    }

    if (!doctor) {
      return NextResponse.json({ success: false, error: "Doctor not found" }, {
        status: 404,
      })
    }

    if (Array.isArray(availableDays)) doctor.availableDays = availableDays
    if (startTime) doctor.startTime = startTime
    if (endTime) doctor.endTime = endTime
    if (availableToday !== undefined) doctor.availableToday = availableToday
    if (weeklySchedule) doctor.weeklySchedule = weeklySchedule

    await doctor.save()

    // Also update User if found
    if (doctor.userId || doctor.email) {
      const u = await User.findOne({
        $or: [
          { _id: doctor.userId },
          { email: doctor.email },
          { doctorId: doctor.id },
        ],
      })
      if (u) {
        if (Array.isArray(availableDays)) u.availableDays = availableDays
        if (startTime) u.startTime = startTime
        if (endTime) u.endTime = endTime
        await u.save()
      }
    }

    return NextResponse.json({
      success: true,
      message: "Doctor availability updated successfully",
      availability: {
        doctorId: doctor.id,
        availableDays: doctor.availableDays,
        startTime: doctor.startTime,
        endTime: doctor.endTime,
        availableToday: doctor.availableToday,
        weeklySchedule: doctor.weeklySchedule,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update availability",
      },
      { status: 500 },
    )
  }
}
