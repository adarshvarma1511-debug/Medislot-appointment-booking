import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully. All session tokens and credentials cleared.",
    })

    // Clear HttpOnly session cookie
    response.cookies.set("medislot_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    })

    // Clear role cookie
    response.cookies.set("medislot_role", "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to log out" },
      { status: 500 },
    )
  }
}
