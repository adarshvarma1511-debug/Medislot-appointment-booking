import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import Doctor from "@/models/Doctor"
import { signSessionToken, SESSION_COOKIE_OPTIONS } from "@/lib/auth"
import { notifyAdmins } from "@/lib/notifications"

export const dynamic = "force-dynamic"

export async function POST(req) {
  try {
    await connectToDatabase()

    const body = await req.json()
    const {
      name,
      email,
      password,
      phone,
      role = "patient",
      specialization,
      department,
      hospital,
      experience,
      consultationDuration,
      availableDays,
      startTime,
      endTime,
    } = body

    // Strict input validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Full Name is required" },
        { status: 400 },
      )
    }
    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: "Email address is required" },
        { status: 400 },
      )
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 },
      )
    }

    const cleanEmail = email.trim().toLowerCase()

    // Check if account already exists in MongoDB
    const existing = await User.findOne({ email: cleanEmail })
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 409 },
      )
    }

    // Securely hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10)

    const initials = name
      .trim()
      .replace(/^Dr\.\s*/i, "")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

    const docId =
      role === "doctor"
        ? `d_${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`
        : undefined

    // Save user document in MongoDB
    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      phone: phone?.trim() || "",
      role: role || "patient",
      specialization:
        role === "doctor" ? specialization || "General Medicine" : undefined,
      department:
        role === "doctor" ? department || "General Medicine" : undefined,
      hospital: role === "doctor" ? hospital || "MediSlot Hospital" : undefined,
      experience: role === "doctor" ? Number(experience || 5) : undefined,
      consultationDuration:
        role === "doctor" ? Number(consultationDuration || 30) : undefined,
      availableDays:
        role === "doctor"
          ? availableDays || [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
            ]
          : undefined,
      startTime: role === "doctor" ? startTime || "10:00 AM" : undefined,
      endTime: role === "doctor" ? endTime || "01:00 PM" : undefined,
      doctorId: docId,
      avatar: initials || "PT",
      status: "Active",
      lastLogin: new Date(),
      passwordUpdatedAt: new Date(),
    })

    // If registering as doctor, create linked doctor profile in MongoDB
    if (role === "doctor") {
      await Doctor.create({
        id: docId,
        userId: newUser._id,
        name: newUser.name,
        email: cleanEmail,
        phone: newUser.phone,
        specialization: newUser.specialization,
        department: newUser.department,
        hospital: newUser.hospital || "MediSlot Hospital",
        experience: newUser.experience || 5,
        consultationDuration: newUser.consultationDuration || 30,
        availableDays: newUser.availableDays,
        startTime: newUser.startTime,
        endTime: newUser.endTime,
        availableToday: true,
        rating: 5.0,
        reviewCount: 0,
        avatar: initials || "DR",
        status: "Active",
        weeklySchedule: {
          Monday: `${newUser.startTime} – ${newUser.endTime}`,
          Tuesday: `${newUser.startTime} – ${newUser.endTime}`,
          Wednesday: `${newUser.startTime} – ${newUser.endTime}`,
          Thursday: `${newUser.startTime} – ${newUser.endTime}`,
          Friday: `${newUser.startTime} – ${newUser.endTime}`,
        },
      })
    }

    // If a new patient registered, notify administrators
    if (newUser.role === "patient") {
      await notifyAdmins({
        type: "patient_registered",
        title: "New Patient Registered",
        message: "A new patient has registered in MediSlot.",
        relatedId: newUser._id.toString(),
        relatedType: "patient",
      })
    }

    const userData = {
      id: newUser._id.toString(),
      _id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      specialization: newUser.specialization,
      department: newUser.department,
      hospital: newUser.hospital,
      experience: newUser.experience,
      doctorId: newUser.doctorId,
      avatar: newUser.avatar,
      lastLogin: newUser.lastLogin,
      passwordUpdatedAt: newUser.passwordUpdatedAt,
    }

    const token = signSessionToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
    })

    const response = NextResponse.json(
      {
        success: true,
        message: "Account registered successfully and saved in database.",
        user: userData,
        token,
      },
      { status: 201 },
    )

    response.cookies.set("medislot_token", token, SESSION_COOKIE_OPTIONS)

    return response
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Registration failed. Please try again.",
      },
      { status: 500 },
    )
  }
}
