import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// Session Model for authentication
export interface ISession extends Document {
  sid: string;
  sess: any;
  expire: Date;
}

const SessionSchema = new Schema({
  sid: { type: String, unique: true, required: true },
  sess: { type: Schema.Types.Mixed, required: true },
  expire: { type: Date, required: true, index: true }
});

export const Session = mongoose.model<ISession>('Session', SessionSchema);

// User Model
export interface IUser extends Document {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: string;
  businessName?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema({
  email: { type: String, unique: true, required: true, lowercase: true },
  password: { type: String, required: true },
  firstName: String,
  lastName: String,
  profileImageUrl: String,
  role: { type: String, default: 'owner' },
  businessName: String,
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  emailVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);

// Customer Model
export interface ICustomer extends Document {
  userId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  totalSpent: number;
  orderCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: String,
  phone: String,
  address: String,
  notes: String,
  totalSpent: { type: Number, default: 0 },
  orderCount: { type: Number, default: 0 },
}, { timestamps: true });

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);

// Order Model
export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  orderNumber: string;
  description: string;
  artworkDescription?: string;
  artworkImage?: string; // Base64 encoded image or URL
  dimensions?: string;
  frameStyle?: string;
  matColor?: string;
  glazing?: string;
  totalAmount: number;
  depositAmount?: number;
  discountPercentage: number;
  balanceAmount?: number;
  taxAmount: number;
  discountAmount: number;
  laborCost?: number;
  materialsCost?: number;
  status: string;
  priority: string;
  dueDate?: Date;
  completedAt?: Date;
  notes?: string;
  aiRecommendations?: any;
  taxExempt: boolean;
  deliveryMethod?: string;
  rushOrder?: boolean;
  estimatedDeliveryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  orderNumber: { type: String, unique: true, required: true },
  description: { type: String, required: true },
  artworkDescription: String,
  artworkImage: String, // Base64 encoded image or URL
  dimensions: String,
  frameStyle: String,
  matColor: String,
  glazing: String,
  totalAmount: { type: Number, required: true },
  depositAmount: Number,
  discountPercentage: { type: Number, default: 0 },
  balanceAmount: Number,
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  laborCost: Number,
  materialsCost: Number,
  status: { type: String, default: 'pending' },
  priority: { type: String, default: 'normal' },
  dueDate: Date,
  completedAt: Date,
  notes: String,
  aiRecommendations: Schema.Types.Mixed,
  taxExempt: { type: Boolean, default: false },
  deliveryMethod: String,
  rushOrder: { type: Boolean, default: false },
  estimatedDeliveryDate: Date,
}, { timestamps: true });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);

// Order Line Item Model
export interface IOrderLineItem extends Document {
  orderId: mongoose.Types.ObjectId;
  itemType: string;
  wholesalerProductId?: mongoose.Types.ObjectId;
  productCode: string;
  productName: string;
  supplierName: string;
  specifications?: any;
  quantity: number;
  unitType: string;
  wholesalePrice: number;
  retailPrice: number;
  lineTotal: number;
  orderStatus: string;
  vendorOrderNumber?: string;
  expectedDelivery?: Date;
  receivedDate?: Date;
  notes?: string;
  createdAt: Date;
}

const OrderLineItemSchema = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  itemType: { type: String, required: true },
  wholesalerProductId: { type: Schema.Types.ObjectId, ref: 'WholesalerProduct' },
  productCode: { type: String, required: true },
  productName: { type: String, required: true },
  supplierName: { type: String, required: true },
  specifications: Schema.Types.Mixed,
  quantity: { type: Number, required: true },
  unitType: { type: String, required: true },
  wholesalePrice: { type: Number, required: true },
  retailPrice: { type: Number, required: true },
  lineTotal: { type: Number, required: true },
  orderStatus: { type: String, default: 'pending' },
  vendorOrderNumber: String,
  expectedDelivery: Date,
  receivedDate: Date,
  notes: String,
}, { timestamps: { createdAt: true, updatedAt: false } });

OrderLineItemSchema.index({ orderId: 1 });
OrderLineItemSchema.index({ productCode: 1, supplierName: 1 });

export const OrderLineItem = mongoose.model<IOrderLineItem>('OrderLineItem', OrderLineItemSchema);

// Project Steps Model
export interface IProjectStep extends Document {
  orderId: mongoose.Types.ObjectId;
  stepName: string;
  status: string;
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
  assignedTo?: string;
  createdAt: Date;
}

const ProjectStepSchema = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  stepName: { type: String, required: true },
  status: { type: String, default: 'pending' },
  startedAt: Date,
  completedAt: Date,
  notes: String,
  assignedTo: String,
}, { timestamps: { createdAt: true, updatedAt: false } });

export const ProjectStep = mongoose.model<IProjectStep>('ProjectStep', ProjectStepSchema);

// AI Insights Model
export interface IAIInsight extends Document {
  userId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  insightType: string;
  title: string;
  description: string;
  severity: string;
  actionTaken: boolean;
  metadata?: any;
  createdAt: Date;
}

const AIInsightSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  insightType: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, default: 'medium' },
  actionTaken: { type: Boolean, default: false },
  metadata: Schema.Types.Mixed,
}, { timestamps: { createdAt: true, updatedAt: false } });

export const AIInsight = mongoose.model<IAIInsight>('AIInsight', AIInsightSchema);

// Communication Settings Model
export interface ICommunicationSettings extends Document {
  userId: mongoose.Types.ObjectId;
  twilioEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  autoCallsEnabled: boolean;
  callScript?: string;
  notificationPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommunicationSettingsSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  twilioEnabled: { type: Boolean, default: false },
  emailEnabled: { type: Boolean, default: true },
  smsEnabled: { type: Boolean, default: false },
  autoCallsEnabled: { type: Boolean, default: false },
  callScript: String,
  notificationPhone: String,
}, { timestamps: true });

export const CommunicationSettings = mongoose.model<ICommunicationSettings>('CommunicationSettings', CommunicationSettingsSchema);

// Communication Logs Model
export interface ICommunicationLog extends Document {
  type: string;
  recipient: string;
  orderId?: mongoose.Types.ObjectId;
  status: string;
  message?: string;
  twilioSid?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommunicationLogSchema = new Schema({
  type: { type: String, required: true },
  recipient: { type: String, required: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  status: { type: String, required: true },
  message: String,
  twilioSid: String,
}, { timestamps: true });

export const CommunicationLog = mongoose.model<ICommunicationLog>('CommunicationLog', CommunicationLogSchema);

// Business Metrics Model
export interface IBusinessMetric extends Document {
  userId: mongoose.Types.ObjectId;
  metricType: string;
  value: number;
  date: Date;
  metadata?: any;
  createdAt: Date;
}

const BusinessMetricSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  metricType: { type: String, required: true },
  value: { type: Number, required: true },
  date: { type: Date, required: true },
  metadata: Schema.Types.Mixed,
}, { timestamps: { createdAt: true, updatedAt: false } });

export const BusinessMetric = mongoose.model<IBusinessMetric>('BusinessMetric', BusinessMetricSchema);

// Inventory Model
export interface IInventory extends Document {
  userId: mongoose.Types.ObjectId;
  itemName: string;
  category: string;
  description?: string;
  supplier?: string;
  quantity: number;
  minQuantity: number;
  unitCost?: number;
  lastRestocked?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  itemName: { type: String, required: true },
  category: { type: String, required: true },
  description: String,
  supplier: String,
  quantity: { type: Number, default: 0 },
  minQuantity: { type: Number, default: 0 },
  unitCost: Number,
  lastRestocked: Date,
}, { timestamps: true });

export const Inventory = mongoose.model<IInventory>('Inventory', InventorySchema);

// Price Structure Model
export interface IPriceStructure extends Document {
  userId: mongoose.Types.ObjectId;
  category: string;
  subcategory?: string;
  itemName: string;
  unitType: string;
  basePrice: number;
  markupPercentage: number;
  retailPrice: number;
  isActive: boolean;
  effectiveDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PriceStructureSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { type: String, required: true },
  subcategory: String,
  itemName: { type: String, required: true },
  unitType: { type: String, default: 'linear_foot' },
  basePrice: { type: Number, required: true },
  markupPercentage: { type: Number, default: 30 },
  retailPrice: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  effectiveDate: { type: Date, default: Date.now },
  notes: String,
}, { timestamps: true });

export const PriceStructure = mongoose.model<IPriceStructure>('PriceStructure', PriceStructureSchema);

// Wholesaler Model
export interface IWholesaler extends Document {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  specialties?: string[];
  paymentTerms?: string;
  minOrderAmount?: number;
  discountTiers?: any;
  catalogFileName?: string;
  catalogFileUrl?: string;
  catalogUploadedAt?: Date;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WholesalerSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  companyName: { type: String, required: true },
  contactName: String,
  email: String,
  phone: String,
  website: String,
  address: String,
  specialties: [String],
  paymentTerms: String,
  minOrderAmount: Number,
  discountTiers: Schema.Types.Mixed,
  catalogFileName: String,
  catalogFileUrl: String,
  catalogUploadedAt: Date,
  isActive: { type: Boolean, default: true },
  notes: String,
}, { timestamps: true });

export const Wholesaler = mongoose.model<IWholesaler>('Wholesaler', WholesalerSchema);

// Wholesaler Product Model
export interface IWholesalerProduct extends Document {
  userId: mongoose.Types.ObjectId;
  wholesalerId: mongoose.Types.ObjectId;
  productCode: string;
  productName: string;
  category: string;
  subcategory?: string;
  description?: string;
  specifications?: any;
  unitType: string;
  wholesalePrice: number;
  suggestedRetail?: number;
  minQuantity: number;
  packSize: number;
  leadTime?: string;
  stockStatus: string;
  vendorCatalogPage?: string;
  imageUrl?: string;
  dataSheetUrl?: string;
  isActive: boolean;
  lastUpdated: Date;
  createdAt: Date;
}

const WholesalerProductSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  wholesalerId: { type: Schema.Types.ObjectId, ref: 'Wholesaler', required: true },
  productCode: { type: String, required: true },
  productName: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: String,
  description: String,
  specifications: Schema.Types.Mixed,
  unitType: { type: String, default: 'linear_foot' },
  wholesalePrice: { type: Number, required: true },
  suggestedRetail: Number,
  minQuantity: { type: Number, default: 1 },
  packSize: { type: Number, default: 1 },
  leadTime: String,
  stockStatus: { type: String, default: 'available' },
  vendorCatalogPage: String,
  imageUrl: String,
  dataSheetUrl: String,
  isActive: { type: Boolean, default: true },
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: { createdAt: true, updatedAt: false } });

WholesalerProductSchema.index({ productCode: 1 });
WholesalerProductSchema.index({ category: 1, subcategory: 1 });
WholesalerProductSchema.index({ wholesalerId: 1, productCode: 1 }, { unique: true });

export const WholesalerProduct = mongoose.model<IWholesalerProduct>('WholesalerProduct', WholesalerProductSchema);

// Invoice Model
export interface IInvoice extends Document {
  userId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  orderId?: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  status: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  dueDate: Date;
  sentDate?: Date;
  paidDate?: Date;
  paymentMethod?: string;
  stripePaymentIntentId?: string;
  notes?: string;
  emailTemplate?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  invoiceNumber: { type: String, unique: true, required: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  status: { type: String, default: 'draft' },
  subtotal: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  sentDate: Date,
  paidDate: Date,
  paymentMethod: String,
  stripePaymentIntentId: String,
  notes: String,
  emailTemplate: String,
}, { timestamps: true });

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);

// Invoice Item Model
export interface IInvoiceItem extends Document {
  invoiceId: mongoose.Types.ObjectId;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  createdAt: Date;
}

const InvoiceItemSchema = new Schema({
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  category: String,
}, { timestamps: { createdAt: true, updatedAt: false } });

export const InvoiceItem = mongoose.model<IInvoiceItem>('InvoiceItem', InvoiceItemSchema);

// Payment Model
export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  invoiceId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: string;
  paymentDate: Date;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  checkNumber?: string;
  notes?: string;
  status: string;
  createdAt: Date;
}

const PaymentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  paymentDate: { type: Date, default: Date.now },
  stripePaymentIntentId: String,
  stripeChargeId: String,
  checkNumber: String,
  notes: String,
  status: { type: String, default: 'completed' },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);

// Expense Model for financial tracking
export interface IExpense extends Document {
  userId: mongoose.Types.ObjectId;
  category: string;
  amount: number;
  description: string;
  vendor?: string;
  date: Date;
  receiptUrl?: string;
  taxDeductible: boolean;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { 
    type: String, 
    required: true,
    enum: ['materials', 'equipment', 'utilities', 'rent', 'salaries', 'marketing', 'shipping', 'office_supplies', 'professional_services', 'other']
  },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  vendor: String,
  date: { type: Date, required: true },
  receiptUrl: String,
  taxDeductible: { type: Boolean, default: true },
  notes: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);

// Financial Transaction Model (combines income and expenses)
export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  referenceId?: mongoose.Types.ObjectId; // Reference to Invoice, Payment, or Expense
  referenceType?: string; // 'invoice', 'payment', 'expense'
  date: Date;
  balance?: number; // Running balance
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  referenceId: Schema.Types.ObjectId,
  referenceType: String,
  date: { type: Date, required: true },
  balance: Number,
}, { timestamps: true });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);

// Financial Summary Model (cached summaries for performance)
export interface IFinancialSummary extends Document {
  userId: mongoose.Types.ObjectId;
  period: string; // e.g., '2024-01', '2024-Q1', '2024'
  periodType: 'month' | 'quarter' | 'year';
  revenue: number;
  expenses: number;
  netProfit: number;
  invoiceCount: number;
  paidInvoiceCount: number;
  expenseCount: number;
  averageOrderValue: number;
  topExpenseCategories: Array<{ category: string; amount: number }>;
  createdAt: Date;
  updatedAt: Date;
}

const FinancialSummarySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  period: { type: String, required: true },
  periodType: { type: String, enum: ['month', 'quarter', 'year'], required: true },
  revenue: { type: Number, default: 0 },
  expenses: { type: Number, default: 0 },
  netProfit: { type: Number, default: 0 },
  invoiceCount: { type: Number, default: 0 },
  paidInvoiceCount: { type: Number, default: 0 },
  expenseCount: { type: Number, default: 0 },
  averageOrderValue: { type: Number, default: 0 },
  topExpenseCategories: [{
    category: String,
    amount: Number
  }],
}, { timestamps: true });

export const FinancialSummary = mongoose.model<IFinancialSummary>('FinancialSummary', FinancialSummarySchema);

// Pricing Rules Model (formerly part of schema)
export interface IPricingRule extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  ruleType: string;
  category?: string;
  conditions?: any;
  adjustment: number;
  isPercentage: boolean;
  isActive: boolean;
  priority: number;
  validFrom?: Date;
  validTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PricingRuleSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  description: String,
  ruleType: { type: String, required: true },
  category: String,
  conditions: Schema.Types.Mixed,
  adjustment: { type: Number, required: true },
  isPercentage: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 0 },
  validFrom: Date,
  validTo: Date,
}, { timestamps: true });

export const PricingRule = mongoose.model<IPricingRule>('PricingRule', PricingRuleSchema);

// Business Settings Model
export interface IBusinessSettings extends Document {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
  taxRate: number;
  defaultMarkup: number;
  laborRate: number;
  overheadCost: number;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSettingsSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  companyName: { type: String, default: "Jay's Frames" },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  zipCode: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  website: { type: String, default: '' },
  taxRate: { type: Number, default: 8.25 },
  defaultMarkup: { type: Number, default: 3.5 },
  laborRate: { type: Number, default: 38 },
  overheadCost: { type: Number, default: 54 },
}, { timestamps: true });

export const BusinessSettings = mongoose.model<IBusinessSettings>('BusinessSettings', BusinessSettingsSchema);

// Notification Settings Model
export interface INotificationSettings extends Document {
  userId: mongoose.Types.ObjectId;
  emailNotifications: boolean;
  orderUpdates: boolean;
  paymentReminders: boolean;
  lowInventory: boolean;
  dailyReports: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSettingsSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  emailNotifications: { type: Boolean, default: true },
  orderUpdates: { type: Boolean, default: true },
  paymentReminders: { type: Boolean, default: true },
  lowInventory: { type: Boolean, default: true },
  dailyReports: { type: Boolean, default: false },
}, { timestamps: true });

export const NotificationSettings = mongoose.model<INotificationSettings>('NotificationSettings', NotificationSettingsSchema);

// Display Settings Model
export interface IDisplaySettings extends Document {
  userId: mongoose.Types.ObjectId;
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  showPriceBreakdown: boolean;
  defaultCurrency: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  createdAt: Date;
  updatedAt: Date;
}

const DisplaySettingsSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  compactMode: { type: Boolean, default: false },
  showPriceBreakdown: { type: Boolean, default: true },
  defaultCurrency: { type: String, default: 'USD' },
  dateFormat: { type: String, default: 'MM/DD/YYYY' },
  timeFormat: { type: String, enum: ['12h', '24h'], default: '12h' },
}, { timestamps: true });

export const DisplaySettings = mongoose.model<IDisplaySettings>('DisplaySettings', DisplaySettingsSchema);

// AI Chat History Model
export interface IAIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    tokens?: number;
    processingTime?: number;
  };
}

export interface IAIChatSession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionName: string;
  messages: IAIChatMessage[];
  context: string; // Business context for the conversation
  totalTokens: number;
  lastActivity: Date;
  isActive: boolean;
  metadata?: {
    orderContext?: mongoose.Types.ObjectId;
    customerContext?: mongoose.Types.ObjectId;
    tags?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const AIChatSessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sessionName: { type: String, required: true },
  messages: [{
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    metadata: {
      model: String,
      tokens: Number,
      processingTime: Number
    }
  }],
  context: { type: String, default: 'general' },
  totalTokens: { type: Number, default: 0 },
  lastActivity: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  metadata: {
    orderContext: { type: Schema.Types.ObjectId, ref: 'Order' },
    customerContext: { type: Schema.Types.ObjectId, ref: 'Customer' },
    tags: [String]
  }
}, { timestamps: true });

AIChatSessionSchema.index({ userId: 1, lastActivity: -1 });
AIChatSessionSchema.index({ isActive: 1 });

export const AIChatSession = mongoose.model<IAIChatSession>('AIChatSession', AIChatSessionSchema);