import { sql } from 'drizzle-orm';
import { db } from '../db';
import { users, customers, orders, orderLineItems, inventory } from '../../shared/schema';
import bcrypt from 'bcryptjs';

async function seedTestData() {
  try {
    console.log('🌱 Starting database seed...');

    // Create test user if not exists
    const existingUser = await db.select().from(users).where(sql`email = 'test@gmail.com'`).limit(1);
    
    let testUserId: number;
    if (existingUser.length === 0) {
      const hashedPassword = await bcrypt.hash('demo123456', 10);
      const [newUser] = await db.insert(users).values({
        email: 'test@gmail.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'owner'
      }).returning();
      testUserId = newUser.id;
      console.log('✅ Created test user');
    } else {
      testUserId = existingUser[0].id;
      console.log('✅ Test user already exists');
    }

    // Clear existing test data
    console.log('🧹 Clearing existing test data...');
    await db.delete(orderLineItems);
    await db.delete(orders);
    await db.delete(customers);
    await db.delete(inventory);

    // Create test customers
    console.log('👥 Creating test customers...');
    const testCustomers = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-1234',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        totalSpent: '1500.00',
        lastOrderDate: new Date('2024-01-15'),
        notes: 'Regular customer, prefers gold frames'
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '555-5678',
        address: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90001',
        totalSpent: '2300.00',
        lastOrderDate: new Date('2024-01-20'),
        notes: 'VIP customer, bulk orders'
      },
      {
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@example.com',
        phone: '555-9012',
        address: '789 Pine Rd',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        totalSpent: '800.00',
        lastOrderDate: new Date('2024-01-10'),
        notes: 'New customer'
      }
    ];

    const insertedCustomers = await db.insert(customers).values(testCustomers).returning();
    console.log(`✅ Created ${insertedCustomers.length} customers`);

    // Create test orders
    console.log('📦 Creating test orders...');
    const currentDate = new Date();
    const testOrders = [
      {
        orderNumber: 'ORD-2024-001',
        customerId: insertedCustomers[0].id,
        orderDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        status: 'completed' as const,
        totalAmount: '750.00',
        depositAmount: '750.00',
        balanceDue: '0.00',
        notes: 'Order completed and paid in full',
        rush: false,
        artworkDescription: 'Family portrait',
        frameSize: '16x20',
        paymentStatus: 'paid' as const
      },
      {
        orderNumber: 'ORD-2024-002',
        customerId: insertedCustomers[1].id,
        orderDate: new Date('2024-01-20'),
        dueDate: new Date('2024-02-05'),
        status: 'in_production' as const,
        totalAmount: '1200.00',
        depositAmount: '600.00',
        balanceDue: '600.00',
        notes: 'VIP customer, priority order',
        rush: true,
        artworkDescription: 'Corporate artwork collection',
        frameSize: '24x36',
        paymentStatus: 'partial' as const
      },
      {
        orderNumber: 'ORD-2024-003',
        customerId: insertedCustomers[2].id,
        orderDate: new Date('2024-01-10'),
        dueDate: new Date('2024-01-25'),
        status: 'pending' as const,
        totalAmount: '450.00',
        depositAmount: '0.00',
        balanceDue: '450.00',
        notes: 'Customer will pay on pickup',
        rush: false,
        artworkDescription: 'Vintage poster',
        frameSize: '11x14',
        paymentStatus: 'pending' as const
      },
      {
        orderNumber: 'ORD-2024-004',
        customerId: insertedCustomers[0].id,
        orderDate: new Date('2024-01-25'),
        dueDate: new Date('2024-02-10'),
        status: 'awaiting_materials' as const,
        totalAmount: '320.00',
        depositAmount: '100.00',
        balanceDue: '220.00',
        notes: 'Waiting for special mat board',
        rush: false,
        artworkDescription: 'Child drawing',
        frameSize: '8x10',
        paymentStatus: 'partial' as const
      },
      {
        orderNumber: 'ORD-2024-005',
        customerId: insertedCustomers[1].id,
        orderDate: currentDate,
        dueDate: new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000),
        status: 'pending' as const,
        totalAmount: '890.00',
        depositAmount: '200.00',
        balanceDue: '690.00',
        notes: 'New order placed today',
        rush: false,
        artworkDescription: 'Wedding photo',
        frameSize: '20x24',
        paymentStatus: 'partial' as const
      }
    ];

    const insertedOrders = await db.insert(orders).values(testOrders).returning();
    console.log(`✅ Created ${insertedOrders.length} orders`);

    // Create test inventory items
    console.log('📊 Creating test inventory...');
    const testInventory = [
      {
        itemName: 'Gold Frame 16x20',
        category: 'frames',
        sku: 'GF-1620',
        quantity: 25,
        minQuantity: 10,
        unitCost: '45.00',
        supplier: 'Premium Frames Inc',
        lastRestocked: new Date('2024-01-01')
      },
      {
        itemName: 'Black Mat Board',
        category: 'mats',
        sku: 'MB-BLACK',
        quantity: 50,
        minQuantity: 20,
        unitCost: '12.00',
        supplier: 'Mat Supplies Co',
        lastRestocked: new Date('2024-01-05')
      },
      {
        itemName: 'Museum Glass 24x36',
        category: 'glass',
        sku: 'MG-2436',
        quantity: 8,
        minQuantity: 5,
        unitCost: '85.00',
        supplier: 'Glass Wholesale Ltd',
        lastRestocked: new Date('2024-01-10')
      },
      {
        itemName: 'Silver Frame 8x10',
        category: 'frames',
        sku: 'SF-0810',
        quantity: 5,
        minQuantity: 15,
        unitCost: '25.00',
        supplier: 'Premium Frames Inc',
        lastRestocked: new Date('2023-12-15')
      },
      {
        itemName: 'White Mat Board',
        category: 'mats',
        sku: 'MB-WHITE',
        quantity: 35,
        minQuantity: 20,
        unitCost: '10.00',
        supplier: 'Mat Supplies Co',
        lastRestocked: new Date('2024-01-12')
      }
    ];

    const insertedInventory = await db.insert(inventory).values(testInventory).returning();
    console.log(`✅ Created ${insertedInventory.length} inventory items`);

    // Create order line items for orders
    console.log('📝 Creating order line items...');
    const testLineItems = [
      // Order 1 items
      {
        orderId: insertedOrders[0].id,
        description: 'Gold Frame 16x20',
        quantity: 1,
        unitPrice: '450.00',
        totalPrice: '450.00'
      },
      {
        orderId: insertedOrders[0].id,
        description: 'Black Mat Board',
        quantity: 2,
        unitPrice: '75.00',
        totalPrice: '150.00'
      },
      {
        orderId: insertedOrders[0].id,
        description: 'Museum Glass',
        quantity: 1,
        unitPrice: '150.00',
        totalPrice: '150.00'
      },
      // Order 2 items
      {
        orderId: insertedOrders[1].id,
        description: 'Premium Frame 24x36',
        quantity: 3,
        unitPrice: '400.00',
        totalPrice: '1200.00'
      },
      // Order 3 items
      {
        orderId: insertedOrders[2].id,
        description: 'Standard Frame 11x14',
        quantity: 1,
        unitPrice: '200.00',
        totalPrice: '200.00'
      },
      {
        orderId: insertedOrders[2].id,
        description: 'White Mat Board',
        quantity: 2,
        unitPrice: '60.00',
        totalPrice: '120.00'
      },
      {
        orderId: insertedOrders[2].id,
        description: 'Standard Glass',
        quantity: 1,
        unitPrice: '130.00',
        totalPrice: '130.00'
      }
    ];

    const insertedLineItems = await db.insert(orderLineItems).values(testLineItems).returning();
    console.log(`✅ Created ${insertedLineItems.length} order line items`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - ${insertedCustomers.length} customers`);
    console.log(`   - ${insertedOrders.length} orders`);
    console.log(`   - ${insertedLineItems.length} order line items`);
    console.log(`   - ${insertedInventory.length} inventory items`);
    console.log('\n🔑 Test credentials: test@gmail.com / demo123456');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
seedTestData()
  .then(() => {
    console.log('✅ Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });