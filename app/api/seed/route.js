import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import Doctor from "@/models/Doctor"
import Department from "@/models/Department"
import { departments } from "@/data/mockData"

export const dynamic = "force-dynamic"

async function seedDatabase() {
  await connectToDatabase()
  const results = {}

  // 1. Seed Departments if empty
  const deptCount = await Department.countDocuments()
  if (deptCount === 0) {
    await Department.insertMany(departments)
    results.departments = `${departments.length} departments seeded`
  } else {
    results.departments = `${deptCount} departments already exist`
  }

  // 2. Ensure Admin account exists with hashed password
  const adminEmail = "admin@medislot.com"
  let existingAdmin = await User.findOne({ email: adminEmail })
  const hashedAdminPassword = await bcrypt.hash("admin123", 10)
  if (!existingAdmin) {
    existingAdmin = await User.create({
      name: "Hospital Administrator",
      email: adminEmail,
      password: hashedAdminPassword,
      phone: "+91 99999 88888",
      role: "admin",
      avatar: "AD",
      passwordUpdatedAt: new Date("2026-09-17T10:00:00.000Z"),
    })
    results.admin = "Admin account created (admin@medislot.com / admin123)"
  } else {
    existingAdmin.password = hashedAdminPassword
    existingAdmin.passwordUpdatedAt = new Date("2026-09-17T10:00:00.000Z")
    await existingAdmin.save()
    results.admin = "Admin account reset (admin@medislot.com / admin123)"
  }

  // 3. Ensure Doctor Dr. Amit Sharma exists (amitsharma@medislot.com)
  const doctorEmail = "amitsharma@medislot.com"
  let existingDoctorUser = await User.findOne({ email: doctorEmail })
  const hashedDoctorPassword = await bcrypt.hash("doctor123", 10)
  if (!existingDoctorUser) {
    existingDoctorUser = await User.create({
      name: "Dr. Amit Sharma",
      email: doctorEmail,
      password: hashedDoctorPassword,
      phone: "+91 98765 43210",
      role: "doctor",
      specialization: "Cardiologist",
      department: "Cardiology",
      hospital: "MediSlot City Hospital",
      experience: 8,
      consultationDuration: 30,
      availableDays: ["Monday", "Tuesday", "Thursday", "Friday"],
      startTime: "10:00 AM",
      endTime: "01:00 PM",
      doctorId: "d1",
      avatar: "AS",
      status: "Active",
      passwordUpdatedAt: new Date("2026-09-17T10:00:00.000Z"),
    })

    // Ensure linked Doctor profile
    let docDoc = await Doctor.findOne({ email: doctorEmail })
    if (!docDoc) {
      docDoc = await Doctor.create({
        id: "d1",
        userId: existingDoctorUser._id,
        name: "Dr. Amit Sharma",
        email: doctorEmail,
        phone: "+91 98765 43210",
        specialization: "Cardiologist",
        department: "Cardiology",
        hospital: "MediSlot City Hospital",
        experience: 8,
        consultationDuration: 30,
        availableDays: ["Monday", "Tuesday", "Thursday", "Friday"],
        startTime: "10:00 AM",
        endTime: "01:00 PM",
        availableToday: true,
        rating: 4.8,
        reviewCount: 214,
        avatar: "AS",
        status: "Active",
        weeklySchedule: {
          Monday: "10:00 AM – 01:00 PM",
          Tuesday: "10:00 AM – 01:00 PM",
          Thursday: "02:00 PM – 05:00 PM",
          Friday: "10:00 AM – 01:00 PM",
        },
      })
    }
    results.doctor =
      "Doctor account created (amitsharma@medislot.com / doctor123)"
  } else {
    existingDoctorUser.password = hashedDoctorPassword
    existingDoctorUser.passwordUpdatedAt = new Date("2026-09-17T10:00:00.000Z")
    await existingDoctorUser.save()
    results.doctor =
      "Doctor account reset (amitsharma@medislot.com / doctor123)"
  }

  // 4. Ensure Patient account exists
  const patientEmail = "patient@medislot.com"
  let existingPatient = await User.findOne({ email: patientEmail })
  const hashedPatientPassword = await bcrypt.hash("patient123", 10)
  if (!existingPatient) {
    existingPatient = await User.create({
      name: "Adarsh Singh",
      email: patientEmail,
      password: hashedPatientPassword,
      phone: "+91 98765 43210",
      role: "patient",
      avatar: "AS",
      passwordUpdatedAt: new Date("2026-09-17T10:00:00.000Z"),
    })
    results.patient =
      "Patient account created (patient@medislot.com / patient123)"
  } else {
    existingPatient.password = hashedPatientPassword
    existingPatient.passwordUpdatedAt = new Date("2026-09-17T10:00:00.000Z")
    await existingPatient.save()
    results.patient =
      "Patient account reset (patient@medislot.com / patient123)"
  }

  return results
}

export async function POST(req) {
  try {
    const results = await seedDatabase()
    return NextResponse.json({
      success: true,
      message: "Database initialized with clean system settings",
      data: results,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to initialize database",
        error: error.message,
      },
      { status: 500 },
    )
  }
}

export async function GET(req) {
  try {
    const results = await seedDatabase()
    return NextResponse.json({
      success: true,
      message: "Database initialized with clean system settings",
      data: results,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to initialize database",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
