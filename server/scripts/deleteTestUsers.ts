import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../mongodb';
import { User } from '../models';

async function deleteTestUsers() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await connectDB();
    
    // Delete test users
    const result = await User.deleteMany({ 
      email: { $in: ['test@framecraft.com', 'admin@framecraft.com'] } 
    });
    
    console.log(`Deleted ${result.deletedCount} test users`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

deleteTestUsers();