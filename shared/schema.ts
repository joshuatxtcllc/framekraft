import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("owner").notNull(),
  businessName: varchar("business_name"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  address: text("address"),
  notes: text("notes"),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0"),
  orderCount: integer("order_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  orderNumber: varchar("order_number").unique().notNull(),
  description: text("description").notNull(),
  artworkDescription: text("artwork_description"),
  dimensions: varchar("dimensions"),
  frameStyle: varchar("frame_style"),
  matColor: varchar("mat_color"),
  glazing: varchar("glazing"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }),
  discountPercentage: decimal("discount_percentage", { precision: 10, scale: 2 }).default("0"),
  balanceAmount: decimal("balance_amount", { precision: 10, scale: 2 }),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  laborCost: decimal("labor_cost", { precision: 10, scale: 2 }),
  materialsCost: decimal("materials_cost", { precision: 10, scale: 2 }),
  status: varchar("status").default("pending").notNull(), // pending, measuring, production, ready, completed, cancelled
  priority: varchar("priority").default("normal").notNull(), // low, normal, high, rush
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  aiRecommendations: jsonb("ai_recommendations"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project tracking for order workflow
export const projectSteps = pgTable("project_steps", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  stepName: varchar("step_name").notNull(), // consultation, measuring, ordering, production, assembly, quality_check, ready
  status: varchar("status").default("pending").notNull(), // pending, in_progress, completed, skipped
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  assignedTo: varchar("assigned_to"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI recommendations and insights
export const aiInsights = pgTable("ai_insights", {
  id: serial("id").primaryKey(),
  type: varchar("type").notNull(), // frame_recommendation, business_insight, inventory_alert, customer_suggestion
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  metadata: jsonb("metadata"),
  orderId: integer("order_id").references(() => orders.id),
  customerId: integer("customer_id").references(() => customers.id),
  actionTaken: boolean("action_taken").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Business metrics and analytics
export const businessMetrics = pgTable("business_metrics", {
  id: serial("id").primaryKey(),
  metricType: varchar("metric_type").notNull(), // daily_revenue, monthly_revenue, order_count, customer_count, completion_rate
  value: decimal("value", { precision: 12, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory tracking
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  itemName: varchar("item_name").notNull(),
  category: varchar("category").notNull(), // frame_molding, mat_board, glazing, hardware
  description: text("description"),
  supplier: varchar("supplier"),
  quantity: integer("quantity").default(0),
  minQuantity: integer("min_quantity").default(0),
  unitCost: decimal("unit_cost", { precision: 8, scale: 2 }),
  lastRestocked: timestamp("last_restocked"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Price structure for framing components
export const priceStructure = pgTable("price_structure", {
  id: serial("id").primaryKey(),
  category: varchar("category").notNull(), // frame, mat, glazing, labor, misc
  subcategory: varchar("subcategory"), // wood, metal, fabric, standard_glass, acrylic, conservation_glass
  itemName: varchar("item_name").notNull(),
  unitType: varchar("unit_type").default("linear_foot"), // linear_foot, square_foot, each
  basePrice: decimal("base_price", { precision: 8, scale: 2 }).notNull(),
  markupPercentage: decimal("markup_percentage", { precision: 5, scale: 2 }).default("30.00"), // Reduced from 50%
  retailPrice: decimal("retail_price", { precision: 8, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  effectiveDate: timestamp("effective_date").defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wholesaler catalogs and suppliers
export const wholesalers = pgTable("wholesalers", {
  id: serial("id").primaryKey(),
  companyName: varchar("company_name").notNull(),
  contactName: varchar("contact_name"),
  email: varchar("email"),
  phone: varchar("phone"),
  website: varchar("website"),
  address: text("address"),
  specialties: text("specialties").array(), // wood_frames, metal_frames, mats, glazing
  paymentTerms: varchar("payment_terms"), // net30, net15, cod
  minOrderAmount: decimal("min_order_amount", { precision: 8, scale: 2 }),
  discountTiers: jsonb("discount_tiers"), // volume discounts
  catalogFileName: varchar("catalog_file_name"), // uploaded catalog file name
  catalogFileUrl: varchar("catalog_file_url"), // file storage URL
  catalogUploadedAt: timestamp("catalog_uploaded_at"),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wholesaler product catalog
export const wholesalerProducts = pgTable("wholesaler_products", {
  id: serial("id").primaryKey(),
  wholesalerId: integer("wholesaler_id").references(() => wholesalers.id).notNull(),
  productCode: varchar("product_code").notNull(),
  productName: varchar("product_name").notNull(),
  category: varchar("category").notNull(),
  description: text("description"),
  unitType: varchar("unit_type").default("linear_foot"),
  wholesalePrice: decimal("wholesale_price", { precision: 8, scale: 2 }).notNull(),
  suggestedRetail: decimal("suggested_retail", { precision: 8, scale: 2 }),
  minQuantity: integer("min_quantity").default(1),
  leadTime: varchar("lead_time"), // "5-7 days", "2-3 weeks"
  isActive: boolean("is_active").default(true),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number").unique().notNull(),
  orderId: integer("order_id").references(() => orders.id),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  status: varchar("status").default("draft").notNull(), // draft, sent, paid, overdue, cancelled
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  sentDate: timestamp("sent_date"),
  paidDate: timestamp("paid_date"),
  paymentMethod: varchar("payment_method"), // cash, check, card, stripe
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  notes: text("notes"),
  emailTemplate: text("email_template"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoice line items
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 8, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 8, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 8, scale: 2 }).notNull(),
  category: varchar("category"), // frame, mat, glazing, labor, misc
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment tracking
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  orderId: integer("order_id").references(() => orders.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method").notNull(), // cash, check, card, stripe
  paymentDate: timestamp("payment_date").defaultNow(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  stripeChargeId: varchar("stripe_charge_id"),
  checkNumber: varchar("check_number"),
  notes: text("notes"),
  status: varchar("status").default("completed").notNull(), // pending, completed, failed, refunded
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
  aiInsights: many(aiInsights),
  invoices: many(invoices),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  projectSteps: many(projectSteps),
  aiInsights: many(aiInsights),
  invoices: many(invoices),
  payments: many(payments),
}));

export const projectStepsRelations = relations(projectSteps, ({ one }) => ({
  order: one(orders, {
    fields: [projectSteps.orderId],
    references: [orders.id],
  }),
}));

export const aiInsightsRelations = relations(aiInsights, ({ one }) => ({
  order: one(orders, {
    fields: [aiInsights.orderId],
    references: [orders.id],
  }),
  customer: one(customers, {
    fields: [aiInsights.customerId],
    references: [customers.id],
  }),
}));

export const wholesalersRelations = relations(wholesalers, ({ many }) => ({
  products: many(wholesalerProducts),
}));

export const wholesalerProductsRelations = relations(wholesalerProducts, ({ one }) => ({
  wholesaler: one(wholesalers, {
    fields: [wholesalerProducts.wholesalerId],
    references: [wholesalers.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  order: one(orders, {
    fields: [invoices.orderId],
    references: [orders.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  totalSpent: true,
  orderCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  totalAmount: z.string().min(1, "Total amount is required"),
  depositAmount: z.string().optional(),
});

export const insertProjectStepSchema = createInsertSchema(projectSteps).omit({
  id: true,
  createdAt: true,
});

export const insertAiInsightSchema = createInsertSchema(aiInsights).omit({
  id: true,
  createdAt: true,
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPriceStructureSchema = createInsertSchema(priceStructure).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWholesalerSchema = createInsertSchema(wholesalers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWholesalerProductSchema = createInsertSchema(wholesalerProducts).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  invoiceNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type OrderWithCustomer = Order & { customer: Customer };
export type ProjectStep = typeof projectSteps.$inferSelect;
export type AiInsight = typeof aiInsights.$inferSelect;
export type BusinessMetric = typeof businessMetrics.$inferSelect;
export type Inventory = typeof inventory.$inferSelect;
export type PriceStructure = typeof priceStructure.$inferSelect;
export type InsertPriceStructure = z.infer<typeof insertPriceStructureSchema>;
export type Wholesaler = typeof wholesalers.$inferSelect;
export type InsertWholesaler = z.infer<typeof insertWholesalerSchema>;
export type WholesalerProduct = typeof wholesalerProducts.$inferSelect;
export type InsertWholesalerProduct = z.infer<typeof insertWholesalerProductSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InvoiceWithDetails = Invoice & { 
  customer: Customer; 
  order?: Order; 
  items: InvoiceItem[];
  payments: Payment[];
};