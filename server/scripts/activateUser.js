import mongoose from 'mongoose';
import { User } from '../models/index.js';

async function activateUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/framekraft', {});
    
    const user = await User.findOneAndUpdate(
      { email: 'test@gmail.com' },
      { isActive: true },
      { new: true }
    );
    
    if (user) {
      console.log('✅ User activated successfully:', {
        email: user.email,
        isActive: user.isActive
      });
    } else {
      console.log('❌ User not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

activateUser();