import nodemailer from 'nodemailer';
import { emailConfig, frontendUrl } from '../config';
import { EmailTemplate } from '../types';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  private initializeTransporter(): void {
    if (!emailConfig.smtp.auth?.user || !emailConfig.smtp.auth?.pass) {
      console.warn('⚠️  Email service not configured. Emails will be logged to console.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransporter({
        host: emailConfig.smtp.host,
        port: emailConfig.smtp.port,
        secure: emailConfig.smtp.secure,
        auth: emailConfig.smtp.auth,
      });

      // Verify connection
      this.transporter.verify((error) => {
        if (error) {
          console.error('❌ Email service connection failed:', error);
          this.transporter = null;
        } else {
          console.log('✅ Email service ready');
        }
      });
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
    }
  }

  /**
   * Send email
   */
  private async sendEmail(to: string, template: EmailTemplate): Promise<void> {
    if (!this.transporter) {
      // Log to console in development
      console.log('📧 Email (dev mode):');
      console.log(`To: ${to}`);
      console.log(`Subject: ${template.subject}`);
      console.log(`Content: ${template.text}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: emailConfig.from,
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const verificationUrl = `${frontendUrl}/auth/verify-email?token=${token}`;
    
    const template: EmailTemplate = {
      subject: 'Verify your FrameCraft account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to FrameCraft!</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>
            
            <p style="font-size: 16px; color: #666;">
              Thank you for signing up! Please verify your email address to complete your registration and start managing your framing business.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                Verify Email Address
              </a>
            </div>
            
            <p style="font-size: 14px; color: #999; margin-top: 30px;">
              If the button doesn't work, copy and paste this link into your browser:
              <br>
              <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
            </p>
            
            <p style="font-size: 14px; color: #999;">
              This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
            <p>© ${new Date().getFullYear()} FrameCraft. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to FrameCraft!
        
        Hi ${name},
        
        Thank you for signing up! Please verify your email address by clicking the link below:
        
        ${verificationUrl}
        
        This link will expire in 24 hours.
        
        If you didn't create an account, you can safely ignore this email.
        
        Best regards,
        The FrameCraft Team
      `,
    };

    await this.sendEmail(email, template);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;
    
    const template: EmailTemplate = {
      subject: 'Reset your FrameCraft password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>
            
            <p style="font-size: 16px; color: #666;">
              We received a request to reset your password. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                Reset Password
              </a>
            </div>
            
            <p style="font-size: 14px; color: #999; margin-top: 30px;">
              If the button doesn't work, copy and paste this link into your browser:
              <br>
              <a href="${resetUrl}" style="color: #f5576c; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin-top: 20px;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and ensure your account is secure.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
            <p>© ${new Date().getFullYear()} FrameCraft. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request
        
        Hi ${name},
        
        We received a request to reset your password. Click the link below to create a new password:
        
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request a password reset, please ignore this email and ensure your account is secure.
        
        Best regards,
        The FrameCraft Team
      `,
    };

    await this.sendEmail(email, template);
  }

  /**
   * Send password changed notification
   */
  async sendPasswordChangedEmail(email: string, name: string): Promise<void> {
    const template: EmailTemplate = {
      subject: 'Your FrameCraft password has been changed',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Changed</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Password Changed</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>
            
            <p style="font-size: 16px; color: #666;">
              Your password has been successfully changed. You can now log in with your new password.
            </p>
            
            <div style="background: #d4edda; border: 1px solid #28a745; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="color: #155724; margin: 0; font-size: 14px;">
                <strong>✅ Password changed successfully</strong><br>
                Changed on: ${new Date().toLocaleString()}
              </p>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              If you didn't make this change, please contact us immediately and reset your password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendUrl}/login" style="display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                Go to Login
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
            <p>© ${new Date().getFullYear()} FrameCraft. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Changed
        
        Hi ${name},
        
        Your password has been successfully changed. You can now log in with your new password.
        
        Changed on: ${new Date().toLocaleString()}
        
        If you didn't make this change, please contact us immediately and reset your password.
        
        Best regards,
        The FrameCraft Team
      `,
    };

    await this.sendEmail(email, template);
  }

  /**
   * Send login alert for suspicious activity
   */
  async sendLoginAlertEmail(email: string, name: string, ipAddress: string, userAgent: string): Promise<void> {
    const template: EmailTemplate = {
      subject: 'New login to your FrameCraft account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Login Alert</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">New Login Detected</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>
            
            <p style="font-size: 16px; color: #666;">
              We detected a new login to your account from:
            </p>
            
            <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="margin: 5px 0; font-size: 14px;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>IP Address:</strong> ${ipAddress}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Device:</strong> ${userAgent}</p>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              If this was you, you can safely ignore this email. If you don't recognize this activity, please secure your account immediately.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendUrl}/settings/security" style="display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                Review Account Security
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
            <p>© ${new Date().getFullYear()} FrameCraft. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        New Login Detected
        
        Hi ${name},
        
        We detected a new login to your account from:
        
        Time: ${new Date().toLocaleString()}
        IP Address: ${ipAddress}
        Device: ${userAgent}
        
        If this was you, you can safely ignore this email. If you don't recognize this activity, please secure your account immediately.
        
        Best regards,
        The FrameCraft Team
      `,
    };

    await this.sendEmail(email, template);
  }
}

// Export singleton instance
export const emailService = new EmailService();