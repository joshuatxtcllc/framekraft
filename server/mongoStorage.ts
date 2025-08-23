import {
  User,
  Customer,
  Order,
  OrderLineItem,
  ProjectStep,
  AIInsight,
  CommunicationSettings,
  CommunicationLog,
  BusinessMetric,
  Inventory,
  PriceStructure,
  Wholesaler,
  WholesalerProduct,
  Invoice,
  InvoiceItem,
  Payment,
  PricingRule,
  BusinessSettings,
  NotificationSettings,
  DisplaySettings,
  IUser,
  ICustomer,
  IOrder,
  IInvoice,
  IWholesaler,
  IWholesalerProduct,
  IPriceStructure,
  IInventory,
  IBusinessSettings,
  INotificationSettings,
  IDisplaySettings
} from './models';
import mongoose from 'mongoose';

// User operations
export async function getUserById(userId: string): Promise<IUser | null> {
  return await User.findById(userId);
}

export async function createOrUpdateUser(userData: Partial<IUser>): Promise<IUser> {
  const user = await User.findByIdAndUpdate(
    userData._id,
    userData,
    { new: true, upsert: true }
  );
  return user!;
}

// Customer operations
export async function getCustomers(): Promise<ICustomer[]> {
  return await Customer.find().sort({ createdAt: -1 });
}

export async function getCustomer(id: number | string): Promise<ICustomer | null> {
  // Handle both numeric IDs (from old system) and MongoDB ObjectIds
  if (typeof id === 'number' || !mongoose.Types.ObjectId.isValid(id)) {
    // For numeric IDs, we might need to find by a different field
    // or handle migration differently
    return null;
  }
  return await Customer.findById(id);
}

export async function getCustomerById(id: string): Promise<ICustomer | null> {
  return await Customer.findById(id);
}

export async function createCustomer(customerData: Partial<ICustomer>): Promise<ICustomer> {
  const customer = new Customer(customerData);
  return await customer.save();
}

export async function updateCustomer(id: string, customerData: Partial<ICustomer>): Promise<ICustomer | null> {
  return await Customer.findByIdAndUpdate(id, customerData, { new: true });
}

export async function deleteCustomer(id: string): Promise<boolean> {
  const result = await Customer.findByIdAndDelete(id);
  return !!result;
}

// Order operations
export async function getOrders(): Promise<any[]> {
  const orders = await Order.find()
    .populate('customerId')
    .sort({ createdAt: -1 });
  
  // Transform to match expected format
  return orders.map(order => {
    // Extract the populated customer data
    const customer = order.customerId as any;
    return {
    id: order._id.toString(),
    customerId: customer._id ? customer._id.toString() : order.customerId,
    orderNumber: order.orderNumber,
    description: order.description,
    artworkDescription: order.artworkDescription,
    artworkImage: order.artworkImage,
    dimensions: order.dimensions,
    frameStyle: order.frameStyle,
    matColor: order.matColor,
    glazing: order.glazing,
    totalAmount: order.totalAmount.toString(),
    depositAmount: order.depositAmount?.toString(),
    discountPercentage: order.discountPercentage.toString(),
    balanceAmount: order.balanceAmount?.toString(),
    taxAmount: order.taxAmount.toString(),
    discountAmount: order.discountAmount.toString(),
    laborCost: order.laborCost?.toString(),
    materialsCost: order.materialsCost?.toString(),
    status: order.status,
    priority: order.priority,
    dueDate: order.dueDate?.toISOString(),
    completedAt: order.completedAt?.toISOString(),
    notes: order.notes,
    aiRecommendations: order.aiRecommendations,
    taxExempt: order.taxExempt,
    deliveryMethod: order.deliveryMethod,
    rushOrder: order.rushOrder,
    estimatedDeliveryDate: order.estimatedDeliveryDate?.toISOString(),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    customer: customer
  };
  });
}

export async function getOrder(id: number | string): Promise<any | null> {
  // Handle both numeric IDs (from old system) and MongoDB ObjectIds
  if (typeof id === 'number' || !mongoose.Types.ObjectId.isValid(id.toString())) {
    return null;
  }
  const order = await Order.findById(id).populate('customerId');
  if (!order) return null;
  
  const customer = order.customerId as any;
  return {
    id: order._id.toString(),
    customerId: customer._id ? customer._id.toString() : order.customerId,
    orderNumber: order.orderNumber,
    description: order.description,
    artworkDescription: order.artworkDescription,
    artworkImage: order.artworkImage,
    dimensions: order.dimensions,
    frameStyle: order.frameStyle,
    matColor: order.matColor,
    glazing: order.glazing,
    totalAmount: order.totalAmount.toString(),
    depositAmount: order.depositAmount?.toString(),
    discountPercentage: order.discountPercentage.toString(),
    balanceAmount: order.balanceAmount?.toString(),
    taxAmount: order.taxAmount.toString(),
    discountAmount: order.discountAmount.toString(),
    laborCost: order.laborCost?.toString(),
    materialsCost: order.materialsCost?.toString(),
    status: order.status,
    priority: order.priority,
    dueDate: order.dueDate?.toISOString(),
    completedAt: order.completedAt?.toISOString(),
    notes: order.notes,
    aiRecommendations: order.aiRecommendations,
    taxExempt: order.taxExempt,
    deliveryMethod: order.deliveryMethod,
    rushOrder: order.rushOrder,
    estimatedDeliveryDate: order.estimatedDeliveryDate?.toISOString(),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    customer: customer
  };
}

export async function getOrderById(id: string): Promise<IOrder | null> {
  return await Order.findById(id).populate('customerId');
}

export async function getOrdersByStatus(status: string): Promise<any[]> {
  const orders = await Order.find({ status })
    .populate('customerId')
    .sort({ createdAt: -1 });
  
  return orders.map(order => {
    const customer = order.customerId as any;
    return {
    id: order._id.toString(),
    customerId: customer._id ? customer._id.toString() : order.customerId,
    orderNumber: order.orderNumber,
    description: order.description,
    artworkDescription: order.artworkDescription,
    artworkImage: order.artworkImage,
    dimensions: order.dimensions,
    frameStyle: order.frameStyle,
    matColor: order.matColor,
    glazing: order.glazing,
    totalAmount: order.totalAmount.toString(),
    depositAmount: order.depositAmount?.toString(),
    discountPercentage: order.discountPercentage.toString(),
    balanceAmount: order.balanceAmount?.toString(),
    taxAmount: order.taxAmount.toString(),
    discountAmount: order.discountAmount.toString(),
    laborCost: order.laborCost?.toString(),
    materialsCost: order.materialsCost?.toString(),
    status: order.status,
    priority: order.priority,
    dueDate: order.dueDate?.toISOString(),
    completedAt: order.completedAt?.toISOString(),
    notes: order.notes,
    aiRecommendations: order.aiRecommendations,
    taxExempt: order.taxExempt,
    deliveryMethod: order.deliveryMethod,
    rushOrder: order.rushOrder,
    estimatedDeliveryDate: order.estimatedDeliveryDate?.toISOString(),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    customer: customer
  };
  });
}

export async function getOrdersByCustomer(customerId: number | string): Promise<any[]> {
  // Handle both numeric IDs (from old system) and MongoDB ObjectIds
  if (typeof customerId === 'number' || !mongoose.Types.ObjectId.isValid(customerId.toString())) {
    return [];
  }
  
  const orders = await Order.find({ customerId })
    .populate('customerId')
    .sort({ createdAt: -1 });
  
  return orders.map(order => {
    const customer = order.customerId as any;
    return {
    id: order._id.toString(),
    customerId: customer._id ? customer._id.toString() : order.customerId,
    orderNumber: order.orderNumber,
    description: order.description,
    artworkDescription: order.artworkDescription,
    artworkImage: order.artworkImage,
    dimensions: order.dimensions,
    frameStyle: order.frameStyle,
    matColor: order.matColor,
    glazing: order.glazing,
    totalAmount: order.totalAmount.toString(),
    depositAmount: order.depositAmount?.toString(),
    discountPercentage: order.discountPercentage.toString(),
    balanceAmount: order.balanceAmount?.toString(),
    taxAmount: order.taxAmount.toString(),
    discountAmount: order.discountAmount.toString(),
    laborCost: order.laborCost?.toString(),
    materialsCost: order.materialsCost?.toString(),
    status: order.status,
    priority: order.priority,
    dueDate: order.dueDate?.toISOString(),
    completedAt: order.completedAt?.toISOString(),
    notes: order.notes,
    aiRecommendations: order.aiRecommendations,
    taxExempt: order.taxExempt,
    deliveryMethod: order.deliveryMethod,
    rushOrder: order.rushOrder,
    estimatedDeliveryDate: order.estimatedDeliveryDate?.toISOString(),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    customer: customer
  };
  });
}

export async function createOrder(orderData: any): Promise<IOrder> {
  // Generate order number if not provided
  if (!orderData.orderNumber) {
    const count = await Order.countDocuments();
    orderData.orderNumber = `ORD-${String(count + 1).padStart(6, '0')}`;
  }
  
  const order = new Order(orderData);
  return await order.save();
}

export async function updateOrder(id: string, orderData: any): Promise<IOrder | null> {
  return await Order.findByIdAndUpdate(id, orderData, { new: true });
}

export async function deleteOrder(id: string): Promise<boolean> {
  const result = await Order.findByIdAndDelete(id);
  return !!result;
}

// Invoice operations
export async function getInvoices(): Promise<IInvoice[]> {
  return await Invoice.find()
    .populate('customerId')
    .populate('orderId')
    .sort({ createdAt: -1 });
}

export async function getInvoiceById(id: string): Promise<IInvoice | null> {
  return await Invoice.findById(id)
    .populate('customerId')
    .populate('orderId');
}

export async function createInvoice(invoiceData: any): Promise<IInvoice> {
  // Generate invoice number if not provided
  if (!invoiceData.invoiceNumber) {
    const count = await Invoice.countDocuments();
    invoiceData.invoiceNumber = `INV-${String(count + 1).padStart(6, '0')}`;
  }
  
  const invoice = new Invoice(invoiceData);
  return await invoice.save();
}

export async function updateInvoice(id: string, invoiceData: any): Promise<IInvoice | null> {
  return await Invoice.findByIdAndUpdate(id, invoiceData, { new: true });
}

export async function deleteInvoice(id: string): Promise<boolean> {
  const result = await Invoice.findByIdAndDelete(id);
  return !!result;
}

// Wholesaler operations
export async function getWholesalers(): Promise<IWholesaler[]> {
  return await Wholesaler.find({ isActive: true }).sort({ companyName: 1 });
}

export async function getWholesalerById(id: string): Promise<IWholesaler | null> {
  return await Wholesaler.findById(id);
}

export async function createWholesaler(wholesalerData: Partial<IWholesaler>): Promise<IWholesaler> {
  const wholesaler = new Wholesaler(wholesalerData);
  return await wholesaler.save();
}

export async function updateWholesaler(id: string, wholesalerData: Partial<IWholesaler>): Promise<IWholesaler | null> {
  return await Wholesaler.findByIdAndUpdate(id, wholesalerData, { new: true });
}

export async function deleteWholesaler(id: string): Promise<boolean> {
  const result = await Wholesaler.findByIdAndDelete(id);
  return !!result;
}

// Wholesaler Product operations
export async function getWholesalerProducts(): Promise<IWholesalerProduct[]> {
  return await WholesalerProduct.find({ isActive: true })
    .populate('wholesalerId')
    .sort({ productName: 1 });
}

export async function getWholesalerProductsByWholesaler(wholesalerId: string): Promise<IWholesalerProduct[]> {
  return await WholesalerProduct.find({ wholesalerId, isActive: true })
    .sort({ productName: 1 });
}

export async function createWholesalerProduct(productData: Partial<IWholesalerProduct>): Promise<IWholesalerProduct> {
  const product = new WholesalerProduct(productData);
  return await product.save();
}

export async function updateWholesalerProduct(id: string, productData: Partial<IWholesalerProduct>): Promise<IWholesalerProduct | null> {
  productData.lastUpdated = new Date();
  return await WholesalerProduct.findByIdAndUpdate(id, productData, { new: true });
}

export async function deleteWholesalerProduct(id: string): Promise<boolean> {
  const result = await WholesalerProduct.findByIdAndDelete(id);
  return !!result;
}

// Search wholesaler products by query
export async function searchWholesalerProducts(query: string): Promise<IWholesalerProduct[]> {
  if (!query) {
    return await getWholesalerProducts();
  }
  
  const searchRegex = new RegExp(query, 'i');
  return await WholesalerProduct.find({
    isActive: true,
    $or: [
      { productCode: searchRegex },
      { productName: searchRegex },
      { category: searchRegex },
      { description: searchRegex }
    ]
  })
  .populate('wholesalerId')
  .sort({ productName: 1 })
  .limit(100);
}

// Price Structure operations
export async function getPriceStructures(): Promise<IPriceStructure[]> {
  return await PriceStructure.find({ isActive: true }).sort({ category: 1, itemName: 1 });
}

export async function getPriceStructureById(id: string): Promise<IPriceStructure | null> {
  return await PriceStructure.findById(id);
}

export async function createPriceStructure(priceData: Partial<IPriceStructure>): Promise<IPriceStructure> {
  const price = new PriceStructure(priceData);
  return await price.save();
}

export async function updatePriceStructure(id: string, priceData: Partial<IPriceStructure>): Promise<IPriceStructure | null> {
  return await PriceStructure.findByIdAndUpdate(id, priceData, { new: true });
}

export async function deletePriceStructure(id: string): Promise<boolean> {
  const result = await PriceStructure.findByIdAndDelete(id);
  return !!result;
}

// Inventory operations
export async function getInventory(): Promise<IInventory[]> {
  return await Inventory.find().sort({ category: 1, itemName: 1 });
}

export async function getInventoryById(id: string): Promise<IInventory | null> {
  return await Inventory.findById(id);
}

export async function getLowStockItems(): Promise<IInventory[]> {
  return await Inventory.find({ $expr: { $lte: ['$quantity', '$minQuantity'] } })
    .sort({ category: 1, itemName: 1 });
}

export async function createInventoryItem(inventoryData: Partial<IInventory>): Promise<IInventory> {
  const item = new Inventory(inventoryData);
  return await item.save();
}

export async function updateInventoryItem(id: string, inventoryData: Partial<IInventory>): Promise<IInventory | null> {
  return await Inventory.findByIdAndUpdate(id, inventoryData, { new: true });
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
  const result = await Inventory.findByIdAndDelete(id);
  return !!result;
}

// Communication Settings operations
export async function getCommunicationSettings(): Promise<any> {
  let settings = await CommunicationSettings.findOne();
  if (!settings) {
    settings = new CommunicationSettings({});
    await settings.save();
  }
  return settings;
}

export async function updateCommunicationSettings(settingsData: any): Promise<any> {
  const settings = await CommunicationSettings.findOneAndUpdate(
    {},
    settingsData,
    { new: true, upsert: true }
  );
  return settings;
}

// Communication Log operations
export async function createCommunicationLog(logData: any): Promise<any> {
  const log = new CommunicationLog(logData);
  return await log.save();
}

export async function getCommunicationLogs(orderId?: string): Promise<any[]> {
  const query = orderId ? { orderId } : {};
  return await CommunicationLog.find(query).sort({ createdAt: -1 });
}

// Business Metrics operations
export async function createBusinessMetric(metricData: any): Promise<any> {
  const metric = new BusinessMetric(metricData);
  return await metric.save();
}

export async function getBusinessMetrics(metricType?: string, startDate?: Date, endDate?: Date): Promise<any[]> {
  const query: any = {};
  if (metricType) query.metricType = metricType;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }
  return await BusinessMetric.find(query).sort({ date: -1 });
}

export async function storeBusinessMetric(metricType: string, value: number): Promise<void> {
  await createBusinessMetric({
    metricType,
    value: value.toString(),
    date: new Date(),
    updatedAt: new Date()
  });
}

// AI Insights operations
export async function createAIInsight(insightData: any): Promise<any> {
  const insight = new AIInsight(insightData);
  return await insight.save();
}

export async function getAIInsights(orderId?: string, customerId?: string): Promise<any[]> {
  const query: any = {};
  if (orderId) query.orderId = orderId;
  if (customerId) query.customerId = customerId;
  return await AIInsight.find(query).sort({ createdAt: -1 });
}

export async function updateAIInsight(id: string, insightData: any): Promise<any> {
  return await AIInsight.findByIdAndUpdate(id, insightData, { new: true });
}

// Payment operations
export async function createPayment(paymentData: any): Promise<any> {
  const payment = new Payment(paymentData);
  return await payment.save();
}

export async function getPayments(invoiceId?: string, orderId?: string): Promise<any[]> {
  const query: any = {};
  if (invoiceId) query.invoiceId = invoiceId;
  if (orderId) query.orderId = orderId;
  return await Payment.find(query).sort({ paymentDate: -1 });
}

// Pricing Rules operations
export async function getPricingRules(): Promise<any[]> {
  return await PricingRule.find({ isActive: true }).sort({ priority: -1 });
}

export async function createPricingRule(ruleData: any): Promise<any> {
  const rule = new PricingRule(ruleData);
  return await rule.save();
}

export async function updatePricingRule(id: string, ruleData: any): Promise<any> {
  return await PricingRule.findByIdAndUpdate(id, ruleData, { new: true });
}

export async function deletePricingRule(id: string): Promise<boolean> {
  const result = await PricingRule.findByIdAndDelete(id);
  return !!result;
}

// Order Line Items operations
export async function getOrderLineItems(orderId: string): Promise<any[]> {
  return await OrderLineItem.find({ orderId }).populate('wholesalerProductId');
}

export async function createOrderLineItem(itemData: any): Promise<any> {
  const item = new OrderLineItem(itemData);
  return await item.save();
}

export async function updateOrderLineItem(id: string, itemData: any): Promise<any> {
  return await OrderLineItem.findByIdAndUpdate(id, itemData, { new: true });
}

export async function deleteOrderLineItem(id: string): Promise<boolean> {
  const result = await OrderLineItem.findByIdAndDelete(id);
  return !!result;
}

// Invoice Items operations
export async function getInvoiceItems(invoiceId: string): Promise<any[]> {
  return await InvoiceItem.find({ invoiceId });
}

export async function createInvoiceItem(itemData: any): Promise<any> {
  const item = new InvoiceItem(itemData);
  return await item.save();
}

export async function updateInvoiceItem(id: string, itemData: any): Promise<any> {
  return await InvoiceItem.findByIdAndUpdate(id, itemData, { new: true });
}

export async function deleteInvoiceItem(id: string): Promise<boolean> {
  const result = await InvoiceItem.findByIdAndDelete(id);
  return !!result;
}

// Project Steps operations
export async function getProjectSteps(orderId: number | string): Promise<any[]> {
  // Handle both numeric IDs (from old system) and MongoDB ObjectIds
  if (typeof orderId === 'number' || !mongoose.Types.ObjectId.isValid(orderId.toString())) {
    return [];
  }
  return await ProjectStep.find({ orderId }).sort({ createdAt: 1 });
}

export async function createProjectStep(stepData: any): Promise<any> {
  const step = new ProjectStep(stepData);
  return await step.save();
}

export async function updateProjectStep(id: number | string, stepData: any): Promise<any> {
  // Handle both numeric IDs (from old system) and MongoDB ObjectIds
  if (typeof id === 'number' || !mongoose.Types.ObjectId.isValid(id.toString())) {
    return null;
  }
  return await ProjectStep.findByIdAndUpdate(id, stepData, { new: true });
}

// Dashboard metrics
export async function getDashboardMetrics(): Promise<any> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  
  const [
    totalCustomers,
    activeOrders,
    todayRevenue,
    monthRevenue,
    recentOrders,
    lowInventory
  ] = await Promise.all([
    Customer.countDocuments(),
    Order.countDocuments({ status: { $nin: ['completed', 'cancelled'] } }),
    Order.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: thisMonth } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    Order.find()
      .populate('customerId')
      .sort({ createdAt: -1 })
      .limit(5),
    Inventory.find({ $expr: { $lte: ['$quantity', '$minQuantity'] } })
  ]);
  
  return {
    totalCustomers,
    activeOrders,
    todayRevenue: todayRevenue[0]?.total || 0,
    monthRevenue: monthRevenue[0]?.total || 0,
    recentOrders,
    lowInventory
  };
}

// Business Settings operations
export async function getBusinessSettings(): Promise<IBusinessSettings> {
  let settings = await BusinessSettings.findOne();
  if (!settings) {
    settings = new BusinessSettings({});
    await settings.save();
  }
  return settings;
}

export async function updateBusinessSettings(settingsData: Partial<IBusinessSettings>): Promise<IBusinessSettings> {
  const settings = await BusinessSettings.findOneAndUpdate(
    {},
    settingsData,
    { new: true, upsert: true }
  );
  return settings!;
}

// Notification Settings operations
export async function getNotificationSettings(): Promise<INotificationSettings> {
  let settings = await NotificationSettings.findOne();
  if (!settings) {
    settings = new NotificationSettings({});
    await settings.save();
  }
  return settings;
}

export async function updateNotificationSettings(settingsData: Partial<INotificationSettings>): Promise<INotificationSettings> {
  const settings = await NotificationSettings.findOneAndUpdate(
    {},
    settingsData,
    { new: true, upsert: true }
  );
  return settings!;
}

// Display Settings operations
export async function getDisplaySettings(): Promise<IDisplaySettings> {
  let settings = await DisplaySettings.findOne();
  if (!settings) {
    settings = new DisplaySettings({});
    await settings.save();
  }
  return settings;
}

export async function updateDisplaySettings(settingsData: Partial<IDisplaySettings>): Promise<IDisplaySettings> {
  const settings = await DisplaySettings.findOneAndUpdate(
    {},
    settingsData,
    { new: true, upsert: true }
  );
  return settings!;
}