import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize Twilio
let twilioClient: ReturnType<typeof twilio> | null = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

interface EmailResult {
  ok: boolean;
  provider?: 'sendgrid' | 'smtp';
  error?: string;
}

interface SMSOptions {
  to: string;
  body: string;
}

interface SMSResult {
  ok: boolean;
  sid?: string;
  error?: string;
}

/**
 * Send email using SendGrid (primary) with SMTP fallback
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const { to, subject, html, text } = options;
  const fromEmail = process.env.NOTIFICATIONS_FROM_EMAIL || 'no-reply@example.com';

  // Try SendGrid first
  if (process.env.SENDGRID_API_KEY) {
    try {
      await sgMail.send({
        to,
        from: fromEmail,
        subject,
        text: text || '',
        html: html || text || '',
      });

      console.log(`[Email] Sent via SendGrid to ${to}`);
      return { ok: true, provider: 'sendgrid' };
    } catch (error) {
      console.error('[Email] SendGrid failed:', error);
      // Fall through to SMTP
    }
  }

  // Fallback to SMTP
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: parseInt(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: fromEmail,
        to,
        subject,
        text: text || '',
        html: html || text || '',
      });

      console.log(`[Email] Sent via SMTP to ${to}`);
      return { ok: true, provider: 'smtp' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Email] SMTP failed:', errorMessage);
      return { ok: false, error: errorMessage };
    }
  }

  return {
    ok: false,
    error: 'No email provider configured (SENDGRID_API_KEY or SMTP credentials)',
  };
}

/**
 * Send SMS using Twilio
 */
export async function sendSMS(options: SMSOptions): Promise<SMSResult> {
  const { to, body } = options;

  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
    return {
      ok: false,
      error: 'Twilio not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)',
    };
  }

  try {
    const message = await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });

    console.log(`[SMS] Sent to ${to}, SID: ${message.sid}`);
    return { ok: true, sid: message.sid };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SMS] Twilio failed:', errorMessage);
    return { ok: false, error: errorMessage };
  }
}
