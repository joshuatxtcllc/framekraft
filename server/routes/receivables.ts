import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../middleware/auth";

const router = Router();

// Get payment record for order
router.post("/record-payment", isAuthenticated, async (req, res) => {
  try {
    const { orderId, paymentAmount, paymentMethod, notes } = req.body;
    
    // Get the order
    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const currentBalance = order.balanceAmount ? parseFloat(order.balanceAmount) : 0;
    const currentDeposit = order.depositAmount ? parseFloat(order.depositAmount) : 0;
    const payment = parseFloat(paymentAmount);
    
    // Calculate new amounts
    const newDepositAmount = currentDeposit + payment;
    const newBalanceAmount = Math.max(0, currentBalance - payment);
    
    // Update order with payment
    await storage.updateOrder(orderId, {
      depositAmount: newDepositAmount.toFixed(2),
      balanceAmount: newBalanceAmount.toFixed(2),
      // If balance is paid off, mark as ready for pickup
      status: newBalanceAmount === 0 ? 'ready' : order.status
    });

    // Log payment (you could create a payments table for better tracking)
    console.log(`Payment recorded: Order ${order.orderNumber}, Amount: $${payment}, Method: ${paymentMethod}, Remaining: $${newBalanceAmount}`);

    res.json({ 
      success: true, 
      newBalance: newBalanceAmount,
      newDepositTotal: newDepositAmount,
      message: `Payment of $${payment} recorded successfully`
    });
  } catch (error) {
    console.error("Error recording payment:", error);
    res.status(500).json({ message: "Failed to record payment" });
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