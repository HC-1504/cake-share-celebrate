// email-config.js
// 邮件配置和模板

export const emailConfig = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'wangzz-jm23@student.tarc.edu.my',
    pass: process.env.EMAIL_PASS || 'oorxswfzfjlqqino'
  }
};

export const emailTemplates = {
  passwordReset: (firstName, resetLink) => ({
    subject: 'Password Reset Request - Cake Picnic',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Hello ${firstName},</h2>
        <p>You have requested to reset your password for the Cake Picnic application.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetLink}" 
           style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
          Reset Password
        </a>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetLink}</p>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>Best regards,<br>The Cake Picnic Team</p>
      </div>
    `,
    text: `
      Hello ${firstName},
      
      You have requested to reset your password for the Cake Picnic application.
      
      Click this link to reset your password: ${resetLink}
      
      This link will expire in 1 hour for security reasons.
      
      If you didn't request this password reset, please ignore this email.
      
      Best regards,
      The Cake Picnic Team
    `
  })
};
