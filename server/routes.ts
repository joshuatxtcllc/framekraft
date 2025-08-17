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
import vendorCatalogRoutes from './routes/vendorCatalog.js';
import inventoryRoutes from "./routes/inventory.js";
import ai from "./routes/ai.js";
import giclee from "./routes/giclee.js";
import communication from "./routes/communication.js";
import { rateLimit } from "./middleware/rateLimiting";
import { requestLogger } from "./middleware/logging";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user || !req.user.claims || !req.user.claims.sub) {
        console.error("Invalid user session data:", req.user);
        return res.status(401).json({ message: "Invalid session", isAuthenticated: false });
      }

      const userId = req.user.claims.sub;
      console.log("Fetching user for ID:", userId);

      const user = await storage.getUser(userId);

      if (!user) {
        console.error("User not found in database:", userId);
        return res.status(404).json({ message: "User not found", isAuthenticated: false });
      }

      const userResponse = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        isAuthenticated: true
      };

      console.log("Successfully fetched user:", userResponse.email);
      res.json(userResponse);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user", isAuthenticated: false });
    }
  });

  // Dashboard metrics
  app.get('/api/dashboard/metrics', isAuthenticated, async (req, res) => {
    try {
      const { metricsService } = await import('./services/metricsService');
      const metrics = await metricsService.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Force refresh metrics endpoint
  app.post('/api/dashboard/metrics/refresh', isAuthenticated, async (req, res) => {
    try {
      const { metricsService } = await import('./services/metricsService');
      const metrics = await metricsService.refreshMetrics();
      res.json({ message: "Metrics refreshed successfully", metrics });
    } catch (error) {
      console.error("Error refreshing dashboard metrics:", error);
      res.status(500).json({ message: "Failed to refresh dashboard metrics" });
    }
  });

  // Metrics validation endpoint
  app.get('/api/dashboard/metrics/validate', isAuthenticated, async (req: any, res: any) => {
    try {
      const { metricsService } = await import('./services/metricsService');
      const validation = await metricsService.validateMetrics();
      res.json(validation);
    } catch (error) {
      console.error('Metrics validation error:', error);
      res.status(500).json({ message: 'Failed to validate metrics' });
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
      console.log("Raw order data received:", JSON.stringify(req.body, null, 2));

      // Parse and validate the request body with the updated schema
      const orderData = insertOrderSchema.parse(req.body);
      console.log("Parsed order data:", JSON.stringify(orderData, null, 2));

      // Handle temporary customer creation if customerId is negative
      let finalCustomerId = orderData.customerId;
      if (orderData.customerId < 0) {
        console.log("Creating new customer for temporary ID:", orderData.customerId);

        // Find the temporary customer in the customers array (added by the frontend)
        const customers = await storage.getCustomers();
        const tempCustomer = customers.find(c => c.id === orderData.customerId);

        if (tempCustomer) {
          // Create a real customer
          const newCustomer = await storage.createCustomer({
            firstName: tempCustomer.firstName,
            lastName: tempCustomer.lastName,
            email: tempCustomer.email || undefined,
            phone: tempCustomer.phone || undefined,
            address: tempCustomer.address || undefined,
            notes: tempCustomer.notes || undefined,
          });
          finalCustomerId = newCustomer.id;
          console.log("Created new customer with ID:", finalCustomerId);
        } else {
          throw new Error("Temporary customer not found");
        }
      }

      // Generate order number using current orders count for unique ID
      const existingOrders = await storage.getOrders();
      const nextOrderId = existingOrders.length + 1;
      const orderNumber = `FC${new Date().getFullYear().toString().slice(-2)}${String(nextOrderId).padStart(2, '0')}`;
      console.log("Generated order number:", orderNumber);

      // Create the order with validated data
      const order = await storage.createOrder({
        ...orderData,
        customerId: finalCustomerId,
        orderNumber,
        // Convert date strings to Date objects if provided
        dueDate: orderData.dueDate ? new Date(orderData.dueDate) : undefined,
        completedAt: orderData.completedAt ? new Date(orderData.completedAt) : undefined,
      });
      console.log("Order created successfully:", order.id);
      res.status(201).json(order);
    } catch (error: any) {
      console.error("Error creating order:", error);
      console.error("Error details:", error?.message);
      console.error("Error stack:", error?.stack);
      if (error?.issues) {
        console.error("Validation issues:", error.issues);
      }

      // Enhanced error response with database-specific errors
      let errorMessage = "Failed to create order";
      let errorDetails: any = {};

      if (error?.message?.includes('duplicate key')) {
        errorMessage = "Order number already exists";
        errorDetails.type = "duplicate_key";
      } else if (error?.message?.includes('foreign key')) {
        errorMessage = "Invalid customer ID provided";
        errorDetails.type = "foreign_key";
      } else if (error?.issues) {
        errorMessage = "Validation failed";
        errorDetails.type = "validation";
        errorDetails.issues = error.issues;
      } else if (error?.message) {
        errorMessage = error.message;
        errorDetails.type = "database";
      }

      res.status(400).json({
        message: errorMessage,
        error: error?.message,
        details: errorDetails,
        timestamp: new Date().toISOString()
      });
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

  // New Orders endpoint with full middleware stack
  app.get('/api/orders/',
    requestLogger,
    rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }),
    isAuthenticated,
    async (req, res) => {
      try {
        const { status, customerId, limit, offset } = req.query;
        let orders;

        // Parse query parameters
        const queryLimit = limit ? parseInt(limit as string) : undefined;
        const queryOffset = offset ? parseInt(offset as string) : undefined;

        if (status && typeof status === 'string') {
          orders = await storage.getOrdersByStatus(status);
        } else if (customerId && typeof customerId === 'string') {
          const customerIdInt = parseInt(customerId);
          orders = await storage.getOrdersByCustomer(customerIdInt);
        } else {
          orders = await storage.getOrders();
        }

        // Apply pagination if requested
        if (queryLimit || queryOffset) {
          const startIndex = queryOffset || 0;
          const endIndex = queryLimit ? startIndex + queryLimit : orders.length;
          orders = orders.slice(startIndex, endIndex);
        }

        res.json({
          orders,
          total: orders.length,
          limit: queryLimit,
          offset: queryOffset || 0
        });
      } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({
          message: "Failed to fetch orders",
          timestamp: new Date().toISOString()
        });
      }
    }
  );

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
          configured: false,
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

  // Register AI routes
  const aiRoutes = await import('./routes/ai.js');
  app.use('/api/ai', aiRoutes.default);

  // Public routes (no authentication required)
  const { publicRoutes } = await import("./routes/public.js");
  app.use("/api/public", publicRoutes);

  // Register other routes that were not covered by the new registration system
  app.use("/api/settings", settingsRoutes);
  app.use("/api/vendor-catalog", vendorCatalogRoutes);
  app.use("/api/giclee", giclee);
  app.use("/api/communication", communication);
  app.use("/api/inventory", inventoryRoutes);

  const httpServer = createServer(app);
  return httpServer;
}