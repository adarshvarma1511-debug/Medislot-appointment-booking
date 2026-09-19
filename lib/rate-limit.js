import { NextResponse } from "next/server"

// In-memory sliding window rate limiter store
const rateLimitStore = new Map()

// Periodic cleanup of expired rate limit entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now()
      for (const [key, record] of rateLimitStore.entries()) {
        if (record.resetTime <= now) {
          rateLimitStore.delete(key)
        }
      }
    },
    5 * 60 * 1000,
  ).unref?.()
}

export function getClientIp(req) {
  let ip = "127.0.0.1"
  if (req?.headers) {
    const forwarded = req.headers.get("x-forwarded-for")
    if (forwarded) {
      ip = forwarded.split(",")[0].trim()
    } else {
      ip = req.headers.get("x-real-ip") || "127.0.0.1"
    }
  }
  return ip
}

/**
 * Checks rate limit for an action.
 * @param {Request} req
 * @param {string} action - Action name (e.g., 'login', 'change-password')
 * @param {Object} opts - { maxRequests: number, windowSeconds: number }
 * @returns {{ allowed: boolean, response?: NextResponse, remaining: number, retryAfter: number }}
 */
export function checkRateLimit(req, action = "general", opts = {}) {
  const baseLimit = (opts.maxRequests = opts.maxRequests || 10)
  const isDev = process.env.NODE_ENV !== "production"
  const maxRequests = isDev ? Math.max(baseLimit * 10, 60) : baseLimit
  const windowSeconds = opts.windowSeconds || 60
  const ip = getClientIp(req)
  const key = `${action}:${ip}`
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  let record = rateLimitStore.get(key)

  if (!record || record.resetTime <= now) {
    record = {
      count: 1,
      resetTime: now + windowMs,
    }
    rateLimitStore.set(key, record)
    return { allowed: true, remaining: maxRequests - 1, retryAfter: 0 }
  }

  record.count += 1

  if (record.count > maxRequests) {
    const retryAfter = Math.max(1, Math.ceil((record.resetTime - now) / 1000))
    const response = NextResponse.json(
      {
        success: false,
        error: `Too many requests. Please try again in ${retryAfter} seconds.`,
        message: `Too many requests. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfter.toString(),
        },
      },
    )
    return { allowed: false, response, remaining: 0, retryAfter }
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - record.count),
    retryAfter: 0,
  }
}
