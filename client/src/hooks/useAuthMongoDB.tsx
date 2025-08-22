import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  role: string;
  profileImageUrl?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  preferences: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || '';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Store tokens in memory for better security
  const [tokens, setTokens] = useState<{
    accessToken: string | null;
    refreshToken: string | null;
  }>({
    accessToken: null,
    refreshToken: null
  });

  // Helper function to make authenticated requests
  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers);
    
    if (tokens.accessToken) {
      headers.set('Authorization', `Bearer ${tokens.accessToken}`);
    }
    
    headers.set('Content-Type', 'application/json');
    
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers,
      credentials: 'include'
    });

    // If token expired, try to refresh
    if (response.status === 401) {
      const data = await response.json();
      if (data.code === 'TOKEN_EXPIRED' && tokens.refreshToken) {
        await refreshToken();
        // Retry the request with new token
        headers.set('Authorization', `Bearer ${tokens.accessToken}`);
        return fetch(`${API_URL}${url}`, {
          ...options,
          headers,
          credentials: 'include'
        });
      }
    }

    return response;
  };

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      
      // Try to get user info with current token
      const response = await fetch(`${API_URL}/api/auth/me`, {
        credentials: 'include',
        headers: tokens.accessToken ? {
          'Authorization': `Bearer ${tokens.accessToken}`
        } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Try to refresh token if we have one
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          await refreshTokenHandler();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    
    setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken
    });
    
    // Store refresh token in localStorage (access token in memory only)
    localStorage.setItem('refreshToken', data.refreshToken);
    
    setUser(data.user);
    setLocation('/dashboard');
  };

  const register = async (registerData: RegisterData) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();
    
    setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken
    });
    
    localStorage.setItem('refreshToken', data.refreshToken);
    
    setUser(data.user);
    setLocation('/dashboard');
  };

  const logout = async () => {
    try {
      await authenticatedFetch('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: tokens.refreshToken })
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setTokens({ accessToken: null, refreshToken: null });
      localStorage.removeItem('refreshToken');
      setLocation('/login');
    }
  };

  const refreshToken = async () => {
    await refreshTokenHandler();
  };

  const refreshTokenHandler = async () => {
    const storedRefreshToken = tokens.refreshToken || localStorage.getItem('refreshToken');
    
    if (!storedRefreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: storedRefreshToken }),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    
    setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken
    });
    
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
  };

  const updateProfile = async (profileData: Partial<User>) => {
    const response = await authenticatedFetch('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Profile update failed');
    }

    const data = await response.json();
    setUser(data.user);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const response = await authenticatedFetch('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Password change failed');
    }

    // Logout after password change
    await logout();
  };

  const forgotPassword = async (email: string) => {
    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Password reset request failed');
    }
  };

  const resetPassword = async (token: string, password: string) => {
    const response = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Password reset failed');
    }
  };

  const verifyEmail = async (token: string) => {
    const response = await fetch(`${API_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Email verification failed');
    }

    // Refresh user data
    await checkAuth();
  };

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!tokens.accessToken) return;

    // Refresh token 1 minute before expiry (access token expires in 15 minutes)
    const refreshTimer = setTimeout(() => {
      refreshTokenHandler().catch(console.error);
    }, 14 * 60 * 1000); // 14 minutes

    return () => clearTimeout(refreshTimer);
  }, [tokens.accessToken]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      refreshToken,
      updateProfile,
      changePassword,
      forgotPassword,
      resetPassword,
      verifyEmail
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}