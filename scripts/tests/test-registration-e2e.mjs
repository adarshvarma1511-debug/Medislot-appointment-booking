// scripts/test-registration-e2e.mjs
// Test registration and verification that all data is saved in MongoDB

const BASE_URL = process.env.TEST_URL || "http://localhost:8443"

async function testRegistrationFlow() {
  console.log("=== VERIFYING REGISTRATION & DATABASE PERSISTENCE ===")
  console.log(`Target URL: ${BASE_URL}\n`)

  let testsPassed = 0

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`)
      testsPassed++
    } else {
      console.error(`❌ FAIL: ${message}`)
      throw new Error(`Assertion failed: ${message}`)
    }
  }

  try {
    // 1. Check DB Health
    console.log("1. Checking DB connection...")
    const dbRes = await fetch(`${BASE_URL}/api/db-status`)
    const dbData = await dbRes.json()
    assert(dbData.connected === true, `MongoDB connected (${dbData.database})`)

    // 2. Register Patient
    console.log("\n2. Registering Patient: Sunil Sharma...")
    const patientEmail = `sunil.${Date.now()}@testmail.com`
    const regPatientRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Sunil Sharma",
        email: patientEmail,
        password: "PatientPassword123!",
        phone: "+91 91234 56789",
        role: "patient",
      }),
    })
    const regPatientData = await regPatientRes.json()
    assert(
      regPatientRes.status === 201 && regPatientData.success === true,
      "Patient registered successfully",
    )
    assert(
      regPatientData.user && regPatientData.user.email === patientEmail,
      "Patient email matches in MongoDB response",
    )
    assert(regPatientData.user.role === "patient", "Role is 'patient'")
    const patientId = regPatientData.user.id || regPatientData.user._id
    console.log(`Created Patient in MongoDB ID: ${patientId}`)

    // 3. Authenticate Registered Patient
    console.log("\n3. Testing Patient Login with created credentials...")
    const loginPatRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: patientEmail,
        password: "PatientPassword123!",
        role: "patient",
      }),
    })
    const loginPatData = await loginPatRes.json()
    assert(
      loginPatRes.ok && loginPatData.success === true,
      "Patient logged in with hashed password verification",
    )

    // 4. Register Doctor
    console.log("\n4. Registering Doctor: Dr. Kavita Deshmukh...")
    const doctorEmail = `dr.kavita.${Date.now()}@testmail.com`
    const regDocRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Dr. Kavita Deshmukh",
        email: doctorEmail,
        password: "DoctorPassword456!",
        phone: "+91 98765 22334",
        role: "doctor",
        specialization: "Neurologist",
        department: "Neurology",
        hospital: "MediSlot Super Specialty",
        experience: 11,
        availableDays: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        startTime: "09:00 AM",
        endTime: "01:00 PM",
      }),
    })
    const regDocData = await regDocRes.json()
    assert(
      regDocRes.status === 201 && regDocData.success === true,
      "Doctor registered successfully and saved in MongoDB",
    )
    assert(
      regDocData.user && regDocData.user.specialization === "Neurologist",
      "Specialization saved as Neurologist",
    )
    const doctorId = regDocData.user.doctorId
    console.log(
      `Created Doctor in MongoDB DoctorId: ${doctorId}, Email: ${doctorEmail}`,
    )

    // 5. Authenticate Registered Doctor
    console.log("\n5. Testing Doctor Login with created credentials...")
    const loginDocRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: doctorEmail,
        password: "DoctorPassword456!",
        role: "doctor",
      }),
    })
    const loginDocData = await loginDocRes.json()
    assert(
      loginDocRes.ok && loginDocData.success === true,
      "Doctor authenticated successfully",
    )
    assert(
      loginDocData.user.role === "doctor",
      "User role returned is 'doctor'",
    )

    // 6. Verify Doctor appears in Patient Find Doctors
    console.log("\n6. Verifying Doctor appears in /api/doctors...")
    const docsRes = await fetch(`${BASE_URL}/api/doctors`)
    const docsData = await docsRes.json()
    const foundDoc = docsData.doctors.find(
      (d) => d.email === doctorEmail || d.id === doctorId,
    )
    assert(!!foundDoc, "New doctor appears in Patient directory")
    assert(
      foundDoc.experience === 11,
      "Doctor experience is 11 years in MongoDB",
    )
    assert(
      foundDoc.hospital === "MediSlot Super Specialty",
      "Hospital name saved correctly",
    )

    // 7. Verify dynamic slots from registered shift hours (09:00 AM - 01:00 PM)
    console.log(
      "\n7. Checking dynamic slot generation for registered doctor...",
    )
    const testDate = new Date()
    testDate.setDate(testDate.getDate() + 2)
    const dateStr = testDate.toISOString().split("T")[0]
    const availRes = await fetch(
      `${BASE_URL}/api/doctors/${doctorId}/availability?date=${dateStr}`,
    )
    const availData = await availRes.json()
    assert(
      availRes.ok && availData.success === true,
      "Availability endpoint returned slots",
    )
    assert(
      availData.slots && availData.slots.length >= 6,
      `Generated ${availData.slots.length} time slots`,
    )
    const firstSlot = availData.slots[0].time

    // 8. Patient books appointment with registered doctor
    console.log(`\n8. Booking appointment for ${firstSlot} on ${dateStr}...`)
    const bookRes = await fetch(`${BASE_URL}/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId: doctorId,
        doctorName: "Dr. Kavita Deshmukh",
        department: "Neurology",
        date: dateStr,
        time: firstSlot,
        patientId: patientId,
        patientName: "Sunil Sharma",
        patientEmail: patientEmail,
        patientPhone: "+91 91234 56789",
        reason: "Persistent migraine checkup",
      }),
    })
    const bookData = await bookRes.json()
    if (!bookRes.ok || !bookData.success) {
      console.error("Booking failed response:", bookRes.status, bookData)
    }
    assert(
      bookRes.ok && bookData.success === true,
      "Appointment booked and stored in MongoDB",
    )
    const apptId = bookData.appointment.appointmentId || bookData.appointment.id

    // 9. Doctor dashboard loads appointment
    console.log(
      "\n9. Doctor fetching appointments from /api/doctor/appointments...",
    )
    const docApptsRes = await fetch(
      `${BASE_URL}/api/doctor/appointments?email=${encodeURIComponent(doctorEmail)}&doctorId=${encodeURIComponent(doctorId)}`,
    )
    const docApptsData = await docApptsRes.json()
    assert(
      docApptsRes.ok && docApptsData.success === true,
      "Doctor appointments endpoint OK",
    )
    const docAppt = docApptsData.appointments.find(
      (a) => a.appointmentId === apptId || a.id === apptId,
    )
    assert(!!docAppt, "Doctor found appointment in queue")

    // 10. Doctor completes consultation
    console.log("\n10. Doctor completing consultation...")
    const completeRes = await fetch(
      `${BASE_URL}/api/appointments/${apptId}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          consultationDetails: {
            diagnosis: "Tension headache & stress-induced migraine",
            prescription: "Naproxen 500mg as needed, Magnesium 400mg daily",
            instructions: "Stay hydrated, regular sleep schedule",
            followUpDate: "2026-10-25",
          },
        }),
      },
    )
    const completeData = await completeRes.json()
    assert(
      completeRes.ok && completeData.success === true,
      "Consultation marked completed in MongoDB",
    )

    // 11. Patient views completed appointment in My Appointments
    console.log(
      "\n11. Patient verifying appointment in /api/patient/appointments...",
    )
    const patApptsRes = await fetch(
      `${BASE_URL}/api/patient/appointments?email=${encodeURIComponent(patientEmail)}&patientId=${encodeURIComponent(patientId)}`,
    )
    const patApptsData = await patApptsRes.json()
    const patAppt = patApptsData.appointments.find(
      (a) => a.appointmentId === apptId || a.id === apptId,
    )
    assert(
      patAppt && patAppt.status === "completed",
      "Patient sees appointment marked completed",
    )
    assert(
      patAppt.consultationDetails?.prescription?.includes("Naproxen"),
      "Patient sees prescription",
    )

    // 12. Verify non-existent user rejected without auto-provisioning
    console.log("\n12. Verifying fake user login is rejected...")
    const fakeRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nonexistent.fake@user.com",
        password: "randompassword123",
        role: "patient",
      }),
    })
    assert(fakeRes.status === 401, "Non-existent user rejected with HTTP 401")

    console.log("\n==========================================")
    console.log(
      `🎉 ALL ${testsPassed} REGISTRATION & PERSISTENCE TESTS PASSED!`,
    )
    console.log("==========================================")
  } catch (err) {
    console.error("\n❌ TEST STOPPED DUE TO ERROR:", err.message)
    process.exit(1)
  }
}

testRegistrationFlow()
