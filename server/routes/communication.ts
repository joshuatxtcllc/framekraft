
import { Router } from 'express';
import { twilioService } from '../services/twilioService';
import { storage } from '../storage';
import { isAuthenticated } from '../replitAuth';

const router = Router();

// Get communication settings
router.get('/settings', isAuthenticated, async (req, res) => {
  try {
    const settings = await storage.getCommunicationSettings();
    res.json(settings || {
      twilioEnabled: false,
      emailEnabled: true,
      smsEnabled: false,
      autoCallsEnabled: false,
      callScript: "Hello {customerName}, this is Jay's Frames. Your order #{orderNumber} status has been updated to {status}. {statusMessage}",
      notificationPhone: ""
    });
  } catch (error) {
    console.error('Error fetching communication settings:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

// Update communication settings
router.put('/settings', isAuthenticated, async (req, res) => {
  try {
    const settings = await storage.updateCommunicationSettings(req.body);
    res.json(settings);
  } catch (error) {
    console.error('Error updating communication settings:', error);
    res.status(500).json({ message: 'Failed to update settings' });
  }
});

// Get call logs
router.get('/call-logs', isAuthenticated, async (req, res) => {
  try {
    const logs = await storage.getCommunicationLogs();
    res.json(logs);
  } catch (error) {
    console.error('Error fetching call logs:', error);
    res.status(500).json({ message: 'Failed to fetch call logs' });
  }
});

// Test communication
router.post('/test-call', isAuthenticated, async (req, res) => {
  try {
    const { type } = req.body;
    const settings = await storage.getCommunicationSettings();
    
    if (!settings?.notificationPhone) {
      return res.status(400).json({ message: 'No test phone number configured' });
    }

    let result;
    if (type === 'voice') {
      result = await twilioService.testCall(settings.notificationPhone);
    } else if (type === 'sms') {
      result = await twilioService.testSMS(settings.notificationPhone);
    } else {
      return res.status(400).json({ message: 'Invalid test type' });
    }

    // Log the test communication
    await storage.createCommunicationLog({
      type: type,
      recipient: settings.notificationPhone,
      orderId: null,
      status: 'completed',
      message: 'Test communication',
      twilioSid: result?.callSid || result?.messageSid || 'unknown'
    });

    res.json({ message: 'Test communication sent successfully', result });
  } catch (error: any) {
    console.error('Error sending test communication:', error);
    res.status(500).json({ message: error.message || 'Failed to send test communication' });
  }
});

// Trigger communication on status update
router.post('/trigger-status-update', isAuthenticated, async (req, res) => {
  try {
    const { orderId, oldStatus, newStatus } = req.body;
    
    // Get communication settings
    const settings = await storage.getCommunicationSettings();
    if (!settings?.autoCallsEnabled) {
      return res.json({ message: 'Auto calls disabled' });
    }

    // Get order details
    const order = await storage.getOrder(orderId);
    if (!order || !order.customer?.phone) {
      return res.json({ message: 'Order not found or no customer phone' });
    }

    const customerPhone = order.customer.phone;
    const callScript = settings.callScript || "Hello {customerName}, your order #{orderNumber} status has been updated to {status}.";

    // Send communications based on settings
    const results = [];

    if (settings.twilioEnabled) {
      try {
        const callResult = await twilioService.makeStatusUpdateCall(order, customerPhone, callScript);
        await storage.createCommunicationLog({
          type: 'voice',
          recipient: customerPhone,
          orderId: orderId,
          status: 'initiated',
          message: `Status update: ${oldStatus} -> ${newStatus}`,
          twilioSid: callResult?.callSid || 'unknown'
        });
        results.push({ type: 'voice', status: 'sent' });
      } catch (error: any) {
        console.error('Voice call failed:', error);
        results.push({ type: 'voice', status: 'failed', error: error.message });
      }
    }

    if (settings.smsEnabled) {
      try {
        const smsResult = await twilioService.sendStatusUpdateSMS(order, customerPhone);
        await storage.createCommunicationLog({
          type: 'sms',
          recipient: customerPhone,
          orderId: orderId,
          status: 'sent',
          message: `Status update: ${oldStatus} -> ${newStatus}`,
          twilioSid: smsResult?.messageSid || 'unknown'
        });
        results.push({ type: 'sms', status: 'sent' });
      } catch (error: any) {
        console.error('SMS failed:', error);
        results.push({ type: 'sms', status: 'failed', error: error.message });
      }
    }

    res.json({ message: 'Communication triggered', results });
  } catch (error) {
    console.error('Error triggering communication:', error);
    res.status(500).json({ message: 'Failed to trigger communication' });
  }
});

// Webhook endpoint for Twilio status updates
router.post('/webhook/twilio', async (req, res) => {
  try {
    const { CallSid, CallStatus, MessageSid, MessageStatus } = req.body;
    
    // Update communication log with status from Twilio
    if (CallSid) {
      await storage.updateCommunicationLogByTwilioSid(CallSid, { status: CallStatus });
    }
    
    if (MessageSid) {
      await storage.updateCommunicationLogByTwilioSid(MessageSid, { status: MessageStatus });
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

export default router;
