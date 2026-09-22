import { NextResponse } from "next/server"

import { connectToDatabase } from "@/lib/mongodb"

import User from "@/models/User"

import { signSessionToken, SESSION_COOKIE_OPTIONS } from "@/lib/auth"

import { logSecurityEvent } from "@/lib/security-logger"

export const dynamic = "force-dynamic"

/**
 * Handles the Google OAuth 2.0 callback for Patient accounts.
 * Verifies the authorization code, validates CSRF state, checks role security,
 * provisions or logs in the Patient, and issues the MediSlot session.
 */

export async function GET(req) {
  const origin = req.nextUrl.origin

  const searchParams = req.nextUrl.searchParams

  const code = searchParams.get("code")

  const state = searchParams.get("state")

  const errorParam = searchParams.get("error")

  // 1. Handle user cancellation or denial from Google

  if (errorParam) {
    const loginUrl = new URL("/login", origin)

    loginUrl.searchParams.set(
      "error",

      errorParam === "access_denied"
        ? "Google sign-in was cancelled."
        : `Google sign-in failed: ${errorParam}`,
    )

    const res = NextResponse.redirect(loginUrl)

    res.cookies.delete("medislot_oauth_state")

    return res
  }

  // 2. Validate OAuth state for CSRF protection

  const savedState = req.cookies.get("medislot_oauth_state")?.value

  if (!state || !savedState || state !== savedState) {
    const loginUrl = new URL("/login", origin)

    loginUrl.searchParams.set(
      "error",

      "Security validation failed: Invalid or expired OAuth state. Please try again.",
    )

    const res = NextResponse.redirect(loginUrl)

    res.cookies.delete("medislot_oauth_state")

    return res
  }

  // 3. Ensure authorization code is present

  if (!code) {
    const loginUrl = new URL("/login", origin)

    loginUrl.searchParams.set(
      "error",

      "Missing authorization code from Google.",
    )

    const res = NextResponse.redirect(loginUrl)

    res.cookies.delete("medislot_oauth_state")

    return res
  }

  const clientId = process.env.GOOGLE_CLIENT_ID

  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  const redirectUri =
    process.env.GOOGLE_CALLBACK_URL || `${origin}/api/auth/google/callback`

  if (!clientId || !clientSecret) {
    const loginUrl = new URL("/login", origin)

    loginUrl.searchParams.set(
      "error",

      "Google OAuth is not properly configured on the server.",
    )

    return NextResponse.redirect(loginUrl)
  }

  try {
    // 4. Exchange authorization code for tokens directly with Google's token endpoint

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",

      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },

      body: new URLSearchParams({
        code,

        client_id: clientId,

        client_secret: clientSecret,

        redirect_uri: redirectUri,

        grant_type: "authorization_code",
      }),
    })

    const tokenData = await tokenRes.json()

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Google token exchange error:", tokenData)

      const loginUrl = new URL("/login", origin)

      loginUrl.searchParams.set(
        "error",

        tokenData.error_description ||
          "Failed to exchange authorization code with Google.",
      )

      const res = NextResponse.redirect(loginUrl)

      res.cookies.delete("medislot_oauth_state")

      return res
    }

    // 5. Fetch verified user identity from Google's OpenID Connect userinfo endpoint

    const userinfoRes = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",

      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      },
    )

    const googleUser = await userinfoRes.json()

    if (!userinfoRes.ok || !googleUser.email) {
      const loginUrl = new URL("/login", origin)

      loginUrl.searchParams.set(
        "error",

        "Unable to retrieve verified user information from Google.",
      )

      const res = NextResponse.redirect(loginUrl)

      res.cookies.delete("medislot_oauth_state")

      return res
    }

    if (googleUser.email_verified === false) {
      const loginUrl = new URL("/login", origin)

      loginUrl.searchParams.set(
        "error",

        "Your Google email address is not verified. Please verify your Google account first.",
      )

      const res = NextResponse.redirect(loginUrl)

      res.cookies.delete("medislot_oauth_state")

      return res
    }

    const cleanEmail = googleUser.email.trim().toLowerCase()

    // 6. Connect to MongoDB and strictly enforce role isolation

    await connectToDatabase()

    let user = await User.findOne({ email: cleanEmail })

    if (user) {
      // Role Security: Google login is ONLY for Patient accounts.

      if (user.role === "doctor") {
        const loginUrl = new URL("/login", origin)

        loginUrl.searchParams.set(
          "error",

          "This email is registered as a Doctor account. Doctor accounts cannot sign in with Google; please use Doctor Login with your credentials.",
        )

        const res = NextResponse.redirect(loginUrl)

        res.cookies.delete("medislot_oauth_state")

        return res
      }

      if (user.role === "admin") {
        const loginUrl = new URL("/login", origin)

        loginUrl.searchParams.set(
          "error",

          "This email is registered as an Administrator account. Admin accounts cannot sign in with Google; please use Admin Login.",
        )

        const res = NextResponse.redirect(loginUrl)

        res.cookies.delete("medislot_oauth_state")

        return res
      }

      // Existing Patient: Link Google provider and update lastLogin

      user.lastLogin = new Date()

      user.authProvider = "google"

      user.provider = "google"

      user.providerId = googleUser.sub || user.providerId

      if (googleUser.picture && !user.profileImage) {
        user.profileImage = googleUser.picture
      }

      await user.save()
    } else {
      // New Patient: Create account strictly with role = "patient"

      const initials =
        (googleUser.name || cleanEmail)

          .split(" ")

          .filter(Boolean)

          .map((n) => n[0])

          .join("")

          .toUpperCase()

          .slice(0, 2) || "PT"

      user = await User.create({
        name: googleUser.name
          ? googleUser.name.trim()
          : cleanEmail.split("@")[0],

        email: cleanEmail,

        phone: "+91 98765 43210",

        role: "patient",

        authProvider: "google",

        provider: "google",

        providerId: googleUser.sub || null,

        profileImage: googleUser.picture || "",

        avatar: initials,

        status: "Active",

        lastLogin: new Date(),
      })
    }

    // 7. Format clean client-safe user data

    const userData = {
      id: user._id.toString(),

      name: user.name,

      email: user.email,

      phone: user.phone || "+91 98765 43210",

      role: "patient",

      specialization: user.specialization || "General",

      department: user.department || "General Medicine",

      experience: user.experience ?? 5,

      consultationDuration: user.consultationDuration ?? 30,

      hospital: user.hospital || "MediSlot Hospital",

      status: user.status || "Active",

      avatar: user.avatar || "PT",

      profileImage: user.profileImage || "",

      lastLogin: user.lastLogin,

      authProvider: "google",

      provider: "google",
    }

    // 8. Generate cryptographically signed JWT session token

    const token = signSessionToken({
      userId: user._id.toString(),

      email: user.email,

      role: "patient",

      pwu: user.passwordUpdatedAt
        ? new Date(user.passwordUpdatedAt).getTime()
        : 0,
    })

    logSecurityEvent({
      event: "GOOGLE_LOGIN_SUCCESS",

      email: user.email,

      role: "patient",

      userId: user._id,

      status: "SUCCESS",

      req,
    })

    // 9. Return an HTML bridge that sets client localStorage and redirects to /dashboard

    const sanitizedUserData = JSON.stringify(userData).replace(/</g, "\\u003c")

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Authenticating with Google...</title>
    <meta http-equiv="refresh" content="1;url=/dashboard">
    <style>
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background-color: #f8fafc;
        color: #0f172a;
      }
      .card {
        text-align: center;
        padding: 2rem;
        background: white;
        border-radius: 1rem;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
        border: 1px solid #e2e8f0;
        max-width: 360px;
      }
      .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #e2e8f0;
        border-top-color: #0d9488;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 1rem;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      p { margin: 0; font-size: 0.875rem; color: #64748b; }
      h2 { margin: 0 0 0.5rem; font-size: 1.125rem; font-weight: 600; color: #0f172a; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="spinner"></div>
      <h2>Signing you in...</h2>
      <p>Redirecting to your Patient Dashboard</p>
    </div>
    <script>
      try {
        localStorage.setItem("medislot_user", '${sanitizedUserData}');
        localStorage.removeItem("medislot_remembered_patient");
      } catch (e) {
        console.error("Failed to save session locally:", e);
      }
      window.location.replace("/dashboard");
    </script>
  </body>
</html>`

    const response = new NextResponse(html, {
      status: 200,

      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    })

    // Set secure HttpOnly session cookie

    response.cookies.set("medislot_token", token, SESSION_COOKIE_OPTIONS)

    // Set role cookie for client navigation checks

    response.cookies.set("medislot_role", "patient", {
      path: "/",

      maxAge: 7 * 24 * 3600,

      sameSite: "lax",
    })

    // Clean up OAuth state cookie

    response.cookies.delete("medislot_oauth_state")

    return response
  } catch (error) {
    console.error("Google OAuth callback error:", error)

    const loginUrl = new URL("/login", origin)

    loginUrl.searchParams.set(
      "error",

      "An unexpected error occurred during Google authentication. Please try again.",
    )

    const res = NextResponse.redirect(loginUrl)

    res.cookies.delete("medislot_oauth_state")

    return res
  }
}
