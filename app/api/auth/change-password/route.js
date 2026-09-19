import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getAuthenticatedUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rate-limit"
import { logSecurityEvent } from "@/lib/security-logger"

export const dynamic = "force-dynamic"

/**
 * Validates password policy:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export function validatePasswordPolicy(password) {
  if (!password || typeof password !== "string") return false
  if (password.length < 8) return false
  if (!/[A-Z]/.test(password)) return false
  if (!/[a-z]/.test(password)) return false
  if (!/[0-9]/.test(password)) return false
  return true
}

export async function PUT(req) {
  try {
    // 1. Rate Limiting (5 attempts per 10 minutes)
    const rateCheck = checkRateLimit(req, "change-password", {
      maxRequests: 5,
      windowSeconds: 600,
    })
    if (!rateCheck.allowed) {
      return rateCheck.response
    }

    // 2. Authentication Requirement (Session/Token validation)
    const auth = await getAuthenticatedUser(req)
    if (!auth.success || !auth.user) {
      logSecurityEvent({
        event: "UNAUTHORIZED_PASSWORD_CHANGE_ATTEMPT",
        status: "WARN",
        reason: auth.error || "Authentication required",
        req,
      })
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required.",
          message: "Authentication required.",
        },
        { status: 401 },
      )
    }

    const { user } = auth

    // 3. Parse input body
    const body = await req.json()
    const { currentPassword, newPassword, confirmPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Current password and new password are required.",
          message: "Current password and new password are required.",
        },
        { status: 400 },
      )
    }

    // 4. Verify Current Password on backend
    let passwordMatch = false
    if (
      user.password &&
      (user.password.startsWith("$2a$") ||
        user.password.startsWith("$2b$") ||
        user.password.startsWith("$2y$"))
    ) {
      passwordMatch = await bcrypt.compare(currentPassword, user.password)
    } else {
      passwordMatch = user.password === currentPassword
    }

    if (!passwordMatch) {
      logSecurityEvent({
        event: "FAILED_PASSWORD_CHANGE",
        email: user.email,
        role: user.role,
        userId: user._id,
        status: "FAIL",
        reason: "Current password is incorrect",
        req,
      })
      return NextResponse.json(
        {
          success: false,
          error: "Current password is incorrect.",
          message: "Current password is incorrect.",
        },
        { status: 401 },
      )
    }

    // 5. Prevent Same Password
    let isSamePassword = false
    if (currentPassword === newPassword) {
      isSamePassword = true
    } else if (
      user.password &&
      (user.password.startsWith("$2a$") ||
        user.password.startsWith("$2b$") ||
        user.password.startsWith("$2y$"))
    ) {
      isSamePassword = await bcrypt.compare(newPassword, user.password)
    }

    if (isSamePassword) {
      return NextResponse.json(
        {
          success: false,
          error: "New password must be different from your current password.",
          message: "New password must be different from your current password.",
        },
        { status: 400 },
      )
    }

    // 6. Confirm Password Validation
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

    // 7. Password Security Policy Validation
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

    // 8. Hash new password with bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // 9. Update MongoDB User record
    user.password = hashedPassword
    user.passwordUpdatedAt = new Date()
    await user.save()

    // 10. Audit Logging
    logSecurityEvent({
      event: "PASSWORD_CHANGED",
      email: user.email,
      role: user.role,
      userId: user._id,
      status: "SUCCESS",
      req,
    })

    // 11. Session Invalidation: Clear session cookie and return success
    const response = NextResponse.json({
      success: true,
      message: "Password changed successfully. Please log in again.",
      passwordUpdatedAt: user.passwordUpdatedAt,
    })

    response.cookies.set("medislot_token", "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
    })

    return response
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update password. Please try again.",
        message: "Failed to update password. Please try again.",
      },
      { status: 500 },
    )
  }
}
