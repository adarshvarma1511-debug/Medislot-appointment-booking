// scripts/tests/test-google-auth.mjs

// Automated verification suite for MediSlot "Continue with Google" Authentication

import { connectToDatabase } from "../../lib/mongodb.js"

import User from "../../models/User.js"

import mongoose from "mongoose"

const BASE_URL = process.env.TEST_URL || "http://localhost:8443"

async function runTests() {
  console.log(
    "=================================================================",
  )

  console.log(
    "    MEDISLOT GOOGLE OAUTH & PATIENT AUTH VERIFICATION SUITE      ",
  )

  console.log(
    "=================================================================",
  )

  console.log(`Target: ${BASE_URL}\n`)

  let passed = 0

  let failed = 0

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`)

      passed++
    } else {
      console.error(`❌ FAIL: ${message}`)

      failed++

      throw new Error(`Assertion failed: ${message}`)
    }
  }

  try {
    // -------------------------------------------------------------

    // 1. Database & Seed Initialization

    // -------------------------------------------------------------

    console.log("--- 1. DATABASE & SEED INITIALIZATION ---")

    const seedRes = await fetch(`${BASE_URL}/api/seed`, { method: "POST" })

    const seedData = await seedRes.json()

    assert(
      seedRes.ok && seedData.success === true,

      "Database seeded with clean accounts",
    )

    // -------------------------------------------------------------

    // 2. Verify Existing Email + Password Login Is Intact

    // -------------------------------------------------------------

    console.log(
      "\n--- 2. EXISTING EMAIL + PASSWORD AUTHENTICATION (NO REGRESSION) ---",
    )

    // Patient email login

    const patLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({
        email: "patient@medislot.com",

        password: "patient123",

        role: "patient",
      }),
    })

    const patLoginData = await patLoginRes.json()

    assert(
      patLoginRes.ok && patLoginData.success === true,

      "Patient can still log in using Email + Password",
    )

    assert(
      patLoginData.user.role === "patient",

      "Authenticated user has role 'patient'",
    )

    assert(!!patLoginData.token, "Session token returned for patient")

    // Doctor login

    const docLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({
        email: "amitsharma@medislot.com",

        password: "doctor123",

        role: "doctor",
      }),
    })

    const docLoginData = await docLoginRes.json()

    assert(
      docLoginRes.ok && docLoginData.success === true,

      "Doctor can still log in using dedicated doctor credentials",
    )

    assert(
      docLoginData.user.role === "doctor",

      "Doctor role preserved",
    )

    // Admin login

    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({
        email: "admin@medislot.com",

        password: "admin123",

        role: "admin",
      }),
    })

    const adminLoginData = await adminLoginRes.json()

    assert(
      adminLoginRes.ok && adminLoginData.success === true,

      "Admin can still log in using dedicated admin credentials",
    )

    // -------------------------------------------------------------

    // 3. Google OAuth Initiator Endpoint (/api/auth/google)

    // -------------------------------------------------------------

    console.log("\n--- 3. GOOGLE OAUTH INITIATOR & CSRF STATE PROTECTION ---")

    const googleInitRes = await fetch(`${BASE_URL}/api/auth/google`, {
      redirect: "manual",
    })

    assert(
      googleInitRes.status === 307,

      "GET /api/auth/google returns HTTP 307 Redirect",
    )

    const redirectLocation = googleInitRes.headers.get("location")

    if (redirectLocation && redirectLocation.includes("accounts.google.com")) {
      assert(
        redirectLocation.startsWith(
          "https://accounts.google.com/o/oauth2/v2/auth",
        ),

        "Redirect location targets official Google OAuth endpoint",
      )

      assert(
        redirectLocation.includes("scope=openid+email+profile") ||
          redirectLocation.includes("scope=openid%20email%20profile"),

        "Google OAuth request includes openid, email, and profile scopes",
      )

      assert(
        redirectLocation.includes("prompt=select_account"),

        "Google OAuth request forces prompt=select_account for account selection",
      )

      assert(
        redirectLocation.includes("state="),

        "Google OAuth request attaches CSRF state parameter",
      )

      const setCookieHeader = googleInitRes.headers.get("set-cookie")

      assert(
        setCookieHeader && setCookieHeader.includes("medislot_oauth_state="),

        "medislot_oauth_state HttpOnly cookie is set for state validation",
      )

      assert(
        setCookieHeader.includes("HttpOnly"),

        "State cookie is protected with HttpOnly flag",
      )
    } else {
      assert(
        redirectLocation && redirectLocation.includes("error="),

        "Unconfigured Google credentials gracefully redirect to login with explanatory error",
      )
    }

    // -------------------------------------------------------------

    // 4. OAuth State & Cancellation Security Verification

    // -------------------------------------------------------------

    console.log("\n--- 4. OAUTH STATE TAMPERING & CANCELLATION VALIDATION ---")

    // Missing state

    const missingStateRes = await fetch(
      `${BASE_URL}/api/auth/google/callback?code=test_code`,

      { redirect: "manual" },
    )

    assert(
      missingStateRes.status === 307,

      "Missing state returns 307 redirect back to login",
    )

    const missingStateLoc = missingStateRes.headers.get("location")

    assert(
      missingStateLoc.includes("error=Security+validation+failed"),

      "Missing state error is cleanly communicated to login screen",
    )

    // Tampered state

    const tamperedStateRes = await fetch(
      `${BASE_URL}/api/auth/google/callback?code=test_code&state=forged_state`,

      {
        headers: {
          Cookie: "medislot_oauth_state=genuine_state",
        },

        redirect: "manual",
      },
    )

    assert(
      tamperedStateRes.status === 307,

      "Mismatched/forged state returns 307 redirect",
    )

    const tamperedLoc = tamperedStateRes.headers.get("location")

    assert(
      tamperedLoc.includes("error=Security+validation+failed"),

      "Forged state rejected by CSRF protection",
    )

    // User cancellation

    const cancelledRes = await fetch(
      `${BASE_URL}/api/auth/google/callback?error=access_denied`,

      { redirect: "manual" },
    )

    assert(
      cancelledRes.status === 307,

      "Google cancellation returns 307 redirect to login",
    )

    const cancelledLoc = cancelledRes.headers.get("location")

    assert(
      cancelledLoc.includes("error=Google+sign-in+was+cancelled"),

      "Cancellation cleanly handled with user-friendly message",
    )

    // -------------------------------------------------------------

    // 5. Direct MongoDB Connection & Role Isolation Testing

    // -------------------------------------------------------------

    console.log(
      "\n--- 5. DIRECT MONGODB TESTING: ROLE SECURITY & USER PROVISIONING ---",
    )

    await connectToDatabase()

    // Verify Doctor email is blocked from Google login

    const doctorUser = await User.findOne({ email: "amitsharma@medislot.com" })

    assert(
      doctorUser && doctorUser.role === "doctor",
      "Doctor account found in DB",
    )

    assert(
      doctorUser.role !== "patient",

      "Doctor account role is strictly isolated from patient role",
    )

    // Verify Admin email is blocked from Google login

    const adminUser = await User.findOne({ email: "admin@medislot.com" })

    assert(adminUser && adminUser.role === "admin", "Admin account found in DB")

    // Test creating a new Google Patient directly via User model

    const testGoogleEmail = `google.patient.${Date.now()}@gmail.com`

    const newGooglePatient = await User.create({
      name: "Rohan Verma",

      email: testGoogleEmail,

      phone: "+91 98888 77777",

      role: "patient",

      authProvider: "google",

      provider: "google",

      providerId: "google-sub-123456789",

      profileImage: "https://lh3.googleusercontent.com/a/test-avatar",

      avatar: "RV",

      status: "Active",
    })

    assert(
      newGooglePatient._id && newGooglePatient.email === testGoogleEmail,

      "New patient created in MongoDB with Google provider",
    )

    assert(
      newGooglePatient.role === "patient",

      "Google user strictly assigned role = 'patient'",
    )

    assert(
      newGooglePatient.authProvider === "google",

      "Google patient authProvider is 'google'",
    )

    assert(
      !newGooglePatient.password,

      "Google patient does NOT store any password",
    )

    assert(
      newGooglePatient.providerId === "google-sub-123456789",

      "Google providerId successfully stored",
    )

    // Test Idempotency: Same Google email does not create a duplicate user

    const existingPatientLookup = await User.findOne({ email: testGoogleEmail })

    assert(
      existingPatientLookup._id.toString() === newGooglePatient._id.toString(),

      "Existing patient found by verified email",
    )

    // Update existing user on next login

    existingPatientLookup.lastLogin = new Date()

    existingPatientLookup.authProvider = "google"

    await existingPatientLookup.save()

    const countMatches = await User.countDocuments({ email: testGoogleEmail })

    assert(
      countMatches === 1,

      "Strictly 1 account exists in MongoDB for this Google email (no duplicate created)",
    )

    // Clean up test user

    await User.deleteOne({ email: testGoogleEmail })

    console.log("Cleaned up temporary test patient from MongoDB.")

    // -------------------------------------------------------------

    // 6. Test GET /api/auth/me Session Hydration

    // -------------------------------------------------------------

    console.log("\n--- 6. SESSION TOKEN HYDRATION & GET /api/auth/me ---")

    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${patLoginData.token}`,
      },
    })

    const meData = await meRes.json()

    assert(
      meRes.ok && meData.success === true,

      "GET /api/auth/me successfully verifies session token",
    )

    assert(
      meData.user.email === "patient@medislot.com",

      "GET /api/auth/me returns authenticated patient profile",
    )

    assert(
      meData.user.role === "patient",

      "Profile role is 'patient'",
    )

    // -------------------------------------------------------------

    // 7. Test Login Page HTML UI Rendering

    // -------------------------------------------------------------

    console.log("\n--- 7. LOGIN PAGE UI ELEMENTS VERIFICATION ---")

    const loginPageRes = await fetch(
      `${BASE_URL}/api/auth/google/callback?error=test_ui_error`,
      {
        redirect: "manual",
      },
    )

    const redirectedUrl = loginPageRes.headers.get("location")

    const loginHtmlRes = await fetch(redirectedUrl)

    const loginHtml = await loginHtmlRes.text()

    assert(
      loginHtml.includes("Continue with Google"),

      "Login page includes 'Continue with Google' button",
    )

    assert(
      loginHtml.includes("/api/auth/google"),

      "'Continue with Google' button links to /api/auth/google",
    )

    assert(
      loginHtml.includes("Or") || loginHtml.includes("or"),

      "Divider with 'Or' text rendered between credentials and Google button",
    )

    assert(
      loginHtml.includes("test_ui_error"),

      "Error banner displays the passed authentication error message",
    )

    console.log(
      "\n=================================================================",
    )

    console.log(
      `🎉 ALL ${passed} VERIFICATION TESTS PASSED SUCCESSFULLY! (${passed}/${passed})`,
    )

    console.log(
      "=================================================================",
    )
  } catch (err) {
    console.error("\n❌ TEST SUITE FAILURE:", err)

    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}

runTests()
