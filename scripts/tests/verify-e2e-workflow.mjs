// scripts/verify-e2e-workflow.mjs
// Automated verification for MediSlot MongoDB-backed workflow

const BASE_URL = process.env.TEST_URL || "http://localhost:8443"

async function runVerification() {
  console.log("=== STARTING MEDISLOT E2E VERIFICATION ===")
  console.log(`Target URL: ${BASE_URL}\n`)

  let testsPassed = 0
  let testsFailed = 0

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`)
      testsPassed++
    } else {
      console.error(`❌ FAIL: ${message}`)
      testsFailed++
      throw new Error(`Assertion failed: ${message}`)
    }
  }

  try {
    // 1. Database Health Check
    console.log("1. Checking MongoDB status...")
    const dbRes = await fetch(`${BASE_URL}/api/db-status`)
    const dbData = await dbRes.json()
    assert(
      dbData.connected === true,
      `MongoDB connected (${dbData.database || "medislot"})`,
    )

    // 2. Fetch doctors on patient side
    console.log("\n2. Fetching doctors from /api/doctors...")
    const initialDocsRes = await fetch(`${BASE_URL}/api/doctors`)
    const initialDocs = await initialDocsRes.json()
    assert(initialDocs.success === true, "Patient /api/doctors returns success")
    assert(Array.isArray(initialDocs.doctors), "/api/doctors returns an array")
    console.log(
      `Currently found ${initialDocs.doctors.length} doctors in MongoDB.`,
    )

    // 3. Admin creates a new doctor
    console.log("\n3. Admin adding Dr. Rajiv Nair via /api/admin/doctors...")
    const testDocEmail = `rajiv.nair.${Date.now()}@medislot.com`
    const addDocRes = await fetch(`${BASE_URL}/api/admin/doctors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Dr. Rajiv Nair",
        email: testDocEmail,
        phone: "+91 98111 22334",
        specialization: "Cardiologist",
        department: "Cardiology",
        experience: "12",
        consultationDuration: "30",
        hospital: "MediSlot Central Hospital",
        password: "DoctorPass123!",
        confirmPassword: "DoctorPass123!",
        availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        startTime: "10:00 AM",
        endTime: "01:00 PM",
      }),
    })
    const addDocData = await addDocRes.json()
    assert(
      addDocRes.ok && addDocData.success === true,
      "Doctor successfully created by Admin in MongoDB",
    )
    const createdDoctor = addDocData.doctor
    assert(
      createdDoctor && createdDoctor.name === "Dr. Rajiv Nair",
      "Doctor name matches Dr. Rajiv Nair",
    )
    const doctorId = createdDoctor.id
    console.log(`Created doctor ID: ${doctorId}, Email: ${testDocEmail}`)

    // 4. Doctor Login verification with credentials
    console.log("\n4. Verifying Doctor Login with created credentials...")
    const loginRes = await fetch(`${BASE_URL}/api/auth/doctor/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testDocEmail,
        password: "DoctorPass123!",
      }),
    })
    const loginData = await loginRes.json()
    assert(
      loginRes.ok && loginData.success === true,
      "Doctor login successful with hashed password verification",
    )
    assert(loginData.user.role === "doctor", "User role returned is 'doctor'")

    // 5. Patient Find Doctors verifies new doctor appears
    console.log("\n5. Verifying doctor appears in Patient Find Doctors...")
    const verifyDocRes = await fetch(`${BASE_URL}/api/doctors`)
    const verifyDocData = await verifyDocRes.json()
    const foundDoc = verifyDocData.doctors.find(
      (d) => d.email === testDocEmail || d.id === doctorId,
    )
    assert(
      !!foundDoc,
      "New doctor appears in Patient -> Find Doctors from MongoDB",
    )
    assert(foundDoc.experience === 12, "Doctor experience is 12 years")

    // 6. Doctor Availability Check
    console.log("\n6. Checking dynamic slot availability for doctor...")
    const testDate = new Date()
    testDate.setDate(testDate.getDate() + 1) // Tomorrow
    const dateStr = testDate.toISOString().split("T")[0]

    const availRes = await fetch(
      `${BASE_URL}/api/doctors/${doctorId}/availability?date=${dateStr}`,
    )
    const availData = await availRes.json()
    assert(
      availRes.ok && availData.success === true,
      "Doctor availability endpoint returned success",
    )
    assert(
      availData.slots && availData.slots.length > 0,
      `Generated ${availData.slots.length} time slots from shift hours`,
    )
    const availableSlots = availData.slots.filter(
      (s) => s.status === "Available",
    )
    assert(
      availableSlots.length === availData.slots.length,
      "All slots are initially Available",
    )
    const slotToBook = availableSlots[0].time
    console.log(`Slot selected for booking: ${slotToBook} on ${dateStr}`)

    // 7. Patient Books Appointment
    console.log("\n7. Patient booking appointment for slot...")
    const bookRes = await fetch(`${BASE_URL}/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId: doctorId,
        doctorName: "Dr. Rajiv Nair",
        department: "Cardiology",
        date: dateStr,
        time: slotToBook,
        patientName: "Aakash Verma",
        patientEmail: "aakash.verma@example.com",
        patientPhone: "+91 99887 76655",
        reason: "Routine cardiac screening",
      }),
    })
    const bookData = await bookRes.json()
    assert(
      bookRes.ok && bookData.success === true,
      "Appointment successfully booked in MongoDB",
    )
    const appointmentId =
      bookData.appointment.appointmentId || bookData.appointment.id
    assert(!!appointmentId, `Appointment created with ID: ${appointmentId}`)

    // 8. DOUBLE-BOOKING PREVENTION
    console.log("\n8. Testing STRICT DOUBLE-BOOKING PREVENTION...")
    const conflictRes = await fetch(`${BASE_URL}/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId: doctorId,
        doctorName: "Dr. Rajiv Nair",
        department: "Cardiology",
        date: dateStr,
        time: slotToBook, // EXACT SAME SLOT
        patientName: "Another Patient",
        patientEmail: "another@example.com",
        patientPhone: "+91 98765 00000",
        reason: "Duplicate attempt",
      }),
    })
    const conflictData = await conflictRes.json()
    assert(
      conflictRes.status === 409 || conflictData.success === false,
      `Double booking strictly rejected with code ${conflictRes.status}: "${conflictData.error || conflictData.message}"`,
    )

    // 9. Verify slot is now marked 'Booked' in Availability API
    console.log(
      "\n9. Verifying slot status in Availability API after booking...",
    )
    const reAvailRes = await fetch(
      `${BASE_URL}/api/doctors/${doctorId}/availability?date=${dateStr}`,
    )
    const reAvailData = await reAvailRes.json()
    const bookedSlot = reAvailData.slots.find((s) => s.time === slotToBook)
    assert(
      bookedSlot && bookedSlot.status === "Booked",
      `Slot ${slotToBook} is now flagged as 'Booked'`,
    )

    // 10. Doctor Dashboard fetches appointment
    console.log("\n10. Doctor Dashboard fetching appointments...")
    const docApptsRes = await fetch(
      `${BASE_URL}/api/doctor/appointments?email=${encodeURIComponent(testDocEmail)}&doctorId=${encodeURIComponent(doctorId)}`,
    )
    const docApptsData = await docApptsRes.json()
    assert(
      docApptsRes.ok && docApptsData.success === true,
      "Doctor appointments endpoint responded OK",
    )
    const foundDocAppt = docApptsData.appointments.find(
      (a) => a.appointmentId === appointmentId || a.id === appointmentId,
    )
    assert(!!foundDocAppt, "Doctor received the booked appointment in queue")

    // 11. Doctor marks appointment as Completed with prescription
    console.log(
      "\n11. Doctor marking appointment as Completed with prescription notes...",
    )
    const statusRes = await fetch(
      `${BASE_URL}/api/appointments/${appointmentId}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          consultationDetails: {
            diagnosis: "Mild hypertension, resting heart rate normal",
            prescription: "Telmisartan 40mg once daily in morning",
            instructions: "Low sodium diet, brisk walking 30 mins daily",
            followUpDate: "2026-10-16",
          },
        }),
      },
    )
    const statusData = await statusRes.json()
    assert(
      statusRes.ok && statusData.success === true,
      "Appointment status updated to completed with prescription notes",
    )
    assert(
      statusData.appointment.status === "completed",
      "Status is confirmed 'completed'",
    )
    assert(
      statusData.appointment.consultationDetails?.prescription?.includes(
        "Telmisartan",
      ),
      "Prescription saved",
    )

    // 12. Patient views completed appointment in My Appointments
    console.log(
      "\n12. Patient My Appointments checking consultation details...",
    )
    const patApptRes = await fetch(
      `${BASE_URL}/api/patient/appointments?email=aakash.verma@example.com`,
    )
    const patApptData = await patApptRes.json()
    assert(
      patApptRes.ok && patApptData.success === true,
      "Patient appointments retrieved",
    )
    const foundPatAppt = patApptData.appointments.find(
      (a) => a.appointmentId === appointmentId || a.id === appointmentId,
    )
    assert(
      foundPatAppt && foundPatAppt.status === "completed",
      "Patient sees appointment marked 'completed'",
    )

    // 13. Admin Appointments listing verification
    console.log("\n13. Admin Appointments list verification...")
    const adminApptsRes = await fetch(`${BASE_URL}/api/appointments`)
    const adminApptsData = await adminApptsRes.json()
    assert(
      adminApptsRes.ok && adminApptsData.success === true,
      "Admin appointments endpoint returned success",
    )
    const foundAdminAppt = adminApptsData.appointments.find(
      (a) => a.appointmentId === appointmentId || a.id === appointmentId,
    )
    assert(
      !!foundAdminAppt,
      "Admin sees the appointment in complete hospital registry",
    )

    // 14. Booking second slot and cancelling to free up slot
    console.log("\n14. Testing Appointment Cancellation and slot liberation...")
    const secondSlot = availableSlots[1].time
    const book2Res = await fetch(`${BASE_URL}/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId: doctorId,
        doctorName: "Dr. Rajiv Nair",
        department: "Cardiology",
        date: dateStr,
        time: secondSlot,
        patientName: "Aakash Verma",
        patientEmail: "aakash.verma@example.com",
        patientPhone: "+91 99887 76655",
        reason: "Follow up check",
      }),
    })
    const book2Data = await book2Res.json()
    const appt2Id =
      book2Data.appointment.appointmentId || book2Data.appointment.id
    assert(!!appt2Id, "Second appointment booked")

    // Cancel the second appointment
    const cancelRes = await fetch(
      `${BASE_URL}/api/appointments/${appt2Id}/cancel`,
      {
        method: "PATCH",
      },
    )
    const cancelData = await cancelRes.json()
    assert(
      cancelRes.ok && cancelData.success === true,
      "Appointment cancelled successfully",
    )

    // Check availability again - secondSlot must be Available now!
    const freeAvailRes = await fetch(
      `${BASE_URL}/api/doctors/${doctorId}/availability?date=${dateStr}`,
    )
    const freeAvailData = await freeAvailRes.json()
    const freedSlot = freeAvailData.slots.find((s) => s.time === secondSlot)
    assert(
      freedSlot && freedSlot.status === "Available",
      `Cancelled slot ${secondSlot} is immediately Available again!`,
    )

    console.log("\n==========================================")
    console.log(`🎉 ALL TESTS PASSED! (${testsPassed} / ${testsPassed})`)
    console.log("==========================================")
  } catch (err) {
    console.error("\n❌ VERIFICATION STOPPED DUE TO ERROR:", err.message)
    process.exit(1)
  }
}

runVerification()
