/**
 * MediSlot - MongoDB Assignment Script (TAE-2 Mini Project)
 * 
 * Instructions:
 * You can execute this script in:
 * 1. MongoDB Shell (mongosh): mongosh "your_connection_string" < tae2_mongodb_demo.js
 * 2. MongoDB Compass -> "Mongosh" tab at the bottom -> Paste commands section by section
 * 3. Or run via Node.js if using mongoose/mongodb driver
 */

// ==========================================
// 1. DATABASE CONNECTIVITY & SELECTION
// ==========================================
use medislot;

print(">>> Connected to database: medislot");

// ==========================================
// 2. DATA MODELING & INITIAL CLEANUP
// ==========================================
db.departments.drop();
db.doctors.drop();
db.users.drop();
db.appointments.drop();

print(">>> Cleaned previous collections for fresh demonstration.");

// ==========================================
// 3. CRUD OPERATIONS: CREATE (INSERT)
// ==========================================

// 3.1 Insert Many Departments
db.departments.insertMany([
  { id: "dept_1", name: "Cardiology", description: "Heart and cardiovascular care", doctorCount: 4 },
  { id: "dept_2", name: "Dermatology", description: "Skin, hair, and nail treatments", doctorCount: 3 },
  { id: "dept_3", name: "Orthopedics", description: "Bone, joint, and spine care", doctorCount: 5 },
  { id: "dept_4", name: "Neurology", description: "Brain and nervous system disorders", doctorCount: 3 }
]);

// 3.2 Insert One Admin and One Patient
db.users.insertOne({
  name: "Dr. Admin Controller",
  email: "admin@medislot.com",
  role: "admin",
  phone: "+91 99999 88888",
  status: "Active",
  createdAt: new Date()
});

// 3.3 Insert Many Doctors
db.doctors.insertMany([
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
    status: "Active"
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
    status: "Active"
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
    status: "Active"
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
    status: "Active"
  }
]);

// 3.4 Insert Sample Appointments (Demonstrating Embedded Documents)
db.appointments.insertMany([
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
    reason: "Chest discomfort and high blood pressure checkup",
    consultationDetails: {
      diagnosis: "Stage 1 Hypertension",
      prescription: "Amlodipine 5mg once daily",
      instructions: "Reduce sodium intake, 30 min daily walking",
      followUpDate: "2026-10-06"
    }
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
      followUpDate: "2027-03-20"
    }
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
    reason: "Skin allergy and rash on hands",
    consultationDetails: null
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
    reason: "Knee pain consultation (rescheduled by patient)",
    consultationDetails: null
  },
  {
    id: "APT-2026-105",
    appointmentId: "APT-2026-105",
    patientName: "Pooja Mehta",
    patientEmail: "pooja.m@example.com",
    patientPhone: "+91 98456 78901",
    doctorId: "d4",
    doctorName: "Dr. Vikram Patel",
    department: "Neurology",
    date: "2026-09-25",
    time: "03:30 PM",
    status: "confirmed",
    feePaid: 1200,
    reason: "Chronic Migraine Evaluation",
    consultationDetails: null
  }
]);

print(">>> Inserted sample records successfully.");

// ==========================================
// 4. CRUD OPERATIONS: READ / QUERY
// ==========================================

// 4.1 Simple Query: Find all active doctors
print("\n--- 4.1 Active Doctors ---");
db.doctors.find({ status: "Active" }).pretty();

// 4.2 Query with Comparison Operator: Doctors with experience >= 10 years
print("\n--- 4.2 Doctors with experience >= 10 ---");
db.doctors.find({ experience: { $gte: 10 } }, { name: 1, department: 1, experience: 1, fee: 1, _id: 0 });

// 4.3 Query with Logical Operator: Confirmed appointments in Cardiology or Neurology
print("\n--- 4.3 Confirmed Appointments in Cardiology or Neurology ---");
db.appointments.find({
  status: "confirmed",
  $or: [{ department: "Cardiology" }, { department: "Neurology" }]
}, { appointmentId: 1, patientName: 1, doctorName: 1, department: 1, date: 1, time: 1 });

// ==========================================
// 5. CRUD OPERATIONS: UPDATE
// ==========================================

// 5.1 Update One: Update doctor's rating and review count
print("\n--- 5.1 Update Doctor Rating ---");
db.doctors.updateOne(
  { id: "d1" },
  {
    $set: { rating: 4.9 },
    $inc: { reviewCount: 1 }
  }
);

// 5.2 Update Many: Mark all confirmed appointments for 2026-09-22 as in-progress
print("\n--- 5.2 Update Many Appointments Status ---");
db.appointments.updateMany(
  { date: "2026-09-22", status: "confirmed" },
  { $set: { status: "in-progress" } }
);

// ==========================================
// 6. CRUD OPERATIONS: DELETE
// ==========================================

// 6.1 Delete One: Remove cancelled appointment
print("\n--- 6.1 Delete Cancelled Appointment ---");
db.appointments.deleteOne({ appointmentId: "APT-2026-104" });

// ==========================================
// 7. AGGREGATION PIPELINES (ADVANCED COMMANDS)
// ==========================================

// 7.1 Pipeline 1: Count total appointments grouped by department
print("\n--- 7.1 Total Appointments by Department ---");
db.appointments.aggregate([
  {
    $group: {
      _id: "$department",
      totalAppointments: { $sum: 1 },
      totalRevenue: { $sum: "$feePaid" }
    }
  },
  { $sort: { totalAppointments: -1 } }
]);

// 7.2 Pipeline 2: Filter completed/confirmed appointments and group by Doctor with averages
print("\n--- 7.2 Appointments Summary by Doctor ---");
db.appointments.aggregate([
  {
    $match: {
      status: { $in: ["confirmed", "completed", "in-progress"] }
    }
  },
  {
    $group: {
      _id: "$doctorName",
      totalBookings: { $sum: 1 },
      totalCollectedFee: { $sum: "$feePaid" },
      avgFeePerVisit: { $avg: "$feePaid" }
    }
  },
  {
    $project: {
      doctorName: "$_id",
      totalBookings: 1,
      totalCollectedFee: 1,
      avgFeePerVisit: { $round: ["$avgFeePerVisit", 2] },
      _id: 0
    }
  },
  { $sort: { totalCollectedFee: -1 } }
]);

// 7.3 Pipeline 3: $lookup (Relational Join between Appointments and Doctors)
print("\n--- 7.3 Join Appointments with Doctors ($lookup) ---");
db.appointments.aggregate([
  {
    $lookup: {
      from: "doctors",
      localField: "doctorId",
      foreignField: "id",
      as: "doctorDetails"
    }
  },
  {
    $unwind: "$doctorDetails"
  },
  {
    $project: {
      appointmentId: 1,
      patientName: 1,
      doctorName: "$doctorDetails.name",
      doctorSpecialization: "$doctorDetails.specialization",
      doctorExperience: "$doctorDetails.experience",
      consultationDuration: "$doctorDetails.consultationDuration",
      appointmentDate: "$date",
      status: 1
    }
  }
]);

// 7.4 Pipeline 4: Appointment Status Distribution
print("\n--- 7.4 Appointment Status Distribution ---");
db.appointments.aggregate([
  {
    $group: {
      _id: "$status",
      count: { $sum: 1 }
    }
  },
  {
    $project: {
      status: "$_id",
      count: 1,
      _id: 0
    }
  }
]);

print("\n>>> All demonstration queries executed successfully!");
