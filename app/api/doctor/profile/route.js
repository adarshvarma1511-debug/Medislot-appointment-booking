import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import Doctor from "@/models/Doctor"

export async function GET(req) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(req.url)
    const email = searchParams.get("email")
    const doctorId = searchParams.get("doctorId") || searchParams.get("id")

    if (!email && !doctorId) {
      return NextResponse.json(
        { success: false, error: "Doctor email or doctorId is required" },
        { status: 400 },
      )
    }

    const query = []
    if (email) query.push({ email: email.trim().toLowerCase() })
    if (doctorId) query.push({ doctorId }, { id: doctorId })

    let user = await User.findOne({ $or: query, role: "doctor" })
    let doctor = await Doctor.findOne({
      $or: [
        ...(email ? [{ email: email.trim().toLowerCase() }] : []),
        ...(doctorId ? [{ id: doctorId }] : []),
        ...(user ? [{ userId: user._id }] : []),
      ],
    })

    if (!user && !doctor) {
      return NextResponse.json(
        { success: false, error: "Doctor profile not found" },
        { status: 404 },
      )
    }

    const profileData = {
      name: user?.name || doctor?.name,
      email: user?.email || doctor?.email, // Displayed as doctor's login email
      phone: user?.phone || doctor?.phone || "+91 98765 43210",
      specialization: user?.specialization || doctor?.specialization,
      department: user?.department || doctor?.department,
      experience: user?.experience ?? doctor?.experience ?? 5,
      hospital: user?.hospital || doctor?.hospital || "MediSlot Hospital",
      consultationDuration:
        user?.consultationDuration ?? doctor?.consultationDuration ?? 30,
      availableDays: user?.availableDays ||
        doctor?.availableDays || ["Monday", "Tuesday", "Thursday", "Friday"],
      startTime: user?.startTime || doctor?.startTime || "10:00 AM",
      endTime: user?.endTime || doctor?.endTime || "01:00 PM",
      status: user?.status || doctor?.status || "Active",
      role: "doctor", // Immutable
      doctorId: user?.doctorId || doctor?.id || "d1",
      avatar: user?.avatar || doctor?.avatar || "DR",
    }

    return NextResponse.json({ success: true, profile: profileData })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch doctor profile",
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
      email,
      doctorId,
      name,
      phone,
      specialization,
      department,
      experience,
      hospital,
    } = body

    // Reject any attempt to change role
    if (body.role && body.role !== "doctor") {
      return NextResponse.json(
        { success: false, error: "Changing user role is not permitted." },
        { status: 403 },
      )
    }

    if (!email && !doctorId) {
      return NextResponse.json(
        {
          success: false,
          error: "Doctor email or doctorId is required to update profile",
        },
        { status: 400 },
      )
    }

    const cleanEmail = email ? email.trim().toLowerCase() : null
    const query = []
    if (cleanEmail) query.push({ email: cleanEmail })
    if (doctorId) query.push({ doctorId }, { id: doctorId })

    let user = await User.findOne({ $or: query, role: "doctor" })
    let doctor = await Doctor.findOne({
      $or: [
        ...(cleanEmail ? [{ email: cleanEmail }] : []),
        ...(doctorId ? [{ id: doctorId }] : []),
        ...(user ? [{ userId: user._id }] : []),
      ],
    })

    if (!user && !doctor) {
      return NextResponse.json(
        { success: false, error: "Doctor profile not found" },
        { status: 404 },
      )
    }

    // Update fields (role cannot be changed!)
    if (user) {
      if (name) user.name = name.trim()
      if (phone) user.phone = phone.trim()
      if (specialization) user.specialization = specialization.trim()
      if (department) user.department = department.trim()
      if (experience !== undefined) user.experience = Number(experience)
      if (hospital) user.hospital = hospital.trim()
      await user.save()
    }

    if (doctor) {
      if (name) doctor.name = name.trim()
      if (phone) doctor.phone = phone.trim()
      if (specialization) doctor.specialization = specialization.trim()
      if (department) doctor.department = department.trim()
      if (experience !== undefined) doctor.experience = Number(experience)
      if (hospital) doctor.hospital = hospital.trim()
      await doctor.save()
    }

    const updatedProfile = {
      name: user?.name || doctor?.name,
      email: user?.email || doctor?.email,
      phone: user?.phone || doctor?.phone,
      specialization: user?.specialization || doctor?.specialization,
      department: user?.department || doctor?.department,
      experience: user?.experience ?? doctor?.experience,
      hospital: user?.hospital || doctor?.hospital,
      role: "doctor",
      doctorId: user?.doctorId || doctor?.id,
    }

    return NextResponse.json({
      success: true,
      message: "Doctor profile updated successfully",
      profile: updatedProfile,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update doctor profile",
      },
      { status: 500 },
    )
  }
}
