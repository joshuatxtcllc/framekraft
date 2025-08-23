import { Router } from 'express';
import * as storage from '../mongoStorage';
import { authenticate } from '../auth';

const router = Router();

// Get financial summary
router.get('/summary', authenticate, async (req, res) => {
  try {
    const analytics = await storage.getFinancialAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({ error: 'Failed to fetch financial summary' });
  }
});

// Get all expenses
router.get('/expenses', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    
    const filter: any = {};
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
router.post('/expenses', authenticate, async (req, res) => {
  try {
    const expenseData = {
      ...req.body,
      // Only add createdBy if it's a valid MongoDB ObjectId
      ...(req.user?.id && req.user.id.match(/^[0-9a-fA-F]{24}$/) ? { createdBy: req.user.id } : {})
    };
    
    const expense = await storage.createExpense(expenseData);
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Update expense
router.put('/expenses/:id', authenticate, async (req, res) => {
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
router.delete('/expenses/:id', authenticate, async (req, res) => {
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
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    const filter: any = {};
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
router.get('/reports/monthly/:period', authenticate, async (req, res) => {
  try {
    const { period } = req.params;
    const summary = await storage.getFinancialSummary(period);
    
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
router.post('/reports/generate', authenticate, async (req, res) => {
  try {
    const { type, startDate, endDate } = req.body;
    
    // Get data based on report type
    let reportData: any = {};
    
    if (type === 'expense_report') {
      reportData.expenses = await storage.getExpenses({
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      });
      reportData.total = reportData.expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
    } else if (type === 'revenue_report') {
      // Get paid invoices for the period
      const invoices = await storage.getInvoices();
      reportData.invoices = invoices.filter((inv: any) => {
        const paidDate = new Date(inv.paidDate || inv.createdAt);
        return inv.status === 'paid' && 
               paidDate >= new Date(startDate) && 
               paidDate <= new Date(endDate);
      });
      reportData.total = reportData.invoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
    } else if (type === 'profit_loss') {
      // Get both revenue and expenses
      const expenses = await storage.getExpenses({
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      });
      const invoices = await storage.getInvoices();
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
router.post('/update-summaries', authenticate, async (req, res) => {
  try {
    // Update summaries for the last 6 months
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 15);
      await storage.updateFinancialSummary(date);
    }
    
    res.json({ success: true, message: 'Financial summaries updated' });
  } catch (error) {
    console.error('Error updating summaries:', error);
    res.status(500).json({ error: 'Failed to update summaries' });
  }
});

// Record payment as income transaction
router.post('/record-payment', authenticate, async (req, res) => {
  try {
    const { invoiceId, amount, paymentMethod, notes } = req.body;
    
    // Get invoice details
    const invoice = await storage.getInvoiceById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // Create income transaction
    const transaction = await storage.createTransaction({
      type: 'income',
      category: 'payment',
      amount,
      description: `Payment for Invoice #${invoice.invoiceNumber}`,
      referenceId: invoice._id,
      referenceType: 'invoice',
      date: new Date()
    });
    
    // Update invoice status if fully paid
    if (invoice.status !== 'paid') {
      await storage.updateInvoice(invoiceId, { 
        status: 'paid', 
        paidDate: new Date() 
      });
    }
    
    // Update financial summary
    await storage.updateFinancialSummary(new Date());
    
    res.json({ transaction, invoice });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

export default router;