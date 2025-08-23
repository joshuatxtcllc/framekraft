import { emailService as gmailService } from './emailService';
import { awsSesService } from './awsSesService';
import { settingsService } from './settingsService';

export type EmailProvider = 'gmail' | 'aws-ses' | 'development';

export class UnifiedEmailService {
  private provider: EmailProvider;

  constructor() {
    // Determine which email provider to use based on configuration
    this.provider = this.determineProvider();
    console.log(`📧 Email service initialized with provider: ${this.provider}`);
  }

  private determineProvider(): EmailProvider {
    // Check environment variables to determine the best provider
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_SES_ENABLED === 'true') {
      return 'aws-ses';
    }
    
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN) {
      return 'gmail';
    }
    
    // Default to development mode
    return 'development';
  }

  /**
   * Switch email provider at runtime
   */
  switchProvider(provider: EmailProvider): void {
    this.provider = provider;
    console.log(`📧 Switched email provider to: ${provider}`);
  }

  /**
   * Get current provider
   */
  getProvider(): EmailProvider {
    return this.provider;
  }

  /**
   * Send invoice email using the configured provider
   */
  async sendInvoiceEmail(invoiceId: number, recipientEmail: string, customMessage?: string): Promise<void> {
    switch (this.provider) {
      case 'aws-ses':
        return await awsSesService.sendInvoiceEmail(invoiceId, recipientEmail, customMessage);
      
      case 'gmail':
        return await gmailService.sendInvoiceEmail(invoiceId, recipientEmail, customMessage);
      
      case 'development':
        console.log('📧 Development mode - Invoice email would be sent:');
        console.log(`  Invoice ID: ${invoiceId}`);
        console.log(`  Recipient: ${recipientEmail}`);
        console.log(`  Message: ${customMessage || 'No custom message'}`);
        return;
      
      default:
        throw new Error(`Unknown email provider: ${this.provider}`);
    }
  }

  /**
   * Send order status update using the configured provider
   */
  async sendOrderStatusUpdate(orderId: number, status: string, customerEmail: string): Promise<void> {
    switch (this.provider) {
      case 'aws-ses':
        return await awsSesService.sendOrderStatusUpdate(orderId, status, customerEmail);
      
      case 'gmail':
        return await gmailService.sendOrderStatusUpdate(orderId, status, customerEmail);
      
      case 'development':
        console.log('📧 Development mode - Order status email would be sent:');
        console.log(`  Order ID: ${orderId}`);
        console.log(`  Status: ${status}`);
        console.log(`  Customer: ${customerEmail}`);
        return;
      
      default:
        throw new Error(`Unknown email provider: ${this.provider}`);
    }
  }

  /**
   * Send bulk email (only supported by AWS SES)
   */
  async sendBulkEmail(params: {
    recipients: string[];
    subject: string;
    htmlBody: string;
    textBody?: string;
    campaignId?: string;
  }): Promise<void> {
    if (this.provider === 'aws-ses') {
      return await awsSesService.sendBulkEmail(params);
    } else {
      throw new Error(`Bulk email is only supported with AWS SES. Current provider: ${this.provider}`);
    }
  }

  /**
   * Get email statistics (provider-specific)
   */
  async getEmailStatistics(): Promise<any> {
    switch (this.provider) {
      case 'aws-ses':
        return await awsSesService.getEmailStatistics();
      
      case 'gmail':
        return {
          provider: 'gmail',
          message: 'Statistics not available for Gmail provider'
        };
      
      case 'development':
        return {
          provider: 'development',
          message: 'No statistics in development mode'
        };
      
      default:
        throw new Error(`Unknown email provider: ${this.provider}`);
    }
  }

  /**
   * Verify email address (AWS SES specific)
   */
  async verifyEmailAddress(email: string): Promise<void> {
    if (this.provider === 'aws-ses') {
      return await awsSesService.verifyEmailAddress(email);
    } else {
      console.log(`Email verification not required for ${this.provider} provider`);
    }
  }

  /**
   * Check if email is verified (AWS SES specific)
   */
  async isEmailVerified(email: string): Promise<boolean> {
    if (this.provider === 'aws-ses') {
      return await awsSesService.isEmailVerified(email);
    }
    // For other providers, assume email is verified
    return true;
  }

  /**
   * Get provider capabilities
   */
  getCapabilities(): Record<string, boolean> {
    const capabilities: Record<string, Record<string, boolean>> = {
      'aws-ses': {
        sendInvoice: true,
        sendOrderStatus: true,
        sendBulk: true,
        getStatistics: true,
        verifyEmail: true,
        handleBounces: true,
      },
      'gmail': {
        sendInvoice: true,
        sendOrderStatus: true,
        sendBulk: false,
        getStatistics: false,
        verifyEmail: false,
        handleBounces: false,
      },
      'development': {
        sendInvoice: true,
        sendOrderStatus: true,
        sendBulk: true,
        getStatistics: true,
        verifyEmail: true,
        handleBounces: true,
      },
    };
    
    return capabilities[this.provider] || {};
  }

  /**
   * Health check for email service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    provider: EmailProvider;
    details: any;
  }> {
    try {
      switch (this.provider) {
        case 'aws-ses':
          const stats = await awsSesService.getEmailStatistics();
          return {
            status: 'healthy',
            provider: this.provider,
            details: {
              quota: stats.quota,
              verified: true,
            },
          };
        
        case 'gmail':
          const gmailEnabled = settingsService.isEnabled('gmail');
          return {
            status: gmailEnabled ? 'healthy' : 'unhealthy',
            provider: this.provider,
            details: {
              enabled: gmailEnabled,
              configured: !!process.env.GOOGLE_REFRESH_TOKEN,
            },
          };
        
        case 'development':
          return {
            status: 'healthy',
            provider: this.provider,
            details: {
              mode: 'development',
              message: 'Emails are logged to console only',
            },
          };
        
        default:
          return {
            status: 'unhealthy',
            provider: this.provider,
            details: {
              error: 'Unknown provider',
            },
          };
      }
    } catch (error: any) {
      return {
        status: 'unhealthy',
        provider: this.provider,
        details: {
          error: error.message,
        },
      };
    }
  }
}

// Export singleton instance
export const unifiedEmailService = new UnifiedEmailService();