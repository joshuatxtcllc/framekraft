import * as storage from '../mongoStorage';
import bcrypt from 'bcryptjs';

async function seedTestData() {
  try {
    console.log('🌱 Starting database seed...');

    // Create test user if not exists
    let testUser = await storage.getUserByEmail('test@gmail.com');
    
    let testUserId: string;
    if (!testUser) {
      const hashedPassword = await bcrypt.hash('demo123456', 10);
      testUser = await storage.createUser({
        email: 'test@gmail.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'owner'
      });
      testUserId = testUser.id;
      console.log('✅ Created test user');
    } else {
      testUserId = testUser.id;
      console.log('✅ Test user already exists');
    }

    // Create sample customers
    const customers = [
      {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        phone: '(555) 123-4567',
        address: '123 Main St, Houston, TX 77001',
        userId: testUserId
      },
      {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phone: '(555) 987-6543',
        address: '456 Oak Ave, Houston, TX 77002',
        userId: testUserId
      },
      {
        firstName: 'Robert',
        lastName: 'Johnson',
        email: 'robert.j@example.com',
        phone: '(555) 555-5555',
        address: '789 Pine St, Houston, TX 77003',
        userId: testUserId
      }
    ];

    const createdCustomers = [];
    for (const customer of customers) {
      const created = await storage.createCustomer(customer, testUserId);
      createdCustomers.push(created);
    }
    console.log(`✅ Created ${createdCustomers.length} customers`);

    // Create sample orders
    const orders = [
      {
        customerId: createdCustomers[0].id,
        orderNumber: `ORD-${Date.now()}-001`,
        status: 'pending',
        description: 'Family portrait 16x20 with custom walnut frame',
        frameStyle: 'Traditional',
        matColor: 'Cream',
        glassType: 'UV Protection',
        width: 20,
        height: 24,
        totalAmount: '350.00',
        depositAmount: '175.00',
        priority: 'standard',
        notes: 'Customer prefers darker wood tones',
        userId: testUserId
      },
      {
        customerId: createdCustomers[1].id,
        orderNumber: `ORD-${Date.now()}-002`,
        status: 'in_progress',
        description: 'Diploma framing with museum quality materials',
        frameStyle: 'Modern',
        matColor: 'Black',
        glassType: 'Museum Glass',
        width: 11,
        height: 14,
        totalAmount: '225.00',
        depositAmount: '100.00',
        priority: 'rush',
        notes: 'Rush order - needed by Friday',
        userId: testUserId
      },
      {
        customerId: createdCustomers[2].id,
        orderNumber: `ORD-${Date.now()}-003`,
        status: 'ready',
        description: 'Vintage poster with conservation framing',
        frameStyle: 'Vintage',
        matColor: 'White',
        glassType: 'Conservation Clear',
        width: 24,
        height: 36,
        totalAmount: '450.00',
        depositAmount: '450.00',
        priority: 'standard',
        notes: 'Fully paid',
        userId: testUserId
      }
    ];

    for (const order of orders) {
      await storage.createOrder(order, testUserId);
    }
    console.log(`✅ Created ${orders.length} orders`);

    // Create sample inventory items
    const inventoryItems = [
      {
        itemName: 'Walnut Frame Moulding',
        category: 'frame',
        sku: 'FRM-WAL-001',
        quantity: 50,
        unitType: 'linear_foot',
        unitCost: '8.50',
        supplier: 'Larson-Juhl',
        reorderPoint: 20,
        lastOrdered: new Date().toISOString(),
        notes: 'Premium walnut, 2" width',
        userId: testUserId
      },
      {
        itemName: 'Museum Glass 24x36',
        category: 'glass',
        sku: 'GLS-MUS-2436',
        quantity: 12,
        unitType: 'sheet',
        unitCost: '45.00',
        supplier: 'Tru Vue',
        reorderPoint: 5,
        lastOrdered: new Date().toISOString(),
        notes: '99% UV protection',
        userId: testUserId
      },
      {
        itemName: 'Acid-Free Mat Board - White',
        category: 'mat',
        sku: 'MAT-WHT-32X40',
        quantity: 25,
        unitType: 'sheet',
        unitCost: '12.00',
        supplier: 'Crescent',
        reorderPoint: 10,
        lastOrdered: new Date().toISOString(),
        notes: '32x40 sheets, 4-ply',
        userId: testUserId
      }
    ];

    for (const item of inventoryItems) {
      await storage.createInventoryItem(item, testUserId);
    }
    console.log(`✅ Created ${inventoryItems.length} inventory items`);

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedTestData()
  .then(() => {
    console.log('🎉 Seed script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });