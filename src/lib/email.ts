import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

export interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        });
        console.log(`✅ Email sent to ${options.to}`);
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
