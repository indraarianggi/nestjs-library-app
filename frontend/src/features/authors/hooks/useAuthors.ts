import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { PaginatedResponse } from '@/types/api.types';
import type { Author } from '@/types/entities.types';

interface UseAuthorsParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  q?: string;
}

/**
 * Hook to fetch paginated authors list
 * @param params - Query parameters for filtering, sorting, and pagination
 */
export const useAuthors = (params?: UseAuthorsParams) => {
  return useQuery({
    queryKey: ['authors', params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Author>>(API_ENDPOINTS.AUTHORS.LIST, {
        params,
      });
      return data;
    },
  });
};

/**
 * Hook to fetch all authors for dropdown (no pagination)
 * Fetches a large page size to get all authors at once
 */
export const useAuthorsForDropdown = () => {
  return useQuery({
    queryKey: ['authors', 'all'],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Author>>(API_ENDPOINTS.AUTHORS.LIST, {
        params: {
          page: 1,
          pageSize: 100, // Get all authors
          sortBy: 'name',
          sortOrder: 'asc',
        },
      });
      return data.items;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes - authors don't change often
  });
};
