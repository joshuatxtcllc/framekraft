import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, Session } from '../models';
import { z } from 'zod';
import * as storage from '../mongoStorage';

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
    // No demo login - real authentication only
    
    // Validate input
    const data = loginSchema.parse(req.body);
    console.log('Login attempt for email:', data.email);

    // Find user (including password field for comparison)
    const user = await User.findOne({ email: data.email }).select('+password');
    if (!user) {
      console.log('User not found for email:', data.email);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    console.log('User found:', user.email, 'Has password:', !!user.password);

    // Check password
    const isPasswordValid = await user.comparePassword(data.password);
    console.log('Password comparison result:', isPasswordValid);
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

// Get current user authentication status
router.get('/user', async (req, res) => {
  try {
    // Get token from cookies or header
    const token = req.cookies?.accessToken || 
                  req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Not authenticated',
        isAuthenticated: false 
      });
    }

    // No demo tokens allowed - real authentication only

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      
      // Find user in database
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(401).json({ 
          message: 'User not found',
          isAuthenticated: false
        });
      }

      // Return user data
      return res.json({
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          businessName: user.businessName,
          role: user.role || 'owner',
          emailVerified: user.emailVerified || false,
          isAuthenticated: true
        }
      });
    } catch (error) {
      // Token is invalid or expired
      return res.status(401).json({ 
        message: 'Invalid or expired token',
        isAuthenticated: false
      });
    }
  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(500).json({ 
      message: 'Failed to check authentication',
      isAuthenticated: false
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

// Change password route
router.put('/change-password', async (req, res) => {
  try {
    // Get current user
    const sessionId = req.cookies.sessionId;
    const token = req.cookies.accessToken || req.headers.authorization?.replace('Bearer ', '');

    // Demo user cannot change password
    if (sessionId === 'demo-session' || token === 'demo-token') {
      return res.status(403).json({ 
        success: false, 
        message: 'Demo account password cannot be changed' 
      });
    }

    let userId: string | null = null;

    // Get user ID from session or token
    if (sessionId) {
      const session = await Session.findOne({ sid: sessionId });
      if (session && session.expire > new Date()) {
        userId = session.sess.userId;
      }
    }

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

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 8 characters long' 
      });
    }

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Verify current password
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Password changed successfully' 
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to change password' 
    });
  }
});

// Download user data route
router.get('/download-data', async (req, res) => {
  try {
    // Get current user
    const sessionId = req.cookies.sessionId;
    const token = req.cookies.accessToken || req.headers.authorization?.replace('Bearer ', '');

    let userId: string | null = null;

    // Handle demo user
    if (sessionId === 'demo-session' || token === 'demo-token') {
      userId = 'demo-user-id';
    } else {
      // Get user ID from session or token
      if (sessionId) {
        const session = await Session.findOne({ sid: sessionId });
        if (session && session.expire > new Date()) {
          userId = session.sess.userId;
        }
      }

      if (!userId && token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
          userId = decoded.userId;
        } catch (error) {
          // Token is invalid
        }
      }
    }

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }

    // Collect all user data
    const userData: any = {};

    if (userId === 'demo-user-id') {
      // Return demo data
      userData.user = {
        email: 'demo@framecraft.com',
        firstName: 'Demo',
        lastName: 'User',
        businessName: 'Demo Framing Co.',
      };
      userData.customers = await storage.getCustomers();
      userData.orders = await storage.getOrders();
      userData.invoices = await storage.getInvoices();
      userData.inventory = await storage.getInventory();
      userData.settings = {
        business: await storage.getBusinessSettings(),
        notifications: await storage.getNotificationSettings(),
        display: await storage.getDisplaySettings(),
      };
    } else {
      // Get real user data
      const user = await User.findById(userId).select('-password');
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      userData.user = user;
      userData.customers = await storage.getCustomers();
      userData.orders = await storage.getOrders();
      userData.invoices = await storage.getInvoices();
      userData.inventory = await storage.getInventory();
      userData.wholesalers = await storage.getWholesalers();
      userData.settings = {
        business: await storage.getBusinessSettings(),
        notifications: await storage.getNotificationSettings(),
        display: await storage.getDisplaySettings(),
      };
    }

    // Send as JSON file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="framecraft-data-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(userData);
  } catch (error) {
    console.error('Download data error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to download data' 
    });
  }
});

// Delete account route
router.delete('/delete-account', async (req, res) => {
  try {
    // Get current user
    const sessionId = req.cookies.sessionId;
    const token = req.cookies.accessToken || req.headers.authorization?.replace('Bearer ', '');

    // Demo user cannot be deleted
    if (sessionId === 'demo-session' || token === 'demo-token') {
      return res.status(403).json({ 
        success: false, 
        message: 'Demo account cannot be deleted' 
      });
    }

    let userId: string | null = null;

    // Get user ID from session or token
    if (sessionId) {
      const session = await Session.findOne({ sid: sessionId });
      if (session && session.expire > new Date()) {
        userId = session.sess.userId;
      }
    }

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

    // Delete all user data
    // Note: In a real application, you'd want to cascade delete all related data
    // For now, we'll just delete the user account
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Delete session
    if (sessionId) {
      await Session.deleteOne({ sid: sessionId });
    }

    // Clear cookies
    res.clearCookie('sessionId');
    res.clearCookie('accessToken');

    res.json({ 
      success: true, 
      message: 'Account deleted successfully' 
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete account' 
    });
  }
});

export default router;