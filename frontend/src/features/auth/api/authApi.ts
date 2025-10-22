/**
 * Auth API Functions
 * Handles authentication-related API calls
 */

import { apiClient, API_ENDPOINTS } from '@/lib/api';
import { tokenStorage } from '@/lib/tokenStorage';
import type {
  LoginResponse,
  RegisterResponse,
  RefreshResponse,
} from '@/types/auth.types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
}

/**
 * Login user with email and password
 * Stores tokens in localStorage
 */
export const login = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  const { data } = await apiClient.post<LoginResponse>(
    API_ENDPOINTS.AUTH.LOGIN,
    credentials
  );

  // Store tokens
  tokenStorage.setTokens(data.tokens.accessToken, data.tokens.refreshToken);

  return data;
};

/**
 * Register new user
 * Stores tokens in localStorage
 */
export const register = async (
  registerData: RegisterData
): Promise<RegisterResponse> => {
  const { data } = await apiClient.post<RegisterResponse>(
    API_ENDPOINTS.AUTH.REGISTER,
    registerData
  );

  // Store tokens from registration
  tokenStorage.setTokens(data.tokens.accessToken, data.tokens.refreshToken);

  return data;
};

/**
 * Logout user
 * Clears tokens from localStorage
 */
export const logout = async (): Promise<void> => {
  const refreshToken = tokenStorage.getRefreshToken();

  if (refreshToken) {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {
        refreshToken,
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
  }

  // Clear tokens regardless of API call success
  tokenStorage.clearTokens();
};

/**
 * Refresh access token using refresh token
 * Updates tokens in localStorage
 */
export const refreshAccessToken = async (): Promise<RefreshResponse> => {
  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const { data } = await apiClient.post<RefreshResponse>(
    API_ENDPOINTS.AUTH.REFRESH,
    {
      refreshToken,
    }
  );

  // Store new tokens
  tokenStorage.setTokens(data.accessToken, data.refreshToken);

  return data;
};
