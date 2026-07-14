// SEGC Build Planner — transactional email templates.
// Hand-built, inline-styled HTML (email-client-safe). Brand tokens match packages/ui.
// Swap point: these can be migrated to React Email components without changing callers —
// each template returns { subject, html, text }.

const BROWN = "#451E00"
const GOLD = "#F4B214"
const INK = "#141414"
const WARM = "#FFFBF5"
const CREAM = "#FFFCFC"

export interface EmailContent {
  subject: string
  html: string
  text: string
}

function layout(preheader: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Inter:wght@400;600&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background:${CREAM};">
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};">
    <tr><td align="center" style="padding:28px 14px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:${BROWN};padding:26px 32px;">
            <div style="font-family:Oswald,Arial Narrow,sans-serif;font-weight:700;font-size:13px;letter-spacing:1px;color:${GOLD};text-transform:uppercase;">&#9632; THE SEGC BUILD PLANNER &#9632;</div>
            <div style="font-family:Oswald,Arial Narrow,sans-serif;font-weight:700;font-size:22px;color:${WARM};text-transform:uppercase;margin-top:8px;">SOUTH EASTERN GENERAL CONTRACTORS</div>
          </td>
        </tr>
        <tr><td style="background:#FFFFFF;padding:32px;">${bodyHtml}</td></tr>
        <tr>
          <td style="background:${BROWN};padding:20px 32px;">
            <div style="font-family:Inter,Arial,sans-serif;font-size:11px;line-height:1.5;color:${WARM};opacity:.75;">
              South Eastern General Contractors &middot; Fayetteville, NC<br />
              20+ Years &middot; SBA 8(a) &amp; HUBZone Certified &middot; #1 Rated Contractor<br />
              You received this because you requested a result from The SEGC Build Planner.
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function goldButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${GOLD};color:#000000;font-family:Oswald,Arial Narrow,sans-serif;font-weight:700;font-size:15px;text-transform:uppercase;text-decoration:none;padding:15px 24px;border-radius:0;">${label} &rsaquo;</a>`
}

export function estimateResultEmail(input: {
  firstName: string
  headline: string
  psf: string
  regionName: string
  styleName: string
  pdfUrl?: string | null
  bookingUrl: string
  briefUrl: string
}): EmailContent {
  const { firstName, headline, psf, regionName, styleName, pdfUrl, bookingUrl, briefUrl } = input
  const subject = `${firstName}, your custom home estimate is ready: ${headline}`
  const html = layout(
    `Your SEGC build range: ${headline}`,
    `
    <div style="font-family:Oswald,Arial Narrow,sans-serif;font-weight:700;font-size:13px;color:${BROWN};text-transform:uppercase;">&#9632; YOUR CUSTOM HOME RANGE &#9632;</div>
    <h1 style="font-family:Oswald,Arial Narrow,sans-serif;font-weight:700;font-size:34px;line-height:1.05;color:${INK};text-transform:uppercase;margin:12px 0 6px;">${headline}</h1>
    <p style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#5E574F;margin:0 0 22px;">${psf} effective per sq ft &middot; ${regionName} &middot; ${styleName}</p>
    <p style="font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6;color:${INK};margin:0 0 18px;">
      ${firstName}, this is your directional planning range from The SEGC Build Planner —
      the same math we use when we sit down with clients. Your full breakdown is attached as a PDF${pdfUrl ? ` (or <a href="${pdfUrl}" style="color:${BROWN};font-weight:600;">download it here</a>)` : ""}.
    </p>
    <div style="border:1px dashed ${GOLD};background:rgba(244,178,20,.07);padding:14px 16px;font-family:Inter,Arial,sans-serif;font-size:13px;color:${INK};margin:0 0 26px;">
      <strong style="font-family:Oswald,Arial Narrow,sans-serif;text-transform:uppercase;">What this is:</strong>
      a planning range, not a quote. Site conditions and final selections move real numbers — that’s exactly what a consultation pins down.
    </div>
    <div style="margin:0 0 12px;">${goldButton(bookingUrl, "BOOK A FREE DESIGN CONSULTATION")}</div>
    <div><a href="${briefUrl}" style="display:inline-block;border:1px solid ${INK};color:${INK};font-family:Oswald,Arial Narrow,sans-serif;font-weight:700;font-size:14px;text-transform:uppercase;text-decoration:none;padding:14px 22px;">START YOUR PROJECT BRIEF &rsaquo;</a></div>
    `,
  )
  const text = [
    `${firstName}, your custom home estimate is ready.`,
    ``,
    `YOUR RANGE: ${headline}`,
    `${psf} effective per sq ft · ${regionName} · ${styleName}`,
    ``,
    pdfUrl ? `Download your PDF: ${pdfUrl}` : `Your full breakdown is attached as a PDF.`,
    ``,
    `Book a free design consultation: ${bookingUrl}`,
    `Start your project brief: ${briefUrl}`,
    ``,
    `— South Eastern General Contractors`,
  ].join("\n")
  return { subject, html, text }
}

export function moduleResultEmail(input: {
  toolLabel: string // e.g. "AFFORDABILITY REPORT"
  firstName: string
  headline: string
  subline: string
  rows: [string, string][]
  note: string
  pdfUrl?: string | null
  bookingUrl: string
  briefUrl: string
}): EmailContent {
  const { toolLabel, firstName, headline, subline, rows, note, pdfUrl, bookingUrl, briefUrl } = input
  const subject = `${firstName}, your ${toolLabel.toLowerCase()} is ready: ${headline}`
  const rowsHtml = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="font-family:Inter,Arial,sans-serif;font-size:13px;color:#5E574F;padding:9px 0;border-bottom:1px dashed #D7D0C8;">${label}</td>
        <td style="font-family:Oswald,Arial Narrow,sans-serif;font-weight:700;font-size:13px;color:${INK};padding:9px 0;border-bottom:1px dashed #D7D0C8;text-align:right;text-transform:uppercase;">${value}</td>
      </tr>`,
    )
    .join("")
  const html = layout(
    `Your SEGC result: ${headline}`,
    `
    <div style="font-family:Oswald,Arial Narrow,sans-serif;font-weight:700;font-size:13px;color:${BROWN};text-transform:uppercase;">&#9632; ${toolLabel} &#9632;</div>
    <h1 style="font-family:Oswald,Arial Narrow,sans-serif;font-weight:700;font-size:32px;line-height:1.05;color:${INK};text-transform:uppercase;margin:12px 0 6px;">${headline}</h1>
    <p style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#5E574F;margin:0 0 20px;">${subline}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">${rowsHtml}</table>
    <div style="border:1px dashed ${GOLD};background:rgba(244,178,20,.07);padding:14px 16px;font-family:Inter,Arial,sans-serif;font-size:13px;color:${INK};margin:0 0 24px;">${note}</div>
    ${pdfUrl ? `<p style="font-family:Inter,Arial,sans-serif;font-size:13px;margin:0 0 20px;">Your full report is attached — or <a href="${pdfUrl}" style="color:${BROWN};font-weight:600;">download it here</a>.</p>` : `<p style="font-family:Inter,Arial,sans-serif;font-size:13px;margin:0 0 20px;">Your full report is attached as a PDF.</p>`}
    <div style="margin:0 0 12px;">${goldButton(bookingUrl, "BOOK A FREE DESIGN CONSULTATION")}</div>
    <div><a href="${briefUrl}" style="display:inline-block;border:1px solid ${INK};color:${INK};font-family:Oswald,Arial Narrow,sans-serif;font-weight:700;font-size:14px;text-transform:uppercase;text-decoration:none;padding:14px 22px;">START YOUR PROJECT BRIEF &rsaquo;</a></div>
    `,
  )
  const text = [
    `${firstName}, your ${toolLabel.toLowerCase()} is ready.`,
    ``,
    `RESULT: ${headline}`,
    subline,
    ``,
    ...rows.map(([label, value]) => `${label}: ${value}`),
    ``,
    note,
    ``,
    pdfUrl ? `Download your PDF: ${pdfUrl}` : `Your full report is attached as a PDF.`,
    ``,
    `Book a free design consultation: ${bookingUrl}`,
    `Start your project brief: ${briefUrl}`,
    ``,
    `— South Eastern General Contractors`,
  ].join("\n")
  return { subject, html, text }
}

export function magicLinkEmail(input: { resumeUrl: string }): EmailContent {
  const subject = "Resume your SEGC Build Plan"
  const html = layout(
    "Pick up your Build Plan where you left off.",
    `
    <div style="font-family:Oswald,Arial Narrow,sans-serif;font-weight:700;font-size:13px;color:${BROWN};text-transform:uppercase;">&#9632; MY BUILD PLAN &#9632;</div>
    <h1 style="font-family:Oswald,Arial Narrow,sans-serif;font-weight:700;font-size:30px;line-height:1.05;color:${INK};text-transform:uppercase;margin:12px 0 14px;">PICK UP WHERE YOU LEFT OFF.</h1>
    <p style="font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6;color:${INK};margin:0 0 22px;">
      Tap the button below to reopen your Build Plan — your answers, results, and progress are saved. The link expires in 24 hours.
    </p>
    ${goldButton(input.resumeUrl, "RESUME MY BUILD PLAN")}
    `,
  )
  const text = `Resume your SEGC Build Plan (link expires in 24 hours): ${input.resumeUrl}`
  return { subject, html, text }
}
