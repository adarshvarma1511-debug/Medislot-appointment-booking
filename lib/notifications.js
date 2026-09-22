import { connectToDatabase } from "@/lib/mongodb"

import Notification from "@/models/Notification"

import User from "@/models/User"

import Doctor from "@/models/Doctor"

/**
 * Creates a single notification in MongoDB for a specific recipient.
 */

export async function createNotification({
  recipientId,

  recipientRole,

  type,

  title,

  message,

  relatedId = null,

  relatedType = "system",
}) {
  try {
    if (!recipientId || !recipientRole || !title || !message || !type) {
      console.warn("[Notifications] Missing required notification fields:", {
        recipientId,

        recipientRole,

        type,

        title,
      })

      return null
    }

    await connectToDatabase()

    const notification = await Notification.create({
      recipientId,

      recipientRole,

      type,

      title,

      message,

      relatedId: relatedId ? String(relatedId) : null,

      relatedType,

      isRead: false,
    })

    return notification
  } catch (error) {
    console.error("[Notifications] Error creating notification:", error)

    return null
  }
}

/**
 * Notifies all active Admin accounts in the system.
 */

export async function notifyAdmins({
  type,

  title,

  message,

  relatedId = null,

  relatedType = "system",
}) {
  try {
    await connectToDatabase()

    const admins = await User.find({ role: "admin" }).select("_id role email")

    if (!admins || admins.length === 0) {
      return []
    }

    const docs = admins.map((admin) => ({
      recipientId: admin._id,

      recipientRole: "admin",

      type,

      title,

      message,

      relatedId: relatedId ? String(relatedId) : null,

      relatedType,

      isRead: false,
    }))

    const created = await Notification.insertMany(docs)

    return created
  } catch (error) {
    console.error("[Notifications] Error notifying admins:", error)

    return []
  }
}

/**
 * Resolves the doctor's User account _id from appointment or doctor records.
 */

export async function resolveDoctorUserId({
  doctorId = null,

  doctorUserId = null,

  doctorEmail = null,

  doctorName = null,
} = {}) {
  try {
    await connectToDatabase()

    // 1. If doctorUserId is provided directly and is valid

    if (doctorUserId && String(doctorUserId).match(/^[0-9a-fA-F]{24}$/)) {
      const user = await User.findById(doctorUserId).select("_id")

      if (user) return user._id
    }

    // 2. Query Doctor collection

    if (doctorId) {
      const isObjectId = String(doctorId).match(/^[0-9a-fA-F]{24}$/)

      const doc = await Doctor.findOne({
        $or: [
          { id: doctorId },

          ...(isObjectId ? [{ _id: doctorId }] : []),
        ],
      }).select("userId email name")

      if (doc?.userId) {
        return doc.userId
      }

      if (doc?.email) {
        const u = await User.findOne({ email: doc.email.toLowerCase() }).select(
          "_id",
        )

        if (u) return u._id
      }
    }

    // 3. Fallback: Search User collection directly

    const conditions = []

    if (doctorId) {
      conditions.push({ doctorId: String(doctorId) })
    }

    if (doctorEmail) {
      conditions.push({ email: doctorEmail.toLowerCase().trim() })
    }

    if (doctorName) {
      const cleanName = doctorName.trim().replace(/^Dr\.\s*/i, "")

      conditions.push({
        role: "doctor",

        name: { $regex: new RegExp(cleanName, "i") },
      })
    }

    if (conditions.length > 0) {
      const userDoc = await User.findOne({ $or: conditions }).select("_id")

      if (userDoc) return userDoc._id
    }

    return null
  } catch (err) {
    console.error("[Notifications] Error resolving doctor user ID:", err)

    return null
  }
}
