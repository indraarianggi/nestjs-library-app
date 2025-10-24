import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { PaginatedResponse } from '@/types/api.types';
import type { Book } from '@/types/entities.types';

/**
 * Hook to fetch featured books (latest additions)
 * @param limit - Number of featured books to fetch (default: 6)
 */
export const useFeaturedBooks = (limit: number = 6) => {
  return useQuery({
    queryKey: ['featured-books', limit],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Book>>(API_ENDPOINTS.BOOKS.LIST, {
        params: {
          page: 1,
          pageSize: limit,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      });
      return data;
    },
  });
};
