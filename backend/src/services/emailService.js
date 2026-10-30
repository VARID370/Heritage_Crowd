const axios = require('axios');
const nodemailer = require('nodemailer');

/**
 * Check if a genuine email provider is configured in environment variables
 */
const getEmailProvider = () => {
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== '') {
    return 'resend';
  }
  if (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim() !== '') {
    return 'brevo';
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return 'smtp';
  }
  return null;
};

const isEmailConfigured = () => {
  return getEmailProvider() !== null;
};

/**
 * Generate responsive HTML email template for account verification
 */
const buildVerificationEmailHtml = ({ name, verificationUrl, otp }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your HeritageConnect Account</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f5f0; margin: 0; padding: 0; color: #23201c; }
    .container { max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e7dfd5; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #7c5835 0%, #4a341e 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-family: Georgia, serif; letter-spacing: 0.5px; }
    .header p { margin: 6px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #e6c887; }
    .content { padding: 32px 28px; line-height: 1.6; font-size: 15px; }
    .greeting { font-size: 18px; font-weight: bold; margin-bottom: 12px; color: #1c1815; }
    .button-container { text-align: center; margin: 28px 0; }
    .btn-verify { display: inline-block; background-color: #7c5835; color: #ffffff !important; padding: 14px 32px; border-radius: 10px; font-weight: bold; text-decoration: none; font-size: 15px; box-shadow: 0 2px 6px rgba(124, 88, 53, 0.3); }
    .otp-box { background-color: #fcfaf7; border: 2px dashed #d5c7b5; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #7c5835; margin: 8px 0; }
    .otp-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6e6457; font-weight: 600; }
    .divider { height: 1px; background-color: #eee7dc; margin: 24px 0; }
    .footer { background-color: #f7f5f0; padding: 20px 24px; text-align: center; font-size: 12px; color: #7b7267; border-top: 1px solid #e7dfd5; }
    .expiry-note { font-size: 13px; color: #6b6257; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>HeritageConnect</h1>
      <p>Official Monument Discovery & Ticketing</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${name || 'Explorer'},</div>
      <p>Thank you for registering with <strong>HeritageConnect</strong>. To complete your registration, book monument tickets, and access your verified passes, please verify your email address.</p>
      
      <div class="button-container">
        <a href="${verificationUrl}" class="btn-verify" target="_blank">Verify Email Address</a>
      </div>

      <div class="otp-box">
        <div class="otp-label">Or use this 6-Digit Verification Code:</div>
        <div class="otp-code">${otp}</div>
        <div style="font-size: 12px; color: #887d71;">Valid for the next 15 minutes</div>
      </div>

      <p class="expiry-note">
        If the button above does not work, you can copy and paste this link into your browser:<br>
        <a href="${verificationUrl}" style="color: #7c5835; word-break: break-all;">${verificationUrl}</a>
      </p>

      <div class="divider"></div>
      <p style="font-size: 13px; color: #887d71; margin-bottom: 0;">
        If you did not create an account on HeritageConnect, you can safely disregard this email.
      </p>
    </div>
    <div class="footer">
      HeritageConnect Portal • Secure Visitor Management<br>
      Protecting & Celebrating Cultural Heritage
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Send genuine verification email using configured provider
 * @param {Object} params
 * @param {string} params.email - Recipient email address
 * @param {string} params.name - Recipient full name
 * @param {string} params.token - Single-use verification token
 * @param {string} params.otp - 6-digit OTP code
 * @returns {Promise<{ success: boolean, sent: boolean, provider: string|null, error?: string, messageId?: string }>}
 */
const sendVerificationEmail = async ({ email, name, token, otp }) => {
  const provider = getEmailProvider();
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const verificationUrl = `${clientUrl}/verify-email?token=${encodeURIComponent(token)}`;

  if (!provider) {
    console.warn(`[Email Service] No email provider configured. Verification token and OTP saved in DB for ${email}.`);
    return {
      success: false,
      sent: false,
      provider: null,
      error: 'Email provider not configured. Please add RESEND_API_KEY, BREVO_API_KEY, or SMTP credentials to backend/.env to send live emails.',
      token,
      otp,
    };
  }

  const subject = 'Verify your HeritageConnect Account';
  const htmlContent = buildVerificationEmailHtml({ name, verificationUrl, otp });
  const textContent = `Hello ${name || 'Explorer'},\n\nThank you for registering with HeritageConnect.\n\nYour 6-digit verification code is: ${otp} (valid for 15 minutes)\n\nOr verify by opening this link: ${verificationUrl}\n\nIf you did not register, please ignore this email.`;

  try {
    // 1. Send via Resend REST API
    if (provider === 'resend') {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'HeritageConnect <onboarding@resend.dev>';
      const res = await axios.post(
        'https://api.resend.com/emails',
        {
          from: fromEmail,
          to: [email],
          subject,
          html: htmlContent,
          text: textContent,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      console.log(`[Email Service - Resend] Successfully sent verification email to ${email}. ID: ${res.data?.id}`);
      return {
        success: true,
        sent: true,
        provider: 'resend',
        messageId: res.data?.id,
      };
    }

    // 2. Send via Brevo REST API
    if (provider === 'brevo') {
      const senderEmail = process.env.BREVO_FROM_EMAIL || 'no-reply@heritageconnect.org';
      const senderName = process.env.BREVO_SENDER_NAME || 'HeritageConnect';
      const res = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: senderName, email: senderEmail },
          to: [{ email, name: name || 'Visitor' }],
          subject,
          htmlContent,
          textContent,
        },
        {
          headers: {
            'api-key': process.env.BREVO_API_KEY.trim(),
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      console.log(`[Email Service - Brevo] Successfully sent verification email to ${email}. ID: ${res.data?.messageId}`);
      return {
        success: true,
        sent: true,
        provider: 'brevo',
        messageId: res.data?.messageId,
      };
    }

    // 3. Send via Nodemailer SMTP
    if (provider === 'smtp') {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || `"HeritageConnect" <${process.env.SMTP_USER}>`,
        to: email,
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`[Email Service - SMTP] Successfully sent verification email to ${email}. ID: ${info.messageId}`);
      return {
        success: true,
        sent: true,
        provider: 'smtp',
        messageId: info.messageId,
      };
    }
  } catch (err) {
    const errorDetails = err.response?.data?.message || err.response?.data?.error || err.message;
    console.error(`[Email Service Error]: Failed to send email via ${provider}: ${errorDetails}`);
    return {
      success: false,
      sent: false,
      provider,
      error: `Failed to deliver email via ${provider}: ${errorDetails}`,
      token,
      otp,
    };
  }
};

module.exports = {
  sendVerificationEmail,
  isEmailConfigured,
  getEmailProvider,
};

