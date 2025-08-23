/**
 * Migration script to add userId field to all existing documents
 * This ensures data isolation between different users
 * 
 * Run this script after deploying the userId changes:
 * node server/migrations/add-userId-to-all-documents.mjs
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import all models
import {
  User,
  Customer,
  Order,
  AIInsight,
  CommunicationSettings,
  BusinessMetric,
  Inventory,
  PriceStructure,
  Wholesaler,
  WholesalerProduct,
  Invoice,
  Payment,
  Expense,
  Transaction,
  FinancialSummary,
  PricingRule,
  BusinessSettings,
  NotificationSettings,
  DisplaySettings
} from '../models/index.js';

async function migrate() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/framecraft';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get the first user (or a specific default user)
    const defaultUser = await User.findOne().sort({ createdAt: 1 });
    
    if (!defaultUser) {
      console.error('No users found in database. Please create at least one user first.');
      process.exit(1);
    }

    const defaultUserId = defaultUser._id;
    console.log(`Using default user: ${defaultUser.email} (${defaultUserId})`);

    // Collections to update
    const collectionsToUpdate = [
      { model: Customer, name: 'customers' },
      { model: Order, name: 'orders' },
      { model: AIInsight, name: 'aiinsights' },
      { model: CommunicationSettings, name: 'communicationsettings' },
      { model: BusinessMetric, name: 'businessmetrics' },
      { model: Inventory, name: 'inventories' },
      { model: PriceStructure, name: 'pricestructures' },
      { model: Wholesaler, name: 'wholesalers' },
      { model: WholesalerProduct, name: 'wholesalerproducts' },
      { model: Invoice, name: 'invoices' },
      { model: Payment, name: 'payments' },
      { model: Expense, name: 'expenses' },
      { model: Transaction, name: 'transactions' },
      { model: FinancialSummary, name: 'financialsummaries' },
      { model: PricingRule, name: 'pricingrules' },
      { model: BusinessSettings, name: 'businesssettings' },
      { model: NotificationSettings, name: 'notificationsettings' },
      { model: DisplaySettings, name: 'displaysettings' }
    ];

    // Update each collection
    for (const { model, name } of collectionsToUpdate) {
      console.log(`\nUpdating ${name}...`);
      
      // Count documents without userId
      const countWithoutUserId = await model.countDocuments({ 
        $or: [
          { userId: { $exists: false } },
          { userId: null }
        ]
      });

      if (countWithoutUserId === 0) {
        console.log(`✓ All documents in ${name} already have userId`);
        continue;
      }

      // Update all documents without userId
      const result = await model.updateMany(
        { 
          $or: [
            { userId: { $exists: false } },
            { userId: null }
          ]
        },
        { 
          $set: { userId: defaultUserId }
        }
      );

      console.log(`✓ Updated ${result.modifiedCount} documents in ${name}`);
    }

    // Create indexes for better performance
    console.log('\nCreating indexes...');
    
    await Customer.collection.createIndex({ userId: 1 });
    await Order.collection.createIndex({ userId: 1 });
    await Invoice.collection.createIndex({ userId: 1 });
    await Inventory.collection.createIndex({ userId: 1 });
    await BusinessMetric.collection.createIndex({ userId: 1 });
    
    console.log('✓ Indexes created successfully');

    console.log('\n✅ Migration completed successfully!');
    console.log('All existing data has been assigned to the default user.');
    console.log('New data will be automatically assigned to the authenticated user.');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
migrate();