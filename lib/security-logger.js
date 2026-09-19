import { getClientIp } from "./rate-limit"

/**
 * Sanitizes and logs security events strictly without sensitive credentials.
 * NEVER logs passwords, hashes, reset tokens, or auth tokens.
 */
export function logSecurityEvent({
  event,
  email = null,
  role = null,
  userId = null,
  ip = null,
  req = null,
  status = "INFO",
  reason = null,
}) {
  const clientIp = ip || (req ? getClientIp(req) : "unknown")
  const timestamp = new Date().toISOString()

  // Mask email for extra privacy if desired, but keeping domain visible
  let safeEmail = email ? email.trim().toLowerCase() : "unspecified"

  const logPayload = {
    timestamp,
    securityEvent: event,
    status,
    role: role || "unknown",
    user: safeEmail,
    ...(userId ? { userId: userId.toString() } : {}),
    ip: clientIp,
    ...(reason ? { reason } : {}),
  }

  const line = `[SECURITY AUDIT] [${timestamp}] [${status}] EVENT=${event} | USER=${safeEmail} | ROLE=${role || "unknown"} | IP=${clientIp}${
    reason ? ` | REASON="${reason}"` : ""
  }`

  if (status === "FAIL" || status === "WARN") {
    console.warn(line)
  } else {
    console.log(line)
  }

  return logPayload
}
