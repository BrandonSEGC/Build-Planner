import { Resend } from "resend"
import type { EmailContent } from "@segc/emails"

/** Sends via Resend when RESEND_API_KEY is set; otherwise logs to console (dev stub). */
export async function sendEmail(input: {
  to: string
  content: EmailContent
  attachment?: { filename: string; content: Buffer } | null
}): Promise<{ delivered: boolean; id?: string }> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.info(`[email:stub] to=${input.to} subject="${input.content.subject}" attachment=${input.attachment?.filename ?? "none"}`)
    return { delivered: false }
  }
  const resend = new Resend(key)
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "SEGC <plan@southeasterngc.com>",
    to: input.to,
    subject: input.content.subject,
    html: input.content.html,
    text: input.content.text,
    attachments: input.attachment
      ? [{ filename: input.attachment.filename, content: input.attachment.content }]
      : undefined,
  })
  if (error) throw new Error(`Resend failed: ${error.message}`)
  return { delivered: true, id: data?.id }
}
