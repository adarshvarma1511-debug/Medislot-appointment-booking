// scripts/test-password-management.mjs
// Comprehensive verification of Password Management feature in MediSlot

import crypto from "node:crypto"

const BASE_URL = process.env.TEST_URL || "http://localhost:8443"

async function runTests() {
  console.log(
    "=================================================================",
  )
  console.log(
    "   MEDISLOT SECURE PASSWORD MANAGEMENT VERIFICATION SUITE       ",
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
    // 1. Seed & DB Status Check
    // -------------------------------------------------------------
    console.log("--- 1. DATABASE & SEED INITIALIZATION ---")
    const seedRes = await fetch(`${BASE_URL}/api/seed`, { method: "POST" })
    const seedData = await seedRes.json()
    assert(
      seedRes.ok && seedData.success === true,
      "Database seeded with clean accounts",
    )

    // -------------------------------------------------------------
    // 2. Test Login for All Roles & Capture Tokens
    // -------------------------------------------------------------
    console.log("\n--- 2. ROLE-BASED LOGIN & SESSION ISSUANCE ---")

    // Patient login
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
      "Patient login successful (patient@medislot.com)",
    )
    assert(!!patLoginData.token, "Patient receives secure session token")
    const patientToken = patLoginData.token

    // Doctor login (amitsharma@medislot.com)
    const docLoginRes = await fetch(`${BASE_URL}/api/auth/doctor/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "amitsharma@medislot.com",
        password: "doctor123",
      }),
    })
    const docLoginData = await docLoginRes.json()
    assert(
      docLoginRes.ok && docLoginData.success === true,
      "Doctor login successful (amitsharma@medislot.com)",
    )
    assert(!!docLoginData.token, "Doctor receives secure session token")
    const doctorToken = docLoginData.token

    // Admin login (admin@medislot.com)
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
      "Admin login successful (admin@medislot.com)",
    )
    assert(!!adminLoginData.token, "Admin receives secure session token")
    const adminToken = adminLoginData.token

    // -------------------------------------------------------------
    // 3. Security Enforcement on Change Password API
    // -------------------------------------------------------------
    console.log("\n--- 3. CHANGE PASSWORD SECURITY & VALIDATIONS ---")

    // Test Unauthenticated request (no token/cookie)
    const unauthRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: "foo", newPassword: "bar" }),
    })
    const unauthData = await unauthRes.json()
    assert(
      unauthRes.status === 401,
      "Unauthenticated change-password returns HTTP 401",
    )
    assert(
      unauthData.message === "Authentication required.",
      "Message says 'Authentication required.'",
    )

    // Test Incorrect current password
    const wrongCurrentRes = await fetch(
      `${BASE_URL}/api/auth/change-password`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${patientToken}`,
        },
        body: JSON.stringify({
          currentPassword: "wrongpassword123",
          newPassword: "NewValidPassword@123",
          confirmPassword: "NewValidPassword@123",
        }),
      },
    )
    const wrongCurrentData = await wrongCurrentRes.json()
    assert(
      wrongCurrentRes.status === 401,
      "Wrong current password rejected with HTTP 401",
    )
    assert(
      wrongCurrentData.message === "Current password is incorrect.",
      "Error message: 'Current password is incorrect.'",
    )

    // Test Weak password (< 8 chars, missing uppercase, number)
    const weakRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${patientToken}`,
      },
      body: JSON.stringify({
        currentPassword: "patient123",
        newPassword: "weak",
        confirmPassword: "weak",
      }),
    })
    const weakData = await weakRes.json()
    assert(weakRes.status === 400, "Weak password rejected with HTTP 400")
    assert(
      weakData.message === "Password does not meet security requirements.",
      "Policy error: 'Password does not meet security requirements.'",
    )

    // Test Same password as current
    const sameRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${patientToken}`,
      },
      body: JSON.stringify({
        currentPassword: "patient123",
        newPassword: "patient123",
        confirmPassword: "patient123",
      }),
    })
    const sameData = await sameRes.json()
    assert(sameRes.status === 400, "Same password rejected with HTTP 400")
    assert(
      sameData.message ===
        "New password must be different from your current password.",
      "Error says: 'New password must be different from your current password.'",
    )

    // Test Mismatched confirm password
    const mismatchRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${patientToken}`,
      },
      body: JSON.stringify({
        currentPassword: "patient123",
        newPassword: "NewSecurePass@123",
        confirmPassword: "DifferentPass@123",
      }),
    })
    const mismatchData = await mismatchRes.json()
    assert(
      mismatchRes.status === 400,
      "Mismatched passwords rejected with HTTP 400",
    )
    assert(
      mismatchData.message === "New passwords do not match.",
      "Error says: 'New passwords do not match.'",
    )

    // -------------------------------------------------------------
    // 4. Successful Change Password & Session Invalidation
    // -------------------------------------------------------------
    console.log("\n--- 4. SUCCESSFUL PASSWORD CHANGE & SESSION REVOCATION ---")

    // Patient changes password to MediSlot@Patient2026
    const patChangeRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${patientToken}`,
      },
      body: JSON.stringify({
        currentPassword: "patient123",
        newPassword: "MediSlot@Patient2026",
        confirmPassword: "MediSlot@Patient2026",
      }),
    })
    const patChangeData = await patChangeRes.json()
    assert(
      patChangeRes.ok && patChangeData.success === true,
      "Patient successfully updated password",
    )
    assert(
      patChangeData.message ===
        "Password changed successfully. Please log in again.",
      "Success message instructs user to log in again",
    )

    // Verify old password no longer works
    const oldLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "patient@medislot.com",
        password: "patient123",
        role: "patient",
      }),
    })
    assert(
      oldLoginRes.status === 401,
      "Old password strictly rejected after change",
    )

    // Verify new password works
    const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "patient@medislot.com",
        password: "MediSlot@Patient2026",
        role: "patient",
      }),
    })
    const newLoginData = await newLoginRes.json()
    assert(
      newLoginRes.ok && newLoginData.success === true,
      "New password successfully authenticates patient",
    )

    // Verify old token was revoked/invalidated by passwordUpdatedAt check
    const revokedCheckRes = await fetch(
      `${BASE_URL}/api/auth/change-password`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${patientToken}`, // using old token
        },
        body: JSON.stringify({
          currentPassword: "MediSlot@Patient2026",
          newPassword: "AnotherPass@2026",
        }),
      },
    )
    assert(
      revokedCheckRes.status === 401,
      "Old session token is invalidated due to password update timestamp",
    )

    // Doctor changes password (amitsharma@medislot.com)
    const docChangeRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        currentPassword: "doctor123",
        newPassword: "MediSlot@Doctor2026",
        confirmPassword: "MediSlot@Doctor2026",
      }),
    })
    const docChangeData = await docChangeRes.json()
    assert(
      docChangeRes.ok && docChangeData.success === true,
      "Doctor (amitsharma@medislot.com) changed password",
    )

    // Verify doctor old password fails
    const docOldRes = await fetch(`${BASE_URL}/api/auth/doctor/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "amitsharma@medislot.com",
        password: "doctor123",
      }),
    })
    assert(docOldRes.status === 401, "Doctor old password fails")

    // Verify doctor new password works
    const docNewRes = await fetch(`${BASE_URL}/api/auth/doctor/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "amitsharma@medislot.com",
        password: "MediSlot@Doctor2026",
      }),
    })
    assert(docNewRes.ok, "Doctor new password works")

    // Admin changes password (admin@medislot.com)
    const adminChangeRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        currentPassword: "admin123",
        newPassword: "MediSlot@Admin2026",
        confirmPassword: "MediSlot@Admin2026",
      }),
    })
    const adminChangeData = await adminChangeRes.json()
    assert(
      adminChangeRes.ok && adminChangeData.success === true,
      "Admin (admin@medislot.com) changed password",
    )

    // Verify admin new password works
    const adminNewRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@medislot.com",
        password: "MediSlot@Admin2026",
        role: "admin",
      }),
    })
    assert(adminNewRes.ok, "Admin new password works")

    // -------------------------------------------------------------
    // 5. Forgot Password & Anti-Enumeration
    // -------------------------------------------------------------
    console.log("\n--- 5. FORGOT PASSWORD & RESET TOKEN SECURITY ---")

    // Test unknown email enumeration prevention
    const unknownRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "unknown@example.com", role: "patient" }),
    })
    const unknownData = await unknownRes.json()
    assert(
      unknownRes.ok && unknownData.success === true,
      "Unknown email returns success HTTP 200",
    )
    assert(
      unknownData.message ===
        "If an account exists for this email, a password reset link has been sent.",
      "Generic anti-enumeration message prevents discovering if email exists",
    )

    // Request reset for doctor (amitsharma@medislot.com)
    const docForgotRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "amitsharma@medislot.com",
        role: "doctor",
      }),
    })
    const docForgotData = await docForgotRes.json()
    assert(
      docForgotRes.ok && docForgotData.success === true,
      "Doctor forgot-password requested successfully",
    )
    assert(
      docForgotData.message ===
        "If an account exists for this email, a password reset link has been sent.",
      "Doctor reset request also returns standard anti-enumeration message",
    )
    assert(
      !!docForgotData.debugResetLink,
      "Debug reset link available in test environment",
    )

    // Extract raw token from debug link
    const resetUrl = new URL(docForgotData.debugResetLink)
    const rawResetToken = resetUrl.searchParams.get("token")
    assert(
      !!rawResetToken && rawResetToken.length === 64,
      "Generated reset token is a 64-char cryptographic hex string",
    )

    // Test invalid / expired reset token
    const invalidTokenRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "completely_fake_invalid_token_1234567890",
        newPassword: "DoctorResetPass@123",
        confirmPassword: "DoctorResetPass@123",
      }),
    })
    const invalidTokenData = await invalidTokenRes.json()
    assert(
      invalidTokenRes.status === 400,
      "Invalid reset token rejected with HTTP 400",
    )
    assert(
      invalidTokenData.message ===
        "This password reset link is invalid or has expired. Please request a new one.",
      "Error message: 'This password reset link is invalid or has expired. Please request a new one.'",
    )

    // Test successful reset with valid token
    const resetSuccessRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: rawResetToken,
        newPassword: "DoctorFinalPass@2026",
        confirmPassword: "DoctorFinalPass@2026",
      }),
    })
    const resetSuccessData = await resetSuccessRes.json()
    assert(
      resetSuccessRes.ok && resetSuccessData.success === true,
      "Password reset succeeded with valid token",
    )

    // Test Single-Use Enforcement: re-use same token -> MUST FAIL!
    const reuseTokenRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: rawResetToken,
        newPassword: "YetAnotherPass@2026",
        confirmPassword: "YetAnotherPass@2026",
      }),
    })
    assert(
      reuseTokenRes.status === 400,
      "Re-used reset token is strictly rejected (single-use enforced)",
    )

    // Verify doctor can now log in with the new password
    const docPostResetLogin = await fetch(`${BASE_URL}/api/auth/doctor/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "amitsharma@medislot.com",
        password: "DoctorFinalPass@2026",
      }),
    })
    assert(
      docPostResetLogin.ok,
      "Doctor successfully logs in with password set via Reset Password link",
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
    console.error("\n❌ TEST SUITE FAILED:", err.message)
    process.exit(1)
  }
}

runTests()
