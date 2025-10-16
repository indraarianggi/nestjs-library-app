/**
 * Authentication related types
 */

export type Role = 'ADMIN' | 'MEMBER';

export type MembershipStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  memberProfile?: MemberProfile;
}

export interface MemberProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  status: MembershipStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
