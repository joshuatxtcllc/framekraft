
import { google } from 'googleapis';
import { storage } from '../storage';
import { settingsService } from './settingsService';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Set credentials if refresh token is available
if (process.env.GOOGLE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
}

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

export class EmailService {
  async sendInvoiceEmail(invoiceId: number, recipientEmail: string, customMessage?: string): Promise<void> {
    // Check if Gmail integration is enabled
    if (!settingsService.isEnabled('gmail')) {
      throw new Error('Gmail integration is disabled');
    }

    // Check for required environment variables
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
      throw new Error('Gmail integration not properly configured - missing required environment variables');
    }

    const circuitBreaker = settingsService.getCircuitBreaker('gmail');
    
    return await circuitBreaker.execute(async () => {
      try {
        const invoice = await storage.getInvoice(invoiceId);
        if (!invoice) throw new Error('Invoice not found');

      const subject = `Invoice ${invoice.invoiceNumber} - FrameCraft Custom Framing`;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8B4513;">FrameCraft Custom Framing</h2>
          <h3>Invoice ${invoice.invoiceNumber}</h3>
          
          ${customMessage ? `<p>${customMessage}</p>` : ''}
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4>Invoice Details:</h4>
            <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Total Amount:</strong> $${invoice.totalAmount}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toDateString()}</p>
            <p><strong>Status:</strong> ${invoice.status}</p>
          </div>
          
          <p>Thank you for choosing FrameCraft for your custom framing needs!</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p>FrameCraft Custom Framing | Professional Art Preservation</p>
          </div>
        </div>
      `;

      const message = [
        `To: ${recipientEmail}`,
        `Subject: ${subject}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        htmlContent,
      ].join('\n');

      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: encodedMessage,
          },
        });

        console.log(`✅ Invoice ${invoice.invoiceNumber} sent successfully to ${recipientEmail}`);

        // Update invoice status
        await storage.updateInvoice(invoiceId, { 
          status: 'sent', 
          sentDate: new Date() 
        });

      } catch (error: any) {
        console.error('❌ Gmail API Error:', error.message);
        
        // Handle specific Gmail errors
        if (error.code === 401) {
          throw new Error('Gmail authentication failed - please check your OAuth credentials');
        } else if (error.code === 403) {
          throw new Error('Gmail API access denied - check your permissions');
        } else if (error.code >= 500) {
          throw new Error('Gmail service temporarily unavailable');
        }
        
        throw new Error(`Failed to send email: ${error.message}`);
      }
    });
  }
  }

  async sendOrderStatusUpdate(orderId: number, status: string, customerEmail: string): Promise<void> {
    if (!settingsService.isEnabled('gmail')) {
      throw new Error('Gmail integration is disabled');
    }

    const circuitBreaker = settingsService.getCircuitBreaker('gmail');
    
    return await circuitBreaker.execute(async () => {
      try {
        const order = await storage.getOrder(orderId);
        if (!order) throw new Error('Order not found');

      const subject = `Order Update - ${order.orderNumber}`;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8B4513;">FrameCraft Custom Framing</h2>
          <h3>Order Status Update</h3>
          
          <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4>Your order status has been updated:</h4>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>New Status:</strong> <span style="color: #2e8b57; font-weight: bold;">${status}</span></p>
            ${order.frameStyle ? `<p><strong>Frame Style:</strong> ${order.frameStyle}</p>` : ''}
          </div>
          
          <p>We'll keep you updated as your custom frame progresses through our workshop.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p>FrameCraft Custom Framing | Professional Art Preservation</p>
          </div>
        </div>
      `;

      const message = [
        `To: ${customerEmail}`,
        `Subject: ${subject}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        htmlContent,
      ].join('\n');

      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: encodedMessage,
          },
        });

        console.log(`✅ Order status update sent successfully for ${order.orderNumber} to ${customerEmail}`);

      } catch (error: any) {
        console.error('❌ Gmail order status error:', error.message);
        throw new Error(`Failed to send order status email: ${error.message}`);
      }
    });
  }
  }
}

export const emailService = new EmailService();
