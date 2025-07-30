
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export class TwilioService {
  private isConfigured(): boolean {
    return !!(client && fromNumber);
  }

  async makeStatusUpdateCall(orderData: any, customerPhone: string, callScript: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Twilio not configured - missing environment variables');
    }

    try {
      // Replace template variables in script
      const finalScript = callScript
        .replace('{customerName}', `${orderData.customer.firstName} ${orderData.customer.lastName}`)
        .replace('{orderNumber}', orderData.orderNumber)
        .replace('{status}', this.getStatusDisplayName(orderData.status))
        .replace('{statusMessage}', this.getStatusMessage(orderData.status));

      // Create TwiML for the call
      const twimlContent = `
        <Response>
          <Say voice="alice" rate="medium" language="en-US">
            ${finalScript}
          </Say>
          <Pause length="2"/>
          <Say voice="alice" rate="medium" language="en-US">
            Thank you for choosing Jay's Frames. Have a great day!
          </Say>
        </Response>
      `;

      // Make the call
      const call = await client!.calls.create({
        twiml: twimlContent,
        to: customerPhone,
        from: fromNumber!,
        timeout: 30,
        record: false,
      });

      console.log(`✅ Twilio call initiated: ${call.sid} to ${customerPhone}`);
      
      return {
        callSid: call.sid,
        status: call.status,
        to: customerPhone,
        from: fromNumber,
      };
    } catch (error: any) {
      console.error('❌ Twilio call error:', error.message);
      throw new Error(`Failed to make call: ${error.message}`);
    }
  }

  async sendStatusUpdateSMS(orderData: any, customerPhone: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Twilio not configured - missing environment variables');
    }

    try {
      const message = `Hi ${orderData.customer.firstName}! Your order ${orderData.orderNumber} status has been updated to: ${this.getStatusDisplayName(orderData.status)}. ${this.getStatusMessage(orderData.status)} - Jay's Frames`;

      const sms = await client!.messages.create({
        body: message,
        to: customerPhone,
        from: fromNumber!,
      });

      console.log(`✅ SMS sent: ${sms.sid} to ${customerPhone}`);
      
      return {
        messageSid: sms.sid,
        status: sms.status,
        to: customerPhone,
        from: fromNumber,
      };
    } catch (error: any) {
      console.error('❌ Twilio SMS error:', error.message);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  private getStatusDisplayName(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Order Processed',
      'measuring': 'Materials Ordered',
      'production': 'In Production',
      'quality_check': 'Quality Check',
      'ready': 'Ready for Pickup',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  }

  private getStatusMessage(status: string): string {
    const messages: { [key: string]: string } = {
      'pending': 'Your order has been received and is being prepared.',
      'measuring': 'We are sourcing the perfect materials for your project.',
      'production': 'Your custom frame is being crafted with care.',
      'quality_check': 'We are performing final quality checks.',
      'ready': 'Your project is complete and ready for pickup!',
      'completed': 'Thank you for choosing us for your framing needs.',
      'cancelled': 'Please contact us if you have any questions.'
    };
    return messages[status] || 'We will keep you updated on your order progress.';
  }

  async testCall(phoneNumber: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Twilio not configured - missing environment variables');
    }

    const testScript = "Hello! This is a test call from Jay's Frames communication system. If you can hear this message, your Twilio integration is working correctly.";

    const twimlContent = `
      <Response>
        <Say voice="alice" rate="medium" language="en-US">
          ${testScript}
        </Say>
      </Response>
    `;

    try {
      const call = await client!.calls.create({
        twiml: twimlContent,
        to: phoneNumber,
        from: fromNumber!,
        timeout: 30,
        record: false,
      });

      console.log(`✅ Test call initiated: ${call.sid}`);
      return { callSid: call.sid, status: call.status };
    } catch (error: any) {
      console.error('❌ Test call error:', error.message);
      throw error;
    }
  }

  async testSMS(phoneNumber: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Twilio not configured - missing environment variables');
    }

    const testMessage = "Hello! This is a test SMS from Jay's Frames communication system. Your Twilio SMS integration is working correctly.";

    try {
      const sms = await client!.messages.create({
        body: testMessage,
        to: phoneNumber,
        from: fromNumber!,
      });

      console.log(`✅ Test SMS sent: ${sms.sid}`);
      return { messageSid: sms.sid, status: sms.status };
    } catch (error: any) {
      console.error('❌ Test SMS error:', error.message);
      throw error;
    }
  }
}

export const twilioService = new TwilioService();
