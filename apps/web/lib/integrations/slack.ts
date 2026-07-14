/** Posts a lead alert to Slack #leads when SLACK_WEBHOOK_URL is set; otherwise logs (dev stub). */
export async function sendSlackLeadAlert(input: {
  name: string
  phone: string
  email: string
  toolLabel: string
  headline: string
  timeline: string
  returning: boolean
}): Promise<{ delivered: boolean }> {
  const url = process.env.SLACK_WEBHOOK_URL
  const text = [
    `:rotating_light: *New Build Planner lead${input.returning ? " (returning)" : ""}*`,
    `*${input.name}* · ${input.phone} · ${input.email}`,
    `Tool: ${input.toolLabel}`,
    `Result: ${input.headline}`,
    `Timeline: ${input.timeline}`,
  ].join("\n")
  if (!url) {
    console.info(`[slack:stub]\n${text}`)
    return { delivered: false }
  }
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  })
  if (!response.ok) throw new Error(`Slack webhook failed: ${response.status}`)
  return { delivered: true }
}
