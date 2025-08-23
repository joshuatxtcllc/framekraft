import mongoose from 'mongoose';
import { User } from '../models/index.js';

async function activateAllUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/framekraft', {});
    
    // Activate all existing users
    const result = await User.updateMany(
      {}, // Match all users
      { $set: { isActive: true } }
    );
    
    console.log(`✅ Activated ${result.modifiedCount} users`);
    
    // List all users
    const users = await User.find({}, 'email isActive role');
    console.log('\nAll users:');
    users.forEach(user => {
      console.log(`  - ${user.email}: isActive=${user.isActive}, role=${user.role}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

activateAllUsers();