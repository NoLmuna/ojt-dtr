import nodemailer from 'nodemailer';

/**
 * Creates and returns a configured Nodemailer Transporter instance.
 * Automatically handles SSL/TLS detection (port 465 vs 587/25), trimmed credentials, and timeouts.
 */
export function getMailTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;

  // Auto-detect secure mode: port 465 requires SSL/TLS (secure: true).
  // If SMTP_SECURE is explicitly set, use it; otherwise infer from port.
  const secure =
    port === 465
      ? true
      : process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === 'true'
      : false;

  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    connectionTimeout: 10000, // 10s timeout to prevent hanging requests
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

/**
 * Verifies the SMTP configuration without sending an email.
 * Useful for diagnostics and health checks.
 */
export async function verifySmtpConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = getMailTransporter();
    await transporter.verify();
    return { success: true, message: 'SMTP connection verified successfully.' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('SMTP verification failed:', message);
    return { success: false, message };
  }
}

/**
 * Sends a supervisor invitation email with responsive HTML and plain-text fallback.
 */
export async function sendSupervisorInvitationEmail(
  supervisorEmail: string,
  traineeName: string,
  acceptLink: string
): Promise<{ success: boolean; data?: nodemailer.SentMessageInfo; error?: string }> {
  try {
    const transporter = getMailTransporter();
    const fromAddress =
      process.env.SMTP_FROM ||
      (process.env.SMTP_USER
        ? `"OJT DTR System" <${process.env.SMTP_USER}>`
        : '"OJT DTR Team" <no-reply@ojt-dtr.com>');

    const info = await transporter.sendMail({
      from: fromAddress,
      to: supervisorEmail,
      subject: `OJT App: ${traineeName} has invited you to be their Supervisor`,
      text: `Hello,\n\n${traineeName} has invited you to act as their official OJT Supervisor to verify and monitor their Daily Time Record (CSC Form 48).\n\nPlease accept the invitation using the link below:\n${acceptLink}\n\nIf you do not know this trainee, you can safely ignore this email.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <!-- Header Banner -->
            <tr>
              <td style="padding: 28px 32px; background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);">
                <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">OJT Daily Time Record</h1>
                <p style="margin: 6px 0 0; color: #bfdbfe; font-size: 13px;">Supervisor Invitation Request</p>
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding: 32px;">
                <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #334155;">Hello,</p>
                <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #334155;">
                  <strong>${traineeName}</strong> has invited you to act as their official OJT Supervisor to monitor and verify their Daily Time Record (CSC Form 48).
                </p>
                <div style="background-color: #f1f5f9; border-radius: 10px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #2563eb;">
                  <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
                    By accepting, you will be linked to their account to review daily attendance logs, geofenced timestamps, and monthly hour totals.
                  </p>
                </div>
                <table border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                  <tr>
                    <td align="center" style="border-radius: 10px; background-color: #2563eb;">
                      <a href="${acceptLink}" target="_blank" style="font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 13px 26px; border-radius: 10px; display: inline-block;">
                        Accept Invitation &rarr;
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin: 24px 0 6px; font-size: 12px; color: #64748b; line-height: 1.5;">
                  Or copy and paste this link in your browser:
                </p>
                <p style="margin: 0; font-size: 12px; word-break: break-all; color: #2563eb;">
                  <a href="${acceptLink}" style="color: #2563eb; text-decoration: underline;">${acceptLink}</a>
                </p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0 20px;" />
                <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                  This invitation was sent to ${supervisorEmail}. If you were not expecting this, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log('Invitation email sent successfully:', info.messageId);
    return { success: true, data: info };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Exception sending email via Nodemailer:', errorMessage);
    return { success: false, error: errorMessage };
  }
}