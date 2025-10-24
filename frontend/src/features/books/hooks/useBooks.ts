import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { PaginatedResponse } from '@/types/api.types';
import type { Book } from '@/types/entities.types';

interface UseBooksParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  categoryId?: string;
  authorId?: string;
  availableOnly?: boolean;
}

/**
 * Hook to fetch paginated books list
 * @param params - Query parameters for filtering, sorting, and pagination
 */
export const useBooks = (params?: UseBooksParams) => {
  return useQuery({
    queryKey: ['books', params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Book>>(API_ENDPOINTS.BOOKS.LIST, {
        params,
      });
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
      const { data } = await apiClient.get<PaginatedResponse<Book>>(API_ENDPOINTS.BOOKS.LIST, {
        params: { page: 1, pageSize: 1 },
      });
      return {
        total: data.total,
      };
    },
  });
};
