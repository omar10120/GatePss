import nodemailer from 'nodemailer';
import type Transporter from 'nodemailer/lib/mailer';
import { authOtpLog } from '@/lib/auth-otp-log';

/** Read at request time — Next.js can inline top-level `process.env.X` at build time. */
function getSmtpConfig() {
  const host = process.env['SMTP_HOST'];
  const port = Number.parseInt(process.env['SMTP_PORT'] || '587', 10);
  const user = process.env['SMTP_USER'];
  const password = process.env['SMTP_PASSWORD'];
  const from = process.env['EMAIL_FROM'] || process.env['SMTP_USER'];
  const resolvedPort = Number.isNaN(port) ? 587 : port;
  return {
    host,
    user,
    password,
    from,
    port: resolvedPort,
    secure: resolvedPort === 465,
    skipVerify: process.env['SMTP_SKIP_VERIFY'] === 'true',
    tlsRejectUnauthorized: process.env['SMTP_TLS_REJECT_UNAUTHORIZED'] !== 'false',
  };
}

function createTransporter(cfg: ReturnType<typeof getSmtpConfig>): Transporter {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    requireTLS: !cfg.secure,
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    auth: {
      user: cfg.user,
      pass: cfg.password,
    },
    tls: {
      rejectUnauthorized: cfg.tlsRejectUnauthorized,
      servername: cfg.host || undefined,
    },
  });
}

let smtpVerified = false;
let smtpVerificationInProgress: Promise<void> | null = null;
let cachedTransporter: Transporter | null = null;

async function ensureSmtpReady(): Promise<Transporter> {
  const cfg = getSmtpConfig();

  if (!cfg.host || !cfg.user || !cfg.password || !cfg.from) {
    // #region agent log
    fetch('http://127.0.0.1:7462/ingest/57bc6c0c-3c40-4f52-952b-a9b5a5dda95f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4eceec'},body:JSON.stringify({sessionId:'4eceec',location:'email.ts:ensureSmtpReady',message:'SMTP env incomplete at runtime',data:{hasHost:Boolean(cfg.host),hasUser:Boolean(cfg.user),hasPassword:Boolean(cfg.password),hasFrom:Boolean(cfg.from),cwd:process.cwd()},timestamp:Date.now(),hypothesisId:'H2-build-inlined-env'})}).catch(()=>{});
    // #endregion
    throw new Error('SMTP configuration is incomplete. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and EMAIL_FROM.');
  }

  if (smtpVerified && cachedTransporter) {
    return cachedTransporter;
  }

  if (smtpVerificationInProgress) {
    await smtpVerificationInProgress;
    return cachedTransporter!;
  }

  const transporter = createTransporter(cfg);
  cachedTransporter = transporter;

  smtpVerificationInProgress = (async () => {
    try {
      if (cfg.skipVerify) {
        smtpVerified = true;
        authOtpLog.smtpConnectionOk();
        return;
      }
      await transporter.verify();
      smtpVerified = true;
      authOtpLog.smtpConnectionOk();
    } catch (error) {
      smtpVerified = false;
      cachedTransporter = null;
      authOtpLog.smtpConnectionFailed(error);
      throw new Error('SMTP connection failed. Please verify mail server credentials and network access.');
    } finally {
      smtpVerificationInProgress = null;
    }
  })();

  await smtpVerificationInProgress;
  return transporter;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const transporter = await ensureSmtpReady();
    const cfg = getSmtpConfig();
    await transporter.sendMail({
      from: cfg.from,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
}

export async function sendRequestConfirmationEmail(
  applicantEmail: string,
  applicantName: string,
  requestNumber: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-left: 4px solid #0ea5e9; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Gate Pass Request Received</h1>
        </div>
        <div class="content">
          <p>Dear ${applicantName},</p>
          <p>Thank you for submitting your gate pass request to Majis Industrial Services.</p>
          <div class="info-box">
            <strong>Request Number:</strong> ${requestNumber}<br>
            <strong>Status:</strong> Pending Review
          </div>
          <p>Your request is currently being reviewed by our team. You will receive another email once your request has been processed.</p>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br><strong>Majis Industrial Services</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: applicantEmail,
    subject: `Gate Pass Request Confirmation - ${requestNumber}`,
    html,
  });
}

export async function sendRequestApprovalEmail(
  applicantEmail: string,
  applicantName: string,
  requestNumber: string,
  dateOfVisit: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #22c55e 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .success-box { background: #dcfce7; padding: 20px; border-left: 4px solid #22c55e; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Gate Pass Approved</h1>
        </div>
        <div class="content">
          <p>Dear ${applicantName},</p>
          <p>Great news! Your gate pass request has been approved.</p>
          <div class="success-box">
            <strong>Request Number:</strong> ${requestNumber}<br>
            <strong>Date of Visit:</strong> ${dateOfVisit}<br>
            <strong>Status:</strong> Approved
          </div>
          <p>Your gate pass with QR code has been generated and attached to this email. Please present this QR code at the gate entrance.</p>
          <p><strong>Important:</strong> Please carry a valid ID for verification at the gate.</p>
          <p>Best regards,<br><strong>Majis Industrial Services</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: applicantEmail,
    subject: `Gate Pass Approved - ${requestNumber}`,
    html,
  });
}

export async function sendRequestRejectionEmail(
  applicantEmail: string,
  applicantName: string,
  requestNumber: string,
  rejectionReason: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .warning-box { background: #fee2e2; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Gate Pass Request Update</h1>
        </div>
        <div class="content">
          <p>Dear ${applicantName},</p>
          <p>We regret to inform you that your gate pass request has not been approved.</p>
          <div class="warning-box">
            <strong>Request Number:</strong> ${requestNumber}<br>
            <strong>Status:</strong> Rejected<br><br>
            <strong>Reason:</strong><br>${rejectionReason}
          </div>
          <p>If you believe this decision was made in error or if you have additional information to provide, please contact our support team.</p>
          <p>Best regards,<br><strong>Majis Industrial Services</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: applicantEmail,
    subject: `Gate Pass Request Update - ${requestNumber}`,
    html,
  });
}

export async function sendAdminNotificationEmail(
  requestNumber: string,
  applicantName: string,
  requestType: string,
  dateOfVisit: string
): Promise<void> {
  const adminEmails = process.env.ADMIN_EMAIL_GROUP?.split(',') || [];

  if (adminEmails.length === 0) {
    console.warn('⚠️ No admin emails configured');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #d946ef 0%, #a21caf 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-left: 4px solid #d946ef; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #d946ef; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 New Gate Pass Request</h1>
        </div>
        <div class="content">
          <p>A new gate pass request has been submitted and requires your review.</p>
          <div class="info-box">
            <strong>Request Number:</strong> ${requestNumber}<br>
            <strong>Applicant:</strong> ${applicantName}<br>
            <strong>Type:</strong> ${requestType}<br>
            <strong>Date of Visit:</strong> ${dateOfVisit}
          </div>
          <p>Please log in to the admin portal to review and process this request.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/requests" class="button">Review Request</a>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: adminEmails,
    subject: `New Gate Pass Request - ${requestNumber}`,
    html,
  });
}

export async function sendOTPEmail(
  userEmail: string,
  userName: string,
  otpCode: string
): Promise<void> {
  authOtpLog.otpEmailSending(userEmail);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .otp-box { background: white; padding: 30px; border: 2px dashed #14b8a6; margin: 20px 0; text-align: center; border-radius: 8px; }
        .otp-code { font-size: 32px; font-weight: bold; color: #14b8a6; letter-spacing: 8px; font-family: 'Courier New', monospace; }
        .warning { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Verify Your Identity</h1>
        </div>
        <div class="content">
          <p>Dear ${userName},</p>
          <p>You have requested to sign in to your account. Please use the following One-Time Password (OTP) to complete your login:</p>
          <div class="otp-box">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your OTP Code:</p>
            <div class="otp-code">${otpCode}</div>
          </div>
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> This OTP will expire in 10 minutes. Do not share this code with anyone.
          </div>
          <p>If you did not request this login, please ignore this email or contact support immediately.</p>
          <p>Best regards,<br><strong>Majis Industrial Services</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const transporter = await ensureSmtpReady();
    const cfg = getSmtpConfig();
    const result = await transporter.sendMail({
      from: cfg.from,
      to: userEmail,
      subject: 'Your Login Verification Code',
      html,
    });
    authOtpLog.otpEmailSent(userEmail, result.messageId);
  } catch (error) {
    authOtpLog.otpEmailFailed(userEmail, error);
    throw error;
  }
}

export async function sendContactFormEmail(
  fullName: string,
  email: string,
  passType: string,
  phoneNumber: string,
  message: string,
  adminEmails: string[]
): Promise<void> {
  if (adminEmails.length === 0) {
    console.warn('⚠️ No admin emails provided for contact form notification');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #00B09C 0%, #0d9488 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-left: 4px solid #00B09C; margin: 20px 0; border-radius: 4px; }
        .info-row { margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .info-label { font-weight: bold; color: #374151; display: inline-block; min-width: 150px; }
        .info-value { color: #6b7280; }
        .message-box { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 3px solid #00B09C; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📧 New Contact Form Submission</h1>
        </div>
        <div class="content">
          <p>A new contact form has been submitted through the website.</p>
          <div class="info-box">
            <div class="info-row">
              <span class="info-label">Full Name:</span>
              <span class="info-value">${fullName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value"><a href="mailto:${email}">${email}</a></span>
            </div>
            <div class="info-row">
              <span class="info-label">Phone Number:</span>
              <span class="info-value"><a href="tel:${phoneNumber}">${phoneNumber}</a></span>
            </div>
            <div class="info-row">
              <span class="info-label">Pass Type:</span>
              <span class="info-value">${passType}</span>
            </div>
          </div>
          <div class="message-box">
            <strong>Message:</strong>
            <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
            <strong>Submitted:</strong> ${new Date().toLocaleString()}
          </p>
        </div>
        <div class="footer">
          <p>This is an automated notification from the Gate Pass System.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: adminEmails,
    subject: `New Contact Form Submission from ${fullName}`,
    html,
  });
}
