import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiService } from "./services/aiService";
import { emailService } from './services/emailService';
import { searchService } from './services/searchService';
import { settingsService } from './services/settingsService';
import { insertCustomerSchema, insertOrderSchema } from "@shared/schema";
import { registerPricingRoutes } from "./routes/pricing";
import { registerWholesalerRoutes } from "./routes/wholesalers";
import { registerInvoiceRoutes } from "./routes/invoices";
import { registerFileUploadRoutes } from "./routes/fileUpload";
import settingsRoutes from './routes/settings.js';

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard metrics
  app.get('/api/dashboard/metrics', isAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      const customers = await storage.getCustomers();

      const currentMonth = new Date();
      currentMonth.setDate(1);

      const monthlyOrders = orders.filter(order => 
        new Date(order.createdAt!) >= currentMonth
      );

      const monthlyRevenue = monthlyOrders.reduce(
        (sum, order) => sum + parseFloat(order.totalAmount), 0
      );

      const activeOrders = orders.filter(order => 
        !['completed', 'cancelled'].includes(order.status)
      ).length;

      const completedOrders = orders.filter(order => order.status === 'completed').length;
      const completionRate = orders.length > 0 ? (completedOrders / orders.length) * 100 : 0;

      res.json({
        monthlyRevenue,
        activeOrders,
        totalCustomers: customers.length,
        completionRate: Math.round(completionRate * 10) / 10,
        newCustomersThisMonth: customers.filter(customer => 
          new Date(customer.createdAt!) >= currentMonth
        ).length,
        recentOrders: orders.slice(0, 5)
      });
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Customer routes
  app.get('/api/customers', isAuthenticated, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post('/api/customers', isAuthenticated, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(400).json({ message: "Failed to create customer" });
    }
  });

  app.get('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      const orders = await storage.getOrdersByCustomer(id);
      res.json({ ...customer, orders });
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.put('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(id, customerData);
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(400).json({ message: "Failed to update customer" });
    }
  });

  // Order routes
  app.get('/api/orders', isAuthenticated, async (req, res) => {
    try {
      const { status } = req.query;
      let orders;

      if (status && typeof status === 'string') {
        orders = await storage.getOrdersByStatus(status);
      } else {
        orders = await storage.getOrders();
      }

      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post('/api/orders', isAuthenticated, async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      // Generate shorter order number (e.g., FC2401)
  const orderNumber = `FC${new Date().getFullYear().toString().slice(-2)}${String(orderData.nextOrderId).padStart(2, '0')}`;
      const order = await storage.createOrder({
        ...orderData,
        orderNumber,
        totalAmount: parseFloat(req.body.totalAmount),
        depositAmount: req.body.depositAmount ? parseFloat(req.body.depositAmount) : 0,
        discountPercentage: req.body.discountPercentage ? parseFloat(req.body.discountPercentage) : 0,
        status: req.body.status || 'pending',
        priority: req.body.priority || 'normal',
        dueDate: req.body.dueDate || null,
        notes: req.body.notes || '',
      });
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(400).json({ message: "Failed to create order" });
    }
  });

  app.get('/api/orders/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      const projectSteps = await storage.getProjectSteps(id);
      res.json({ ...order, projectSteps });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.put('/api/orders/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const orderData = insertOrderSchema.partial().parse(req.body);
      const order = await storage.updateOrder(id, {
        ...orderData,
        totalAmount: parseFloat(req.body.totalAmount),
        depositAmount: req.body.depositAmount ? parseFloat(req.body.depositAmount) : 0,
        discountPercentage: req.body.discountPercentage ? parseFloat(req.body.discountPercentage) : 0,
        status: req.body.status,
        priority: req.body.priority,
        dueDate: req.body.dueDate || null,
        notes: req.body.notes || '',
      });
      res.json(order);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(400).json({ message: "Failed to update order" });
    }
  });

  // Project tracking routes
  app.get('/api/orders/:id/steps', isAuthenticated, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const steps = await storage.getProjectSteps(orderId);
      res.json(steps);
    } catch (error) {
      console.error("Error fetching project steps:", error);
      res.status(500).json({ message: "Failed to fetch project steps" });
    }
  });

  app.put('/api/project-steps/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const stepData = req.body;
      const step = await storage.updateProjectStep(id, stepData);
      res.json(step);
    } catch (error) {
      console.error("Error updating project step:", error);
      res.status(400).json({ message: "Failed to update project step" });
    }
  });

  // AI routes
  app.post('/api/ai/message', isAuthenticated, async (req, res) => {
    try {
      const { message, context } = req.body;
      const response = await aiService.sendMessage(message, context);
      res.json(response);
    } catch (error) {
      console.error("Error processing AI message:", error);
      res.status(500).json({ message: "Failed to process AI request" });
    }
  });

  app.post('/api/ai/frame-recommendation', isAuthenticated, async (req, res) => {
    try {
      const { artworkDescription, dimensions, customerPreferences, budget } = req.body;
      const recommendation = await aiService.analyzeFrameRecommendation(
        artworkDescription,
        dimensions,
        customerPreferences,
        budget
      );
      res.json(recommendation);
    } catch (error) {
      console.error("Error generating frame recommendation:", error);
      res.status(500).json({ message: "Failed to generate frame recommendation" });
    }
  });

  app.get('/api/ai/insights', isAuthenticated, async (req, res) => {
    try {
      const insights = await storage.getAiInsights(10);
      res.json(insights);
    } catch (error) {
      console.error("Error fetching AI insights:", error);
      res.status(500).json({ message: "Failed to fetch AI insights" });
    }
  });

  app.post('/api/ai/generate-insights', isAuthenticated, async (req, res) => {
    try {
      // Gather business data for AI analysis
      const orders = await storage.getOrders();
      const customers = await storage.getCustomers();

      const businessData = {
        recentOrders: orders.slice(0, 50),
        monthlyRevenue: orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0),
        customerCount: customers.length,
        averageOrderValue: orders.length > 0 ? 
          orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0) / orders.length : 0,
        popularFrames: orders.map(o => o.frameStyle).filter(Boolean),
      };

      const insights = await aiService.generateBusinessInsights(businessData);

      // Store insights in database
      for (const insight of insights) {
        await storage.createAiInsight({
          type: 'business_insight',
          title: insight.title,
          description: insight.description,
          confidence: insight.confidence.toString(),
          metadata: {
            actionItems: insight.action_items,
            impactScore: insight.impact_score,
            type: insight.type
          }
        });
      }

      res.json(insights);
    } catch (error) {
      console.error("Error generating business insights:", error);
      res.status(500).json({ message: "Failed to generate business insights" });
    }
  });

  // Document generation and email routes
  app.post('/api/orders/email-document', isAuthenticated, async (req, res) => {
    try {
      const { orderId, type, emailAddress } = req.body;

      // Get order and customer data
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const customer = await storage.getCustomer(order.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // For now, we'll simulate email sending
      // In a real implementation, you would integrate with an email service like SendGrid, Nodemailer, etc.
      console.log(`Simulating email send:`);
      console.log(`To: ${emailAddress}`);
      console.log(`Subject: ${type === 'invoice' ? 'Invoice' : 'Work Order'} ${order.orderNumber}`);
      console.log(`Order ID: ${orderId}`);
      console.log(`Customer: ${customer.firstName} ${customer.lastName}`);

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      res.json({ 
        success: true, 
        message: `${type === 'invoice' ? 'Invoice' : 'Work order'} email sent successfully` 
      });
    } catch (error) {
      console.error("Error sending document email:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // Inventory routes
  app.get('/api/inventory', isAuthenticated, async (req, res) => {
    try {
      const inventory = await storage.getInventory();
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.get('/api/inventory/low-stock', isAuthenticated, async (req, res) => {
    try {
      const lowStockItems = await storage.getLowStockItems();
      res.json(lowStockItems);
    } catch (error) {
      console.error("Error fetching low stock items:", error);
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });

  // Integration settings routes
  app.get('/api/settings/integrations', isAuthenticated, async (req, res) => {
    try {
      const settings = settingsService.getSettings();
      const status = settingsService.getServiceStatus();
      res.json({ settings, status });
    } catch (error) {
      console.error("Error fetching integration settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put('/api/settings/integrations', isAuthenticated, async (req, res) => {
    try {
      settingsService.updateSettings(req.body);
      res.json({ message: "Settings updated successfully" });
    } catch (error) {
      console.error("Error updating integration settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Service health check
  app.get('/api/health/integrations', isAuthenticated, async (req, res) => {
    try {
      const status = settingsService.getServiceStatus();
      const health = {
        gmail: {
          configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN),
          ...status.gmail
        },
        openai: {
          configured: !!process.env.OPENAI_API_KEY,
          ...status.openai
        },
        stripe: {
          configured: !!process.env.STRIPE_SECRET_KEY,
          ...status.stripe
        },
        googleSearch: {
          configured: !!(process.env.GOOGLE_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID),
          ...status.googleSearch
        }
      };
      res.json(health);
    } catch (error) {
      console.error("Error checking service health:", error);
      res.status(500).json({ message: "Failed to check service health" });
    }
  });

  // Register new feature routes
  registerPricingRoutes(app);
  registerWholesalerRoutes(app);
  registerInvoiceRoutes(app);
  registerFileUploadRoutes(app);
  app.use('/api/pricing', pricingRoutes);
  app.use('/api/wholesalers', wholesalersRoutes);
  app.use('/api/invoices', invoicesRoutes);
  app.use('/api/upload', fileUploadRoutes);
  app.use('/api/settings', settingsRoutes);

  const httpServer = createServer(app);
  return httpServer;
}