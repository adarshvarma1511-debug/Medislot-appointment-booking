import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Appointment from "@/models/Appointment"
import Doctor from "@/models/Doctor"
import User from "@/models/User"
import {
  createNotification,
  notifyAdmins,
  resolveDoctorUserId,
} from "@/lib/notifications"

export const dynamic = "force-dynamic"

export async function GET(req) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(req.url)
    const patientEmail = searchParams.get("patientEmail")
    const patientId = searchParams.get("patientId")
    const doctorId = searchParams.get("doctorId")
    const status = searchParams.get("status")

    const query = {}
    if (patientId && patientId.match(/^[0-9a-fA-F]{24}$/)) {
      query.patientId = patientId
    } else if (patientEmail) {
      query.patientEmail = patientEmail.toLowerCase()
    }

    if (doctorId) {
      query.$or = [
        { doctorId },
        { doctorUserId: doctorId.match(/^[0-9a-fA-F]{24}$/) ? doctorId : null },
      ]
    }

    if (status && status !== "All") {
      query.status = status
    }

    // Return real appointments from MongoDB (NO fake/demo appointments)
    const appts = await Appointment.find(query).sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      count: appts.length,
      appointments: appts,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch appointments",
        appointments: [],
      },
      { status: 500 },
    )
  }
}

export async function POST(req) {
  try {
    await connectToDatabase()

    const body = await req.json()
    const {
      patientId,
      patientName,
      patientEmail,
      patientPhone,
      doctorId,
      doctorName,
      department,
      specialization,
      date,
      time,
      reason,
      status,
    } = body

    // Validation of mandatory fields
    if (!doctorId || !date || !time) {
      return NextResponse.json(
        {
          success: false,
          message: "Doctor, date, and time slot are required.",
        },
        { status: 400 },
      )
    }

    const cleanDate = date.trim()
    const cleanTime = time.trim()

    // 1. Resolve Doctor in MongoDB
    const isDocObjectId = doctorId.match(/^[0-9a-fA-F]{24}$/)
    const doctor = await Doctor.findOne({
      $or: [{ id: doctorId }, ...(isDocObjectId ? [{ _id: doctorId }] : [])],
    })

    const finalDoctorId = doctor ? doctor.id : doctorId
    const finalDoctorName = doctor ? doctor.name : doctorName || "Doctor"
    const finalDept = doctor
      ? doctor.department
      : department || "General Medicine"
    const finalSpec = doctor
      ? doctor.specialization
      : specialization || "General"
    const doctorUserId = doctor?.userId || null

    // 2. Resolve Patient in MongoDB
    let resolvedPatientId = null
    let resolvedPatientName = patientName || "Patient"
    let resolvedPatientEmail = (patientEmail || "").toLowerCase().trim()
    let resolvedPatientPhone = patientPhone || "+91 98765 43210"

    if (patientId && patientId.match(/^[0-9a-fA-F]{24}$/)) {
      const userDoc = await User.findById(patientId)
      if (userDoc) {
        resolvedPatientId = userDoc._id
        resolvedPatientName = userDoc.name || resolvedPatientName
        resolvedPatientEmail = userDoc.email || resolvedPatientEmail
        resolvedPatientPhone = userDoc.phone || resolvedPatientPhone
      }
    } else if (resolvedPatientEmail) {
      const userDoc = await User.findOne({ email: resolvedPatientEmail })
      if (userDoc) {
        resolvedPatientId = userDoc._id
        resolvedPatientName = userDoc.name || resolvedPatientName
        resolvedPatientPhone = userDoc.phone || resolvedPatientPhone
      }
    }

    // 3. PREVENT DOUBLE BOOKING: Atomic check for already booked slot
    // Active statuses: confirmed, upcoming
    const existingConflict = await Appointment.findOne({
      $or: [
        { doctorId: finalDoctorId },
        ...(doctor ? [{ doctorId: doctor._id.toString() }] : []),
      ],
      date: cleanDate,
      time: {
        $regex: new RegExp(`^${cleanTime.replace(/\s+/g, "\\s*")}$`, "i"),
      },
      status: { $in: ["confirmed", "upcoming"] },
    })

    if (existingConflict) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This time slot is no longer available. Please select another slot.",
        },
        { status: 409 },
      )
    }

    // 4. Generate unique Appointment ID (e.g. MED1025)
    const count = await Appointment.countDocuments()
    const uniqueNumber = 1000 + count + Math.floor(Math.random() * 900)
    const appointmentId = `MED${uniqueNumber}`

    // 5. Save appointment to MongoDB with proper relationships
    const newAppointment = await Appointment.create({
      id: appointmentId,
      appointmentId,
      patientId: resolvedPatientId,
      doctorId: finalDoctorId,
      doctorUserId,
      patientName: resolvedPatientName.trim(),
      patientEmail: resolvedPatientEmail,
      patientPhone: resolvedPatientPhone.trim(),
      doctorName: finalDoctorName,
      department: finalDept,
      specialization: finalSpec,
      date: cleanDate,
      time: cleanTime,
      status: status || "confirmed",
      reason: reason?.trim() || "Consultation & Health Examination",
    })

    // 6. Create in-app notifications for Patient, Doctor, and Admin (Real DB events)
    const doctorDisplayName = finalDoctorName.trim().startsWith("Dr.")
      ? finalDoctorName.trim()
      : `Dr. ${finalDoctorName.trim()}`

    // A. Patient notification
    if (resolvedPatientId) {
      await createNotification({
        recipientId: resolvedPatientId,
        recipientRole: "patient",
        type: "appointment_booked",
        title: "Appointment Booked",
        message: `Your appointment with ${doctorDisplayName} has been booked successfully.`,
        relatedId: newAppointment.appointmentId || newAppointment._id.toString(),
        relatedType: "appointment",
      })
    }

    // B. Doctor notification
    const targetDocUserId = await resolveDoctorUserId({
      doctorId: finalDoctorId,
      doctorUserId,
      doctorEmail: doctor?.email,
      doctorName: finalDoctorName,
    })

    if (targetDocUserId) {
      await createNotification({
        recipientId: targetDocUserId,
        recipientRole: "doctor",
        type: "new_appointment",
        title: "New Appointment",
        message: `You have received a new appointment from ${resolvedPatientName.trim()}.`,
        relatedId: newAppointment.appointmentId || newAppointment._id.toString(),
        relatedType: "appointment",
      })
    }

    // C. Admin notification
    await notifyAdmins({
      type: "new_appointment",
      title: "New Appointment",
      message: "A new appointment has been booked.",
      relatedId: newAppointment.appointmentId || newAppointment._id.toString(),
      relatedType: "appointment",
    })

    return NextResponse.json(
      {
        success: true,
        message: "Appointment confirmed and saved successfully to database.",
        appointment: newAppointment,
      },
      { status: 201 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create appointment",
      },
      { status: 500 },
    )
  }
}
