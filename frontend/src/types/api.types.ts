/**
 * Common API Response Types
 * 
 * These types match the API contract defined in api-contract.yaml
 */

/**
 * Standard API Error Response
 * Returned by the backend for all error cases
 */
export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  details?: unknown[];
  timestamp: string;
  path: string;
}

/**
 * Paginated Response
 * Used for list endpoints that return paginated data
 */
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Pagination Query Parameters
 * Used when making requests to paginated endpoints
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Common Filter Parameters
 * Used for filtering list results
 */
export interface FilterParams {
  q?: string; // Search query
  [key: string]: string | number | boolean | undefined;
}

/**
 * API Response Wrapper
 * Generic wrapper for API responses
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}
