import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Appointment from "@/models/Appointment"
import User from "@/models/User"

export const dynamic = "force-dynamic"

export async function GET(req) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get("patientId")
    const email = searchParams.get("email") || searchParams.get("patientEmail")

    if (!patientId && !email) {
      return NextResponse.json(
        { success: false, error: "Patient identifier is required" },
        { status: 400 },
      )
    }

    const query = []
    if (patientId && patientId.match(/^[0-9a-fA-F]{24}$/)) {
      query.push({ patientId })
    }
    if (email) {
      query.push({ patientEmail: email.trim().toLowerCase() })
    }

    // Also find user ID if email provided
    if (email && (!patientId || !patientId.match(/^[0-9a-fA-F]{24}$/))) {
      const userDoc = await User.findOne({ email: email.trim().toLowerCase() })
      if (userDoc) {
        query.push({ patientId: userDoc._id })
      }
    }

    const appointments = await Appointment.find({ $or: query }).sort({
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
        error: error.message || "Failed to fetch patient appointments",
        appointments: [],
      },
      { status: 500 },
    )
  }
}
