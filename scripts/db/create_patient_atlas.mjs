// scripts/db/create_patient_atlas.mjs
import { connectToDatabase } from "../../lib/mongodb.js"
import mongoose from "mongoose"
import bcrypt from "bcryptjs"

async function createPatientInAtlas() {
  console.log(
    "================================================================================",
  )
  console.log(
    "            CREATE OPERATION: REGISTER NEW PATIENT IN MONGODB ATLAS            ",
  )
  console.log(
    "================================================================================\n",
  )

  console.log("[1] Connecting to MongoDB Atlas cluster...")
  await connectToDatabase()
  const db = mongoose.connection.db
  console.log(">>> SUCCESS: Connected to Database: " + db.databaseName + "\n")

  const patientEmail = "rahul.sharma@medislot.com"

  // 1. Remove if already exists so script can be re-run safely
  await db.collection("users").deleteOne({ email: patientEmail })

  // 2. Hash patient password securely
  const plainPassword = "Patient@123"
  const hashedPassword = await bcrypt.hash(plainPassword, 10)

  const patientDocument = {
    name: "Rahul Sharma",
    email: patientEmail,
    password: hashedPassword,
    phone: "+91 98765 12345",
    role: "patient",
    avatar: "RS",
    provider: "email",
    authProvider: "email",
    status: "Active",
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  console.log(
    "--------------------------------------------------------------------------------",
  )
  console.log(">> 1.1 MONGODB INSERT QUERY:")
  console.log(
    "--------------------------------------------------------------------------------",
  )
  console.log(`db.users.insertOne({
  name: "Rahul Sharma",
  email: "${patientEmail}",
  password: "<bcrypt_hashed_password>",
  phone: "+91 98765 12345",
  role: "patient",
  avatar: "RS",
  status: "Active",
  createdAt: new Date()
});\n`)

  console.log("Inserting patient document into 'users' collection in Atlas...")
  const result = await db.collection("users").insertOne(patientDocument)

  console.log(
    "--------------------------------------------------------------------------------",
  )
  console.log(">> 1.2 EXECUTION OUTPUT RETURNED BY MONGODB:")
  console.log(
    "--------------------------------------------------------------------------------",
  )
  console.log(
    JSON.stringify(
      {
        acknowledged: result.acknowledged,
        insertedId: result.insertedId,
      },
      null,
      2,
    ) + "\n",
  )

  console.log(
    "--------------------------------------------------------------------------------",
  )
  console.log(
    ">> 1.3 DOCUMENT AS STORED LIVE IN MONGODB ATLAS (COLLECTION: 'users'):",
  )
  console.log(
    "--------------------------------------------------------------------------------",
  )
  const savedPatient = await db
    .collection("users")
    .findOne({ _id: result.insertedId })
  console.log(JSON.stringify(savedPatient, null, 2))

  console.log(
    "\n================================================================================",
  )
  console.log(
    ">>> STATUS: Patient account successfully created and saved in MongoDB Atlas!",
  )
  console.log(">>> Database: 'medislot'")
  console.log(">>> Collection: 'users'")
  console.log(">>> Email: " + patientEmail)
  console.log(">>> Login Password: " + plainPassword)
  console.log(
    "================================================================================\n",
  )

  process.exit(0)
}

createPatientInAtlas().catch((err) => {
  console.error("Patient creation failed:", err)
  process.exit(1)
})
