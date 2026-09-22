// scripts/db/run_tae2_demo.mjs

import { connectToDatabase } from "../../lib/mongodb.js"

import mongoose from "mongoose"

async function runDemo() {
  console.log("===============================================================")

  console.log("  TAE-2 MINI PROJECT: MONGODB ASSIGNMENT DEMO (MEDISLOT)     ")

  console.log("===============================================================")

  console.log("\n[1] MONGODB DATABASE CONNECTIVITY")

  console.log("---------------------------------------------------------------")

  try {
    await connectToDatabase()

    console.log(">>> SUCCESS: Connected to MongoDB Database successfully!")

    console.log(">>> Database Name:", mongoose.connection.db.databaseName)

    console.log(
      ">>> Ready State:",
      mongoose.connection.readyState,
      "(1 = Connected)",
    )
  } catch (err) {
    console.error(">>> Connection notice:", err.message)

    console.log(
      ">>> Tip: Ensure MongoDB Atlas cluster is reachable or local mongod is running.",
    )

    process.exit(1)
  }

  const db = mongoose.connection.db

  console.log("\n[2] DATA MODELING IN MONGODB: INITIALIZING COLLECTIONS")

  console.log("---------------------------------------------------------------")

  // Clean demonstration collections

  try {
    await db.collection("departments").deleteMany({})

    await db.collection("doctors").deleteMany({})

    await db.collection("appointments").deleteMany({})

    console.log(
      ">>> Reset test collections: departments, doctors, appointments.",
    )
  } catch (e) {
    console.log("Collection reset notice:", e.message)
  }

  console.log("\n[3] CRUD OPERATIONS: INSERT (CREATE)")

  console.log("---------------------------------------------------------------")

  // 3.1 Insert Many Departments

  const deptResult = await db.collection("departments").insertMany([
    {
      id: "dept_1",
      name: "Cardiology",
      description: "Heart and cardiovascular care",
      doctorCount: 4,
    },

    {
      id: "dept_2",
      name: "Dermatology",
      description: "Skin, hair, and nail treatments",
      doctorCount: 3,
    },

    {
      id: "dept_3",
      name: "Orthopedics",
      description: "Bone, joint, and spine care",
      doctorCount: 5,
    },

    {
      id: "dept_4",
      name: "Neurology",
      description: "Brain and nervous system disorders",
      doctorCount: 3,
    },
  ])

  console.log(
    `[+] 3.1 insertMany(): Inserted ${deptResult.insertedCount} Departments`,
  )

  // 3.2 Insert Many Doctors

  const docResult = await db.collection("doctors").insertMany([
    {
      id: "d1",

      name: "Dr. Amit Sharma",

      email: "amitsharma@medislot.com",

      specialization: "Cardiologist",

      department: "Cardiology",

      experience: 8,

      rating: 4.8,

      reviewCount: 214,

      consultationDuration: 30,

      fee: 800,

      availableDays: ["Monday", "Tuesday", "Thursday", "Friday"],

      availableToday: true,

      status: "Active",
    },

    {
      id: "d2",

      name: "Dr. Priya Nair",

      email: "priyanair@medislot.com",

      specialization: "Dermatologist",

      department: "Dermatology",

      experience: 6,

      rating: 4.7,

      reviewCount: 178,

      consultationDuration: 20,

      fee: 650,

      availableDays: ["Monday", "Wednesday", "Friday"],

      availableToday: false,

      status: "Active",
    },

    {
      id: "d3",

      name: "Dr. Rajesh Kumar",

      email: "rajeshkumar@medislot.com",

      specialization: "Orthopedic Surgeon",

      department: "Orthopedics",

      experience: 12,

      rating: 4.9,

      reviewCount: 302,

      consultationDuration: 30,

      fee: 1000,

      availableDays: ["Tuesday", "Thursday", "Saturday"],

      availableToday: true,

      status: "Active",
    },

    {
      id: "d4",

      name: "Dr. Vikram Patel",

      email: "vikrampatel@medislot.com",

      specialization: "Neurologist",

      department: "Neurology",

      experience: 15,

      rating: 4.9,

      reviewCount: 189,

      consultationDuration: 45,

      fee: 1200,

      availableDays: ["Wednesday", "Thursday", "Friday"],

      availableToday: true,

      status: "Active",
    },
  ])

  console.log(
    `[+] 3.2 insertMany(): Inserted ${docResult.insertedCount} Doctors`,
  )

  // 3.3 Insert Appointments (With Embedded Consultation Details Document)

  const apptResult = await db.collection("appointments").insertMany([
    {
      id: "APT-2026-101",

      appointmentId: "APT-2026-101",

      patientName: "Adarsh Singh",

      patientEmail: "patient@medislot.com",

      patientPhone: "+91 98765 43210",

      doctorId: "d1",

      doctorName: "Dr. Amit Sharma",

      department: "Cardiology",

      date: "2026-09-22",

      time: "10:30 AM",

      status: "confirmed",

      feePaid: 800,

      reason: "Chest discomfort and BP checkup",

      consultationDetails: {
        diagnosis: "Stage 1 Hypertension",

        prescription: "Amlodipine 5mg once daily",

        instructions: "Reduce sodium intake, 30 min daily walking",

        followUpDate: "2026-10-06",
      },
    },

    {
      id: "APT-2026-102",

      appointmentId: "APT-2026-102",

      patientName: "Rohan Verma",

      patientEmail: "rohan.v@example.com",

      patientPhone: "+91 98123 45678",

      doctorId: "d1",

      doctorName: "Dr. Amit Sharma",

      department: "Cardiology",

      date: "2026-09-22",

      time: "11:00 AM",

      status: "completed",

      feePaid: 800,

      reason: "Routine ECG Review",

      consultationDetails: {
        diagnosis: "Normal Sinus Rhythm",

        prescription: "Multivitamins",

        instructions: "Annual health checkup recommended",

        followUpDate: "2027-03-20",
      },
    },

    {
      id: "APT-2026-103",

      appointmentId: "APT-2026-103",

      patientName: "Neha Gupta",

      patientEmail: "neha.g@example.com",

      patientPhone: "+91 97234 56789",

      doctorId: "d2",

      doctorName: "Dr. Priya Nair",

      department: "Dermatology",

      date: "2026-09-23",

      time: "02:00 PM",

      status: "confirmed",

      feePaid: 650,

      reason: "Skin allergy and rash",

      consultationDetails: null,
    },

    {
      id: "APT-2026-104",

      appointmentId: "APT-2026-104",

      patientName: "Sunil Joshi",

      patientEmail: "sunil.j@example.com",

      patientPhone: "+91 99345 67890",

      doctorId: "d3",

      doctorName: "Dr. Rajesh Kumar",

      department: "Orthopedics",

      date: "2026-09-24",

      time: "10:00 AM",

      status: "cancelled",

      feePaid: 0,

      reason: "Knee pain consultation",

      consultationDetails: null,
    },
  ])

  console.log(
    `[+] 3.3 insertMany(): Inserted ${apptResult.insertedCount} Appointments`,
  )

  console.log("\n[4] CRUD OPERATIONS: READ / QUERY")

  console.log("---------------------------------------------------------------")

  console.log(
    "Q1: Query Doctors with experience >= 10 years (Filtering & Projection):",
  )

  const experiencedDocs = await db
    .collection("doctors")
    .find(
      { experience: { $gte: 10 } },

      { projection: { name: 1, department: 1, experience: 1, fee: 1, _id: 0 } },
    )
    .toArray()

  console.table(experiencedDocs)

  console.log("\nQ2: Query Confirmed Appointments for Cardiology:")

  const cardAppts = await db
    .collection("appointments")
    .find(
      { department: "Cardiology", status: "confirmed" },

      {
        projection: {
          appointmentId: 1,
          patientName: 1,
          doctorName: 1,
          date: 1,
          time: 1,
          _id: 0,
        },
      },
    )
    .toArray()

  console.table(cardAppts)

  console.log("\n[5] CRUD OPERATIONS: UPDATE")

  console.log("---------------------------------------------------------------")

  const updateRes = await db.collection("doctors").updateOne(
    { id: "d1" },

    { $set: { rating: 4.95 }, $inc: { reviewCount: 1 } },
  )

  console.log(
    `[+] updateOne(): Updated rating and incremented review count for Dr. Amit Sharma (Modified: ${updateRes.modifiedCount})`,
  )

  console.log("\n[6] CRUD OPERATIONS: DELETE")

  console.log("---------------------------------------------------------------")

  const deleteRes = await db
    .collection("appointments")
    .deleteOne({ appointmentId: "APT-2026-104" })

  console.log(
    `[+] deleteOne(): Deleted cancelled appointment APT-2026-104 (Deleted: ${deleteRes.deletedCount})`,
  )

  console.log("\n[7] MONGODB AGGREGATION COMMANDS")

  console.log("---------------------------------------------------------------")

  console.log(
    "Pipeline 1: Total Appointments and Revenue Grouped by Department ($group & $sort):",
  )

  const aggDept = await db
    .collection("appointments")
    .aggregate([
      {
        $group: {
          _id: "$department",

          totalAppointments: { $sum: 1 },

          totalRevenue: { $sum: "$feePaid" },
        },
      },

      { $sort: { totalAppointments: -1 } },
    ])
    .toArray()

  console.table(aggDept)

  console.log(
    "\nPipeline 2: Relational Join ($lookup) between Appointments and Doctors:",
  )

  const aggJoin = await db
    .collection("appointments")
    .aggregate([
      {
        $lookup: {
          from: "doctors",

          localField: "doctorId",

          foreignField: "id",

          as: "doctorProfile",
        },
      },

      { $unwind: "$doctorProfile" },

      {
        $project: {
          appointmentId: 1,

          patientName: 1,

          doctorName: "$doctorProfile.name",

          specialization: "$doctorProfile.specialization",

          consultationDuration: "$doctorProfile.consultationDuration",

          status: 1,

          _id: 0,
        },
      },
    ])
    .toArray()

  console.table(aggJoin)

  console.log(
    "\nPipeline 3: Doctor Consultation Summary & Average Revenue ($match + $group + $project):",
  )

  const aggDoctorSummary = await db
    .collection("appointments")
    .aggregate([
      {
        $group: {
          _id: "$doctorName",

          totalPatients: { $sum: 1 },

          totalEarnings: { $sum: "$feePaid" },

          averageFee: { $avg: "$feePaid" },
        },
      },

      {
        $project: {
          doctorName: "$_id",

          totalPatients: 1,

          totalEarnings: 1,

          averageFee: { $round: ["$averageFee", 2] },

          _id: 0,
        },
      },
    ])
    .toArray()

  console.table(aggDoctorSummary)

  console.log(
    "\n===============================================================",
  )

  console.log("  DEMONSTRATION COMPLETE - ALL SECTIONS VERIFIED & READY      ")

  console.log("===============================================================")

  process.exit(0)
}

runDemo().catch((e) => {
  console.error("Demo failed with error:", e)

  process.exit(1)
})
