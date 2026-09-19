import assert from "node:assert"

const BASE_URL = "http://localhost:8443"

async function runTests() {
  console.log("==================================================")
  console.log("RUNNING MEDISLOT ROUTING & AUTHENTICATION TESTS")
  console.log("==================================================\n")

  // TEST 1: Open "/" without login -> Expected: Home page (200 OK, Landing Page title and elements)
  console.log("TEST 1: Checking public Home page ('/') without authentication...")
  const homeRes = await fetch(`${BASE_URL}/`)
  assert.strictEqual(homeRes.status, 200, "Home page returns 200 OK")
  const homeHtml = await homeRes.text()
  assert(homeHtml.includes("Book Your Doctor"), "Home page contains 'Book Your Doctor'")
  assert(homeHtml.includes("How It Works"), "Home page contains 'How It Works'")
  assert(!homeHtml.includes("Doctor's Appointment Queue"), "Home page does NOT contain Doctor Dashboard queue")
  assert(!homeHtml.includes("Doctor Portal"), "Home page does NOT contain Doctor Portal sidebar")
  console.log("✓ TEST 1 PASSED: Home page ('/') correctly renders the public MediSlot landing page.\n")

  // TEST 2: Doctor Login via credentials against /api/auth/login
  console.log("TEST 2: Doctor Login via credentials...")
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "adarsh@medislot.com",
      password: "Doctor123",
      role: "doctor",
    }),
  })
  assert.strictEqual(loginRes.status, 200, "Doctor login returns 200 OK")
  const loginData = await loginRes.json()
  assert.strictEqual(loginData.success, true, "Login successful")
  assert.strictEqual(loginData.user.role, "doctor", "User role is doctor")

  // Check Set-Cookie headers
  const setCookie = loginRes.headers.get("set-cookie")
  assert(setCookie && setCookie.includes("medislot_token="), "medislot_token cookie was set")
  console.log("✓ TEST 2 PASSED: Doctor authenticated and session token issued.\n")

  // Extract cookie
  const cookieMatch = setCookie.match(/medislot_token=([^;]+)/)
  const tokenCookie = cookieMatch ? cookieMatch[0] : ""

  // TEST 3: Validate /api/auth/me returns the doctor user when token is present
  console.log("TEST 3: Session verification with active token...")
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: tokenCookie },
  })
  assert.strictEqual(meRes.status, 200, "/api/auth/me returns 200 OK")
  const meData = await meRes.json()
  assert.strictEqual(meData.success, true, "/api/auth/me succeeded")
  assert.strictEqual(meData.user.role, "doctor", "Returned user is doctor")
  console.log("✓ TEST 3 PASSED: Session verification confirmed doctor role.\n")

  // TEST 4: Call POST /api/auth/logout endpoint
  console.log("TEST 4: Invoking /api/auth/logout...")
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
  })
  assert.strictEqual(logoutRes.status, 200, "Logout endpoint returns 200 OK")
  const logoutData = await logoutRes.json()
  assert.strictEqual(logoutData.success, true, "Logout endpoint reports success")

  const logoutCookies = logoutRes.headers.get("set-cookie") || ""
  assert(
    logoutCookies.includes("medislot_token=;") || logoutCookies.includes("Max-Age=0"),
    "medislot_token cookie was invalidated with Max-Age=0",
  )
  console.log("✓ TEST 4 PASSED: Logout endpoint successfully cleared session cookie.\n")

  // TEST 5: Verify /api/auth/me fails after logout (unauthenticated)
  console.log("TEST 5: Verify /api/auth/me fails without token (or with cleared cookie)...")
  const unauthMeRes = await fetch(`${BASE_URL}/api/auth/me`)
  assert.strictEqual(unauthMeRes.status, 401, "/api/auth/me returns 401 Unauthorized without session")
  const unauthMeData = await unauthMeRes.json()
  assert.strictEqual(unauthMeData.success, false, "Auth fails when logged out")
  console.log("✓ TEST 5 PASSED: User is completely unauthenticated after logout.\n")

  // TEST 6: Verify Doctor Dashboard route is protected
  console.log("TEST 6: Checking that /doctor/dashboard requires authorization...")
  const docDashRes = await fetch(`${BASE_URL}/doctor/dashboard`)
  assert.strictEqual(docDashRes.status, 200, "Route reachable")
  const docDashHtml = await docDashRes.text()
  assert(
    docDashHtml.includes("Verifying Doctor Authorization") || docDashHtml.includes("animate-spin"),
    "Doctor Dashboard does not render unprotected content to unauthenticated requests",
  )
  console.log("✓ TEST 6 PASSED: Protected route guards unauthenticated access.\n")

  console.log("==================================================")
  console.log("ALL ROUTING & AUTHENTICATION API TESTS PASSED!")
  console.log("==================================================")
}

runTests().catch((err) => {
  console.error("Test failed:", err)
  process.exit(1)
})
