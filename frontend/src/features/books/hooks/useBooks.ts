import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { PaginatedResponse } from '@/types/api.types';
import type { Book } from '@/types/entities.types';

/**
 * Query parameters for fetching books
 * Matches API contract: GET /api/books
 */
interface UseBooksParams {
  /** Search query for title or author (case-insensitive partial match) */
  q?: string;
  /** Filter by category UUID */
  categoryId?: string;
  /** Filter by author UUID */
  authorId?: string;
  /** Filter by availability status (true = available copies > 0) */
  availability?: boolean;
  /** Field to sort by: relevance, title, createdAt */
  sortBy?: 'relevance' | 'title' | 'createdAt';
  /** Sort direction: asc or desc */
  sortOrder?: 'asc' | 'desc';
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page */
  pageSize?: number;
}

/**
 * Hook to fetch paginated books list
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Query result with books data, loading state, and error
 */
export const useBooks = (params?: UseBooksParams) => {
  return useQuery({
    queryKey: ['books', params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Book>>(
        API_ENDPOINTS.BOOKS.LIST,
        {
          params,
        }
      );
      return data;
    },
  });
};

/**
 * Hook to fetch total books count (stats)
 * Optimized by only fetching 1 item to get the total count
 */
export const useBooksStats = () => {
  return useQuery({
    queryKey: ['books-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Book>>(
        API_ENDPOINTS.BOOKS.LIST,
        {
          params: { page: 1, pageSize: 1 },
        }
      );
      return {
        total: data.total,
      };
    },
  });
};
