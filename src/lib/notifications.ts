import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || "")

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "GroomingPro <noreply@petsalonos.com>"

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
