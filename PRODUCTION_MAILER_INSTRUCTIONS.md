# Production Setup Guide: Supervisor Email Invitations

This application uses **Nodemailer** to handle the email invitations sent by Trainees to their Supervisors. In a production environment, you need an active and secure SMTP server to reliably send these emails.

## 1. Prerequisites

You must use a reliable SMTP provider for production to ensure emails do not get flagged as spam. 
Popular providers include:
- **Google Workspace (Gmail)** Setup via App Passwords
- **Amazon SES**
- **SendGrid**
- **Mailgun**
- **Postmark**

## 2. Environment Variables

In your production environment (Vercel, AWS, your own VPS, etc.), you need to set the following environment variables. If you are using an `.env` file on a traditional server, add these lines:

```env
# Mailer configuration (Example using Gmail SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_USER="your.app.email@gmail.com"
SMTP_PASS="your-16-digit-app-password"
SMTP_FROM="OJT DTR System <your.app.email@gmail.com>"

# Application URL (CRITICAL for formatting the invitation link)
# Make sure to omit the trailing slash
NEXT_PUBLIC_APP_URL="https://your-production-domain.com"
```

## 3. Configuring Gmail (If using a Google Account)

If you decide to use a standard Gmail or Google Workspace account as your sender:
1. Log into the Google Account.
2. Navigate to **Manage your Google Account** -> **Security**.
3. Ensure **2-Step Verification** is turned ON.
4. Search for or navigate to **App passwords**.
5. Create a new App Password (e.g., name it "OJT DTR System").
6. Copy the generated 16-character password.
7. Paste it into the `SMTP_PASS` environment variable (without spaces).
8. Put `smtp.gmail.com` as your `SMTP_HOST` and `465` as your `SMTP_PORT`.

## 4. Important Production Checks

- **`NEXT_PUBLIC_APP_URL`**: Ensure this is accurately set to your live website (e.g., `https://dtr.myschool.edu`). If it's missing or set to `localhost`, the Supervisor will receive a broken link in their email.
- **Port Differences**: 
  - `465` is for secure SMTP (SSL/TLS). 
  - `587` is for STARTTLS. 
  - Depending on your hosting provider (like DigitalOcean, AWS, or host blocks), port 25 or 465 might be blocked by default. You may need to use port `587` or request the port to be unblocked by your host.
- **SPAM Filters**: Emails coming from naked domains without proper SPF/DKIM/DMARC records often go to Spam. Using established SMTP providers (Sendgrid, AWS SES) and authenticating your domain is highly recommended over generic Gmail accounts for large-scale deployments.

## 5. Troubleshooting
If the invitation emails are failing in production:
1. Check your production server logs. Nodemailer will typically output authentication errors (e.g., `Invalid login: 535-5.7.8 Username and Password not accepted`).
2. Verify the `SMTP_PASS` didn't expire.
3. Ensure your firewall allows outbound connections on your deployed SMTP port (465 / 587).