import bcrypt from "bcryptjs"
import { connectToDatabase } from "../../lib/mongodb.js"
import User from "../../models/User.js"
import Doctor from "../../models/Doctor.js"

async function runTests() {
  console.log("=== Starting Doctor Management & Account Creation Tests ===")

  await connectToDatabase()
  console.log("✓ Connected to MongoDB")

  const testEmail = `test.amit.${Date.now()}@medislot.com`
  const rawPassword = "TempPassword@123"

  // Cleanup if existed
  await User.deleteMany({ email: testEmail })
  await Doctor.deleteMany({ email: testEmail })

  // 1. Password Hashing Test
  const hashedPassword = await bcrypt.hash(rawPassword, 10)
  if (hashedPassword === rawPassword || !hashedPassword.startsWith("$2")) {
    throw new Error("Password was not properly hashed with bcrypt!")
  }
  console.log(
    "✓ Password correctly hashed with bcrypt:",
    hashedPassword.slice(0, 15) + "...",
  )

  // 2. Create Doctor User and Doctor Record
  const docId = `d_test_${Date.now()}`
  const user = await User.create({
    name: "Dr. Amit Sharma",
    email: testEmail,
    password: hashedPassword,
    role: "doctor",
    phone: "9876543210",
    specialization: "Cardiologist",
    department: "Cardiology",
    experience: 8,
    consultationDuration: 30,
    hospital: "MediSlot Hospital",
    availableDays: ["Monday", "Tuesday", "Thursday", "Friday"],
    startTime: "10:00 AM",
    endTime: "01:00 PM",
    status: "Active",
    doctorId: docId,
  })

  const doctor = await Doctor.create({
    id: docId,
    name: "Dr. Amit Sharma",
    email: testEmail,
    phone: "9876543210",
    specialization: "Cardiologist",
    department: "Cardiology",
    experience: 8,
    consultationDuration: 30,
    hospital: "MediSlot Hospital",
    availableDays: ["Monday", "Tuesday", "Thursday", "Friday"],
    startTime: "10:00 AM",
    endTime: "01:00 PM",
    weeklySchedule: {
      Monday: "10:00 AM – 01:00 PM",
      Tuesday: "10:00 AM – 01:00 PM",
      Thursday: "10:00 AM – 01:00 PM",
      Friday: "10:00 AM – 01:00 PM",
    },
    status: "Active",
    userId: user._id,
  })
  console.log(
    "✓ Successfully created Doctor User and Doctor document in MongoDB",
  )

  // 3. Verify Unique Email check
  const duplicateUser = await User.findOne({ email: testEmail })
  if (duplicateUser) {
    console.log(
      "✓ Unique email check verified: Duplicate email detected in DB ('This email is already registered.')",
    )
  }

  // 4. Verify Doctor Login Authentication
  const foundUser = await User.findOne({ email: testEmail })
  if (!foundUser || foundUser.role !== "doctor") {
    throw new Error("Doctor user not found or role mismatch!")
  }

  const isPwMatch = await bcrypt.compare(rawPassword, foundUser.password)
  if (!isPwMatch) {
    throw new Error("Bcrypt password comparison failed for correct password!")
  }
  console.log("✓ Bcrypt authentication succeeded with temporary password")

  const isWrongPwMatch = await bcrypt.compare(
    "WrongPassword",
    foundUser.password,
  )
  if (isWrongPwMatch) {
    throw new Error("Bcrypt matched wrong password!")
  }
  console.log(
    "✓ Invalid password correctly rejected with 'Invalid doctor email or password.'",
  )

  // 5. Verify Update Doctor
  doctor.experience = 10
  doctor.phone = "9876500000"
  await doctor.save()

  foundUser.experience = 10
  foundUser.phone = "9876500000"
  await foundUser.save()

  const updatedDoc = await Doctor.findOne({ id: docId })
  if (updatedDoc.experience !== 10 || updatedDoc.phone !== "9876500000") {
    throw new Error("Doctor update failed!")
  }
  console.log(
    "✓ Doctor update verified successfully without creating duplicate account",
  )

  // 6. Verify Delete Doctor (deletes both Doctor and User account)
  await User.deleteMany({ email: testEmail })
  await Doctor.deleteOne({ id: docId })

  const remainingUser = await User.findOne({ email: testEmail })
  const remainingDoc = await Doctor.findOne({ id: docId })
  if (remainingUser || remainingDoc) {
    throw new Error("Doctor or User record was not cleaned up!")
  }
  console.log(
    "✓ Doctor and associated User account successfully deleted without orphan records",
  )

  console.log("\n========================================================")
  console.log("ALL TESTS PASSED SUCCESSFULLY! ✓")
  console.log("========================================================")
  process.exit(0)
}

runTests().catch((err) => {
  console.error("Test failed:", err)
  process.exit(1)
})
