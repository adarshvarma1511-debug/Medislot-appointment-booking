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

export async function PATCH(req, { params }) {
  try {
    await connectToDatabase()

    const resolvedParams = await params

    const { id } = resolvedParams

    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/)

    const updated = await Appointment.findOneAndUpdate(
      {
        $or: [
          { id },

          { appointmentId: id },

          ...(isObjectId ? [{ _id: id }] : []),
        ],
      },

      { $set: { status: "cancelled" } },

      { new: true },
    )

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Appointment not found to cancel" },

        { status: 404 },
      )
    }

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

    // Identify who made the cancellation if authenticated

    const authResult = await getAuthenticatedUser(req)

    const actorRole = authResult.success ? authResult.user?.role : null

    if (actorRole === "patient") {
      // Patient cancelled -> Doctor & Admin notified

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
      // Doctor or Admin cancelled -> Patient notified

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

      // If doctor cancelled, notify Admin

      if (actorRole === "doctor") {
        await notifyAdmins({
          type: "appointment_cancelled",

          title: "Appointment Cancelled",

          message: "An appointment has been cancelled.",

          relatedId: apptRefId,

          relatedType: "appointment",
        })
      } else if (actorRole === "admin") {
        // If admin cancelled, notify Doctor

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
      } else {
        // Default / unauthenticated: Notify Doctor and Admin

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
      }
    }

    return NextResponse.json({
      success: true,

      message: "Appointment cancelled successfully. Slot is now available.",

      appointment: updated,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, {
      status: 500,
    })
  }
}
