import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Notification from "@/models/Notification"
import { getAuthenticatedUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function DELETE(req, { params }) {
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

    // Enforce that user can only delete their own notification
    const deleted = await Notification.findOneAndDelete({
      _id: id,
      recipientId: authResult.user._id,
    })

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: "Notification not found or you do not have permission to delete it.",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Notification deleted successfully",
    })
  } catch (error) {
    console.error("[Notifications API] Error deleting notification:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete notification" },
      { status: 500 },
    )
  }
}
