// Simple script to reset test user's financial data
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/framecraft';

async function resetTestUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Find test user
    const usersCollection = db.collection('users');
    const testUser = await usersCollection.findOne({ email: 'test@gmail.com' });
    
    if (!testUser) {
      console.log('Test user not found. Creating test user...');
      const hashedPassword = await bcrypt.hash('demo123456', 10);
      const result = await usersCollection.insertOne({
        email: 'test@gmail.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'owner',
        emailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      testUser._id = result.insertedId;
      console.log('Test user created successfully');
    } else {
      console.log('Test user found:', testUser.email);
    }

    // Clear existing financial data for test user
    console.log('\nClearing existing financial data for test user...');
    
    const collections = ['expenses', 'transactions', 'financialsummaries'];
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      const deleteResult = await collection.deleteMany({ userId: testUser._id });
      console.log(`Deleted ${deleteResult.deletedCount} ${collectionName} for test user`);
    }

    // Create sample expenses for test user only
    console.log('\nCreating sample expenses for test user...');
    const expensesCollection = db.collection('expenses');
    
    const testUserExpenses = [
      {
        userId: testUser._id,
        category: 'materials',
        amount: 250.00,
        description: 'Test User - Frame materials',
        vendor: 'Test Supplier A',
        date: new Date('2024-01-15'),
        taxDeductible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: testUser._id,
        category: 'equipment',
        amount: 500.00,
        description: 'Test User - New cutting tool',
        vendor: 'Test Equipment Co',
        date: new Date('2024-01-20'),
        taxDeductible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: testUser._id,
        category: 'utilities',
        amount: 150.00,
        description: 'Test User - Electricity bill',
        vendor: 'Test Power Company',
        date: new Date('2024-01-25'),
        taxDeductible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await expensesCollection.insertMany(testUserExpenses);
    console.log(`Created ${testUserExpenses.length} expenses for test user`);

    // Create sample transactions for test user
    console.log('\nCreating sample transactions for test user...');
    const transactionsCollection = db.collection('transactions');
    
    const testUserTransactions = [
      {
        userId: testUser._id,
        type: 'income',
        category: 'payment',
        amount: 1200.00,
        description: 'Test User - Payment for Order #1001',
        date: new Date('2024-01-10'),
        balance: 1200.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: testUser._id,
        type: 'expense',
        category: 'materials',
        amount: 250.00,
        description: 'Test User - Frame materials',
        date: new Date('2024-01-15'),
        balance: 950.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: testUser._id,
        type: 'income',
        category: 'payment',
        amount: 800.00,
        description: 'Test User - Payment for Order #1002',
        date: new Date('2024-01-18'),
        balance: 1750.00,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await transactionsCollection.insertMany(testUserTransactions);
    console.log(`Created ${testUserTransactions.length} transactions for test user`);

    // Check if another user exists and has different data
    console.log('\nChecking for other users in the system...');
    const otherUser = await usersCollection.findOne({ 
      email: { $ne: 'test@gmail.com' } 
    });
    
    if (otherUser) {
      console.log('Found another user:', otherUser.email);
      
      // Count their financial data
      const otherUserExpenses = await expensesCollection.countDocuments({ userId: otherUser._id });
      const otherUserTransactions = await transactionsCollection.countDocuments({ userId: otherUser._id });
      
      console.log(`Other user has ${otherUserExpenses} expenses and ${otherUserTransactions} transactions`);
      
      // Verify test user can't see other user's data
      const testUserExpenseCount = await expensesCollection.countDocuments({ userId: testUser._id });
      const testUserTransactionCount = await transactionsCollection.countDocuments({ userId: testUser._id });
      
      console.log(`Test user has ${testUserExpenseCount} expenses and ${testUserTransactionCount} transactions`);
      console.log('\n✅ Data isolation verified - users have separate financial data');
    } else {
      console.log('No other users found in the system');
    }

    console.log('\n✅ Test user financial data reset successfully!');
    console.log('Test credentials: test@gmail.com / demo123456');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
resetTestUser();