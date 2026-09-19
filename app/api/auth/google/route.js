import { NextResponse } from "next/server"
import crypto from "node:crypto"

export const dynamic = "force-dynamic"

/**
 * Initiates official Google OAuth 2.0 Authorization Code flow for Patient accounts.
 * Sets a secure cryptographic state cookie for CSRF protection and redirects the browser.
 */
export async function GET(req) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim()
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()

    if (!clientId || !clientSecret) {
      const loginUrl = new URL("/login", req.nextUrl.origin)
      loginUrl.searchParams.set(
        "error",
        "Google Sign-In is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local and restart the server.",
      )
      return NextResponse.redirect(loginUrl)
    }

    const redirectUri = (
      process.env.GOOGLE_CALLBACK_URL ||
      `${req.nextUrl.origin}/api/auth/google/callback`
    ).trim()

    // Generate cryptographically random state token for CSRF protection
    const state = crypto.randomBytes(32).toString("hex")

    const googleAuthUrl = new URL(
      "https://accounts.google.com/o/oauth2/v2/auth",
    )
    googleAuthUrl.searchParams.set("client_id", clientId)
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri)
    googleAuthUrl.searchParams.set("response_type", "code")
    googleAuthUrl.searchParams.set("scope", "openid email profile")
    googleAuthUrl.searchParams.set("state", state)
    googleAuthUrl.searchParams.set("prompt", "select_account")
    googleAuthUrl.searchParams.set("access_type", "offline")

    const response = NextResponse.redirect(googleAuthUrl.toString())

    // Store state in a secure HttpOnly cookie with 10-minute expiry
    response.cookies.set("medislot_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    })

    return response
  } catch (error) {
    const loginUrl = new URL("/login", req.nextUrl.origin)
    loginUrl.searchParams.set(
      "error",
      error.message || "Failed to initialize Google authentication.",
    )
    return NextResponse.redirect(loginUrl)
  }
}
