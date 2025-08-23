import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../mongodb';
import { User } from '../models';

async function checkUser() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await connectDB();
    
    const email = 'test@framecraft.com';
    const password = 'TestUser123';
    
    // Find user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('User not found');
      await mongoose.disconnect();
      process.exit(1);
    }
    
    console.log('User found:', {
      email: user.email,
      hasPassword: !!user.password,
      passwordLength: user.password?.length,
      passwordHash: user.password?.substring(0, 30) + '...'
    });
    
    // Test password comparison directly
    const directCompare = await bcrypt.compare(password, user.password);
    console.log('Direct bcrypt compare result:', directCompare);
    
    // Test with method
    const methodCompare = await user.comparePassword(password);
    console.log('Method compare result:', methodCompare);
    
    // Try hashing the password and comparing
    const newHash = await bcrypt.hash(password, 10);
    console.log('New hash for same password:', newHash.substring(0, 30) + '...');
    console.log('Hashes match:', newHash === user.password);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkUser();