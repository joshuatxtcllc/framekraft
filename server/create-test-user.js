import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Connect to MongoDB
await mongoose.connect('mongodb://localhost:27017/framecraft');

// Define User schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  businessName: String,
  role: { type: String, default: 'user' },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

async function createTestUser() {
  try {
    // Check if test user exists
    const existingUser = await User.findOne({ email: 'test@framecraft.com' });
    if (existingUser) {
      console.log('Test user already exists');
      process.exit(0);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('Test123!', 10);
    
    // Create test user
    const testUser = new User({
      email: 'test@framecraft.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      businessName: 'Test Framing Co.',
      role: 'owner',
      isActive: true,
      isEmailVerified: true
    });
    
    await testUser.save();
    console.log('✅ Test user created successfully!');
    console.log('Email: test@framecraft.com');
    console.log('Password: Test123!');
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createTestUser();