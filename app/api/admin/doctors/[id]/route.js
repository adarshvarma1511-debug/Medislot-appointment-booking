import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import Doctor from "@/models/Doctor"

export async function GET(req, { params }) {
  try {
    await connectToDatabase()
    const { id } = await params

    let doctor = await Doctor.findOne({
      $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    })

    if (!doctor) {
      return NextResponse.json({ success: false, error: "Doctor not found" }, {
        status: 404,
      })
    }

    const user = await User.findOne({
      $or: [
        { _id: doctor.userId },
        { doctorId: doctor.id },
        { email: doctor.email },
      ],
    })

    const doctorData = {
      id: doctor.id,
      name: doctor.name,
      email: doctor.email || user?.email || "doctor@medislot.com",
      phone: doctor.phone || user?.phone || "+91 98765 43210",
      specialization: doctor.specialization,
      department: doctor.department,
      experience: doctor.experience ?? user?.experience ?? 5,
      consultationDuration: doctor.consultationDuration ?? 30,
      hospital: doctor.hospital || user?.hospital || "MediSlot Hospital",
      availableDays: doctor.availableDays || [
        "Monday",
        "Tuesday",
        "Thursday",
        "Friday",
      ],
      startTime: doctor.startTime || user?.startTime || "10:00 AM",
      endTime: doctor.endTime || user?.endTime || "01:00 PM",
      status: doctor.status || user?.status || "Active",
      rating: doctor.rating,
      reviewCount: doctor.reviewCount,
      role: "doctor",
      userId: user?._id?.toString() || doctor.userId?.toString(),
      weeklySchedule: doctor.weeklySchedule || {},
    }

    return NextResponse.json({ success: true, doctor: doctorData })
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

export async function PUT(req, { params }) {
  try {
    await connectToDatabase()
    const { id } = await params
    const body = await req.json()

    const {
      name,
      phone,
      specialization,
      department,
      experience,
      consultationDuration,
      hospital,
      availableDays,
      startTime,
      endTime,
      status,
    } = body

    let doctor = await Doctor.findOne({
      $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    })

    if (!doctor) {
      return NextResponse.json({ success: false, error: "Doctor not found" }, {
        status: 404,
      })
    }

    // Update Doctor properties
    if (name) doctor.name = name.trim()
    if (phone) doctor.phone = phone.trim()
    if (specialization) doctor.specialization = specialization.trim()
    if (department) doctor.department = department.trim()
    if (experience !== undefined) doctor.experience = Number(experience)
    if (consultationDuration !== undefined)
      doctor.consultationDuration = Number(consultationDuration)
    if (hospital) doctor.hospital = hospital.trim()
    if (status) doctor.status = status

    if (Array.isArray(availableDays)) {
      doctor.availableDays = availableDays
      const sTime = startTime || doctor.startTime || "10:00 AM"
      const eTime = endTime || doctor.endTime || "01:00 PM"
      const scheduleMap = {}
      for (const day of availableDays) {
        scheduleMap[day] = `${sTime} – ${eTime}`
      }
      doctor.weeklySchedule = scheduleMap
    }
    if (startTime) doctor.startTime = startTime.trim()
    if (endTime) doctor.endTime = endTime.trim()

    await doctor.save()

    // Synchronize linked User account without creating duplicate account or modifying password/role
    const userQuery = doctor.userId
      ? { _id: doctor.userId }
      : { $or: [{ doctorId: doctor.id }, { email: doctor.email }] }

    const linkedUser = await User.findOne(userQuery)
    if (linkedUser) {
      if (name) linkedUser.name = doctor.name
      if (phone) linkedUser.phone = doctor.phone
      if (specialization) linkedUser.specialization = doctor.specialization
      if (department) linkedUser.department = doctor.department
      if (experience !== undefined) linkedUser.experience = doctor.experience
      if (consultationDuration !== undefined)
        linkedUser.consultationDuration = doctor.consultationDuration
      if (hospital) linkedUser.hospital = doctor.hospital
      if (availableDays) linkedUser.availableDays = doctor.availableDays
      if (startTime) linkedUser.startTime = doctor.startTime
      if (endTime) linkedUser.endTime = doctor.endTime
      if (status) linkedUser.status = doctor.status
      await linkedUser.save()
    }

    return NextResponse.json({
      success: true,
      message: "Doctor details updated successfully",
      doctor: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email || linkedUser?.email,
        phone: doctor.phone,
        specialization: doctor.specialization,
        department: doctor.department,
        experience: doctor.experience,
        consultationDuration: doctor.consultationDuration,
        hospital: doctor.hospital,
        availableDays: doctor.availableDays,
        startTime: doctor.startTime,
        endTime: doctor.endTime,
        status: doctor.status,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update doctor" },
      { status: 500 },
    )
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectToDatabase()
    const { id } = await params

    const doctor = await Doctor.findOne({
      $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    })

    if (!doctor) {
      return NextResponse.json({ success: false, error: "Doctor not found" }, {
        status: 404,
      })
    }

    // Delete associated User account so no orphan login remains
    const userQuery = doctor.userId
      ? { _id: doctor.userId }
      : { $or: [{ doctorId: doctor.id }, { email: doctor.email }] }

    await User.deleteMany(userQuery)

    // Delete doctor document
    await Doctor.deleteOne({ _id: doctor._id })

    return NextResponse.json({
      success: true,
      message: "Doctor and associated login account deleted successfully",
      deletedId: id,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete doctor" },
      { status: 500 },
    )
  }
}
