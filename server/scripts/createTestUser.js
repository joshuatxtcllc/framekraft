import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';

async function createTestUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/framekraft', {});
    
    // Check if user already exists
    let user = await User.findOne({ email: 'test@gmail.com' });
    
    if (user) {
      // Update existing user
      user.isActive = true;
      await user.save();
      console.log('✅ Existing user activated:', {
        email: user.email,
        isActive: user.isActive
      });
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash('test123', 10);
      user = await User.create({
        email: 'test@gmail.com',
        password: hashedPassword,
        name: 'Test User',
        isActive: true,
        role: 'admin'
      });
      console.log('✅ User created successfully:', {
        email: user.email,
        isActive: user.isActive,
        role: user.role
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createTestUser();