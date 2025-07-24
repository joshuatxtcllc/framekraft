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
import { eq, desc, sql, and, gte, lte, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: number): Promise<void>;

  // Order operations
  getOrders(): Promise<OrderWithCustomer[]>;
  getOrder(id: number): Promise<OrderWithCustomer | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order>;
  deleteOrder(id: number): Promise<void>;
  getOrdersByCustomer(customerId: number): Promise<Order[]>;
  getOrdersByStatus(status: string): Promise<OrderWithCustomer[]>;

  // Project tracking
  getProjectSteps(orderId: number): Promise<ProjectStep[]>;
  createProjectStep(step: any): Promise<ProjectStep>;
  updateProjectStep(id: number, step: any): Promise<ProjectStep>;

  // AI insights
  getAiInsights(limit?: number): Promise<AiInsight[]>;
  createAiInsight(insight: any): Promise<AiInsight>;
  markInsightActionTaken(id: number): Promise<void>;

  // Business metrics
  getBusinessMetrics(type?: string, dateRange?: { start: Date; end: Date }): Promise<BusinessMetric[]>;
  createBusinessMetric(metric: Omit<BusinessMetric, 'id' | 'createdAt'>): Promise<BusinessMetric>;

  // Inventory
  getInventory(): Promise<Inventory[]>;
  updateInventoryItem(id: number, item: any): Promise<Inventory>;
  getLowStockItems(): Promise<Inventory[]>;

  // Price Structure
  getPriceStructure(): Promise<PriceStructure[]>;
  createPriceStructure(price: InsertPriceStructure): Promise<PriceStructure>;
  updatePriceStructure(id: number, price: Partial<InsertPriceStructure>): Promise<PriceStructure>;
  deletePriceStructure(id: number): Promise<void>;

  // Wholesalers
  getWholesalers(): Promise<Wholesaler[]>;
  createWholesaler(wholesaler: InsertWholesaler): Promise<Wholesaler>;
  getWholesalerProducts(wholesalerId: number): Promise<WholesalerProduct[]>;

  // Invoices
  getInvoices(): Promise<InvoiceWithDetails[]>;
  getInvoice(id: number): Promise<InvoiceWithDetails | undefined>;
  createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  deleteInvoice(id: number): Promise<void>;
  markInvoicePaid(invoiceId: number, payment: InsertPayment): Promise<void>;

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
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(customerData).returning();
    return customer;
  }

  async updateCustomer(id: number, customerData: Partial<InsertCustomer>): Promise<Customer> {
    const [customer] = await db
      .update(customers)
      .set({ ...customerData, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  async deleteCustomer(id: number): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // Order operations
  async getOrders(): Promise<OrderWithCustomer[]> {
    return await db
      .select()
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .orderBy(desc(orders.createdAt))
      .then(rows => 
        rows.map(row => ({
          ...row.orders,
          customer: row.customers!
        }))
      );
  }

  async getOrder(id: number): Promise<OrderWithCustomer | undefined> {
    const [result] = await db
      .select()
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(eq(orders.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.orders,
      customer: result.customers!
    };
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    // Generate order number
    const orderNumber = `FC${Date.now()}`;
    
    const [order] = await db
      .insert(orders)
      .values({
        ...orderData,
        orderNumber,
        totalAmount: orderData.totalAmount.toString(),
        depositAmount: orderData.depositAmount || "0",
      })
      .returning();

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
  }

  async updateOrder(id: number, orderData: Partial<InsertOrder>): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ ...orderData, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async deleteOrder(id: number): Promise<void> {
    await db.delete(orders).where(eq(orders.id, id));
  }

  async getOrdersByCustomer(customerId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrdersByStatus(status: string): Promise<OrderWithCustomer[]> {
    return await db
      .select()
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(eq(orders.status, status))
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

  // Inventory
  async getInventory(): Promise<Inventory[]> {
    return await db.select().from(inventory).orderBy(inventory.itemName);
  }

  async updateInventoryItem(id: number, itemData: any): Promise<Inventory> {
    const [item] = await db
      .update(inventory)
      .set({ ...itemData, updatedAt: new Date() })
      .where(eq(inventory.id, id))
      .returning();
    return item;
  }

  async getLowStockItems(): Promise<Inventory[]> {
    return await db
      .select()
      .from(inventory)
      .where(sql`${inventory.quantity} <= ${inventory.minQuantity}`)
      .orderBy(inventory.itemName);
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
    
    return await db
      .select()
      .from(wholesalerProducts)
      .leftJoin(wholesalers, eq(wholesalerProducts.wholesalerId, wholesalers.id))
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
}

export const storage = new DatabaseStorage();
