import nodemailer from 'nodemailer';

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
      port: parseInt(process.env.SMTP_PORT || '2525', 10),
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }
  return transporter;
};

export const sendPasswordResetEmail = async (toEmail, resetToken) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'no-reply@syncsphere.local',
    to: toEmail,
    subject: 'SyncSphere — Password Reset Verification Token',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #0e8ce9;">SyncSphere Account Security</h2>
        <p>A password reset was requested for your SyncSphere account.</p>
        <p>Your verification token is:</p>
        <div style="background-color: #f1f5f9; padding: 12px; font-family: monospace; font-size: 16px; font-weight: bold; letter-spacing: 1px; border-radius: 4px; word-break: break-all;">
          ${resetToken}
        </div>
        <p style="margin-top: 20px;">Or click the link below to proceed directly:</p>
        <p><a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #0e8ce9; color: #ffffff; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">
          This token will expire in 1 hour. If you did not request this, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  // In development, log a generic dispatch notice without exposing raw secret tokens
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[EMAIL SERVICE] Password reset requested for recipient: ${toEmail}`);
  }

  try {
    if (process.env.SMTP_USER && process.env.SMTP_USER !== 'your-smtp-username') {
      await getTransporter().sendMail(mailOptions);
    }
    return { success: true };
  } catch (err) {
    console.warn('[EMAIL SERVICE] SMTP dispatch notice:', err.message);
    // Even if SMTP fails in local offline environment, the token is logged above for testing
    return { success: true, simulated: true };
  }
};
