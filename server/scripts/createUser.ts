import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../mongodb';
import { User } from '../models';

async function createAdminUser() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await connectDB();
    
    // User details
    const userData = {
      email: 'admin@framecraft.com',
      password: 'FrameCraft2024!',  // Strong password
      firstName: 'Admin',
      lastName: 'User',
      businessName: 'FrameCraft Inc.',
      role: 'owner',
      isActive: true,
      emailVerified: true,
      isEmailVerified: true
    };
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      console.log('User already exists with email:', userData.email);
      console.log('Login credentials:');
      console.log('Email:', userData.email);
      console.log('Password: FrameCraft2024!');
      await mongoose.disconnect();
      process.exit(0);
    }
    
    // Create the user (password will be hashed automatically by the model)
    const newUser = new User(userData);
    
    await newUser.save();
    
    console.log('✅ User created successfully!');
    console.log('=====================================');
    console.log('Login Credentials:');
    console.log('Email: admin@framecraft.com');
    console.log('Password: FrameCraft2024!');
    console.log('=====================================');
    console.log('You can now login with these credentials');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error creating user:', error);
    process.exit(1);
  }
}

// Run the script
createAdminUser();