import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const conn = await connectToDatabase()
    const isConnected = conn.connection.readyState === 1

    return NextResponse.json({
      success: true,
      connected: isConnected,
      message: isConnected
        ? "MongoDB connected successfully"
        : "MongoDB connecting...",
      database: conn.connection.name || "medislot",
      host: conn.connection.host || "localhost",
      readyState: conn.connection.readyState,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        connected: false,
        message: "Unable to connect to MongoDB",
        error: error.message,
        hint: "Verify that your MongoDB server is running or configure MONGODB_URI in .env.local",
      },
      { status: 503 },
    )
  }
}
