/**
 * API Endpoints
 * 
 * Centralized definition of all API endpoints based on api-contract.yaml
 * Use these constants instead of hardcoding URLs throughout the application.
 */

export const API_ENDPOINTS = {
  // ==================== Authentication ====================
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
  },

  // ==================== Books ====================
  BOOKS: {
    LIST: '/books',
    DETAIL: (id: string) => `/books/${id}`,
    CREATE: '/books',
    UPDATE: (id: string) => `/books/${id}`,
    DELETE: (id: string) => `/books/${id}`,
    // Book copies for a specific book
    COPIES: (bookId: string) => `/books/${bookId}/copies`,
    ADD_COPIES: (bookId: string) => `/books/${bookId}/copies`,
  },

  // ==================== Authors ====================
  AUTHORS: {
    LIST: '/authors',
    CREATE: '/authors',
    UPDATE: (id: string) => `/authors/${id}`,
    DELETE: (id: string) => `/authors/${id}`,
  },

  // ==================== Categories ====================
  CATEGORIES: {
    LIST: '/categories',
    CREATE: '/categories',
    UPDATE: (id: string) => `/categories/${id}`,
    DELETE: (id: string) => `/categories/${id}`,
  },

  // ==================== Book Copies ====================
  COPIES: {
    UPDATE: (copyId: string) => `/copies/${copyId}`,
    DELETE: (copyId: string) => `/copies/${copyId}`,
  },

  // ==================== Members ====================
  MEMBERS: {
    LIST: '/members',
    DETAIL: (id: string) => `/members/${id}`,
    UPDATE: (id: string) => `/members/${id}`,
    ACTIVATE: (id: string) => `/members/${id}/activate`,
    SUSPEND: (id: string) => `/members/${id}/suspend`,
  },

  // ==================== Loans ====================
  LOANS: {
    // Admin: view all loans
    LIST: '/loans',
    // Member: view own loans
    MY_LOANS: '/my/loans',
    // Create new loan (borrow)
    CREATE: '/loans',
    // Admin actions
    APPROVE: (id: string) => `/loans/${id}/approve`,
    REJECT: (id: string) => `/loans/${id}/reject`,
    // Member/Admin actions
    RENEW: (id: string) => `/loans/${id}/renew`,
    RETURN: (id: string) => `/loans/${id}/return`,
  },

  // ==================== Settings ====================
  SETTINGS: {
    GET: '/settings',
    UPDATE: '/settings',
  },

  // ==================== Audit Logs ====================
  AUDIT_LOGS: {
    LIST: '/audit-logs',
  },
} as const;
