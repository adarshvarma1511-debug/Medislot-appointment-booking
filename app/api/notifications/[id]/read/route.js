import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Notification from "@/models/Notification"
import { getAuthenticatedUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

async function handleMarkAsRead(req, { params }) {
  try {
    const authResult = await getAuthenticatedUser(req)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Authentication required" },
        { status: 401 },
      )
    }

    const resolvedParams = await params
    const { id } = resolvedParams

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, error: "Invalid notification ID format" },
        { status: 400 },
      )
    }

    await connectToDatabase()

    // Strictly enforce recipientId = authenticated user ID
    const updated = await Notification.findOneAndUpdate(
      {
        _id: id,
        recipientId: authResult.user._id,
      },
      {
        $set: { isRead: true },
      },
      { new: true },
    )

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error: "Notification not found or you do not have permission to access it.",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
      notification: updated,
    })
  } catch (error) {
    console.error("[Notifications API] Error marking notification as read:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to mark notification as read" },
      { status: 500 },
    )
  }
}

export async function PUT(req, context) {
  return handleMarkAsRead(req, context)
}

export async function PATCH(req, context) {
  return handleMarkAsRead(req, context)
}
