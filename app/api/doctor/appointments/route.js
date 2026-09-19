import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Appointment from "@/models/Appointment"
import Doctor from "@/models/Doctor"
import User from "@/models/User"

export const dynamic = "force-dynamic"

export async function GET(req) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(req.url)
    const doctorId = searchParams.get("doctorId") || searchParams.get("id")
    const email = searchParams.get("email")

    if (!doctorId && !email) {
      return NextResponse.json(
        { success: false, error: "Doctor identifier is required" },
        { status: 400 },
      )
    }

    const doctorQuery = []
    if (doctorId) {
      doctorQuery.push({ id: doctorId })
      if (doctorId.match(/^[0-9a-fA-F]{24}$/))
        doctorQuery.push({ _id: doctorId }, { userId: doctorId })
    }
    if (email) {
      doctorQuery.push({ email: email.trim().toLowerCase() })
    }

    let doctor = await Doctor.findOne({ $or: doctorQuery })
    let doctorUser = null
    if (email) {
      doctorUser = await User.findOne({
        email: email.trim().toLowerCase(),
        role: "doctor",
      })
    }
    if (!doctor && doctorUser) {
      doctor = await Doctor.findOne({
        $or: [{ id: doctorUser.doctorId }, { userId: doctorUser._id }],
      })
    }

    const apptQuery = []
    if (doctor) {
      if (doctor.id) apptQuery.push({ doctorId: doctor.id })
      if (doctor._id) apptQuery.push({ doctorId: doctor._id.toString() })
      if (doctor.userId) apptQuery.push({ doctorUserId: doctor.userId })
      if (doctor.name) apptQuery.push({ doctorName: doctor.name })
    }
    if (doctorUser) {
      if (doctorUser.doctorId) apptQuery.push({ doctorId: doctorUser.doctorId })
      if (doctorUser._id) {
        apptQuery.push({ doctorUserId: doctorUser._id })
        apptQuery.push({ doctorId: doctorUser._id.toString() })
      }
      if (doctorUser.name) apptQuery.push({ doctorName: doctorUser.name })
    }
    if (doctorId) {
      apptQuery.push({ doctorId })
      if (doctorId.match(/^[0-9a-fA-F]{24}$/)) {
        apptQuery.push({ doctorUserId: doctorId })
      }
    }

    if (apptQuery.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        appointments: [],
      })
    }

    const appointments = await Appointment.find({ $or: apptQuery }).sort({
      createdAt: -1,
    })

    return NextResponse.json({
      success: true,
      count: appointments.length,
      appointments,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch doctor appointments",
        appointments: [],
      },
      { status: 500 },
    )
  }
}
