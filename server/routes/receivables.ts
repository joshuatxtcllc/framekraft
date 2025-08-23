import { Router } from "express";
import * as storage from "../mongoStorage";
import { isAuthenticated } from "../middleware/auth";
import { unifiedEmailService } from "../services/unifiedEmailService";

const router = Router();

// Get payment record for order
router.post("/record-payment", isAuthenticated, async (req, res) => {
  try {
    const { orderId, paymentAmount, paymentMethod, notes } = req.body;
    
    // Validate input
    if (!orderId || !paymentAmount) {
      return res.status(400).json({ message: "Order ID and payment amount are required" });
    }
    
    // Get the order
    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const totalAmount = parseFloat(order.totalAmount);
    const currentDeposit = order.depositAmount ? parseFloat(order.depositAmount) : 0;
    const payment = parseFloat(paymentAmount);
    
    // Validate payment amount
    if (payment <= 0) {
      return res.status(400).json({ message: "Payment amount must be greater than 0" });
    }
    
    // Calculate new deposit amount
    const newDepositAmount = currentDeposit + payment;
    
    // Don't allow overpayment
    if (newDepositAmount > totalAmount) {
      return res.status(400).json({ 
        message: `Payment amount exceeds remaining balance. Maximum payment: $${(totalAmount - currentDeposit).toFixed(2)}` 
      });
    }
    
    // Calculate remaining balance
    const remainingBalance = totalAmount - newDepositAmount;
    
    // Update order with payment
    const updateData = {
      depositAmount: newDepositAmount.toFixed(2),
      // If fully paid, mark as ready for pickup (unless already completed)
      status: remainingBalance === 0 && order.status !== 'completed' ? 'ready' : order.status
    };
    
    await storage.updateOrder(orderId, updateData);

    // Log payment
    console.log(`Payment recorded: Order ${order.orderNumber}, Amount: $${payment}, Method: ${paymentMethod}, New Deposit: $${newDepositAmount}, Remaining: $${remainingBalance}`);

    res.json({ 
      success: true, 
      newBalance: remainingBalance,
      newDepositTotal: newDepositAmount,
      paidInFull: remainingBalance === 0,
      message: `Payment of $${payment} recorded successfully${remainingBalance === 0 ? '. Order is now paid in full!' : ''}`
    });
  } catch (error) {
    console.error("Error recording payment:", error);
    res.status(500).json({ 
      message: "Failed to record payment", 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Send payment reminder via email/SMS
router.post("/send-reminder", isAuthenticated, async (req, res) => {
  try {
    const { orderId, method, customMessage } = req.body; // method: 'sms', 'email', 'call'
    
    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const customer = await storage.getCustomer(order.customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Calculate balance
    const totalAmount = parseFloat(order.totalAmount || '0');
    const depositAmount = parseFloat(order.depositAmount || '0');
    const remainingBalance = totalAmount - depositAmount;

    if (method === 'email' && customer.email) {
      // Create a temporary invoice-like reminder
      const invoiceData = {
        id: orderId,
        invoiceNumber: `REM-${order.orderNumber}`,
        orderId: orderId,
        customerId: order.customerId,
        totalAmount: remainingBalance.toFixed(2),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'pending',
        createdAt: new Date()
      };
      
      // Send payment reminder email
      await unifiedEmailService.sendInvoiceEmail(
        orderId, 
        customer.email,
        customMessage || `This is a friendly reminder that you have an outstanding balance of $${remainingBalance.toFixed(2)} for order ${order.orderNumber}. Please make payment at your earliest convenience.`
      );
      
      console.log(`Payment reminder email sent to ${customer.email} for order ${order.orderNumber}`);
      
      res.json({ 
        success: true, 
        message: `Payment reminder sent via email to ${customer.firstName} ${customer.lastName} (${customer.email})`
      });
    } else if (method === 'sms' && customer.phone) {
      // SMS functionality would go here (requires Twilio integration)
      console.log(`SMS reminder would be sent to ${customer.phone} for order ${order.orderNumber}`);
      
      res.json({ 
        success: true, 
        message: `SMS functionality coming soon. Would send to ${customer.phone}`
      });
    } else {
      res.status(400).json({ 
        message: `Cannot send ${method} reminder. Customer ${method === 'email' ? 'email' : 'phone'} not found.` 
      });
    }
  } catch (error: any) {
    console.error("Error sending reminder:", error);
    res.status(500).json({ 
      message: "Failed to send reminder",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get email service health status
router.get("/email-status", isAuthenticated, async (req, res) => {
  try {
    const health = await unifiedEmailService.healthCheck();
    const capabilities = unifiedEmailService.getCapabilities();
    
    res.json({
      ...health,
      capabilities,
      currentProvider: unifiedEmailService.getProvider()
    });
  } catch (error: any) {
    console.error("Error checking email status:", error);
    res.status(500).json({ 
      message: "Failed to check email status",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;