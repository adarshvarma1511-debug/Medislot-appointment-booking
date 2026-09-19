import { NextResponse } from "next/server"
import crypto from "node:crypto"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import { checkRateLimit } from "@/lib/rate-limit"
import { logSecurityEvent } from "@/lib/security-logger"

export const dynamic = "force-dynamic"

const GENERIC_RESPONSE_MESSAGE =
  "If an account exists for this email, a password reset link has been sent."

export async function POST(req) {
  try {
    // 1. Rate Limiting (5 requests per 15 minutes)
    const rateCheck = checkRateLimit(req, "forgot-password", {
      maxRequests: 5,
      windowSeconds: 900,
    })
    if (!rateCheck.allowed) {
      return rateCheck.response
    }

    const body = await req.json()
    const { email, role } = body

    if (!email || !email.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Email address is required.",
          message: "Email address is required.",
        },
        { status: 400 },
      )
    }

    const cleanEmail = email.trim().toLowerCase()

    await connectToDatabase()

    // 2. Query MongoDB for account
    const user = await User.findOne({ email: cleanEmail })

    // Anti-Enumeration: Always respond with the same message whether user is found or not
    if (!user) {
      logSecurityEvent({
        event: "PASSWORD_RESET_ATTEMPT_UNKNOWN_EMAIL",
        email: cleanEmail,
        status: "INFO",
        reason: "User not found (generic response returned)",
        req,
      })
      return NextResponse.json({
        success: true,
        message: GENERIC_RESPONSE_MESSAGE,
      })
    }

    // Role check: If requested role doesn't match the account role, return generic message without error
    if (role && user.role !== role) {
      logSecurityEvent({
        event: "PASSWORD_RESET_ROLE_MISMATCH",
        email: cleanEmail,
        role: user.role,
        status: "INFO",
        reason: `Requested role '${role}' does not match account role '${user.role}'`,
        req,
      })
      return NextResponse.json({
        success: true,
        message: GENERIC_RESPONSE_MESSAGE,
      })
    }

    // 3. Generate cryptographically secure random reset token (64 hex characters)
    const rawToken = crypto.randomBytes(32).toString("hex")

    // 4. Hash the token using SHA-256 before storing in MongoDB
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex")

    // 5. Save hashed token and short expiration (15 minutes) in MongoDB
    user.passwordResetTokenHash = tokenHash
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000)
    await user.save()

    // 6. Construct reset URL
    let origin = "http://localhost:8443"
    try {
      const url = new URL(req.url)
      origin = url.origin
    } catch {}

    const resetUrl = `${origin}/reset-password?token=${rawToken}`

    // 7. Safe Security Logging (does NOT log rawToken or tokenHash)
    logSecurityEvent({
      event: "PASSWORD_RESET_REQUESTED",
      email: user.email,
      role: user.role,
      userId: user._id,
      status: "SUCCESS",
      req,
    })

    // Development / demo console dispatch for easy testing without mandatory external SMTP
    console.log(
      `\n=============================================================`,
    )
    console.log(`[PASSWORD RESET DISPATCH]`)
    console.log(`Account: ${user.email} (${user.role})`)
    console.log(`Reset Link: ${resetUrl}`)
    console.log(`Expires in: 15 minutes`)
    console.log(
      `=============================================================\n`,
    )

    return NextResponse.json({
      success: true,
      message: GENERIC_RESPONSE_MESSAGE,
      // For local testing convenience only when in development or non-production
      ...(process.env.NODE_ENV !== "production"
        ? { debugResetLink: resetUrl }
        : {}),
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process password reset request. Please try again.",
        message: "Failed to process password reset request. Please try again.",
      },
      { status: 500 },
    )
  }
}
