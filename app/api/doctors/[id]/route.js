import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Doctor from "@/models/Doctor"
import User from "@/models/User"

export const dynamic = "force-dynamic"

export async function GET(req, { params }) {
  try {
    await connectToDatabase()
    const resolvedParams = await params
    const { id } = resolvedParams

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Doctor ID is required" },
        { status: 400 },
      )
    }

    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/)
    const doctor = await Doctor.findOne({
      $or: [{ id }, ...(isObjectId ? [{ _id: id }] : [])],
    })

    if (!doctor) {
      return NextResponse.json(
        { success: false, error: "Doctor not found in database." },
        { status: 404 },
      )
    }

    const linkedUser = await User.findOne({
      $or: [
        { doctorId: doctor.id },
        { _id: doctor.userId },
        ...(doctor.email ? [{ email: doctor.email }] : []),
      ],
    })

    const docObj = doctor.toObject()

    return NextResponse.json({
      success: true,
      doctor: {
        _id: docObj._id.toString(),
        id: docObj.id,
        name: docObj.name,
        email: docObj.email || linkedUser?.email || "",
        phone: docObj.phone || linkedUser?.phone || "+91 98765 43210",
        specialization: docObj.specialization,
        department: docObj.department,
        experience: docObj.experience ?? linkedUser?.experience ?? 5,
        hospital:
          docObj.hospital || linkedUser?.hospital || "MediSlot Hospital",
        consultationDuration: docObj.consultationDuration ?? 30,
        availableDays: docObj.availableDays || [
          "Monday",
          "Tuesday",
          "Thursday",
          "Friday",
        ],
        startTime: docObj.startTime || "10:00 AM",
        endTime: docObj.endTime || "01:00 PM",
        weeklySchedule: docObj.weeklySchedule || {},
        availableToday: docObj.availableToday ?? true,
        status: docObj.status || "Active",
        rating: docObj.rating ?? 4.8,
        reviewCount: docObj.reviewCount ?? 0,
        avatar: docObj.avatar || "DR",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch doctor details",
      },
      { status: 500 },
    )
  }
}
