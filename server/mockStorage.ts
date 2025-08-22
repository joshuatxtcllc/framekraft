// Mock storage for development without database
const mockCustomers = [
  {
    id: 1,
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "555-0100",
    address: "123 Main St",
    totalSpent: "1250.00",
    orderCount: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    firstName: "Jane",
    lastName: "Smith",
    email: "jane@example.com",
    phone: "555-0101",
    address: "456 Oak Ave",
    totalSpent: "850.00",
    orderCount: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockOrders = [
  {
    id: 1,
    customerId: 1,
    orderNumber: "FC2401",
    description: "Custom frame for landscape painting",
    totalAmount: "450.00",
    status: "pending",
    priority: "normal",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    customerId: 2,
    orderNumber: "FC2402",
    description: "Family portrait framing",
    totalAmount: "350.00",
    status: "completed",
    priority: "high",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockStorage = {
  // Customer methods
  async getCustomers() {
    return mockCustomers;
  },
  
  async getCustomer(id: number) {
    return mockCustomers.find(c => c.id === id) || null;
  },
  
  async createCustomer(data: any) {
    const newCustomer = {
      ...data,
      id: mockCustomers.length + 1,
      totalSpent: "0.00",
      orderCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockCustomers.push(newCustomer);
    return newCustomer;
  },
  
  async updateCustomer(id: number, data: any) {
    const index = mockCustomers.findIndex(c => c.id === id);
    if (index >= 0) {
      mockCustomers[index] = { ...mockCustomers[index], ...data, updatedAt: new Date() };
      return mockCustomers[index];
    }
    return null;
  },
  
  // Order methods
  async getOrders() {
    return mockOrders.map(order => ({
      ...order,
      customer: mockCustomers.find(c => c.id === order.customerId),
    }));
  },
  
  async getOrder(id: number) {
    const order = mockOrders.find(o => o.id === id);
    if (order) {
      return {
        ...order,
        customer: mockCustomers.find(c => c.id === order.customerId),
      };
    }
    return null;
  },
  
  async getOrdersByStatus(status: string) {
    return mockOrders
      .filter(o => o.status === status)
      .map(order => ({
        ...order,
        customer: mockCustomers.find(c => c.id === order.customerId),
      }));
  },
  
  async getOrdersByCustomer(customerId: number) {
    return mockOrders
      .filter(o => o.customerId === customerId)
      .map(order => ({
        ...order,
        customer: mockCustomers.find(c => c.id === customerId),
      }));
  },
  
  async createOrder(data: any) {
    const newOrder = {
      ...data,
      id: mockOrders.length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockOrders.push(newOrder);
    return newOrder;
  },
  
  async updateOrder(id: number, data: any) {
    const index = mockOrders.findIndex(o => o.id === id);
    if (index >= 0) {
      mockOrders[index] = { ...mockOrders[index], ...data, updatedAt: new Date() };
      return mockOrders[index];
    }
    return null;
  },
  
  // Project steps
  async getProjectSteps(orderId: number) {
    return [];
  },
  
  async updateProjectStep(id: number, data: any) {
    return { id, ...data };
  },
  
  // Inventory
  async getInventory() {
    return [];
  },
  
  async getLowStockItems() {
    return [];
  },
  
  // Other methods with empty implementations
  async upsertUser(data: any) {
    return { id: '1', ...data };
  },
  
  async updateOrdersPriceCalc() {
    return { updated: 0 };
  },
};