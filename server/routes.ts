import type { Express } from "express";
import { createServer, type Server } from "http";
import * as storage from "./mongoStorage";
import { setupAuthenticationSystem, authenticate, migrateAuthentication } from "./auth";
import { demoAuthService } from "./auth/services/demoAuthService";
import { aiService } from "./services/aiService";
import { emailService } from './services/emailService';
import { searchService } from './services/searchService';
import { settingsService } from './services/settingsService';
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
import authRoutes from "./routes/authMongoDB";
import searchRoutes from "./routes/search";
import financeRoutes from "./routes/finance";
import aiAssistantRoutes from "./routes/ai-assistant";
import { rateLimit } from "./middleware/rateLimiting";
import { requestLogger } from "./middleware/logging";
import { validateSession, optionalAuth } from "./middleware/sessionValidation";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register MongoDB auth routes
  app.use('/api/auth', authRoutes);
  
  // Demo login removed - use real authentication only
  
  // Simple logout endpoint  
  app.get('/api/logout', (req, res) => {
    // Clear the authentication cookie
    res.clearCookie('accessToken');
    // Redirect to login page
    res.redirect('/login');
  });

  // Registration is now handled by MongoDB auth routes at /api/auth/signup
  // Skip migration in development if database is not available
  try {
    await migrateAuthentication();
  } catch (error: any) {
    if (error.message?.includes('DATABASE_URL') || error.code === 'ECONNREFUSED') {
      console.log('⚠️ Skipping database migration - using in-memory auth');
    } else {
      throw error;
    }
  }
  
  // Setup new authentication system
  try {
    await setupAuthenticationSystem(app);
  } catch (error: any) {
    console.log('⚠️ Using simplified auth setup due to:', error.message);
  }
  
  // Use new authentication middleware with session validation
  const isAuthenticated = validateSession;

  // The /api/auth/user endpoint is now handled by authRoutes (authMongoDB.ts)

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
  app.get('/api/customers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?._id?.toString();
      const customers = await storage.getCustomers(userId);
      // Transform MongoDB documents to match frontend expectations
      const formattedCustomers = customers.map((customer: any) => ({
        id: customer._id?.toString() || customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        notes: customer.notes,
        totalSpent: customer.totalSpent,
        orderCount: customer.orderCount,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt
      }));
      res.json(formattedCustomers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post('/api/customers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Don't use PostgreSQL schema for MongoDB - just validate required fields
      const { firstName, lastName, email, phone, address, notes } = req.body;
      
      if (!firstName || !lastName) {
        return res.status(400).json({ message: "First name and last name are required" });
      }
      
      const customerData = {
        firstName,
        lastName,
        email: email || undefined,
        phone: phone || undefined,
        address: address || undefined,
        notes: notes || undefined,
      };
      
      const customer = await storage.createCustomer(customerData, userId);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(400).json({ message: "Failed to create customer" });
    }
  });

  app.get('/api/customers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?._id?.toString();
      const id = req.params.id;
      const customer = await storage.getCustomer(id, userId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      const orders = await storage.getOrdersByCustomer(id, userId);
      
      // Format customer data properly
      const formattedCustomer = {
        id: customer._id?.toString() || customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        notes: customer.notes,
        totalSpent: customer.totalSpent,
        orderCount: customer.orderCount,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        orders
      };
      
      res.json(formattedCustomer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.put('/api/customers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const id = req.params.id;
      
      // Don't use PostgreSQL schema for MongoDB - just extract the fields we can update
      const { firstName, lastName, email, phone, address, notes } = req.body;
      
      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (notes !== undefined) updateData.notes = notes;
      
      const customer = await storage.updateCustomer(id, updateData, userId);
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(400).json({ message: "Failed to update customer" });
    }
  });

  app.delete('/api/customers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?._id?.toString();
      const id = req.params.id;
      
      // Check if customer has any orders
      const orders = await storage.getOrdersByCustomer(id, userId);
      if (orders && orders.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete customer with existing orders",
          orderCount: orders.length 
        });
      }
      
      await storage.deleteCustomer(id, userId);
      res.json({ success: true, message: "Customer deleted successfully" });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Order routes
  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?._id?.toString();
      const { status } = req.query;
      let orders;

      if (status && typeof status === 'string') {
        orders = await storage.getOrdersByStatus(status, userId);
      } else {
        orders = await storage.getOrders(userId);
      }

      // The mongoStorage.getOrders already populates customer data
      // Just ensure the response format matches frontend expectations
      const formattedOrders = orders.map((order: any) => ({
        ...order,
        id: order.id || order._id?.toString(),
        customer: order.customer || order.customerId,
      }));

      res.json(formattedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?._id?.toString();
      console.log("Raw order data received:", JSON.stringify(req.body, null, 2));

      // Don't use the PostgreSQL schema validation for MongoDB
      const orderData = req.body;
      console.log("Order data:", JSON.stringify(orderData, null, 2));

      // Handle temporary customer creation if customerId is negative
      let finalCustomerId = orderData.customerId;
      
      // Check if we're creating a new customer (negative ID from frontend)
      if (parseInt(orderData.customerId) < 0) {
        console.log("Creating new customer for temporary ID:", orderData.customerId);
        
        // Extract customer name from the order form
        // The frontend sends the customer data when creating a new customer inline
        const nameParts = (orderData.customerName || '').split(' ');
        const firstName = nameParts[0] || 'New';
        const lastName = nameParts.slice(1).join(' ') || 'Customer';
        
        // Create a real customer
        const newCustomer = await storage.createCustomer({
          firstName,
          lastName,
          email: orderData.customerEmail || undefined,
          phone: orderData.customerPhone || undefined,
        }, userId);
        
        finalCustomerId = (newCustomer as any)._id.toString();
        console.log("Created new customer with ID:", finalCustomerId);
      } else {
        // For existing customers, we need to find them by their numeric ID
        // and get their MongoDB ObjectId
        const customers = await storage.getCustomers(userId);
        const customer = customers.find(c => c.id?.toString() === orderData.customerId?.toString());
        
        if (customer) {
          finalCustomerId = customer._id ? customer._id.toString() : customer.id;
        } else {
          // If not found by id field, try to find by _id directly
          const directCustomer = await storage.getCustomer(orderData.customerId, userId);
          if (directCustomer) {
            finalCustomerId = (directCustomer as any)._id.toString();
          } else {
            throw new Error(`Customer not found with ID: ${orderData.customerId}`);
          }
        }
      }

      // Generate order number using current orders count for unique ID
      const existingOrders = await storage.getOrders(userId);
      const nextOrderId = existingOrders.length + 1;
      const orderNumber = `FC${new Date().getFullYear().toString().slice(-2)}${String(nextOrderId).padStart(4, '0')}`;
      console.log("Generated order number:", orderNumber);

      // Create the order with validated data
      const order = await storage.createOrder({
        customerId: finalCustomerId,
        orderNumber,
        description: orderData.description,
        artworkDescription: orderData.artworkDescription || undefined,
        artworkImage: orderData.artworkImage || undefined,
        dimensions: orderData.dimensions || undefined,
        frameStyle: orderData.frameStyle || undefined,
        matColor: orderData.matColor || undefined,
        glazing: orderData.glazing || undefined,
        totalAmount: parseFloat(orderData.totalAmount),
        depositAmount: orderData.depositAmount ? parseFloat(orderData.depositAmount) : 0,
        discountPercentage: orderData.discountPercentage ? parseFloat(orderData.discountPercentage) : 0,
        taxAmount: orderData.taxAmount ? parseFloat(orderData.taxAmount) : 0,
        discountAmount: orderData.discountAmount ? parseFloat(orderData.discountAmount) : 0,
        taxExempt: orderData.taxExempt || false,
        status: orderData.status || 'pending',
        priority: orderData.priority || 'normal',
        notes: orderData.notes || undefined,
        dueDate: orderData.dueDate ? new Date(orderData.dueDate) : undefined,
        deliveryMethod: orderData.deliveryMethod || undefined,
        rushOrder: orderData.rushOrder || false,
        estimatedDeliveryDate: orderData.estimatedDeliveryDate ? new Date(orderData.estimatedDeliveryDate) : undefined,
      }, userId);
      
      console.log("Order created successfully:", (order as any)._id);
      
      // Transform the response to match frontend expectations
      const responseOrder = {
        ...(order as any).toObject(),
        id: (order as any)._id.toString(),
        customer: await storage.getCustomer(finalCustomerId, userId),
      };
      
      res.status(201).json(responseOrder);
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
      const id = req.params.id;
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

  app.put('/api/orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?._id?.toString();
      const id = req.params.id;
      // Don't validate with insertOrderSchema since MongoDB uses string IDs
      // Extract only the fields we need to update
      const updateData: any = {};
      
      // Handle customerId - it might be an object or a string
      if (req.body.customerId) {
        if (typeof req.body.customerId === 'object' && req.body.customerId !== null) {
          // If it's an object, extract the ID
          updateData.customerId = req.body.customerId._id || req.body.customerId.id;
        } else if (typeof req.body.customerId === 'string') {
          // If it's already a string, use it directly
          updateData.customerId = req.body.customerId;
        }
      }
      
      // Copy over other fields
      if (req.body.orderNumber !== undefined) updateData.orderNumber = req.body.orderNumber;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.artworkDescription !== undefined) updateData.artworkDescription = req.body.artworkDescription;
      if (req.body.artworkImage !== undefined) updateData.artworkImage = req.body.artworkImage;
      if (req.body.dimensions !== undefined) updateData.dimensions = req.body.dimensions;
      if (req.body.frameStyle !== undefined) updateData.frameStyle = req.body.frameStyle;
      if (req.body.matColor !== undefined) updateData.matColor = req.body.matColor;
      if (req.body.glazing !== undefined) updateData.glazing = req.body.glazing;
      if (req.body.totalAmount !== undefined) updateData.totalAmount = parseFloat(req.body.totalAmount);
      if (req.body.depositAmount !== undefined) updateData.depositAmount = parseFloat(req.body.depositAmount);
      if (req.body.discountPercentage !== undefined) updateData.discountPercentage = parseFloat(req.body.discountPercentage);
      if (req.body.status !== undefined) updateData.status = req.body.status;
      if (req.body.priority !== undefined) updateData.priority = req.body.priority;
      if (req.body.dueDate !== undefined) updateData.dueDate = req.body.dueDate || null;
      if (req.body.notes !== undefined) updateData.notes = req.body.notes || '';
      
      const order = await storage.updateOrder(id, updateData, userId);
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
  registerPricingRoutes(app, isAuthenticated);
  registerWholesalerRoutes(app, isAuthenticated);
  registerInvoiceRoutes(app, isAuthenticated);
  registerFileUploadRoutes(app, isAuthenticated);

  // Register AI routes
  const aiRoutes = await import('./routes/ai.js');
  app.use('/api/ai', aiRoutes.default);
  
  // Register AI Assistant routes (Claude integration)
  app.use('/api/ai', aiAssistantRoutes);

  // Public routes (no authentication required)
  const { publicRoutes } = await import("./routes/public.js");
  app.use("/api/public", publicRoutes);

  // Register search routes
  app.use("/api", searchRoutes);
  
  // Register other routes that were not covered by the new registration system
  app.use("/api/settings", settingsRoutes);
  app.use("/api/vendor-catalog", vendorCatalogRoutes);
  app.use("/api/giclee", giclee);
  app.use("/api/communication", communication);
  app.use("/api/inventory", inventoryRoutes);

  // Add receivables routes for payment management
  const receivablesRoutes = await import('./routes/receivables');
  app.use('/api/receivables', receivablesRoutes.default);
  
  // Add email configuration routes
  const emailConfigRoutes = await import('./routes/email-config');
  app.use('/api/email', emailConfigRoutes.default);
  
  // Add system routes for validation
  const validationRoutes = await import('./routes/validation');
  app.use('/api/system', validationRoutes.default);
  
  // Finance routes
  app.use('/api/finance', financeRoutes);

  const httpServer = createServer(app);
  return httpServer;
}