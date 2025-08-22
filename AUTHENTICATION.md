# FrameKraft Authentication System

## Overview

FrameKraft uses a production-ready MongoDB-based authentication system with JWT tokens, secure password hashing, and comprehensive user management features.

## Features

### Security
- **Password Hashing**: BCrypt with 12 salt rounds
- **JWT Tokens**: Access tokens (15 min) and refresh tokens (7 days)
- **Account Protection**: Account locking after 5 failed login attempts
- **Rate Limiting**: 5 auth requests per 15 minutes per IP
- **Email Verification**: Required for new accounts
- **Password Reset**: Secure token-based password reset flow

### User Management
- User registration with email verification
- Secure login/logout
- Password reset via email
- Profile management
- Multi-device session management
- Role-based access control (admin, owner, employee, viewer)

## Setup

### 1. Install Dependencies

```bash
cd server
npm install mongoose bcryptjs jsonwebtoken express-validator nodemailer
```

### 2. Configure MongoDB

#### Local MongoDB
```bash
# Install MongoDB locally
brew install mongodb-community@7.0

# Start MongoDB
brew services start mongodb-community@7.0
```

#### MongoDB Atlas (Cloud)
1. Create account at [mongodb.com](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get your connection string

### 3. Environment Configuration

Create a `.env` file in the server directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/framekraft
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/framekraft?retryWrites=true&w=majority

# Authentication
AUTH_PROVIDER=mongodb
JWT_SECRET=your-256-bit-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
SESSION_SECRET=your-session-secret-here

# Application
APP_URL=http://localhost:5173
NODE_ENV=development
PORT=5000

# Email (for password reset)
EMAIL_FROM=noreply@framekraft.com
EMAIL_SERVICE=gmail
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REFRESH_TOKEN=your-google-refresh-token
```

### 4. Generate Secure Secrets

```bash
# Generate secure random strings for production
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## API Endpoints

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "businessName": "Acme Framing" // optional
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer {accessToken}

{
  "refreshToken": "..." // optional, to logout specific device
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "..."
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {accessToken}
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "businessName": "New Business Name",
  "preferences": {
    "theme": "dark",
    "notifications": {
      "email": true,
      "sms": false
    }
  }
}
```

#### Change Password
```http
POST /api/auth/change-password
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

#### Request Password Reset
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "password": "NewSecurePass789!"
}
```

#### Verify Email
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "verification-token-from-email"
}
```

## Frontend Integration

### Using the Auth Hook

```tsx
import { useAuth } from '@/hooks/useAuthMongoDB';

function MyComponent() {
  const { 
    user, 
    isAuthenticated, 
    isLoading,
    login,
    register,
    logout,
    updateProfile
  } = useAuth();

  const handleLogin = async () => {
    try {
      await login('user@example.com', 'password');
      // User is now logged in
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  
  if (!isAuthenticated) {
    return <LoginForm onSubmit={handleLogin} />;
  }

  return (
    <div>
      Welcome, {user?.firstName}!
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protected Routes

```tsx
function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Protected routes */}
      {isAuthenticated ? (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/orders" component={Orders} />
        </>
      ) : (
        <Route path="/" component={Login} />
      )}
    </Switch>
  );
}
```

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files to version control
2. **HTTPS Only**: Always use HTTPS in production
3. **Secure Cookies**: Set `secure: true` and `httpOnly: true` in production
4. **Rate Limiting**: Implement rate limiting on all auth endpoints
5. **Input Validation**: Always validate and sanitize user input
6. **Password Requirements**: Enforce strong password requirements
7. **Token Rotation**: Regularly rotate JWT secrets in production
8. **Monitoring**: Log and monitor authentication events

## Database Schema

### User Collection

```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  password: String (hashed),
  firstName: String,
  lastName: String,
  businessName: String,
  role: String (admin|owner|employee|viewer),
  profileImageUrl: String,
  isEmailVerified: Boolean,
  isActive: Boolean,
  loginAttempts: Number,
  lockUntil: Date,
  lastLogin: Date,
  refreshTokens: [{
    token: String,
    createdAt: Date,
    expiresAt: Date,
    userAgent: String,
    ipAddress: String
  }],
  preferences: {
    notifications: {
      email: Boolean,
      sms: Boolean,
      push: Boolean
    },
    theme: String,
    language: String
  },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check MongoDB is running: `brew services list`
   - Verify connection string in `.env`
   - Check network/firewall settings

2. **JWT Token Expired**
   - Tokens expire after 15 minutes
   - Use refresh token to get new access token
   - Implement auto-refresh in frontend

3. **Account Locked**
   - Wait 2 hours or reset password
   - Check `lockUntil` field in database

4. **Email Not Sending**
   - Verify email service credentials
   - Check spam folder
   - Enable "Less secure app access" for Gmail

## Migration from Other Auth Systems

To migrate from Replit Auth or other systems:

1. Export existing users
2. Create MongoDB user documents
3. Send password reset emails to all users
4. Update frontend to use new auth endpoints

## Production Deployment

1. Use MongoDB Atlas for cloud database
2. Set `NODE_ENV=production`
3. Use strong, unique secrets for JWT
4. Enable SSL/TLS for MongoDB connection
5. Implement backup and recovery procedures
6. Set up monitoring and alerting
7. Regular security audits

## Support

For issues or questions:
- Check logs in `server/logs/`
- Review MongoDB connection status
- Verify environment variables
- Test with Postman or curl

## License

This authentication system is part of FrameKraft and follows the project's MIT license.