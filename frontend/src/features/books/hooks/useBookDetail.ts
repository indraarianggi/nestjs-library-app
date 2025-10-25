import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { Book } from '@/types/entities.types';

/**
 * Hook to fetch a single book's details by ID
 * @param id - Book UUID
 * @returns Query result with book details, loading state, and error
 */
export const useBookDetail = (id: string | undefined) => {
  return useQuery({
    queryKey: ['book', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('Book ID is required');
      }

      const { data } = await apiClient.get<Book>(API_ENDPOINTS.BOOKS.DETAIL(id));
      return data;
    },
    enabled: !!id, // Only run query if ID is provided
  });
};
