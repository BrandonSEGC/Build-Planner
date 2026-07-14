/** Verifies a Cloudflare Turnstile token server-side.
 *  When TURNSTILE_SECRET_KEY is unset, verification is skipped (dev / pre-launch). */
export async function verifyTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token) return false
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) }),
  })
  if (!response.ok) return false
  const body = (await response.json()) as { success: boolean }
  return body.success
}
