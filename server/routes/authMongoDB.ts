import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, Session } from '../models';
import { z } from 'zod';

const router = Router();

// JWT Secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Validation schemas
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  businessName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Generate JWT token
function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Signup route (also available as /register for compatibility)
router.post('/signup', async (req, res) => {
  try {
    // Validate input
    const data = signupSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    // Create new user
    const user = new User({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      businessName: data.businessName,
      role: 'owner',
      emailVerified: true, // Auto-verify for now
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    // Create session
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session = new Session({
      sid: sessionId,
      sess: {
        userId: user._id,
        email: user.email,
        token,
      },
      expire: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    await session.save();

    // Set cookies
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user data
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        businessName: user.businessName,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      token,
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid input', 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create account' 
    });
  }
});

// Register route (alias for signup)
router.post('/register', async (req, res) => {
  try {
    // Validate input
    const data = signupSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    // Create new user
    const user = new User({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      businessName: data.businessName,
      role: 'owner',
      emailVerified: true, // Auto-verify for now
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    // Create session
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session = new Session({
      sid: sessionId,
      sess: {
        userId: user._id,
        email: user.email,
        token,
      },
      expire: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    await session.save();

    // Set cookies
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user data
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        businessName: user.businessName,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      token,
    });
  } catch (error: any) {
    console.error('Register error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid input', 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create account' 
    });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    // Check for demo login first
    if (req.body.email === 'demo@framecraft.com' && req.body.password === 'demo123456') {
      const demoUser = {
        id: 'demo-user-id',
        email: 'demo@framecraft.com',
        firstName: 'Demo',
        lastName: 'User',
        businessName: 'Demo Framing Co.',
        role: 'owner',
        emailVerified: true,
      };
      
      // Set demo cookies
      res.cookie('sessionId', 'demo-session', {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
      
      res.cookie('accessToken', 'demo-token', {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
      
      return res.json({
        success: true,
        user: demoUser,
        token: 'demo-token',
      });
    }

    // Validate input
    const data = loginSchema.parse(req.body);

    // Find user
    const user = await User.findOne({ email: data.email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(data.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Generate token
    const token = generateToken(user._id.toString());

    // Create or update session
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await Session.findOneAndUpdate(
      { 'sess.userId': user._id },
      {
        sid: sessionId,
        sess: {
          userId: user._id,
          email: user.email,
          token,
        },
        expire: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      { upsert: true, new: true }
    );

    // Set cookies
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user data
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        businessName: user.businessName,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid input', 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to login' 
    });
  }
});

// Get current user
router.get('/user', async (req, res) => {
  try {
    // Check for demo user
    if (req.cookies.accessToken === 'demo-token' || req.cookies.sessionId === 'demo-session') {
      return res.json({
        success: true,
        user: {
          id: 'demo-user-id',
          email: 'demo@framecraft.com',
          firstName: 'Demo',
          lastName: 'User',
          businessName: 'Demo Framing Co.',
          role: 'owner',
          emailVerified: true,
        },
      });
    }

    // Check for session or token
    const sessionId = req.cookies.sessionId;
    const token = req.cookies.accessToken || req.headers.authorization?.replace('Bearer ', '');

    if (!sessionId && !token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }

    let userId: string | null = null;

    // Try to get user from session
    if (sessionId) {
      const session = await Session.findOne({ sid: sessionId });
      if (session && session.expire > new Date()) {
        userId = session.sess.userId;
      }
    }

    // Try to get user from token
    if (!userId && token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        userId = decoded.userId;
      } catch (error) {
        // Token is invalid
      }
    }

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }

    // Get user
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        businessName: user.businessName,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get user' 
    });
  }
});

// Logout route
router.post('/logout', async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;
    
    // Delete session from database
    if (sessionId && sessionId !== 'demo-session') {
      await Session.deleteOne({ sid: sessionId });
    }

    // Clear cookies
    res.clearCookie('sessionId');
    res.clearCookie('accessToken');

    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to logout' 
    });
  }
});

// Check if email exists
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !z.string().email().safeParse(email).success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email' 
      });
    }

    const user = await User.findOne({ email });
    
    res.json({
      success: true,
      exists: !!user,
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check email' 
    });
  }
});

export default router;