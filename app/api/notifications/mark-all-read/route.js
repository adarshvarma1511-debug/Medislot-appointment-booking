import { NextResponse } from "next/server"

import { connectToDatabase } from "@/lib/mongodb"

import Notification from "@/models/Notification"

import { getAuthenticatedUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

async function handleMarkAllAsRead(req) {
  try {
    const authResult = await getAuthenticatedUser(req)

    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error || "Authentication required",
        },

        { status: 401 },
      )
    }

    await connectToDatabase()

    const result = await Notification.updateMany(
      {
        recipientId: authResult.user._id,

        isRead: false,
      },

      {
        $set: { isRead: true },
      },
    )

    return NextResponse.json({
      success: true,

      message: "All notifications marked as read",

      modifiedCount: result.modifiedCount,
    })
  } catch (error) {
    console.error(
      "[Notifications API] Error marking all notifications as read:",
      error,
    )

    return NextResponse.json(
      { success: false, error: error.message || "Failed to mark all as read" },

      { status: 500 },
    )
  }
}

export async function PUT(req) {
  return handleMarkAllAsRead(req)
}

export async function PATCH(req) {
  return handleMarkAllAsRead(req)
}
