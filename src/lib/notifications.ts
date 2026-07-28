import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || "")

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "GroomingPro <noreply@petsalonos.com>"

// ── Twilio SMS config ────────────────────────────────────────
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || ""
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN || ""
const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER || "" // E.164, e.g. +1XXXXXXXXXX
const SMS_ENABLED = Boolean(TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM)
const IS_DEMO = process.env.GROOMING_DEMO === "true"

// Lazy-load Twilio client only when configured (avoids import cost in demo mode)
let twilioClient: import("twilio").Twilio | null = null
async function getTwilio() {
  if (!SMS_ENABLED) return null
  if (!twilioClient) {
    const twilio = await import("twilio")
    twilioClient = twilio.default(TWILIO_SID, TWILIO_TOKEN)
  }
  return twilioClient
}

/**
 * Normalize a US phone number to E.164 format expected by Twilio.
 * Accepts "(415) 555-1234", "415-555-1234", "4155551234" → "+14155551234"
 * Returns null if the number is not a valid 10-digit US number.
 */
function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`
  return null
}

/**
 * Core SMS sender. Returns true on success, false on failure.
 * In demo mode (no Twilio keys), logs to console and returns true.
 */
export async function sendSMS(to: string, body: string): Promise<boolean> {
  const normalized = normalizePhone(to)
  if (!normalized) {
    console.warn("[SMS] Skipping: invalid phone number:", to)
    return false
  }

  // Demo mode: no Twilio keys configured — log instead of sending
  if (!SMS_ENABLED || IS_DEMO) {
    console.log(`[SMS DEMO] To: ${normalized} | Body: ${body}`)
    return true
  }

  try {
    const client = await getTwilio()
    if (!client) return false
    await client.messages.create({
      from: TWILIO_FROM,
      to: normalized,
      body: body.slice(0, 1600), // Twilio hard limit is 1600 chars
    })
    return true
  } catch (err) {
    console.error("[SMS] Failed to send:", err)
    return false
  }
}

// ── SMS templates ────────────────────────────────────────────

interface SmsData {
  customerName: string
  customerPhone: string | null
  petName: string
  serviceName: string
  startTime: string
  shopName: string
  shopPhone?: string | null
}

function formatSmsDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

function formatSmsTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

/**
 * SMS sent immediately when an appointment is booked/confirmed.
 */
export async function sendConfirmationSMS(data: SmsData): Promise<boolean> {
  if (!data.customerPhone) return false
  const body = `${data.shopName}: Hi ${data.customerName}, ${data.petName}'s ${data.serviceName} is confirmed for ${formatSmsDate(data.startTime)} at ${formatSmsTime(data.startTime)}. See you then!`
  return sendSMS(data.customerPhone, body)
}

/**
 * SMS sent 24h before the appointment (called by cron/reminders).
 */
export async function sendReminderSMS(data: SmsData): Promise<boolean> {
  if (!data.customerPhone) return false
  const body = `${data.shopName}: Reminder - ${data.petName}'s grooming is TOMORROW at ${formatSmsTime(data.startTime)}. Reply C to confirm or call ${data.shopPhone || "the salon"} to reschedule.`
  return sendSMS(data.customerPhone, body)
}

/**
 * SMS sent when an appointment status changes (completed/canceled/no_show).
 */
export async function sendStatusUpdateSMS(
  data: SmsData,
  status: "completed" | "canceled" | "no_show"
): Promise<boolean> {
  if (!data.customerPhone) return false
  let body = ""
  if (status === "completed") {
    body = `${data.shopName}: ${data.petName}'s grooming is done and looking great! Ready for pickup. Thank you!`
  } else if (status === "canceled") {
    body = `${data.shopName}: Your ${formatSmsDate(data.startTime)} appointment for ${data.petName} was canceled. Call ${data.shopPhone || "us"} to reschedule.`
  } else if (status === "no_show") {
    body = `${data.shopName}: We missed ${data.petName} today! Call ${data.shopPhone || "us"} to reschedule the grooming.`
  }
  return body ? sendSMS(data.customerPhone, body) : false
}

interface AppointmentEmail {
  customerName: string
  customerEmail: string
  petName: string
  serviceName: string
  startTime: string
  shopName: string
  bookingLink?: string
}

/**
 * Send confirmation email when an appointment is booked
 */
export async function sendConfirmationEmail(data: AppointmentEmail) {
  const dateStr = new Date(data.startTime).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const timeStr = new Date(data.startTime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.customerEmail],
      subject: `Appointment Confirmed - ${data.petName}'s ${data.serviceName}`,
      html: confirmationTemplate({ ...data, formattedDate: dateStr, formattedTime: timeStr }),
    })
    return true
  } catch (err) {
    console.error("Failed to send confirmation email:", err)
    return false
  }
}

/**
 * Send reminder email 1 day before appointment
 */
export async function sendReminderEmail(data: AppointmentEmail) {
  const dateStr = new Date(data.startTime).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
  const timeStr = new Date(data.startTime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.customerEmail],
      subject: `Reminder: ${data.petName}'s grooming tomorrow at ${timeStr}`,
      html: reminderTemplate({ ...data, formattedDate: dateStr, formattedTime: timeStr }),
    })
    return true
  } catch (err) {
    console.error("Failed to send reminder email:", err)
    return false
  }
}

interface TemplateData extends AppointmentEmail {
  formattedDate: string
  formattedTime: string
}

function confirmationTemplate(data: TemplateData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #7c3aed; margin: 0;">🐾 ${data.shopName}</h1>
  </div>
  <div style="background: #f5f3ff; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
    <h2 style="color: #4c1d95; margin: 0 0 16px 0;">Appointment Confirmed!</h2>
    <p style="margin: 0 0 8px 0;"><strong>Pet:</strong> ${data.petName}</p>
    <p style="margin: 0 0 8px 0;"><strong>Service:</strong> ${data.serviceName}</p>
    <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${data.formattedDate}</p>
    <p style="margin: 0;"><strong>Time:</strong> ${data.formattedTime}</p>
  </div>
  <p style="color: #6b7280; font-size: 14px; text-align: center;">
    Need to change? <a href="${data.bookingLink || "#"}" style="color: #7c3aed;">Manage your booking</a>
  </p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
  <p style="color: #9ca3af; font-size: 12px; text-align: center;">
    Powered by GroomingPro — AI-powered pet grooming management
  </p>
</body>
</html>`
}

function reminderTemplate(data: TemplateData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #7c3aed; margin: 0;">🐾 ${data.shopName}</h1>
  </div>
  <div style="background: #fef3c7; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
    <h2 style="color: #92400e; margin: 0 0 16px 0;">⏰ Tomorrow's Appointment</h2>
    <p style="margin: 0 0 8px 0;">Just a friendly reminder that <strong>${data.petName}</strong> has a grooming appointment tomorrow!</p>
    <p style="margin: 0 0 8px 0;"><strong>Service:</strong> ${data.serviceName}</p>
    <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${data.formattedDate}</p>
    <p style="margin: 0;"><strong>Time:</strong> ${data.formattedTime}</p>
  </div>
  <p style="color: #6b7280; font-size: 14px; text-align: center;">
    Can't make it? Please let us know in advance.
  </p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
  <p style="color: #9ca3af; font-size: 12px; text-align: center;">
    Powered by GroomingPro
  </p>
</body>
</html>`
}
