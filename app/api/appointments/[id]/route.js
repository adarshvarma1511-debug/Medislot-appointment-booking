import { NextResponse } from "next/server"

import { connectToDatabase } from "@/lib/mongodb"

import Appointment from "@/models/Appointment"

import User from "@/models/User"

import { getAuthenticatedUser } from "@/lib/auth"

import {
  createNotification,
  notifyAdmins,
  resolveDoctorUserId,
} from "@/lib/notifications"

export const dynamic = "force-dynamic"

export async function GET(req, { params }) {
  try {
    await connectToDatabase()

    const resolvedParams = await params

    const { id } = resolvedParams

    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/)

    const appt = await Appointment.findOne({
      $or: [
        { id },

        { appointmentId: id },

        ...(isObjectId ? [{ _id: id }] : []),
      ],
    })

    if (!appt) {
      return NextResponse.json(
        { success: false, error: "Appointment not found in database." },

        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,

      appointment: appt,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch appointment" },

      { status: 500 },
    )
  }
}

export async function PATCH(req, { params }) {
  try {
    await connectToDatabase()

    const resolvedParams = await params

    const { id } = resolvedParams

    const body = await req.json()

    const { status, consultationDetails } = body

    const updateFields = {}

    if (status) updateFields.status = status.toLowerCase()

    if (consultationDetails)
      updateFields.consultationDetails = consultationDetails

    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/)

    const updated = await Appointment.findOneAndUpdate(
      {
        $or: [
          { id },

          { appointmentId: id },

          ...(isObjectId ? [{ _id: id }] : []),
        ],
      },

      { $set: updateFields },

      { new: true },
    )

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Appointment not found to update" },

        { status: 404 },
      )
    }

    if (status) {
      // Resolve patient user ID

      let patientUserId = updated.patientId

      if (!patientUserId && updated.patientEmail) {
        const patientUser = await User.findOne({
          email: updated.patientEmail.toLowerCase().trim(),
        }).select("_id")

        if (patientUser) patientUserId = patientUser._id
      }

      const doctorDisplayName = updated.doctorName?.trim().startsWith("Dr.")
        ? updated.doctorName.trim()
        : `Dr. ${updated.doctorName?.trim() || "Doctor"}`

      const apptRefId =
        updated.appointmentId || updated.id || updated._id.toString()

      // Identify who made the change if authenticated

      const authResult = await getAuthenticatedUser(req)

      const actorRole = authResult.success ? authResult.user?.role : null

      if (updated.status === "confirmed") {
        if (patientUserId) {
          await createNotification({
            recipientId: patientUserId,

            recipientRole: "patient",

            type: "appointment_confirmed",

            title: "Appointment Confirmed",

            message: `Your appointment with ${doctorDisplayName} has been confirmed.`,

            relatedId: apptRefId,

            relatedType: "appointment",
          })
        }
      } else if (updated.status === "completed") {
        if (patientUserId) {
          await createNotification({
            recipientId: patientUserId,

            recipientRole: "patient",

            type: "appointment_completed",

            title: "Appointment Completed",

            message: `Your appointment with ${doctorDisplayName} has been marked as completed.`,

            relatedId: apptRefId,

            relatedType: "appointment",
          })
        }
      } else if (updated.status === "cancelled") {
        if (actorRole === "patient") {
          const targetDocUserId = await resolveDoctorUserId({
            doctorId: updated.doctorId,

            doctorUserId: updated.doctorUserId,

            doctorName: updated.doctorName,
          })

          if (targetDocUserId) {
            await createNotification({
              recipientId: targetDocUserId,

              recipientRole: "doctor",

              type: "appointment_cancelled",

              title: "Appointment Cancelled",

              message: `${updated.patientName} has cancelled an appointment.`,

              relatedId: apptRefId,

              relatedType: "appointment",
            })
          }

          await notifyAdmins({
            type: "appointment_cancelled",

            title: "Appointment Cancelled",

            message: "An appointment has been cancelled.",

            relatedId: apptRefId,

            relatedType: "appointment",
          })
        } else {
          if (patientUserId) {
            await createNotification({
              recipientId: patientUserId,

              recipientRole: "patient",

              type: "appointment_cancelled",

              title: "Appointment Cancelled",

              message: `Your appointment with ${doctorDisplayName} has been cancelled.`,

              relatedId: apptRefId,

              relatedType: "appointment",
            })
          }

          if (actorRole === "doctor") {
            await notifyAdmins({
              type: "appointment_cancelled",

              title: "Appointment Cancelled",

              message: "An appointment has been cancelled.",

              relatedId: apptRefId,

              relatedType: "appointment",
            })
          } else if (actorRole === "admin") {
            const targetDocUserId = await resolveDoctorUserId({
              doctorId: updated.doctorId,

              doctorUserId: updated.doctorUserId,

              doctorName: updated.doctorName,
            })

            if (targetDocUserId) {
              await createNotification({
                recipientId: targetDocUserId,

                recipientRole: "doctor",

                type: "appointment_cancelled",

                title: "Appointment Cancelled",

                message: `An appointment with ${updated.patientName} has been cancelled.`,

                relatedId: apptRefId,

                relatedType: "appointment",
              })
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,

      message: `Appointment status updated to ${updated.status} successfully in MongoDB`,

      appointment: updated,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,

        error: error.message || "Failed to update appointment",
      },

      { status: 500 },
    )
  }
}
