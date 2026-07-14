import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

function configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY,
  )
}

/** Uploads a generated PDF to Cloudflare R2 and returns its stable public URL.
 *  When R2 isn't configured (dev), returns null — the email attaches the PDF instead. */
export async function uploadPdf(key: string, pdf: Buffer): Promise<string | null> {
  if (!configured()) {
    console.info(`[r2:stub] would upload ${key} (${pdf.length} bytes)`)
    return null
  }
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
  const bucket = process.env.R2_BUCKET ?? "segc-build-planner"
  await client.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: pdf, ContentType: "application/pdf" }),
  )
  const base = process.env.R2_PUBLIC_BASE_URL
  return base ? `${base.replace(/\/$/, "")}/${key}` : null
}
