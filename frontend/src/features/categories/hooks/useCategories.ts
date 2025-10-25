import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { PaginatedResponse } from '@/types/api.types';
import type { Category } from '@/types/entities.types';

interface UseCategoriesParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  q?: string;
}

/**
 * Hook to fetch paginated categories list
 * @param params - Query parameters for filtering, sorting, and pagination
 */
export const useCategories = (params?: UseCategoriesParams) => {
  return useQuery({
    queryKey: ['categories', params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Category>>(
        API_ENDPOINTS.CATEGORIES.LIST,
        {
          params,
        },
      );
      return data;
    },
  });
};

/**
 * Hook to fetch all categories for dropdown (no pagination)
 * Fetches a large page size to get all categories at once
 */
export const useCategoriesForDropdown = () => {
  return useQuery({
    queryKey: ['categories', 'all'],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Category>>(
        API_ENDPOINTS.CATEGORIES.LIST,
        {
          params: {
            page: 1,
            pageSize: 100, // Get all categories
            sortBy: 'name',
            sortOrder: 'asc',
          },
        },
      );
      return data.items;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes - categories don't change often
  });
};

/**
 * Hook to fetch total categories count (stats)
 * Optimized by only fetching 1 item to get the total count
 */
export const useCategoriesStats = () => {
  return useQuery({
    queryKey: ['categories-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Category>>(
        API_ENDPOINTS.CATEGORIES.LIST,
        {
          params: { page: 1, pageSize: 1 },
        },
      );
      return {
        total: data.total,
      };
    },
  });
};
