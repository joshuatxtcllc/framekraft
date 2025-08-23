import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../mongodb';
import { User } from '../models';

async function createSimpleUser() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await connectDB();
    
    // User details with simpler password
    const userData = {
      email: 'test@framecraft.com',
      password: 'TestUser123',  // Simpler password without special characters
      firstName: 'Test',
      lastName: 'User',
      businessName: 'Test Company',
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
      console.log('Password: TestUser123');
      await mongoose.disconnect();
      process.exit(0);
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    // Create the user
    const newUser = new User({
      ...userData,
      password: hashedPassword
    });
    
    await newUser.save();
    
    console.log('✅ User created successfully!');
    console.log('=====================================');
    console.log('Login Credentials:');
    console.log('Email: test@framecraft.com');
    console.log('Password: TestUser123');
    console.log('=====================================');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error creating user:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
createSimpleUser();