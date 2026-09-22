import { NextResponse } from "next/server"

import { connectToDatabase } from "@/lib/mongodb"

import User from "@/models/User"

import { getAuthenticatedUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(req) {
  try {
    const authResult = await getAuthenticatedUser(req)

    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },

        { status: authResult.status || 401 },
      )
    }

    const user = authResult.user

    const userData = {
      id: user._id.toString(),

      name: user.name,

      email: user.email,

      phone: user.phone || "+91 98765 43210",

      role: user.role,

      specialization: user.specialization || "General",

      department: user.department || "General Medicine",

      experience: user.experience ?? 5,

      consultationDuration: user.consultationDuration ?? 30,

      hospital: user.hospital || "MediSlot Hospital",

      status: user.status || "Active",

      avatar: user.avatar || "PT",

      profileImage: user.profileImage || "",

      lastLogin: user.lastLogin,

      authProvider: user.authProvider || user.provider || "email",

      provider: user.provider || "email",
    }

    return NextResponse.json({
      success: true,

      user: userData,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch session" },

      { status: 500 },
    )
  }
}

export async function PATCH(req) {
  try {
    await connectToDatabase()

    const body = await req.json()

    const { email, name, phone } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required to update profile" },

        { status: 400 },
      )
    }

    const updated = await User.findOneAndUpdate(
      { email: email.trim().toLowerCase() },

      {
        ...(name ? { name: name.trim() } : {}),

        ...(phone ? { phone: phone.trim() } : {}),
      },

      { new: true },
    )

    if (!updated) {
      return NextResponse.json({ success: false, error: "User not found" }, {
        status: 404,
      })
    }

    return NextResponse.json({
      success: true,

      message: "Profile updated successfully",

      user: {
        id: updated._id,

        name: updated.name,

        email: updated.email,

        phone: updated.phone,

        role: updated.role,

        avatar: updated.avatar,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,

        error: error.message || "Failed to update user profile",
      },

      { status: 500 },
    )
  }
}
