const { Resend } = require('resend');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Generate 6-digit verification key
const generateVerificationKey = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email with 6-digit key
const sendVerificationEmail = async (email, username, verificationKey) => {
  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Mini Trello <noreply@minitrello.com>',
      to: email,
      subject: 'Verify Your Mini Trello Account',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Mini Trello!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333; margin-top: 0;">Hi ${username}!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Thanks for signing up! To get started with Mini Trello, please verify your email address using the verification code below:
            </p>
            
            <div style="text-align: center; margin: 30px 0; padding: 20px; background: #ffffff; border: 2px dashed #667eea; border-radius: 10px;">
              <p style="color: #333; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">Your Verification Code:</p>
              <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${verificationKey}
              </div>
            </div>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Enter this code in the verification screen to activate your account.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              This verification code will expire in 30 minutes.<br>
              If you didn't create an account, you can safely ignore this email.
            </p>
          </div>
        </div>
      `
    });

    console.log('✅ Verification email sent with Resend!', result.data?.id);

    return {
      success: true,
      messageId: result.data?.id,
      provider: 'resend'
    };
  } catch (error) {
    console.error('❌ Resend email sending error:', error);
    throw new Error('Failed to send verification email');
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, username, resetToken) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Mini Trello <noreply@minitrello.com>',
      to: email,
      subject: 'Reset Your Mini Trello Password',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333; margin-top: 0;">Hi ${username}!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              We received a request to reset your password. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold; 
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(245, 87, 108, 0.3);">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              If you can't click the button, copy and paste this link into your browser:
              <br>
              <a href="${resetUrl}" style="color: #f5576c; word-break: break-all;">
                ${resetUrl}
              </a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              This reset link will expire in 1 hour.<br>
              If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
        </div>
      `
    });

    console.log('✅ Password reset email sent with Resend!', result.data?.id);

    return {
      success: true,
      messageId: result.data?.id,
      provider: 'resend'
    };
  } catch (error) {
    console.error('❌ Resend email sending error:', error);
    throw new Error('Failed to send password reset email');
  }
};

module.exports = {
  generateVerificationKey,
  sendVerificationEmail,
  sendPasswordResetEmail
};
