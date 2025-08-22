import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// In-memory user storage for demo purposes
const demoUsers = new Map();

// Initialize with a demo user
const demoPassword = bcrypt.hashSync('demo123456', 10);
demoUsers.set('demo@framecraft.com', {
  id: '1',
  email: 'demo@framecraft.com',
  passwordHash: demoPassword,
  firstName: 'Demo',
  lastName: 'User',
  businessName: 'Demo Framing Co.',
  role: 'owner',
  emailVerified: true,
});

export const demoAuthService = {
  async login(email: string, password: string) {
    const user = demoUsers.get(email);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }
    
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.SESSION_SECRET || 'demo-secret',
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.SESSION_SECRET || 'demo-secret',
      { expiresIn: '30d' }
    );
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        businessName: user.businessName,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes
    };
  },
  
  async register(data: any) {
    if (demoUsers.has(data.email)) {
      throw new Error('Email already registered');
    }
    
    const passwordHash = await bcrypt.hash(data.password, 10);
    const userId = Date.now().toString();
    
    const newUser = {
      id: userId,
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      businessName: data.businessName || '',
      role: 'owner',
      emailVerified: true, // Auto-verify for demo
    };
    
    demoUsers.set(data.email, newUser);
    
    const accessToken = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.SESSION_SECRET || 'demo-secret',
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { userId: newUser.id, type: 'refresh' },
      process.env.SESSION_SECRET || 'demo-secret',
      { expiresIn: '30d' }
    );
    
    return {
      success: true,
      message: 'Registration successful',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        businessName: newUser.businessName,
        role: newUser.role,
        emailVerified: newUser.emailVerified,
      },
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  },
  
  async getUserFromToken(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'demo-secret') as any;
      
      // Find user by email
      for (const [email, user] of demoUsers.entries()) {
        if (user.id === decoded.userId) {
          return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            businessName: user.businessName,
            role: user.role,
            emailVerified: user.emailVerified,
          };
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
};