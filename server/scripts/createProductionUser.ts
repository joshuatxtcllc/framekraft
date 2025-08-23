import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../mongodb';
import { User } from '../models';

async function createProductionUser() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await connectDB();
    
    // User details with secure but simpler password
    const userData = {
      email: 'owner@framecraft.com',
      password: 'SecurePass2024',  // Secure password without special JSON-breaking characters
      firstName: 'Business',
      lastName: 'Owner',
      businessName: 'FrameCraft Productions',
      role: 'owner',
      isActive: true,
      emailVerified: true,
      isEmailVerified: true
    };
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      console.log('User already exists with email:', userData.email);
      console.log('=====================================');
      console.log('Login Credentials:');
      console.log('Email: owner@framecraft.com');
      console.log('Password: SecurePass2024');
      console.log('=====================================');
      await mongoose.disconnect();
      process.exit(0);
    }
    
    // Create the user (password will be hashed automatically by the model)
    const newUser = new User(userData);
    
    await newUser.save();
    
    console.log('✅ User created successfully!');
    console.log('=====================================');
    console.log('Login Credentials:');
    console.log('Email: owner@framecraft.com');
    console.log('Password: SecurePass2024');
    console.log('=====================================');
    console.log('You can now login with these credentials');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error creating user:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
createProductionUser();