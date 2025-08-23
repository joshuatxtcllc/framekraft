import { Router } from "express";
import { isAuthenticated } from "../middleware/auth";
import { unifiedEmailService } from "../services/unifiedEmailService";
import { awsSesService } from "../services/awsSesService";

const router = Router();

// Get current email configuration
router.get("/config", isAuthenticated, async (req, res) => {
  try {
    const provider = unifiedEmailService.getProvider();
    const capabilities = unifiedEmailService.getCapabilities();
    const health = await unifiedEmailService.healthCheck();
    
    // Check AWS SES specific info if that's the provider
    let sesInfo = null;
    if (provider === 'aws-ses' && process.env.AWS_ACCESS_KEY_ID) {
      try {
        const stats = await unifiedEmailService.getEmailStatistics();
        sesInfo = {
          configured: true,
          region: process.env.AWS_REGION || 'us-east-1',
          fromEmail: process.env.AWS_SES_FROM_EMAIL || process.env.EMAIL_FROM,
          statistics: stats
        };
      } catch (error) {
        sesInfo = {
          configured: false,
          error: error.message
        };
      }
    }
    
    // Check Gmail configuration
    let gmailInfo = null;
    if (provider === 'gmail' || process.env.GOOGLE_CLIENT_ID) {
      gmailInfo = {
        configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_REFRESH_TOKEN),
        clientIdSet: !!process.env.GOOGLE_CLIENT_ID,
        refreshTokenSet: !!process.env.GOOGLE_REFRESH_TOKEN,
        fromEmail: process.env.EMAIL_FROM
      };
    }
    
    res.json({
      currentProvider: provider,
      capabilities,
      health,
      providers: {
        'aws-ses': sesInfo,
        'gmail': gmailInfo,
        'development': {
          active: provider === 'development',
          message: 'Emails are logged to console only'
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        awsConfigured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
        gmailConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_REFRESH_TOKEN)
      }
    });
  } catch (error: any) {
    console.error("Error getting email config:", error);
    res.status(500).json({ 
      message: "Failed to get email configuration",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Switch email provider
router.post("/switch-provider", isAuthenticated, async (req, res) => {
  try {
    const { provider } = req.body;
    
    if (!['gmail', 'aws-ses', 'development'].includes(provider)) {
      return res.status(400).json({ message: "Invalid provider. Must be 'gmail', 'aws-ses', or 'development'" });
    }
    
    // Check if provider is configured
    if (provider === 'aws-ses' && (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)) {
      return res.status(400).json({ 
        message: "AWS SES is not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables." 
      });
    }
    
    if (provider === 'gmail' && (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN)) {
      return res.status(400).json({ 
        message: "Gmail is not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN environment variables." 
      });
    }
    
    unifiedEmailService.switchProvider(provider as any);
    
    res.json({
      success: true,
      message: `Switched to ${provider} email provider`,
      newProvider: provider
    });
  } catch (error: any) {
    console.error("Error switching provider:", error);
    res.status(500).json({ 
      message: "Failed to switch email provider",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify email address (AWS SES)
router.post("/verify-email", isAuthenticated, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email address is required" });
    }
    
    if (unifiedEmailService.getProvider() !== 'aws-ses') {
      return res.status(400).json({ 
        message: "Email verification is only available with AWS SES provider" 
      });
    }
    
    await awsSesService.verifyEmailAddress(email);
    
    res.json({
      success: true,
      message: `Verification email sent to ${email}. Please check your inbox and click the verification link.`
    });
  } catch (error: any) {
    console.error("Error verifying email:", error);
    res.status(500).json({ 
      message: "Failed to verify email address",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Check if email is verified (AWS SES)
router.get("/check-verified/:email", isAuthenticated, async (req, res) => {
  try {
    const { email } = req.params;
    
    if (unifiedEmailService.getProvider() !== 'aws-ses') {
      return res.json({ 
        verified: true,
        message: "Email verification not required for current provider"
      });
    }
    
    const isVerified = await awsSesService.isEmailVerified(email);
    
    res.json({
      email,
      verified: isVerified
    });
  } catch (error: any) {
    console.error("Error checking email verification:", error);
    res.status(500).json({ 
      message: "Failed to check email verification",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Send test email
router.post("/send-test", isAuthenticated, async (req, res) => {
  try {
    const { recipientEmail, testType = 'simple' } = req.body;
    
    if (!recipientEmail) {
      return res.status(400).json({ message: "Recipient email is required" });
    }
    
    const provider = unifiedEmailService.getProvider();
    
    if (testType === 'invoice') {
      // Create a test invoice-like object
      const testInvoiceId = 999999;
      await unifiedEmailService.sendInvoiceEmail(
        testInvoiceId,
        recipientEmail,
        "This is a test email from FrameCraft. If you received this, your email configuration is working correctly!"
      );
    } else if (testType === 'order') {
      // Create a test order status update
      const testOrderId = 999999;
      await unifiedEmailService.sendOrderStatusUpdate(
        testOrderId,
        'completed',
        recipientEmail
      );
    } else {
      // For simple test, we'll use the invoice template with test data
      await unifiedEmailService.sendInvoiceEmail(
        999999,
        recipientEmail,
        "This is a test email to verify your email configuration is working correctly."
      );
    }
    
    res.json({
      success: true,
      message: `Test email sent successfully to ${recipientEmail} using ${provider} provider`,
      provider,
      testType
    });
  } catch (error: any) {
    console.error("Error sending test email:", error);
    res.status(500).json({ 
      message: "Failed to send test email",
      error: error.message,
      provider: unifiedEmailService.getProvider()
    });
  }
});

// Get email statistics (AWS SES)
router.get("/statistics", isAuthenticated, async (req, res) => {
  try {
    if (unifiedEmailService.getProvider() !== 'aws-ses') {
      return res.json({ 
        message: "Statistics are only available with AWS SES provider",
        currentProvider: unifiedEmailService.getProvider()
      });
    }
    
    const stats = await unifiedEmailService.getEmailStatistics();
    
    res.json({
      provider: 'aws-ses',
      statistics: stats
    });
  } catch (error: any) {
    console.error("Error getting email statistics:", error);
    res.status(500).json({ 
      message: "Failed to get email statistics",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;