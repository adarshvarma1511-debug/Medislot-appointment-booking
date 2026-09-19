import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Notification from "@/models/Notification"
import { getAuthenticatedUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(req) {
  try {
    const authResult = await getAuthenticatedUser(req)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Authentication required" },
        { status: 401 },
      )
    }

    await connectToDatabase()

    const count = await Notification.countDocuments({
      recipientId: authResult.user._id,
      isRead: false,
    })

    return NextResponse.json({
      success: true,
      count,
    })
  } catch (error) {
    console.error("[Notifications API] Error fetching unread count:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to count unread notifications",
        count: 0,
      },
      { status: 500 },
    )
  }
}
