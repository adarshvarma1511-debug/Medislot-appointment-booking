// scripts/db/create_patient_appointment_atlas.mjs
import { connectToDatabase } from "../../lib/mongodb.js"
import mongoose from "mongoose"

async function createPatientAppointment() {
  console.log(
    "================================================================================",
  )
  console.log(
    "     CREATE OPERATION: BOOK APPOINTMENT FOR PATIENT IN MONGODB ATLAS            ",
  )
  console.log(
    "================================================================================\n",
  )

  await connectToDatabase()
  const db = mongoose.connection.db
  console.log(">>> Connected to Database: " + db.databaseName + "\n")

  const patient = await db
    .collection("users")
    .findOne({ email: "rahul.sharma@medislot.com" })
  if (!patient) {
    console.error("Patient not found. Run create_patient_atlas.mjs first.")
    process.exit(1)
  }

  const appointmentId = "APT-2026-777"
  await db.collection("appointments").deleteOne({ appointmentId })

  const appointmentDoc = {
    id: appointmentId,
    appointmentId: appointmentId,
    patientId: patient._id,
    patientName: patient.name,
    patientEmail: patient.email,
    patientPhone: patient.phone,
    doctorId: "d1",
    doctorName: "Dr. Amit Sharma",
    department: "Cardiology",
    specialization: "Cardiologist",
    date: "2026-09-25",
    time: "10:30 AM",
    status: "confirmed",
    feePaid: 800,
    reason: "Cardiovascular health examination & consultation",
    consultationDetails: {
      diagnosis: "Mild elevated blood pressure",
      prescription: "Lifestyle modifications, monitor blood pressure weekly",
      instructions: "Low sodium diet, brisk walking for 30 minutes",
      followUpDate: "2026-10-10",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  console.log(
    "--------------------------------------------------------------------------------",
  )
  console.log(">> 2.1 MONGODB APPOINTMENT INSERT QUERY:")
  console.log(
    "--------------------------------------------------------------------------------",
  )
  console.log(
    `db.appointments.insertOne(${JSON.stringify(appointmentDoc, null, 2)});\n`,
  )

  const res = await db.collection("appointments").insertOne(appointmentDoc)

  console.log(
    "--------------------------------------------------------------------------------",
  )
  console.log(">> 2.2 EXECUTION OUTPUT RETURNED BY MONGODB:")
  console.log(
    "--------------------------------------------------------------------------------",
  )
  console.log(
    JSON.stringify(
      { acknowledged: res.acknowledged, insertedId: res.insertedId },
      null,
      2,
    ) + "\n",
  )

  console.log(
    "--------------------------------------------------------------------------------",
  )
  console.log(
    ">> 2.3 DOCUMENT IN ATLAS 'appointments' COLLECTION (WITH EMBEDDED PRESCRIPTION):",
  )
  console.log(
    "--------------------------------------------------------------------------------",
  )
  const savedAppt = await db
    .collection("appointments")
    .findOne({ _id: res.insertedId })
  console.log(JSON.stringify(savedAppt, null, 2))

  console.log(
    "\n================================================================================",
  )
  console.log(">>> STATUS: Patient Appointment saved in MongoDB Atlas!")
  console.log(">>> Database: 'medislot' | Collection: 'appointments'")
  console.log(
    "================================================================================\n",
  )

  process.exit(0)
}

createPatientAppointment().catch((e) => {
  console.error("Error booking appointment:", e)
  process.exit(1)
})
