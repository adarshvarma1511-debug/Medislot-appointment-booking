import { NextResponse } from "next/server"
import crypto from "node:crypto"
import bcrypt from "bcryptjs"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import { checkRateLimit } from "@/lib/rate-limit"
import { logSecurityEvent } from "@/lib/security-logger"
import { validatePasswordPolicy } from "@/app/api/auth/change-password/route"

export const dynamic = "force-dynamic"

const INVALID_TOKEN_MESSAGE =
  "This password reset link is invalid or has expired. Please request a new one."

export async function POST(req) {
  try {
    // 1. Rate Limiting (5 requests per 15 minutes)
    const rateCheck = checkRateLimit(req, "reset-password", {
      maxRequests: 5,
      windowSeconds: 900,
    })
    if (!rateCheck.allowed) {
      return rateCheck.response
    }

    const body = await req.json()
    const { token, newPassword, confirmPassword } = body

    if (!token || typeof token !== "string" || !token.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: INVALID_TOKEN_MESSAGE,
          message: INVALID_TOKEN_MESSAGE,
        },
        { status: 400 },
      )
    }

    if (!newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "New password is required.",
          message: "New password is required.",
        },
        { status: 400 },
      )
    }

    // 2. Hash incoming token with SHA-256 to compare against MongoDB hash
    const tokenHash = crypto
      .createHash("sha256")
      .update(token.trim())
      .digest("hex")

    await connectToDatabase()

    // 3. Find user with matching active token
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    })

    if (!user) {
      logSecurityEvent({
        event: "PASSWORD_RESET_FAILED",
        status: "FAIL",
        reason: "Token is invalid, expired, or already used",
        req,
      })
      return NextResponse.json(
        {
          success: false,
          error: INVALID_TOKEN_MESSAGE,
          message: INVALID_TOKEN_MESSAGE,
        },
        { status: 400 },
      )
    }

    // 4. Confirm Password Match
    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "New passwords do not match.",
          message: "New passwords do not match.",
        },
        { status: 400 },
      )
    }

    // 5. Validate Password Policy
    if (!validatePasswordPolicy(newPassword)) {
      return NextResponse.json(
        {
          success: false,
          error: "Password does not meet security requirements.",
          message: "Password does not meet security requirements.",
        },
        { status: 400 },
      )
    }

    // 6. Prevent Re-using Current Password
    if (
      user.password &&
      (user.password.startsWith("$2a$") ||
        user.password.startsWith("$2b$") ||
        user.password.startsWith("$2y$"))
    ) {
      const isSame = await bcrypt.compare(newPassword, user.password)
      if (isSame) {
        return NextResponse.json(
          {
            success: false,
            error: "New password must be different from your current password.",
            message:
              "New password must be different from your current password.",
          },
          { status: 400 },
        )
      }
    }

    // 7. Hash new password with bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // 8. Update MongoDB User record and invalidate reset token (Single-use)
    user.password = hashedPassword
    user.passwordUpdatedAt = new Date()
    user.passwordResetTokenHash = undefined
    user.passwordResetExpires = undefined
    await user.save()

    // 9. Audit Logging
    logSecurityEvent({
      event: "PASSWORD_RESET_COMPLETED",
      email: user.email,
      role: user.role,
      userId: user._id,
      status: "SUCCESS",
      req,
    })

    return NextResponse.json({
      success: true,
      message:
        "Password reset successful. Please log in with your new password.",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to reset password. Please try again.",
        message: "Failed to reset password. Please try again.",
      },
      { status: 500 },
    )
  }
}
