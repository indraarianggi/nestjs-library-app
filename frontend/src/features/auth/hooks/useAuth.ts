import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { jwtDecode } from 'jwt-decode';
import { useAuthStore } from '../store/authStore';
import { tokenStorage } from '@/lib/tokenStorage';
import * as authApi from '../api/authApi';
import type { LoginCredentials, RegisterData } from '../api/authApi';
import type { User } from '@/types/auth.types';

/**
 * JWT Token Payload Interface
 * Represents the decoded JWT token structure
 */
interface JWTPayload {
  sub: string; // User ID
  email: string;
  role: 'ADMIN' | 'MEMBER';
  iat: number; // Issued at
  exp: number; // Expiration time
}

/**
 * Validates if a JWT token is expired
 * @param token - JWT token string
 * @returns true if token is valid and not expired, false otherwise
 */
const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;

  try {
    const decoded = jwtDecode<JWTPayload>(token);
    const currentTime = Date.now() / 1000; // Convert to seconds
    
    // Check if token is expired (with 10 second buffer)
    return decoded.exp > currentTime + 10;
  } catch (error) {
    console.error('[Auth] Token validation error:', error);
    return false;
  }
};

/**
 * Decodes JWT token and extracts user information
 * @param token - JWT token string
 * @returns User object or null if token is invalid
 */
const getUserFromToken = (token: string | null): User | null => {
  if (!token || !isTokenValid(token)) {
    return null;
  }

  try {
    const decoded = jwtDecode<JWTPayload>(token);
    
    return {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      isActive: true,
      lastLoginAt: null,
    };
  } catch (error) {
    console.error('[Auth] Token decoding error:', error);
    return null;
  }
};

/**
 * useAuth Hook
 * 
 * Main authentication hook that manages auth state and validates JWT tokens.
 * Automatically checks for stored tokens on mount and validates them.
 * 
 * @returns Auth state including user, loading status, and authentication status
 */
export const useAuth = () => {
  const {
    user,
    memberProfile,
    isLoading,
    isAuthenticated,
    error,
    setUser,
    clearUser,
    setLoading,
  } = useAuthStore();

  // Validate and restore auth state from stored JWT token on mount
  useEffect(() => {
    const initializeAuth = () => {
      setLoading(true);
      
      const accessToken = tokenStorage.getAccessToken();
      const refreshToken = tokenStorage.getRefreshToken();

      // If no tokens, clear auth state
      if (!accessToken || !refreshToken) {
        clearUser();
        return;
      }

      // Validate access token and extract user info
      const userFromToken = getUserFromToken(accessToken);
      
      if (userFromToken) {
        // Token is valid, set user in store
        setUser(userFromToken);
      } else {
        // Token is invalid or expired, clear tokens
        console.warn('[Auth] Invalid or expired token, clearing auth state');
        tokenStorage.clearTokens();
        clearUser();
      }
    };

    initializeAuth();
  }, [clearUser, setUser, setLoading]);

  return {
    user,
    memberProfile,
    isLoading,
    isAuthenticated,
    error,
  };
};

/**
 * useLogin Hook
 * 
 * Handles user login with email and password.
 * Stores JWT tokens and updates auth store on success.
 * 
 * @returns Login mutation with loading and error states
 */
export const useLogin = () => {
  const { setUser, clearUser, setError } = useAuthStore();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data) => {
      // Tokens are already stored by authApi.login
      setUser(data.user, data.memberProfile);
      setError(null);
      
      // Invalidate all queries on login to fetch fresh data
      queryClient.invalidateQueries();
      
      console.log('[Auth] Login successful');
    },
    onError: (err: Error) => {
      const errorMessage = err.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      clearUser();
      console.error('[Auth] Login error:', err);
    },
  });

  return {
    login: loginMutation.mutateAsync,
    loginSync: loginMutation.mutate,
    isLoading: loginMutation.isPending,
    isError: loginMutation.isError,
    error: loginMutation.error,
    isSuccess: loginMutation.isSuccess,
  };
};

/**
 * useRegister Hook
 * 
 * Handles new user registration.
 * Stores JWT tokens and updates auth store on success.
 * 
 * @returns Register mutation with loading and error states
 */
export const useRegister = () => {
  const { setUser, clearUser, setError } = useAuthStore();
  const queryClient = useQueryClient();

  const registerMutation = useMutation({
    mutationFn: (registerData: RegisterData) => authApi.register(registerData),
    onSuccess: (data) => {
      // Tokens are already stored by authApi.register
      setUser(data.user, data.memberProfile);
      setError(null);
      
      // Invalidate all queries on registration to fetch fresh data
      queryClient.invalidateQueries();
      
      console.log('[Auth] Registration successful');
    },
    onError: (err: Error) => {
      const errorMessage = err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      clearUser();
      console.error('[Auth] Registration error:', err);
    },
  });

  return {
    register: registerMutation.mutateAsync,
    registerSync: registerMutation.mutate,
    isLoading: registerMutation.isPending,
    isError: registerMutation.isError,
    error: registerMutation.error,
    isSuccess: registerMutation.isSuccess,
  };
};

/**
 * useLogout Hook
 * 
 * Handles user logout.
 * Clears JWT tokens from storage, invalidates queries, and clears auth store.
 * 
 * @returns Logout mutation with loading state
 */
export const useLogout = () => {
  const { clearUser, setError } = useAuthStore();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      // Tokens are already cleared by authApi.logout
      clearUser();
      setError(null);
      
      // Clear all cached queries on logout
      queryClient.clear();
      
      console.log('[Auth] Logout successful');
    },
    onError: (err: Error) => {
      console.error('[Auth] Logout error:', err);
      // Clear user even if API call fails
      tokenStorage.clearTokens();
      clearUser();
      queryClient.clear();
    },
  });

  return {
    logout: logoutMutation.mutateAsync,
    logoutSync: logoutMutation.mutate,
    isLoading: logoutMutation.isPending,
  };
};

/**
 * useRefreshToken Hook
 * 
 * Handles JWT access token refresh using refresh token.
 * Updates tokens in storage and syncs auth state.
 * 
 * Note: This is typically called automatically by the axios interceptor,
 * but can be used manually if needed.
 * 
 * @returns Refresh token mutation
 */
export const useRefreshToken = () => {
  const { setUser, clearUser } = useAuthStore();

  const refreshMutation = useMutation({
    mutationFn: () => authApi.refreshAccessToken(),
    onSuccess: (data) => {
      // Tokens are already stored by authApi.refreshAccessToken
      setUser(data.user, data.memberProfile);
      console.log('[Auth] Token refresh successful');
    },
    onError: (err: Error) => {
      console.error('[Auth] Token refresh error:', err);
      // Clear tokens on refresh failure
      tokenStorage.clearTokens();
      clearUser();
      
      // Redirect to login if not already there
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        window.location.href = '/login';
      }
    },
  });

  return {
    refreshToken: refreshMutation.mutateAsync,
    refreshTokenSync: refreshMutation.mutate,
    isLoading: refreshMutation.isPending,
    isError: refreshMutation.isError,
    error: refreshMutation.error,
  };
};
