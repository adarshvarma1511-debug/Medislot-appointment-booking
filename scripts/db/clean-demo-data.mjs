// scripts/db/clean-demo-data.mjs
import { connectToDatabase } from "../../lib/mongodb.js"
import mongoose from "mongoose"
import bcrypt from "bcryptjs"

async function cleanData() {
  await connectToDatabase()
  const db = mongoose.connection.db

  console.log("--- Cleaning MongoDB demo data ---")

  // 1. Delete all demo doctors
  const docDel = await db.collection("doctors").deleteMany({})
  console.log("Deleted doctors count:", docDel.deletedCount)

  // 2. Delete all demo appointments
  const collections = await db.listCollections().toArray()
  if (collections.some((c) => c.name === "appointments")) {
    const apptDel = await db.collection("appointments").deleteMany({})
    console.log("Deleted appointments count:", apptDel.deletedCount)
  }

  // 3. Delete demo users (keep admin or any real accounts)
  const userDel = await db.collection("users").deleteMany({
    email: {
      $in: [
        "adarsh@example.com",
        "dr.amit@medislot.com",
        "amit.sharma@medislot.com",
        "adarsh.singh@gmail.com",
        "dr.amit.sharma@gmail.com",
        "aakash.verma@example.com",
      ],
    },
  })
  console.log("Deleted demo users count:", userDel.deletedCount)

  // 4. Ensure admin user exists with hashed password
  const adminEmail = "admin@medislot.com"
  const existingAdmin = await db
    .collection("users")
    .findOne({ email: adminEmail })
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 10)
    await db.collection("users").insertOne({
      name: "Hospital Administrator",
      email: adminEmail,
      password: hashedPassword,
      phone: "+91 99999 88888",
      role: "admin",
      avatar: "AD",
      createdAt: new Date(),
      lastLogin: new Date(),
    })
    console.log("Created clean Admin user: admin@medislot.com / admin123")
  } else {
    console.log("Admin user exists:", existingAdmin.email)
  }

  console.log("--- Cleanup finished successfully ---")
  process.exit(0)
}

cleanData().catch((err) => {
  console.error("Cleanup error:", err)
  process.exit(1)
})
