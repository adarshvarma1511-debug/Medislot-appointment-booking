import crypto from "node:crypto"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"

const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.SESSION_SECRET ||
  "medislot-secure-auth-session-key-2026"

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/")
  while (base64.length % 4) {
    base64 += "="
  }
  return Buffer.from(base64, "base64").toString("utf8")
}

export function signSessionToken(payload, expiresInSeconds = 7 * 24 * 3600) {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: "HS256", typ: "JWT" }
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload))

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

export function verifySessionToken(token) {
  if (!token || typeof token !== "string") return null
  const parts = token.split(".")
  if (parts.length !== 3) return null

  const [encodedHeader, encodedPayload, signature] = parts

  const expectedSignature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")

  // Constant-time comparison
  if (signature.length !== expectedSignature.length) return null
  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expectedSignature)
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload))
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      return null // Expired
    }
    return payload
  } catch {
    return null
  }
}

/**
 * Resolves the authenticated user strictly from session cookie or Bearer header.
 * Enforces session invalidation if password was updated after token issuance.
 */
export async function getAuthenticatedUser(req) {
  try {
    let token = null

    // 1. Check HTTP-only cookie
    if (req.cookies) {
      const cookieVal =
        typeof req.cookies.get === "function"
          ? req.cookies.get("medislot_token")?.value
          : null
      if (cookieVal) token = cookieVal
    }

    // 2. Check Authorization header
    if (!token && req.headers) {
      const authHeader =
        typeof req.headers.get === "function"
          ? req.headers.get("authorization")
          : null
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7).trim()
      }
    }

    if (!token) {
      return { success: false, status: 401, error: "Authentication required." }
    }

    const decoded = verifySessionToken(token)
    if (!decoded || !decoded.userId) {
      return { success: false, status: 401, error: "Authentication required." }
    }

    await connectToDatabase()
    const user = await User.findById(decoded.userId)

    if (!user) {
      return { success: false, status: 401, error: "Authentication required." }
    }

    if (user.status === "Inactive") {
      return {
        success: false,
        status: 403,
        error: "Account is inactive. Please contact administration.",
      }
    }

    // 3. Verify session invalidation: if user changed password after token was issued
    if (user.passwordUpdatedAt) {
      const currentPwu = new Date(user.passwordUpdatedAt).getTime()
      if (decoded.pwu !== undefined) {
        if (decoded.pwu < currentPwu) {
          return {
            success: false,
            status: 401,
            error:
              "Session expired due to password update. Please log in again.",
            revoked: true,
          }
        }
      } else {
        const tokenIssuedAtMs = decoded.iat ? decoded.iat * 1000 : 0
        if (tokenIssuedAtMs <= currentPwu) {
          return {
            success: false,
            status: 401,
            error:
              "Session expired due to password update. Please log in again.",
            revoked: true,
          }
        }
      }
    }

    return {
      success: true,
      user,
      tokenData: decoded,
    }
  } catch (err) {
    return {
      success: false,
      status: 500,
      error: "Authentication verification failed.",
    }
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 3600, // 7 days
}
