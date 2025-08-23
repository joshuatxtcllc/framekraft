import mongoose from 'mongoose';
import { User } from '../models/index.js';

async function checkTestUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/framekraft', {});
    
    const user = await User.findOne({ email: 'test@gmail.com' });
    
    if (user) {
      console.log('User found:', {
        id: user._id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        role: user.role,
        createdAt: user.createdAt
      });
      
      // Make sure isActive is true
      if (!user.isActive) {
        user.isActive = true;
        await user.save();
        console.log('✅ User activated!');
      }
    } else {
      console.log('❌ User not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkTestUser();