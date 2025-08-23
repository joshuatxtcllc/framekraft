import { Router } from 'express';
import * as storage from '../mongoStorage';
import { validateSession } from '../middleware/sessionValidation';

const router = Router();

// Get financial summary
router.get('/summary', validateSession, async (req, res) => {
  try {
    // Pass the user's ID to get user-specific analytics
    const userId = req.user?._id?.toString() || req.user?.id;
    const analytics = await storage.getFinancialAnalytics(userId);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({ error: 'Failed to fetch financial summary' });
  }
});

// Get all expenses
router.get('/expenses', validateSession, async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    const userId = req.user?._id?.toString() || req.user?.id;
    
    const filter: any = { userId }; // Always include userId
    if (startDate && endDate) {
      filter.startDate = new Date(startDate as string);
      filter.endDate = new Date(endDate as string);
    }
    if (category) {
      filter.category = category as string;
    }
    
    const expenses = await storage.getExpenses(filter);
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Create new expense
router.post('/expenses', validateSession, async (req, res) => {
  try {
    const userId = req.user?._id?.toString() || req.user?.id;
    const expenseData = {
      ...req.body,
      userId, // Always add userId to the expense
      // Only add createdBy if it's a valid MongoDB ObjectId
      ...(userId && userId.match(/^[0-9a-fA-F]{24}$/) ? { createdBy: userId } : {})
    };
    
    const expense = await storage.createExpense(expenseData);
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Update expense
router.put('/expenses/:id', validateSession, async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await storage.updateExpense(id, req.body);
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete expense
router.delete('/expenses/:id', validateSession, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await storage.deleteExpense(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Get all transactions
router.get('/transactions', validateSession, async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    const userId = req.user?._id?.toString() || req.user?.id;
    
    const filter: any = { userId }; // Always include userId
    if (startDate && endDate) {
      filter.startDate = new Date(startDate as string);
      filter.endDate = new Date(endDate as string);
    }
    if (type) {
      filter.type = type as string;
    }
    
    const transactions = await storage.getTransactions(filter);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get monthly financial report
router.get('/reports/monthly/:period', validateSession, async (req, res) => {
  try {
    const { period } = req.params;
    const userId = req.user?._id?.toString() || req.user?.id;
    const summary = await storage.getFinancialSummary(period, userId);
    
    if (!summary) {
      return res.status(404).json({ error: 'No data available for this period' });
    }
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching monthly report:', error);
    res.status(500).json({ error: 'Failed to fetch monthly report' });
  }
});

// Generate financial report (PDF)
router.post('/reports/generate', validateSession, async (req, res) => {
  try {
    const { type, startDate, endDate } = req.body;
    const userId = req.user?._id?.toString() || req.user?.id;
    
    // Get data based on report type
    let reportData: any = {};
    
    if (type === 'expense_report') {
      reportData.expenses = await storage.getExpenses({
        userId,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      });
      reportData.total = reportData.expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
    } else if (type === 'revenue_report') {
      // Get paid invoices for the period (user-specific)
      const invoices = await storage.getInvoices(userId);
      reportData.invoices = invoices.filter((inv: any) => {
        const paidDate = new Date(inv.paidDate || inv.createdAt);
        return inv.status === 'paid' && 
               paidDate >= new Date(startDate) && 
               paidDate <= new Date(endDate);
      });
      reportData.total = reportData.invoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
    } else if (type === 'profit_loss') {
      // Get both revenue and expenses (user-specific)
      const expenses = await storage.getExpenses({
        userId,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      });
      const invoices = await storage.getInvoices(userId);
      const paidInvoices = invoices.filter((inv: any) => {
        const paidDate = new Date(inv.paidDate || inv.createdAt);
        return inv.status === 'paid' && 
               paidDate >= new Date(startDate) && 
               paidDate <= new Date(endDate);
      });
      
      reportData = {
        revenue: paidInvoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0),
        expenses: expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0),
        invoices: paidInvoices,
        expenseList: expenses
      };
      reportData.netProfit = reportData.revenue - reportData.expenses;
    }
    
    res.json({
      type,
      period: { startDate, endDate },
      data: reportData,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Update financial summaries (admin task)
router.post('/update-summaries', validateSession, async (req, res) => {
  try {
    // Update summaries for the last 6 months (user-specific)
    const userId = req.user?._id?.toString() || req.user?.id;
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 15);
      await storage.updateFinancialSummary(date, userId);
    }
    
    res.json({ success: true, message: 'Financial summaries updated' });
  } catch (error) {
    console.error('Error updating summaries:', error);
    res.status(500).json({ error: 'Failed to update summaries' });
  }
});

// Record payment as income transaction
router.post('/record-payment', validateSession, async (req, res) => {
  try {
    const { invoiceId, amount, paymentMethod, notes } = req.body;
    
    // Get invoice details
    const invoice = await storage.getInvoiceById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // Create income transaction (with userId)
    const userId = req.user?._id?.toString() || req.user?.id;
    const transaction = await storage.createTransaction({
      type: 'income',
      category: 'payment',
      amount,
      description: `Payment for Invoice #${invoice.invoiceNumber}`,
      referenceId: invoice._id,
      referenceType: 'invoice',
      date: new Date(),
      userId
    });
    
    // Update invoice status if fully paid
    if (invoice.status !== 'paid') {
      await storage.updateInvoice(invoiceId, { 
        status: 'paid', 
        paidDate: new Date() 
      });
    }
    
    // Update financial summary (user-specific)
    await storage.updateFinancialSummary(new Date(), userId);
    
    res.json({ transaction, invoice });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

export default router;