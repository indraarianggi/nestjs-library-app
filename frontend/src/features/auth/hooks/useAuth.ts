import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { tokenStorage } from '@/lib/tokenStorage';
import * as authApi from '../api/authApi';
import type {
  LoginCredentials,
  RegisterData,
} from '../api/authApi';

/**
 * useAuth Hook
 * Provides auth state and actions (login, register, logout)
 * Handles token storage and user state management
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
    setError,
  } = useAuthStore();

  // Check for existing tokens on mount and set authenticated state
  useEffect(() => {
    const hasTokens = tokenStorage.hasTokens();
    
    if (!hasTokens) {
      clearUser();
    }
    
    // Set loading to false after initial check
    setLoading(false);
  }, [clearUser, setLoading]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data) => {
      setUser(data.user, data.memberProfile);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message || 'Login failed');
      clearUser();
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (registerData: RegisterData) => authApi.register(registerData),
    onSuccess: (data) => {
      setUser(data.user, data.memberProfile);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message || 'Registration failed');
      clearUser();
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      clearUser();
      setError(null);
    },
    onError: (err: Error) => {
      console.error('Logout error:', err);
      // Clear user even if API call fails
      clearUser();
    },
  });

  return {
    // Auth state
    user,
    memberProfile,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    isAuthenticated,
    error,

    // Auth actions
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,

    // Mutation states
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
  };
};
