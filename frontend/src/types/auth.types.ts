export type UserRole = 'ADMIN' | 'MEMBER';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
}

export interface MemberProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string | null;
  status: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  memberProfile?: MemberProfile;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse {
  user: User;
  memberProfile: MemberProfile;
  tokens: AuthTokens;
  message: string;
}

export interface RefreshResponse {
  user: User;
  memberProfile?: MemberProfile;
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  memberProfile: MemberProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null, memberProfile?: MemberProfile | null) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}
