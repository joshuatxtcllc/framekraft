import { Router } from "express";
import * as storage from "../mongoStorage";
import { isAuthenticated } from "../middleware/auth";

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

// Send payment reminder (placeholder for future integration with Twilio/email)
router.post("/send-reminder", isAuthenticated, async (req, res) => {
  try {
    const { orderId, method } = req.body; // method: 'sms', 'email', 'call'
    
    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const customer = await storage.getCustomer(order.customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Placeholder for actual reminder sending
    // In a real implementation, you'd integrate with Twilio for SMS/calls
    // and SendGrid/similar for email
    
    console.log(`Reminder sent via ${method} to ${customer.firstName} ${customer.lastName} for order ${order.orderNumber}`);
    
    res.json({ 
      success: true, 
      message: `Reminder sent via ${method} to ${customer.firstName} ${customer.lastName}`
    });
  } catch (error) {
    console.error("Error sending reminder:", error);
    res.status(500).json({ message: "Failed to send reminder" });
  }
});

export default router;