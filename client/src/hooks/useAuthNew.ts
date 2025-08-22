import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  businessName?: string;
  profileImageUrl?: string;
  emailVerified: boolean;
}

interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  agreeToTerms: boolean;
}

interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  csrfToken?: string;
  message?: string;
  requiresTwoFactor?: boolean;
}

const API_BASE = '/api/auth';

// Helper to handle API requests with proper error handling
async function authFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok && response.status !== 401) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `Request failed with status ${response.status}`);
  }

  return response;
}

export function useAuthNew() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  // Fetch current user
  const { data: user, isLoading, error, refetch } = useQuery<AuthUser | null>({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      try {
        const response = await authFetch('/me');
        if (response.ok) {
          const data = await response.json();
          return data.user;
        }
        return null;
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Fetch CSRF token when authenticated
  useEffect(() => {
    if (user && !csrfToken) {
      authFetch('/csrf')
        .then(res => res.json())
        .then(data => {
          if (data.csrfToken) {
            setCsrfToken(data.csrfToken);
          }
        })
        .catch(console.error);
    }
  }, [user, csrfToken]);

  // Login mutation
  const loginMutation = useMutation<AuthResponse, Error, LoginData>({
    mutationFn: async (loginData) => {
      const response = await authFetch('/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && !data.requiresTwoFactor) {
        setCsrfToken(data.csrfToken || null);
        queryClient.setQueryData(['auth', 'user'], data.user);
        queryClient.invalidateQueries({ queryKey: ['auth'] });
        setLocation('/dashboard');
      }
    },
  });

  // Register mutation
  const registerMutation = useMutation<AuthResponse, Error, RegisterData>({
    mutationFn: async (registerData) => {
      const response = await authFetch('/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setCsrfToken(data.csrfToken || null);
        queryClient.setQueryData(['auth', 'user'], data.user);
        queryClient.invalidateQueries({ queryKey: ['auth'] });
        setLocation('/dashboard');
      }
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await authFetch('/logout', {
        method: 'POST',
        headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
      });
      return response.json();
    },
    onSuccess: () => {
      setCsrfToken(null);
      queryClient.setQueryData(['auth', 'user'], null);
      queryClient.invalidateQueries();
      setLocation('/login');
    },
  });

  // Logout from all devices
  const logoutAllMutation = useMutation({
    mutationFn: async () => {
      const response = await authFetch('/logout-all', {
        method: 'POST',
        headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
      });
      return response.json();
    },
    onSuccess: () => {
      setCsrfToken(null);
      queryClient.setQueryData(['auth', 'user'], null);
      queryClient.invalidateQueries();
      setLocation('/login');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation<
    { success: boolean; message: string },
    Error,
    { currentPassword: string; newPassword: string; confirmPassword: string }
  >({
    mutationFn: async (passwordData) => {
      const response = await authFetch('/password/change', {
        method: 'POST',
        headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
        body: JSON.stringify(passwordData),
      });
      return response.json();
    },
  });

  // Request password reset
  const requestPasswordResetMutation = useMutation<
    { success: boolean; message: string },
    Error,
    { email: string }
  >({
    mutationFn: async (data) => {
      const response = await authFetch('/password/reset', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },
  });

  // Confirm password reset
  const confirmPasswordResetMutation = useMutation<
    { success: boolean; message: string },
    Error,
    { token: string; password: string; confirmPassword: string }
  >({
    mutationFn: async (data) => {
      const response = await authFetch('/password/confirm', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      setLocation('/login');
    },
  });

  // Verify email
  const verifyEmailMutation = useMutation<
    { success: boolean; message: string },
    Error,
    { token: string }
  >({
    mutationFn: async (data) => {
      const response = await authFetch('/email/verify', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      setLocation('/dashboard');
    },
  });

  // Resend verification email
  const resendVerificationMutation = useMutation<
    { success: boolean; message: string },
    Error,
    { email: string }
  >({
    mutationFn: async (data) => {
      const response = await authFetch('/email/resend', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },
  });

  // Get active sessions
  const { data: sessions } = useQuery({
    queryKey: ['auth', 'sessions'],
    queryFn: async () => {
      if (!user) return [];
      const response = await authFetch('/sessions');
      const data = await response.json();
      return data.sessions || [];
    },
    enabled: !!user,
  });

  // Revoke session mutation
  const revokeSessionMutation = useMutation<
    { success: boolean; message: string },
    Error,
    { sessionId: string }
  >({
    mutationFn: async ({ sessionId }) => {
      const response = await authFetch(`/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] });
    },
  });

  // Auto-refresh token when it's about to expire
  useEffect(() => {
    if (!user) return;

    // Check token expiry every minute
    const interval = setInterval(async () => {
      try {
        // The server will auto-refresh if needed
        await refetch();
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }, 60 * 1000); // Every minute

    return () => clearInterval(interval);
  }, [user, refetch]);

  // Redirect to login if not authenticated and on protected route
  useEffect(() => {
    const publicPaths = ['/login', '/register', '/auth/', '/password-reset', '/'];
    const currentPath = window.location.pathname;
    
    const isPublicPath = publicPaths.some(path => currentPath.startsWith(path));
    
    if (!isLoading && !user && !isPublicPath) {
      setLocation('/login');
    }
  }, [user, isLoading, setLocation]);

  return {
    // User state
    user,
    isLoading,
    isAuthenticated: !!user,
    isEmailVerified: user?.emailVerified || false,
    
    // Auth methods
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    logoutAll: logoutAllMutation.mutate,
    
    // Password methods
    changePassword: changePasswordMutation.mutate,
    requestPasswordReset: requestPasswordResetMutation.mutate,
    confirmPasswordReset: confirmPasswordResetMutation.mutate,
    
    // Email verification
    verifyEmail: verifyEmailMutation.mutate,
    resendVerification: resendVerificationMutation.mutate,
    
    // Session management
    sessions,
    revokeSession: revokeSessionMutation.mutate,
    
    // Loading states
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    
    // Error states
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    
    // CSRF token
    csrfToken,
    
    // Refetch user
    refetchUser: refetch,
  };
}