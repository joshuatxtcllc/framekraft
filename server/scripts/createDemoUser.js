import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';

async function createDemoUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/framekraft', {});
    
    // Delete existing test user
    await User.deleteOne({ email: 'test@gmail.com' });
    
    // Create new user with correct password
    const hashedPassword = await bcrypt.hash('demo123456', 10);
    const user = await User.create({
      email: 'test@gmail.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      role: 'admin',
      emailVerified: true
    });
    
    console.log('✅ User created successfully:', {
      email: user.email,
      isActive: user.isActive,
      role: user.role
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createDemoUser();