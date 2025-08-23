import {
  users,
  customers,
  orders,
  projectSteps,
  aiInsights,
  businessMetrics,
  inventory,
  priceStructure,
  wholesalers,
  wholesalerProducts,
  invoices,
  invoiceItems,
  payments,
  communicationSettings,
  communicationLogs,
  type User,
  type UpsertUser,
  type InsertCustomer,
  type Customer,
  type InsertOrder,
  type Order,
  type OrderWithCustomer,
  type ProjectStep,
  type AiInsight,
  type BusinessMetric,
  type Inventory,
  type PriceStructure,
  type InsertPriceStructure,
  type Wholesaler,
  type InsertWholesaler,
  type WholesalerProduct,
  type InsertWholesalerProduct,
  type Invoice,
  type InsertInvoice,
  type InvoiceItem,
  type InsertInvoiceItem,
  type InvoiceWithDetails,
  type Payment,
  type InsertPayment,
  insertProjectStepSchema,
  insertAiInsightSchema,
  insertInventorySchema,
  insertPriceStructureSchema,
  insertWholesalerSchema,
  insertWholesalerProductSchema,
  insertInvoiceSchema,
  insertInvoiceItemSchema,
  insertPaymentSchema,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte, lte, inArray, or, like } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Customer operations
  getCustomers(userId: string): Promise<Customer[]>;
  getCustomer(id: number, userId: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer, userId: string): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>, userId: string): Promise<Customer>;
  deleteCustomer(id: number, userId: string): Promise<void>;

  // Order operations
  getOrders(userId: string): Promise<OrderWithCustomer[]>;
  getOrder(id: number, userId: string): Promise<OrderWithCustomer | undefined>;
  createOrder(order: InsertOrder, userId: string): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>, userId: string): Promise<Order>;
  deleteOrder(id: number, userId: string): Promise<void>;
  getOrdersByCustomer(customerId: number, userId: string): Promise<Order[]>;
  getOrdersByStatus(status: string, userId: string): Promise<OrderWithCustomer[]>;

  // Project tracking
  getProjectSteps(orderId: number): Promise<ProjectStep[]>;
  createProjectStep(step: any): Promise<ProjectStep>;
  updateProjectStep(id: number, step: any): Promise<ProjectStep>;

  // AI insights
  getAiInsights(userId: string, limit?: number): Promise<AiInsight[]>;
  createAiInsight(insight: any, userId: string): Promise<AiInsight>;
  markInsightActionTaken(id: number, userId: string): Promise<void>;
  deleteAiInsight(id: number, userId: string): Promise<void>;

  // Business metrics
  getBusinessMetrics(userId: string, type?: string, dateRange?: { start: Date; end: Date }): Promise<BusinessMetric[]>;
  createBusinessMetric(metric: Omit<BusinessMetric, 'id' | 'createdAt'>, userId: string): Promise<BusinessMetric>;
  storeBusinessMetric(metricType: string, value: number, userId: string): Promise<void>;
  getBusinessMetricsSimple(userId: string): Promise<Array<{metricType: string, value: number, updatedAt: Date}>>;

  // Inventory
  getInventory(userId: string): Promise<Inventory[]>;
  createInventoryItem(item: any, userId: string): Promise<Inventory>;
  updateInventoryItem(id: number, item: any, userId: string): Promise<Inventory>;
  deleteInventoryItem(id: number, userId: string): Promise<void>;
  updateInventoryStock(id: number, quantity: number, userId: string): Promise<Inventory>;
  getLowStockItems(userId: string): Promise<Inventory[]>;

  // Price Structure
  getPriceStructure(userId: string): Promise<PriceStructure[]>;
  createPriceStructure(price: InsertPriceStructure, userId: string): Promise<PriceStructure>;
  updatePriceStructure(id: number, price: Partial<InsertPriceStructure>, userId: string): Promise<PriceStructure>;
  deletePriceStructure(id: number, userId: string): Promise<void>;

  // Wholesalers
  getWholesalers(userId: string): Promise<Wholesaler[]>;
  createWholesaler(wholesaler: InsertWholesaler, userId: string): Promise<Wholesaler>;
  getWholesalerProducts(wholesalerId: number, userId: string): Promise<WholesalerProduct[]>;

  // Invoices
  getInvoices(userId: string): Promise<InvoiceWithDetails[]>;
  getInvoice(id: number, userId: string): Promise<InvoiceWithDetails | undefined>;
  createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[], userId: string): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>, userId: string): Promise<Invoice>;
  deleteInvoice(id: number, userId: string): Promise<void>;
  markInvoicePaid(invoiceId: number, payment: InsertPayment, userId: string): Promise<void>;

  // Stripe integration
  updateUserStripeInfo(userId: string, customerId: string, subscriptionId?: string): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Customer operations
  async getCustomers(userId: string): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.userId, userId)).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: number, userId: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(and(eq(customers.id, id), eq(customers.userId, userId)));
    return customer;
  }

  async createCustomer(customerData: InsertCustomer, userId: string): Promise<Customer> {
    const [customer] = await db.insert(customers).values({ ...customerData, userId }).returning();
    return customer;
  }

  async updateCustomer(id: number, customerData: Partial<InsertCustomer>, userId: string): Promise<Customer> {
    const [customer] = await db
      .update(customers)
      .set({ ...customerData, updatedAt: new Date() })
      .where(and(eq(customers.id, id), eq(customers.userId, userId)))
      .returning();
    return customer;
  }

  async deleteCustomer(id: number, userId: string): Promise<void> {
    await db.delete(customers).where(and(eq(customers.id, id), eq(customers.userId, userId)));
  }

  // Order operations
  async getOrders(userId: string): Promise<OrderWithCustomer[]> {
    return await db
      .select()
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .then(rows => 
        rows.map(row => ({
          ...row.orders,
          customer: row.customers!
        }))
      );
  }

  async getOrder(id: number, userId: string): Promise<OrderWithCustomer | undefined> {
    const [result] = await db
      .select()
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(and(eq(orders.id, id), eq(orders.userId, userId)));

    if (!result) return undefined;

    return {
      ...result.orders,
      customer: result.customers!
    };
  }

  async createOrder(orderData: InsertOrder, userId: string): Promise<Order> {
    try {
      console.log("Storage createOrder called with:", JSON.stringify(orderData, null, 2));

      // Validate required fields
      if (!orderData.customerId) {
        throw new Error("Customer ID is required");
      }
      if (!orderData.description) {
        throw new Error("Order description is required");
      }
      if (!orderData.totalAmount || orderData.totalAmount <= 0) {
        throw new Error("Valid total amount is required");
      }

      // Generate order number
      const orderNumber = orderData.orderNumber || `FC${Date.now()}`;
      console.log("Generated order number:", orderNumber);

      // Calculate balance amount if not provided
      const totalAmount = orderData.totalAmount;
      const depositAmount = orderData.depositAmount || 0;
      const calculatedBalance = totalAmount - depositAmount;

      // Prepare data for database insertion, converting numbers to strings for decimal fields
      const insertData = {
        userId,
        customerId: orderData.customerId,
        orderNumber,
        description: orderData.description,
        artworkDescription: orderData.artworkDescription || null,
        dimensions: orderData.dimensions || null,
        frameStyle: orderData.frameStyle || null,
        matColor: orderData.matColor || null,
        glazing: orderData.glazing || null,
        totalAmount: orderData.totalAmount.toString(),
        depositAmount: orderData.depositAmount?.toString() || "0",
        discountPercentage: orderData.discountPercentage?.toString() || "0",
        balanceAmount: orderData.balanceAmount?.toString() || calculatedBalance.toString(),
        taxAmount: orderData.taxAmount?.toString() || "0",
        discountAmount: orderData.discountAmount?.toString() || "0",
        taxExempt: orderData.taxExempt || false,
        laborCost: orderData.laborCost?.toString() || null,
        materialsCost: orderData.materialsCost?.toString() || null,
        status: orderData.status || "pending",
        priority: orderData.priority || "normal",
        dueDate: orderData.dueDate ? (typeof orderData.dueDate === 'string' ? new Date(orderData.dueDate + 'T00:00:00.000Z') : orderData.dueDate) : null,
        completedAt: orderData.completedAt ? (typeof orderData.completedAt === 'string' ? new Date(orderData.completedAt) : orderData.completedAt) : null,
        notes: orderData.notes || null,
        aiRecommendations: orderData.aiRecommendations || null,
      };

      console.log("Prepared data for database insertion:", JSON.stringify(insertData, null, 2));

      const [order] = await db
        .insert(orders)
        .values(insertData)
        .returning();

      console.log("Order inserted successfully:", order);

      // Create initial project steps
      const defaultSteps = [
        'consultation',
        'measuring',
        'ordering',
        'production',
        'assembly',
        'quality_check',
        'ready'
      ];

      for (const stepName of defaultSteps) {
        await db.insert(projectSteps).values({
          orderId: order.id,
          stepName,
          status: stepName === 'consultation' ? 'completed' : 'pending',
          completedAt: stepName === 'consultation' ? new Date() : null,
        });
      }

      // Update customer order count and total spent
      await db
        .update(customers)
        .set({
          orderCount: sql`${customers.orderCount} + 1`,
          totalSpent: sql`${customers.totalSpent} + ${orderData.totalAmount}`,
        })
        .where(eq(customers.id, orderData.customerId));

      return order;
    } catch (error: any) {
      console.error("Storage createOrder error:", error);
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);
      console.error("Error code:", error?.code);

      // Re-throw with enhanced error information
      throw new Error(`Database insertion failed: ${error?.message || 'Unknown database error'}`);
    }
  }

  async updateOrder(id: number, orderData: Partial<InsertOrder>, userId: string): Promise<Order> {
    // Convert number fields to strings for database storage, exclude problematic fields
    const updateData: any = {
      updatedAt: new Date()
    };

    // Only include defined fields and convert numbers to strings
    if (orderData.customerId !== undefined) updateData.customerId = orderData.customerId;
    if (orderData.description !== undefined) updateData.description = orderData.description;
    if (orderData.artworkDescription !== undefined) updateData.artworkDescription = orderData.artworkDescription;
    if (orderData.dimensions !== undefined) updateData.dimensions = orderData.dimensions;
    if (orderData.frameStyle !== undefined) updateData.frameStyle = orderData.frameStyle;
    if (orderData.matColor !== undefined) updateData.matColor = orderData.matColor;
    if (orderData.glazing !== undefined) updateData.glazing = orderData.glazing;
    if (orderData.totalAmount !== undefined) updateData.totalAmount = orderData.totalAmount.toString();
    if (orderData.depositAmount !== undefined) updateData.depositAmount = orderData.depositAmount.toString();
    if (orderData.discountPercentage !== undefined) updateData.discountPercentage = orderData.discountPercentage.toString();
    if (orderData.balanceAmount !== undefined) updateData.balanceAmount = orderData.balanceAmount.toString();
    if (orderData.taxAmount !== undefined) updateData.taxAmount = orderData.taxAmount.toString();
    if (orderData.discountAmount !== undefined) updateData.discountAmount = orderData.discountAmount.toString();
    if (orderData.taxExempt !== undefined) updateData.taxExempt = orderData.taxExempt;
    if (orderData.laborCost !== undefined) updateData.laborCost = orderData.laborCost.toString();
    if (orderData.materialsCost !== undefined) updateData.materialsCost = orderData.materialsCost.toString();
    if (orderData.status !== undefined) updateData.status = orderData.status;
    if (orderData.priority !== undefined) updateData.priority = orderData.priority;
    if (orderData.dueDate !== undefined) {
      updateData.dueDate = orderData.dueDate ? new Date(orderData.dueDate) : null;
    }
    if (orderData.completedAt !== undefined) updateData.completedAt = orderData.completedAt;
    if (orderData.notes !== undefined) updateData.notes = orderData.notes;
    if (orderData.aiRecommendations !== undefined) updateData.aiRecommendations = orderData.aiRecommendations;

    const [order] = await db
      .update(orders)
      .set(updateData)
      .where(and(eq(orders.id, id), eq(orders.userId, userId)))
      .returning();
    return order;
  }

  async deleteOrder(id: number, userId: string): Promise<void> {
    await db.delete(orders).where(and(eq(orders.id, id), eq(orders.userId, userId)));
  }

  async getOrdersByCustomer(customerId: number, userId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(and(eq(orders.customerId, customerId), eq(orders.userId, userId)))
      .orderBy(desc(orders.createdAt));
  }

  async getOrdersByStatus(status: string, userId: string): Promise<OrderWithCustomer[]> {
    return await db
      .select()
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(and(eq(orders.status, status), eq(orders.userId, userId)))
      .orderBy(desc(orders.createdAt))
      .then(rows => 
        rows.map(row => ({
          ...row.orders,
          customer: row.customers!
        }))
      );
  }

  // Project tracking
  async getProjectSteps(orderId: number): Promise<ProjectStep[]> {
    return await db
      .select()
      .from(projectSteps)
      .where(eq(projectSteps.orderId, orderId))
      .orderBy(projectSteps.id);
  }

  async createProjectStep(stepData: any): Promise<ProjectStep> {
    const [step] = await db.insert(projectSteps).values(stepData).returning();
    return step;
  }

  async updateProjectStep(id: number, stepData: any): Promise<ProjectStep> {
    const [step] = await db
      .update(projectSteps)
      .set(stepData)
      .where(eq(projectSteps.id, id))
      .returning();
    return step;
  }

  // AI insights
  async getAiInsights(limit = 10): Promise<AiInsight[]> {
    return await db
      .select()
      .from(aiInsights)
      .orderBy(desc(aiInsights.createdAt))
      .limit(limit);
  }

  async createAiInsight(insightData: any): Promise<AiInsight> {
    const [insight] = await db.insert(aiInsights).values(insightData).returning();
    return insight;
  }

  async markInsightActionTaken(id: number): Promise<void> {
    await db
      .update(aiInsights)
      .set({ actionTaken: true })
      .where(eq(aiInsights.id, id));
  }

  async deleteAiInsight(id: number): Promise<void> {
    await db.delete(aiInsights).where(eq(aiInsights.id, id));
  }

  // Business metrics
  async getBusinessMetrics(type?: string, dateRange?: { start: Date; end: Date }): Promise<BusinessMetric[]> {
    let conditions: any[] = [];

    if (type) {
      conditions.push(eq(businessMetrics.metricType, type));
    }

    if (dateRange) {
      conditions.push(
        and(
          gte(businessMetrics.date, dateRange.start),
          lte(businessMetrics.date, dateRange.end)
        )
      );
    }

    if (conditions.length > 0) {
      return await db
        .select()
        .from(businessMetrics)
        .where(and(...conditions))
        .orderBy(desc(businessMetrics.date));
    }

    return await db
      .select()
      .from(businessMetrics)
      .orderBy(desc(businessMetrics.date));
  }

  async createBusinessMetric(metricData: Omit<BusinessMetric, 'id' | 'createdAt'>): Promise<BusinessMetric> {
    const [metric] = await db.insert(businessMetrics).values(metricData).returning();
    return metric;
  }

  // Simplified metrics storage - storing as business metrics entries
  async storeBusinessMetric(metricType: string, value: number): Promise<void> {
    try {
      // Use the existing businessMetrics table for storage
      const metricData = {
        metricType,
        value: value.toString(),
        date: new Date()
      };

      // Check if metric exists and update or create
      const existing = await db
        .select()
        .from(businessMetrics)
        .where(eq(businessMetrics.metricType, metricType))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(businessMetrics)
          .set({ value: value.toString(), date: new Date() })
          .where(eq(businessMetrics.metricType, metricType));
      } else {
        await db.insert(businessMetrics).values(metricData);
      }
    } catch (error) {
      console.error('Error storing business metric:', error);
    }
  }

  // Retrieve business metrics using Drizzle ORM
  async getBusinessMetrics(): Promise<Array<{metricType: string, value: string, updatedAt: Date}>> {
    try {
      const metrics = await db
        .select({
          metricType: businessMetrics.metricType,
          value: businessMetrics.value,
          updatedAt: businessMetrics.date
        })
        .from(businessMetrics)
        .orderBy(desc(businessMetrics.date));
        
      return metrics;
    } catch (error) {
      console.error('Error retrieving business metrics:', error);
      return [];
    }
  }

  // Inventory
  async getInventory(): Promise<Inventory[]> {
    return await db.select().from(inventory).orderBy(inventory.itemName);
  }

  async createInventoryItem(itemData: any): Promise<Inventory> {
    const [item] = await db
      .insert(inventory)
      .values(itemData)
      .returning();
    return item;
  }

  async updateInventoryItem(id: number, itemData: any): Promise<Inventory> {
    const [item] = await db
      .update(inventory)
      .set({ ...itemData, updatedAt: new Date() })
      .where(eq(inventory.id, id))
      .returning();
    return item;
  }

  async deleteInventoryItem(id: number): Promise<void> {
    await db.delete(inventory).where(eq(inventory.id, id));
  }

  async updateInventoryStock(id: number, quantity: number): Promise<Inventory> {
    const [item] = await db
      .update(inventory)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(inventory.id, id))
      .returning();
    return item;
  }

  async getLowStockItems(): Promise<Inventory[]> {
    const items = await db
      .select()
      .from(inventory)
      .where(lte(inventory.quantity, inventory.minQuantity));
    return items;
  }

  // Price Structure methods
  async getPriceStructure(): Promise<PriceStructure[]> {
    return await db.select().from(priceStructure).where(eq(priceStructure.isActive, true)).orderBy(priceStructure.category, priceStructure.itemName);
  }

  async createPriceStructure(priceData: InsertPriceStructure): Promise<PriceStructure> {
    const [price] = await db.insert(priceStructure).values(priceData).returning();
    return price;
  }

  async updatePriceStructure(id: number, priceData: Partial<InsertPriceStructure>): Promise<PriceStructure> {
    const [price] = await db
      .update(priceStructure)
      .set({ ...priceData, updatedAt: new Date() })
      .where(eq(priceStructure.id, id))
      .returning();
    return price;
  }

  async deletePriceStructure(id: number): Promise<void> {
    await db.update(priceStructure).set({ isActive: false }).where(eq(priceStructure.id, id));
  }

  // Wholesaler methods
  async getWholesalers(): Promise<Wholesaler[]> {
    return await db.select().from(wholesalers).where(eq(wholesalers.isActive, true)).orderBy(wholesalers.companyName);
  }

  async getWholesaler(id: number): Promise<Wholesaler | undefined> {
    const [wholesaler] = await db.select().from(wholesalers).where(eq(wholesalers.id, id));
    return wholesaler || undefined;
  }

  async createWholesaler(wholesalerData: InsertWholesaler): Promise<Wholesaler> {
    const [wholesaler] = await db.insert(wholesalers).values(wholesalerData).returning();
    return wholesaler;
  }

  async updateWholesaler(id: number, wholesalerData: Partial<InsertWholesaler>): Promise<Wholesaler> {
    const [wholesaler] = await db
      .update(wholesalers)
      .set({ ...wholesalerData, updatedAt: new Date() })
      .where(eq(wholesalers.id, id))
      .returning();
    return wholesaler;
  }

  async getWholesalerProducts(wholesalerId: number): Promise<WholesalerProduct[]> {
    return await db
      .select()
      .from(wholesalerProducts)
      .where(and(eq(wholesalerProducts.wholesalerId, wholesalerId), eq(wholesalerProducts.isActive, true)))
      .orderBy(wholesalerProducts.category, wholesalerProducts.productName);
  }

  async searchWholesalerProducts(query: string): Promise<WholesalerProduct[]> {
    if (!query) return [];

    const results = await db
      .select({
        id: wholesalerProducts.id,
        wholesalerId: wholesalerProducts.wholesalerId,
        productCode: wholesalerProducts.productCode,
        productName: wholesalerProducts.productName,
        category: wholesalerProducts.category,
        subcategory: wholesalerProducts.subcategory,
        description: wholesalerProducts.description,
        specifications: wholesalerProducts.specifications,
        unitType: wholesalerProducts.unitType,
        wholesalePrice: wholesalerProducts.wholesalePrice,
        suggestedRetail: wholesalerProducts.suggestedRetail,
        minQuantity: wholesalerProducts.minQuantity,
        packSize: wholesalerProducts.packSize,
        leadTime: wholesalerProducts.leadTime,
        stockStatus: wholesalerProducts.stockStatus,
        vendorCatalogPage: wholesalerProducts.vendorCatalogPage,
        imageUrl: wholesalerProducts.imageUrl,
        dataSheetUrl: wholesalerProducts.dataSheetUrl,
        isActive: wholesalerProducts.isActive,
        lastUpdated: wholesalerProducts.lastUpdated,
        createdAt: wholesalerProducts.createdAt,
      })
      .from(wholesalerProducts)
      .where(
        and(
          eq(wholesalerProducts.isActive, true),
          or(
            like(wholesalerProducts.productCode, `%${query}%`),
            like(wholesalerProducts.productName, `%${query}%`)
          )
        )
      )
      .orderBy(wholesalerProducts.productCode);

    return results;
  }

  // Invoice methods
  async getInvoices(): Promise<InvoiceWithDetails[]> {
    const invoiceResults = await db
      .select()
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(orders, eq(invoices.orderId, orders.id))
      .orderBy(desc(invoices.createdAt));

    const invoiceIds = invoiceResults.map(r => r.invoices.id);

    const items = invoiceIds.length > 0 ? await db
      .select()
      .from(invoiceItems)
      .where(inArray(invoiceItems.invoiceId, invoiceIds)) : [];

    const paymentsResult = invoiceIds.length > 0 ? await db
      .select()
      .from(payments)
      .where(inArray(payments.invoiceId, invoiceIds)) : [];

    return invoiceResults.map(result => ({
      ...result.invoices,
      customer: result.customers!,
      order: result.orders || undefined,
      items: items.filter(item => item.invoiceId === result.invoices.id),
      payments: paymentsResult.filter(payment => payment.invoiceId === result.invoices.id),
    }));
  }

  async getInvoice(id: number): Promise<InvoiceWithDetails | undefined> {
    const [invoiceResult] = await db
      .select()
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(orders, eq(invoices.orderId, orders.id))
      .where(eq(invoices.id, id));

    if (!invoiceResult) return undefined;

    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    const paymentsResult = await db.select().from(payments).where(eq(payments.invoiceId, id));

    return {
      ...invoiceResult.invoices,
      customer: invoiceResult.customers!,
      order: invoiceResult.orders || undefined,
      items,
      payments: paymentsResult,
    };
  }

  async createInvoice(invoiceData: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice> {
    // Generate invoice number
    const invoiceNumber = `INV${Date.now()}`;

    const [invoice] = await db
      .insert(invoices)
      .values({
        ...invoiceData,
        invoiceNumber,
      })
      .returning();

    // Add invoice items
    if (items.length > 0) {
      await db.insert(invoiceItems).values(
        items.map(item => ({ ...item, invoiceId: invoice.id }))
      );
    }

    return invoice;
  }

  async updateInvoice(id: number, invoiceData: Partial<InsertInvoice>): Promise<Invoice> {
    const [invoice] = await db
      .update(invoices)
      .set({ ...invoiceData, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return invoice;
  }

  async deleteInvoice(id: number): Promise<void> {
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  async markInvoicePaid(invoiceId: number, paymentData: InsertPayment): Promise<void> {
    // Add payment record
    await db.insert(payments).values({ ...paymentData, invoiceId });

    // Update invoice status
    await db
      .update(invoices)
      .set({ 
        status: 'paid', 
        paidDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(invoices.id, invoiceId));
  }

  // Stripe integration
  async updateUserStripeInfo(userId: string, customerId: string, subscriptionId?: string): Promise<User> {
    const updateData: any = { stripeCustomerId: customerId };
    if (subscriptionId) {
      updateData.stripeSubscriptionId = subscriptionId;
    }

    const [user] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Communication methods
  async getCommunicationSettings() {
    const result = await db.select().from(communicationSettings).limit(1);
    return result[0] || null;
  }

  async updateCommunicationSettings(data: any) {
    const existing = await this.getCommunicationSettings();

    if (existing) {
      const result = await db.update(communicationSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(communicationSettings.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(communicationSettings).values(data).returning();
      return result[0];
    }
  }

  async createCommunicationLog(data: any) {
    const result = await db.insert(communicationLogs).values(data).returning();
    return result[0];
  }

  async getCommunicationLogs() {
    return await db.select().from(communicationLogs)
      .orderBy(desc(communicationLogs.createdAt))
      .limit(50);
  }

  async updateCommunicationLogByTwilioSid(twilioSid: string, data: any) {
    const result = await db.update(communicationLogs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(communicationLogs.twilioSid, twilioSid))
      .returning();
    return result[0];
  }
}

// Always use real database storage
export const storage = new DatabaseStorage();