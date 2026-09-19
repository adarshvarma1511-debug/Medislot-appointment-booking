import assert from "node:assert"

const BASE_URL = process.env.TEST_URL || "http://localhost:8443"

let testsPassed = 0
let testsFailed = 0

function pass(name) {
  console.log(`✅ PASS: ${name}`)
  testsPassed++
}

function fail(name, err) {
  console.error(`❌ FAIL: ${name}`, err)
  testsFailed++
  throw err
}

async function loginUser(email, password, role) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  })
  const data = await res.json()
  assert.strictEqual(res.status, 200, `Login failed for ${email}: ${data.error || res.statusText}`)
  assert.strictEqual(data.success, true, `Login unsuccessful for ${email}`)

  const setCookie = res.headers.get("set-cookie") || ""
  const tokenMatch = setCookie.match(/medislot_token=([^;]+)/)
  const token = tokenMatch ? tokenMatch[1] : data.token

  return {
    user: data.user,
    token,
    cookie: `medislot_token=${token}`,
  }
}

async function run() {
  console.log("==================================================")
  console.log("MEDISLOT IN-APP NOTIFICATION SYSTEM TEST SUITE")
  console.log("==================================================\n")

  // Ensure database seeded
  await fetch(`${BASE_URL}/api/seed`, { method: "POST" })

  // 1. Authenticate test actors
  console.log("Authenticating Patient, Doctor, and Admin actors...")
  const patient = await loginUser("patient@medislot.com", "patient123", "patient")
  const doctor = await loginUser("amitsharma@medislot.com", "doctor123", "doctor")
  const admin = await loginUser("admin@medislot.com", "admin123", "admin")
  console.log("Actors authenticated successfully.\n")

  // ----------------------------------------------------
  // TEST 1: Patient books appointment
  // Expected:
  // Patient receives "Appointment Booked"
  // Doctor receives "New Appointment"
  // Admin receives "New Appointment"
  // ----------------------------------------------------
  console.log("Executing TEST 1: Patient books appointment...")
  const uniqueDate = `2026-10-${String(Math.floor(Math.random() * 20) + 10)}`
  const uniqueTime = "10:30 AM"

  const bookRes = await fetch(`${BASE_URL}/api/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: patient.cookie,
    },
    body: JSON.stringify({
      patientId: patient.user.id || patient.user._id,
      patientName: patient.user.name || "Adarsh Singh",
      patientEmail: patient.user.email,
      patientPhone: "+91 98765 43210",
      doctorId: "d1",
      doctorName: "Dr. Amit Sharma",
      department: "Cardiology",
      specialization: "Cardiologist",
      date: uniqueDate,
      time: uniqueTime,
      reason: "Heart rate monitoring and routine ECG checkup",
      status: "confirmed",
    }),
  })

  const bookData = await bookRes.json()
  assert.strictEqual(bookRes.status, 201, `Booking failed: ${bookData.message || bookData.error}`)
  const appt1 = bookData.appointment
  assert(appt1 && appt1.id, "Appointment created with ID")

  // Verify Patient Notification
  const patNotifsRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: patient.cookie },
  })
  const patNotifsData = await patNotifsRes.json()
  assert(patNotifsData.success, "Patient notifications fetch succeeded")
  const patBookingNotif = patNotifsData.notifications.find(
    (n) => n.relatedId === appt1.id || n.relatedId === appt1.appointmentId,
  )
  assert(patBookingNotif, "Patient received notification for booked appointment")
  assert.strictEqual(patBookingNotif.title, "Appointment Booked")
  assert(patBookingNotif.message.includes("Your appointment with Dr. Amit Sharma has been booked successfully."))
  assert.strictEqual(patBookingNotif.isRead, false)

  // Verify Doctor Notification
  const docNotifsRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: doctor.cookie },
  })
  const docNotifsData = await docNotifsRes.json()
  assert(docNotifsData.success, "Doctor notifications fetch succeeded")
  const docBookingNotif = docNotifsData.notifications.find(
    (n) => n.relatedId === appt1.id || n.relatedId === appt1.appointmentId,
  )
  assert(docBookingNotif, "Doctor received notification for new appointment")
  assert.strictEqual(docBookingNotif.title, "New Appointment")
  assert(docBookingNotif.message.includes("You have received a new appointment from"))

  // Verify Admin Notification
  const adminNotifsRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: admin.cookie },
  })
  const adminNotifsData = await adminNotifsRes.json()
  assert(adminNotifsData.success, "Admin notifications fetch succeeded")
  const adminBookingNotif = adminNotifsData.notifications.find(
    (n) => (n.relatedId === appt1.id || n.relatedId === appt1.appointmentId) && n.type === "new_appointment",
  )
  assert(adminBookingNotif, "Admin received notification for new appointment")
  assert.strictEqual(adminBookingNotif.title, "New Appointment")
  assert.strictEqual(adminBookingNotif.message, "A new appointment has been booked.")
  pass("TEST 1: Patient books appointment -> Patient, Doctor, Admin all received correct notifications.")

  // ----------------------------------------------------
  // TEST 2: Doctor confirms appointment
  // Expected: Patient receives "Appointment Confirmed"
  // ----------------------------------------------------
  console.log("\nExecuting TEST 2: Doctor confirms appointment...")
  const confirmRes = await fetch(`${BASE_URL}/api/appointments/${appt1.id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: doctor.cookie,
    },
    body: JSON.stringify({ status: "confirmed" }),
  })
  const confirmData = await confirmRes.json()
  assert.strictEqual(confirmRes.status, 200, `Doctor confirmation failed: ${confirmData.error}`)

  const patNotifsAfterConfirm = await (
    await fetch(`${BASE_URL}/api/notifications`, { headers: { Cookie: patient.cookie } })
  ).json()
  const patConfirmNotif = patNotifsAfterConfirm.notifications.find(
    (n) => n.type === "appointment_confirmed" && (n.relatedId === appt1.id || n.relatedId === appt1.appointmentId),
  )
  assert(patConfirmNotif, "Patient received 'Appointment Confirmed' notification")
  assert.strictEqual(patConfirmNotif.title, "Appointment Confirmed")
  assert(patConfirmNotif.message.includes("Your appointment with Dr. Amit Sharma has been confirmed."))
  pass("TEST 2: Doctor confirms appointment -> Patient received 'Appointment Confirmed' notification.")

  // ----------------------------------------------------
  // TEST 3: Doctor cancels appointment
  // Expected: Patient receives "Appointment Cancelled"
  // ----------------------------------------------------
  console.log("\nExecuting TEST 3: Doctor cancels appointment...")
  const docCancelRes = await fetch(`${BASE_URL}/api/appointments/${appt1.id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: doctor.cookie,
    },
    body: JSON.stringify({ status: "cancelled" }),
  })
  const docCancelData = await docCancelRes.json()
  assert.strictEqual(docCancelRes.status, 200, "Cancel by doctor succeeded")

  const patNotifsAfterDocCancel = await (
    await fetch(`${BASE_URL}/api/notifications`, { headers: { Cookie: patient.cookie } })
  ).json()
  const patCancelNotif = patNotifsAfterDocCancel.notifications.find(
    (n) => n.type === "appointment_cancelled" && (n.relatedId === appt1.id || n.relatedId === appt1.appointmentId),
  )
  assert(patCancelNotif, "Patient received 'Appointment Cancelled' notification from doctor cancellation")
  assert.strictEqual(patCancelNotif.title, "Appointment Cancelled")
  assert(patCancelNotif.message.includes("Your appointment with Dr. Amit Sharma has been cancelled."))
  pass("TEST 3: Doctor cancels appointment -> Patient received 'Appointment Cancelled'.")

  // ----------------------------------------------------
  // TEST 4: Patient cancels appointment
  // Expected: Doctor receives "Appointment Cancelled", Admin receives "Appointment Cancelled"
  // ----------------------------------------------------
  console.log("\nExecuting TEST 4: Patient cancels appointment...")
  // Book appointment 2
  const appt2Res = await fetch(`${BASE_URL}/api/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: patient.cookie,
    },
    body: JSON.stringify({
      patientId: patient.user.id || patient.user._id,
      patientName: patient.user.name || "Adarsh Singh",
      patientEmail: patient.user.email,
      doctorId: "d1",
      doctorName: "Dr. Amit Sharma",
      department: "Cardiology",
      specialization: "Cardiologist",
      date: `2026-10-${String(Math.floor(Math.random() * 20) + 10)}`,
      time: "11:00 AM",
      reason: "Follow up consultation",
      status: "confirmed",
    }),
  })
  const appt2 = (await appt2Res.json()).appointment
  assert(appt2 && appt2.id, "Second appointment booked for cancellation test")

  // Patient cancels appointment 2
  const patCancelRes = await fetch(`${BASE_URL}/api/appointments/${appt2.id}/cancel`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: patient.cookie,
    },
  })
  assert.strictEqual(patCancelRes.status, 200, "Patient cancel request succeeded")

  // Doctor checks notification
  const docNotifsAfterPatCancel = await (
    await fetch(`${BASE_URL}/api/notifications`, { headers: { Cookie: doctor.cookie } })
  ).json()
  const docCancelledNotif = docNotifsAfterPatCancel.notifications.find(
    (n) => n.type === "appointment_cancelled" && (n.relatedId === appt2.id || n.relatedId === appt2.appointmentId),
  )
  assert(docCancelledNotif, "Doctor received 'Appointment Cancelled' when patient cancelled")
  assert.strictEqual(docCancelledNotif.title, "Appointment Cancelled")
  assert(docCancelledNotif.message.includes("has cancelled an appointment."))

  // Admin checks notification
  const adminNotifsAfterPatCancel = await (
    await fetch(`${BASE_URL}/api/notifications`, { headers: { Cookie: admin.cookie } })
  ).json()
  const adminCancelledNotif = adminNotifsAfterPatCancel.notifications.find(
    (n) => n.type === "appointment_cancelled" && (n.relatedId === appt2.id || n.relatedId === appt2.appointmentId),
  )
  assert(adminCancelledNotif, "Admin received 'Appointment Cancelled' when appointment was cancelled")
  assert.strictEqual(adminCancelledNotif.title, "Appointment Cancelled")
  assert.strictEqual(adminCancelledNotif.message, "An appointment has been cancelled.")
  pass("TEST 4: Patient cancels appointment -> Doctor and Admin both received 'Appointment Cancelled'.")

  // ----------------------------------------------------
  // TEST 5: Appointment is completed
  // Expected: Patient receives "Appointment Completed"
  // ----------------------------------------------------
  console.log("\nExecuting TEST 5: Appointment is completed...")
  const appt3Res = await fetch(`${BASE_URL}/api/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: patient.cookie,
    },
    body: JSON.stringify({
      patientId: patient.user.id || patient.user._id,
      patientName: patient.user.name || "Adarsh Singh",
      patientEmail: patient.user.email,
      doctorId: "d1",
      doctorName: "Dr. Amit Sharma",
      department: "Cardiology",
      specialization: "Cardiologist",
      date: `2026-10-${String(Math.floor(Math.random() * 20) + 10)}`,
      time: "11:30 AM",
      reason: "Completed consultation test",
      status: "confirmed",
    }),
  })
  const appt3 = (await appt3Res.json()).appointment
  assert(appt3 && appt3.id, "Third appointment created")

  const completeRes = await fetch(`${BASE_URL}/api/appointments/${appt3.id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: doctor.cookie,
    },
    body: JSON.stringify({
      status: "completed",
      consultationDetails: {
        diagnosis: "Normal healthy sinus rhythm",
        prescription: "Tab Atorvastatin 10mg OD",
        instructions: "Maintain light diet and exercise",
      },
    }),
  })
  assert.strictEqual(completeRes.status, 200, "Complete status update succeeded")

  const patNotifsAfterComplete = await (
    await fetch(`${BASE_URL}/api/notifications`, { headers: { Cookie: patient.cookie } })
  ).json()
  const patCompleteNotif = patNotifsAfterComplete.notifications.find(
    (n) => n.type === "appointment_completed" && (n.relatedId === appt3.id || n.relatedId === appt3.appointmentId),
  )
  assert(patCompleteNotif, "Patient received 'Appointment Completed' notification")
  assert.strictEqual(patCompleteNotif.title, "Appointment Completed")
  assert(patCompleteNotif.message.includes("Your appointment with Dr. Amit Sharma has been marked as completed."))
  pass("TEST 5: Appointment completed -> Patient received 'Appointment Completed'.")

  // ----------------------------------------------------
  // TEST 6: New patient registers
  // Expected: Admin receives "New Patient Registered"
  // ----------------------------------------------------
  console.log("\nExecuting TEST 6: New patient registers...")
  const randNum = Math.floor(Math.random() * 90000) + 10000
  const newPatientEmail = `testpatient_${randNum}@example.com`
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `Test Patient ${randNum}`,
      email: newPatientEmail,
      password: "TestPassword123!",
      role: "patient",
    }),
  })
  assert.strictEqual(regRes.status, 201, "Patient registered successfully")
  const regData = await regRes.json()

  const adminNotifsAfterReg = await (
    await fetch(`${BASE_URL}/api/notifications`, { headers: { Cookie: admin.cookie } })
  ).json()
  const newPatientNotif = adminNotifsAfterReg.notifications.find(
    (n) => n.type === "patient_registered" && n.relatedId === regData.user.id,
  )
  assert(newPatientNotif, "Admin received 'New Patient Registered' notification")
  assert.strictEqual(newPatientNotif.title, "New Patient Registered")
  assert.strictEqual(newPatientNotif.message, "A new patient has registered in MediSlot.")
  pass("TEST 6: New patient registers -> Admin received 'New Patient Registered'.")

  // ----------------------------------------------------
  // TEST 7: Admin adds doctor
  // Expected: Admin receives "New Doctor Added"
  // ----------------------------------------------------
  console.log("\nExecuting TEST 7: Admin adds doctor...")
  const newDocEmail = `drsuresh_${randNum}@medislot.com`
  const addDocRes = await fetch(`${BASE_URL}/api/admin/doctors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Dr. Suresh Reddy",
      email: newDocEmail,
      phone: "+91 91234 56789",
      specialization: "Neurologist",
      department: "Neurology",
      experience: "10",
      consultationDuration: "30",
      hospital: "MediSlot City Hospital",
      password: "DoctorPassword123!",
      confirmPassword: "DoctorPassword123!",
    }),
  })
  assert.strictEqual(addDocRes.status, 201, "Admin added doctor successfully")
  const addDocData = await addDocRes.json()

  const adminNotifsAfterDoc = await (
    await fetch(`${BASE_URL}/api/notifications`, { headers: { Cookie: admin.cookie } })
  ).json()
  const newDocNotif = adminNotifsAfterDoc.notifications.find(
    (n) => n.type === "doctor_added" && (n.relatedId === addDocData.doctor.id || n.relatedId === addDocData.doctor._id),
  )
  assert(newDocNotif, "Admin received 'New Doctor Added' notification")
  assert.strictEqual(newDocNotif.title, "New Doctor Added")
  assert.strictEqual(newDocNotif.message, "Dr. Suresh Reddy has been added to MediSlot.")
  pass("TEST 7: Admin adds doctor -> Admin received 'New Doctor Added'.")

  // ----------------------------------------------------
  // TEST 8: Unread count
  // Expected: Bell displays correct unread count
  // ----------------------------------------------------
  console.log("\nExecuting TEST 8: Verify unread count endpoint...")
  const countRes = await fetch(`${BASE_URL}/api/notifications/unread-count`, {
    headers: { Cookie: patient.cookie },
  })
  assert.strictEqual(countRes.status, 200, "Unread count response 200")
  const countData = await countRes.json()
  assert(countData.success === true, "Unread count returned success")
  assert(typeof countData.count === "number" && countData.count > 0, `Unread count > 0 (found ${countData.count})`)
  const baselineCount = countData.count
  pass(`TEST 8: Unread count returned accurate count (${baselineCount}).`)

  // ----------------------------------------------------
  // TEST 9: Mark one as read
  // Expected: Unread count decreases by 1
  // ----------------------------------------------------
  console.log("\nExecuting TEST 9: Mark one notification as read...")
  const patList = await (
    await fetch(`${BASE_URL}/api/notifications`, { headers: { Cookie: patient.cookie } })
  ).json()
  const unreadNotif = patList.notifications.find((n) => !n.isRead)
  assert(unreadNotif, "Found unread notification to mark as read")

  const markOneRes = await fetch(`${BASE_URL}/api/notifications/${unreadNotif._id}/read`, {
    method: "PUT",
    headers: { Cookie: patient.cookie },
  })
  assert.strictEqual(markOneRes.status, 200, "Mark one as read succeeded")
  const markOneData = await markOneRes.json()
  assert.strictEqual(markOneData.success, true)
  assert.strictEqual(markOneData.notification.isRead, true)

  const countAfterOne = await (
    await fetch(`${BASE_URL}/api/notifications/unread-count`, { headers: { Cookie: patient.cookie } })
  ).json()
  assert.strictEqual(countAfterOne.count, baselineCount - 1, `Count decreased from ${baselineCount} to ${countAfterOne.count}`)
  pass("TEST 9: Mark one as read -> Unread count decremented by 1.")

  // ----------------------------------------------------
  // TEST 10: Mark all as read
  // Expected: Unread count becomes zero
  // ----------------------------------------------------
  console.log("\nExecuting TEST 10: Mark all notifications as read...")
  const markAllRes = await fetch(`${BASE_URL}/api/notifications/mark-all-read`, {
    method: "PUT",
    headers: { Cookie: patient.cookie },
  })
  assert.strictEqual(markAllRes.status, 200, "Mark all as read succeeded")
  const markAllData = await markAllRes.json()
  assert.strictEqual(markAllData.success, true)

  const countAfterAll = await (
    await fetch(`${BASE_URL}/api/notifications/unread-count`, { headers: { Cookie: patient.cookie } })
  ).json()
  assert.strictEqual(countAfterAll.count, 0, "Unread count became 0 after mark-all-read")
  pass("TEST 10: Mark all as read -> Unread count is exactly 0.")

  // ----------------------------------------------------
  // TEST 11: Logout/Login isolation
  // Expected: User sees their own notification history after logging back in
  // ----------------------------------------------------
  console.log("\nExecuting TEST 11: Verify logout and re-login notification history...")
  // Logout
  await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: { Cookie: patient.cookie },
  })

  // Re-login
  const rePatient = await loginUser("patient@medislot.com", "patient123", "patient")
  const reNotifs = await (
    await fetch(`${BASE_URL}/api/notifications`, { headers: { Cookie: rePatient.cookie } })
  ).json()
  assert(reNotifs.success === true, "Notifications retrieved after re-login")
  assert(reNotifs.notifications.length > 0, "User sees their persistent notification history in MongoDB")
  // Ensure every notification belongs to this patient
  for (const n of reNotifs.notifications) {
    assert.strictEqual(n.recipientId, rePatient.user.id || rePatient.user._id, "Every notification belongs to recipient")
    assert.strictEqual(n.recipientRole, "patient", "Recipient role is patient")
  }
  pass("TEST 11: Re-login verified persistent history strictly belonging to the authenticated user.")

  // ----------------------------------------------------
  // TEST 12: Security
  // Attempt to access / mark-as-read / delete another user's notification through API
  // Expected: Request rejected (401 or 404)
  // ----------------------------------------------------
  console.log("\nExecuting TEST 12: Testing notification security boundaries...")
  // Doctor tries to mark patient's notification as read
  const hackAttempt = await fetch(`${BASE_URL}/api/notifications/${unreadNotif._id}/read`, {
    method: "PUT",
    headers: { Cookie: doctor.cookie }, // doctor token targeting patient notification
  })
  assert.strictEqual(hackAttempt.status, 404, "Cross-user notification modification rejected with 404")

  // Unauthenticated attempt
  const unauthAttempt = await fetch(`${BASE_URL}/api/notifications`, {
    headers: {}, // No cookie/token
  })
  assert.strictEqual(unauthAttempt.status, 401, "Unauthenticated notification fetch rejected with 401")

  // Cross-user deletion attempt
  const deleteHack = await fetch(`${BASE_URL}/api/notifications/${unreadNotif._id}`, {
    method: "DELETE",
    headers: { Cookie: doctor.cookie },
  })
  assert.strictEqual(deleteHack.status, 404, "Cross-user notification deletion rejected with 404")
  pass("TEST 12: Security verified -> Cross-user access and unauthenticated requests are strictly rejected.")

  console.log("\n==================================================")
  console.log(`ALL 12 TESTS PASSED! (${testsPassed}/${testsPassed})`)
  console.log("==================================================")
}

run().catch((err) => {
  console.error("Test Suite Terminated with error:", err)
  process.exit(1)
})
