import type { Express } from "express";
import Stripe from "stripe";
import { storage } from "../storage";
import { insertInvoiceSchema, insertInvoiceItemSchema, insertPaymentSchema } from "@shared/schema";
import { isAuthenticated } from "../middleware/auth";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export function registerInvoiceRoutes(app: Express) {
  // Get all invoices
  app.get("/api/invoices", isAuthenticated, async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Get specific invoice
  app.get("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  // Create new invoice
  app.post("/api/invoices", isAuthenticated, async (req, res) => {
    try {
      const { invoice, items } = req.body;
      const validatedInvoice = insertInvoiceSchema.parse(invoice);
      const validatedItems = items.map((item: any) => insertInvoiceItemSchema.parse(item));
      
      const newInvoice = await storage.createInvoice(validatedInvoice, validatedItems);
      res.status(201).json(newInvoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  // Update invoice
  app.put("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(id, validatedData);
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  // Create Stripe payment intent for invoice
  app.post("/api/invoices/:id/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(invoice.totalAmount.toString()) * 100), // Convert to cents
        currency: "usd",
        metadata: {
          invoiceId: invoiceId.toString(),
          customerId: invoice.customerId.toString(),
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Mark invoice as paid (for non-Stripe payments)
  app.post("/api/invoices/:id/mark-paid", isAuthenticated, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const paymentData = insertPaymentSchema.parse(req.body);
      
      await storage.markInvoicePaid(invoiceId, paymentData);
      res.json({ message: "Invoice marked as paid" });
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
      res.status(500).json({ message: "Failed to mark invoice as paid" });
    }
  });

  // Generate invoice PDF (placeholder for now)
  app.get("/api/invoices/:id/pdf", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoice(id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // TODO: Implement PDF generation
      res.json({ 
        message: "PDF generation not yet implemented",
        invoice: invoice 
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Send invoice via email (placeholder for now)
  app.post("/api/invoices/:id/send", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { emailAddress } = req.body;
      const invoice = await storage.getInvoice(id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Update invoice status to sent
      await storage.updateInvoice(id, { 
        status: 'sent', 
        sentDate: new Date() 
      });

      // TODO: Implement email sending
      res.json({ 
        message: `Invoice sent to ${emailAddress}`,
        invoice: invoice 
      });
    } catch (error) {
      console.error("Error sending invoice:", error);
      res.status(500).json({ message: "Failed to send invoice" });
    }
  });

  // Handle Stripe webhook for successful payments
  app.post("/api/invoices/stripe-webhook", async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'];
      let event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
      } catch (err: any) {
        console.log(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const invoiceId = parseInt(paymentIntent.metadata.invoiceId);
        
        await storage.markInvoicePaid(invoiceId, {
          invoiceId,
          amount: (paymentIntent.amount / 100).toString(),
          paymentMethod: 'stripe',
          stripePaymentIntentId: paymentIntent.id,
          status: 'completed',
        });
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Error handling Stripe webhook:", error);
      res.status(500).json({ message: "Webhook error" });
    }
  });
}