import nodemailer from 'nodemailer';

// Keep this flexible based on what SMTP service you'll plug in!
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',         // Often 'smtp.sendgrid.net', 'smtp.mailgun.org', etc.
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',               // true for 465, false for 587/25
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendSupervisorInvitationEmail(
  supervisorEmail: string,
  traineeName: string,
  acceptLink: string
) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"OJT DTR Team" <no-reply@ojt-dtr.com>', // Sender address
      to: supervisorEmail,
      subject: `OJT App: ${traineeName} has invited you to be their Supervisor`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Supervisor Invitation</h2>
          <p>Hello,</p>
          <p><strong>${traineeName}</strong> has invited you to act as their supervisor to monitor their Daily Time Record (DTR).</p>
          <p>Please click the link below to safely accept the invitation and view their records:</p>
          <p style="margin: 30px 0;">
            <a href="${acceptLink}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Accept Invitation</a>
          </p>
          <p style="font-size: 14px; color: #666;">Or copy and paste this link in your browser: <br/> <a href="${acceptLink}">${acceptLink}</a></p>
          <hr style="border: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #999;">If you don't know this person, you can safely ignore this email.</p>
        </div>
      `,
    });

    console.log('Message sent: %s', info.messageId);
    return { success: true, data: info };
  } catch (error) {
    console.error('Exception sending email via Nodemailer:', error);
    return { success: false, error };
  }
}