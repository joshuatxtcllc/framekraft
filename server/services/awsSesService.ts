import AWS from 'aws-sdk';
import { storage } from '../storage';
import { settingsService } from './settingsService';

// Configure AWS SES
const sesConfig = {
  apiVersion: '2010-12-01',
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

const ses = new AWS.SES(sesConfig);

export class AWSSESService {
  private fromEmail: string;
  private replyToEmail: string;
  private isDevelopment: boolean;

  constructor() {
    this.fromEmail = process.env.AWS_SES_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@framekraft.com';
    this.replyToEmail = process.env.AWS_SES_REPLY_TO || this.fromEmail;
    this.isDevelopment = process.env.NODE_ENV === 'development';
    
    // Verify configuration on startup
    this.verifyConfiguration();
  }

  /**
   * Verify AWS SES configuration
   */
  private async verifyConfiguration(): Promise<void> {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.warn('⚠️  AWS SES credentials not configured. Email service will run in development mode.');
      return;
    }

    try {
      // Verify email addresses
      const verifiedEmails = await ses.listVerifiedEmailAddresses().promise();
      console.log('✅ AWS SES verified email addresses:', verifiedEmails.VerifiedEmailAddresses);
      
      // Check sending quota
      const quota = await ses.getSendQuota().promise();
      console.log('📊 AWS SES Sending Quota:', {
        max24HourSend: quota.Max24HourSend,
        sentLast24Hours: quota.SentLast24Hours,
        maxSendRate: quota.MaxSendRate
      });
      
      // Check if from email is verified
      if (verifiedEmails.VerifiedEmailAddresses && 
          !verifiedEmails.VerifiedEmailAddresses.includes(this.fromEmail)) {
        console.warn(`⚠️  From email ${this.fromEmail} is not verified in AWS SES. Attempting to verify...`);
        await this.verifyEmailAddress(this.fromEmail);
      }
    } catch (error: any) {
      console.error('❌ AWS SES configuration error:', error.message);
      if (error.code === 'InvalidClientTokenId') {
        console.error('Invalid AWS credentials. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.');
      } else if (error.code === 'SignatureDoesNotMatch') {
        console.error('AWS signature does not match. Please verify your AWS_SECRET_ACCESS_KEY.');
      }
    }
  }

  /**
   * Verify an email address with AWS SES
   */
  async verifyEmailAddress(email: string): Promise<void> {
    try {
      await ses.verifyEmailIdentity({ EmailAddress: email }).promise();
      console.log(`📧 Verification email sent to ${email}. Please check your inbox.`);
    } catch (error: any) {
      console.error(`Failed to verify email ${email}:`, error.message);
    }
  }

  /**
   * Send email using AWS SES
   */
  private async sendEmail(params: {
    to: string | string[];
    subject: string;
    htmlBody: string;
    textBody?: string;
    replyTo?: string;
    cc?: string[];
    bcc?: string[];
  }): Promise<void> {
    // In development mode, just log the email
    if (this.isDevelopment && !process.env.AWS_ACCESS_KEY_ID) {
      console.log('📧 Email (dev mode):');
      console.log(`To: ${Array.isArray(params.to) ? params.to.join(', ') : params.to}`);
      console.log(`Subject: ${params.subject}`);
      console.log(`Preview: ${params.textBody?.substring(0, 200) || params.htmlBody.substring(0, 200)}...`);
      return;
    }

    const emailParams: AWS.SES.SendEmailRequest = {
      Source: this.fromEmail,
      Destination: {
        ToAddresses: Array.isArray(params.to) ? params.to : [params.to],
        CcAddresses: params.cc,
        BccAddresses: params.bcc,
      },
      Message: {
        Subject: {
          Data: params.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: params.htmlBody,
            Charset: 'UTF-8',
          },
          Text: params.textBody ? {
            Data: params.textBody,
            Charset: 'UTF-8',
          } : undefined,
        },
      },
      ReplyToAddresses: params.replyTo ? [params.replyTo] : [this.replyToEmail],
    };

    try {
      const result = await ses.sendEmail(emailParams).promise();
      console.log(`✅ Email sent successfully via AWS SES. MessageId: ${result.MessageId}`);
    } catch (error: any) {
      console.error('❌ AWS SES send error:', error.message);
      
      // Handle specific SES errors
      if (error.code === 'MessageRejected') {
        throw new Error('Email was rejected by AWS SES. Please check the email content.');
      } else if (error.code === 'MailFromDomainNotVerified') {
        throw new Error('The sending domain is not verified in AWS SES.');
      } else if (error.code === 'ConfigurationSetDoesNotExist') {
        throw new Error('AWS SES configuration set does not exist.');
      } else if (error.code === 'Throttling') {
        throw new Error('AWS SES rate limit exceeded. Please try again later.');
      }
      
      throw new Error(`Failed to send email via AWS SES: ${error.message}`);
    }
  }

  /**
   * Send invoice email
   */
  async sendInvoiceEmail(invoiceId: number, recipientEmail: string, customMessage?: string): Promise<void> {
    // Check if email service is enabled
    if (!settingsService.isEnabled('email')) {
      throw new Error('Email service is disabled');
    }

    const circuitBreaker = settingsService.getCircuitBreaker('email');
    
    return await circuitBreaker.execute(async () => {
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      const subject = `Invoice ${invoice.invoiceNumber} - FrameCraft Custom Framing`;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice ${invoice.invoiceNumber}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #8B4513; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">FrameCraft Custom Framing</h1>
            <p style="color: #f5f5f5; margin: 10px 0 0 0;">Professional Art Preservation</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Invoice ${invoice.invoiceNumber}</h2>
            
            ${customMessage ? `
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <p style="margin: 0; color: #666;">${customMessage}</p>
              </div>
            ` : ''}
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #8B4513; margin-top: 0;">Invoice Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Invoice Number:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold;">${invoice.invoiceNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Issue Date:</td>
                  <td style="padding: 8px 0; text-align: right;">${new Date(invoice.createdAt).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Due Date:</td>
                  <td style="padding: 8px 0; text-align: right;">${new Date(invoice.dueDate).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Status:</td>
                  <td style="padding: 8px 0; text-align: right;">
                    <span style="background: ${invoice.status === 'paid' ? '#28a745' : invoice.status === 'overdue' ? '#dc3545' : '#ffc107'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                      ${invoice.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
                <tr style="border-top: 2px solid #8B4513; margin-top: 10px;">
                  <td style="padding: 12px 0; font-size: 18px; color: #333;"><strong>Total Amount:</strong></td>
                  <td style="padding: 12px 0; text-align: right; font-size: 20px; color: #8B4513;"><strong>$${invoice.totalAmount}</strong></td>
                </tr>
              </table>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Payment Instructions:</strong><br>
                Please make payment by the due date to avoid late fees. You can pay online through our customer portal or contact us for other payment options.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.APP_URL}/invoices/${invoice.id}" style="display: inline-block; padding: 14px 30px; background: #8B4513; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                View Invoice Online
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Thank you for choosing FrameCraft for your custom framing needs. We appreciate your business!
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #999; font-size: 12px; margin: 5px 0;">FrameCraft Custom Framing</p>
            <p style="color: #999; font-size: 12px; margin: 5px 0;">123 Art Street, Creative City, CC 12345</p>
            <p style="color: #999; font-size: 12px; margin: 5px 0;">Phone: (555) 123-4567 | Email: info@framekraft.com</p>
            <p style="color: #999; font-size: 12px; margin: 15px 0 0 0;">© ${new Date().getFullYear()} FrameCraft. All rights reserved.</p>
          </div>
        </body>
        </html>
      `;

      const textContent = `
        FRAMECRAFT CUSTOM FRAMING
        Professional Art Preservation
        
        Invoice ${invoice.invoiceNumber}
        
        ${customMessage ? customMessage + '\n\n' : ''}
        
        INVOICE DETAILS:
        ----------------
        Invoice Number: ${invoice.invoiceNumber}
        Issue Date: ${new Date(invoice.createdAt).toLocaleDateString()}
        Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
        Status: ${invoice.status.toUpperCase()}
        
        TOTAL AMOUNT: $${invoice.totalAmount}
        
        Payment Instructions:
        Please make payment by the due date to avoid late fees. You can pay online through our customer portal or contact us for other payment options.
        
        View invoice online: ${process.env.APP_URL}/invoices/${invoice.id}
        
        Thank you for choosing FrameCraft for your custom framing needs!
        
        FrameCraft Custom Framing
        123 Art Street, Creative City, CC 12345
        Phone: (555) 123-4567 | Email: info@framekraft.com
      `;

      await this.sendEmail({
        to: recipientEmail,
        subject,
        htmlBody: htmlContent,
        textBody: textContent,
      });

      // Update invoice status
      await storage.updateInvoice(invoiceId, { 
        status: 'sent', 
        sentDate: new Date() 
      });

      console.log(`✅ Invoice ${invoice.invoiceNumber} sent successfully to ${recipientEmail}`);
    });
  }

  /**
   * Send order status update email
   */
  async sendOrderStatusUpdate(orderId: number, status: string, customerEmail: string): Promise<void> {
    if (!settingsService.isEnabled('email')) {
      throw new Error('Email service is disabled');
    }

    const circuitBreaker = settingsService.getCircuitBreaker('email');
    
    return await circuitBreaker.execute(async () => {
      const order = await storage.getOrder(orderId);
      if (!order) throw new Error('Order not found');

      const statusDescriptions: Record<string, string> = {
        pending: 'Your order has been received and is awaiting processing.',
        measuring: 'We are carefully measuring your artwork to ensure a perfect fit.',
        designing: 'Our designers are creating the perfect frame design for your piece.',
        cutting: 'Your frame materials are being precision cut to specification.',
        assembly: 'Your custom frame is being expertly assembled.',
        completed: 'Your order is complete and ready for pickup!',
        delivered: 'Your order has been delivered. Enjoy your beautifully framed artwork!',
      };

      const statusColors: Record<string, string> = {
        pending: '#6c757d',
        measuring: '#17a2b8',
        designing: '#007bff',
        cutting: '#ffc107',
        assembly: '#fd7e14',
        completed: '#28a745',
        delivered: '#20c997',
      };

      const subject = `Order ${order.orderNumber} - Status Update`;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Status Update</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Order Status Update</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Order ${order.orderNumber}</h2>
            
            <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColors[status] || '#333'};">
              <h3 style="margin-top: 0; color: ${statusColors[status] || '#333'};">
                Status: ${status.charAt(0).toUpperCase() + status.slice(1)}
              </h3>
              <p style="margin: 10px 0; color: #666;">
                ${statusDescriptions[status] || 'Your order status has been updated.'}
              </p>
            </div>
            
            <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="color: #8B4513; margin-top: 0;">Order Details:</h4>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 0; color: #666;">Order Number:</td>
                  <td style="padding: 5px 0; text-align: right;">${order.orderNumber}</td>
                </tr>
                ${order.frameStyle ? `
                <tr>
                  <td style="padding: 5px 0; color: #666;">Frame Style:</td>
                  <td style="padding: 5px 0; text-align: right;">${order.frameStyle}</td>
                </tr>
                ` : ''}
                ${order.totalAmount ? `
                <tr>
                  <td style="padding: 5px 0; color: #666;">Total Amount:</td>
                  <td style="padding: 5px 0; text-align: right;">$${order.totalAmount}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 5px 0; color: #666;">Updated:</td>
                  <td style="padding: 5px 0; text-align: right;">${new Date().toLocaleString()}</td>
                </tr>
              </table>
            </div>
            
            <!-- Progress Bar -->
            <div style="margin: 30px 0;">
              <h4 style="color: #333; margin-bottom: 15px;">Order Progress:</h4>
              <div style="background: #e0e0e0; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background: linear-gradient(90deg, #8B4513, #D2691E); height: 100%; width: ${
                  status === 'pending' ? '10%' :
                  status === 'measuring' ? '25%' :
                  status === 'designing' ? '40%' :
                  status === 'cutting' ? '60%' :
                  status === 'assembly' ? '80%' :
                  status === 'completed' ? '95%' :
                  status === 'delivered' ? '100%' : '50%'
                }; transition: width 0.3s;"></div>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.APP_URL}/orders/${order.id}" style="display: inline-block; padding: 14px 30px; background: #8B4513; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                Track Your Order
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              We'll continue to keep you updated as your custom frame progresses through our workshop. If you have any questions, please don't hesitate to contact us.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding: 20px;">
            <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} FrameCraft. All rights reserved.</p>
          </div>
        </body>
        </html>
      `;

      const textContent = `
        Order Status Update
        
        Order ${order.orderNumber}
        
        Status: ${status.charAt(0).toUpperCase() + status.slice(1)}
        ${statusDescriptions[status] || 'Your order status has been updated.'}
        
        Order Details:
        - Order Number: ${order.orderNumber}
        ${order.frameStyle ? `- Frame Style: ${order.frameStyle}` : ''}
        ${order.totalAmount ? `- Total Amount: $${order.totalAmount}` : ''}
        - Updated: ${new Date().toLocaleString()}
        
        Track your order: ${process.env.APP_URL}/orders/${order.id}
        
        We'll continue to keep you updated as your custom frame progresses through our workshop.
        
        FrameCraft Custom Framing
      `;

      await this.sendEmail({
        to: customerEmail,
        subject,
        htmlBody: htmlContent,
        textBody: textContent,
      });

      console.log(`✅ Order status update sent for ${order.orderNumber} to ${customerEmail}`);
    });
  }

  /**
   * Send bulk emails (e.g., marketing campaigns)
   */
  async sendBulkEmail(params: {
    recipients: string[];
    subject: string;
    htmlBody: string;
    textBody?: string;
    campaignId?: string;
  }): Promise<void> {
    if (!settingsService.isEnabled('email')) {
      throw new Error('Email service is disabled');
    }

    // Send in batches of 50 (AWS SES limit)
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < params.recipients.length; i += batchSize) {
      batches.push(params.recipients.slice(i, i + batchSize));
    }

    console.log(`📧 Sending bulk email to ${params.recipients.length} recipients in ${batches.length} batches`);

    for (const [index, batch] of batches.entries()) {
      try {
        await this.sendEmail({
          to: this.fromEmail, // Send to self
          bcc: batch, // BCC all recipients in batch
          subject: params.subject,
          htmlBody: params.htmlBody,
          textBody: params.textBody,
        });
        
        console.log(`✅ Batch ${index + 1}/${batches.length} sent (${batch.length} recipients)`);
        
        // Add delay between batches to avoid rate limiting
        if (index < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        console.error(`❌ Failed to send batch ${index + 1}:`, error.message);
        throw error;
      }
    }
    
    console.log(`✅ Bulk email campaign ${params.campaignId || 'unnamed'} completed`);
  }

  /**
   * Get email sending statistics
   */
  async getEmailStatistics(): Promise<any> {
    try {
      const stats = await ses.getSendStatistics().promise();
      return {
        sendDataPoints: stats.SendDataPoints,
        quota: await ses.getSendQuota().promise(),
      };
    } catch (error: any) {
      console.error('Failed to get email statistics:', error.message);
      throw error;
    }
  }

  /**
   * Check if an email is verified
   */
  async isEmailVerified(email: string): Promise<boolean> {
    try {
      const result = await ses.getIdentityVerificationAttributes({
        Identities: [email]
      }).promise();
      
      const attributes = result.VerificationAttributes?.[email];
      return attributes?.VerificationStatus === 'Success';
    } catch (error: any) {
      console.error('Failed to check email verification:', error.message);
      return false;
    }
  }

  /**
   * Handle bounce and complaint notifications
   */
  async handleSESNotification(notification: any): Promise<void> {
    const messageType = notification.Type;
    
    switch (messageType) {
      case 'Bounce':
        console.warn('📧 Email bounce detected:', notification.bounce);
        // Handle bounce (e.g., mark email as invalid in database)
        break;
        
      case 'Complaint':
        console.warn('📧 Email complaint detected:', notification.complaint);
        // Handle complaint (e.g., unsubscribe user)
        break;
        
      case 'Delivery':
        console.log('✅ Email delivered:', notification.delivery);
        break;
        
      default:
        console.log('📧 SES notification:', messageType, notification);
    }
  }
}

// Export singleton instance
export const awsSesService = new AWSSESService();