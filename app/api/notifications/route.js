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

    const { searchParams } = new URL(req.url)
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 50), 1), 100)

    const notifications = await Notification.find({
      recipientId: authResult.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(limit)

    return NextResponse.json({
      success: true,
      count: notifications.length,
      notifications,
    })
  } catch (error) {
    console.error("[Notifications API] Error fetching notifications:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch notifications",
        notifications: [],
      },
      { status: 500 },
    )
  }
}
