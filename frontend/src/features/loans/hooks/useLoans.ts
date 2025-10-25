import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { Loan } from '@/types/entities.types';

/**
 * Request payload for creating a new loan (borrowing a book)
 */
interface BorrowBookRequest {
  /** UUID of the book to borrow */
  bookId: string;
  /** Optional UUID of specific copy to borrow (if not provided, system auto-selects) */
  copyId?: string;
}

/**
 * Response from creating a loan
 */
interface BorrowBookResponse {
  loan: Loan;
  message: string;
}

/**
 * Hook to borrow a book (create a new loan)
 *
 * Creates a new loan for the authenticated member. Validates:
 * - Member is active (not suspended or pending)
 * - Book has available copies
 * - Member has not exceeded concurrent loan limit
 *
 * If approvals are required, loan is created in REQUESTED status.
 * Otherwise, loan is auto-approved to APPROVED status.
 *
 * @returns Mutation with borrowBook function, loading state, and error
 */
export const useBorrowBook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: BorrowBookRequest) => {
      const { data } = await apiClient.post<BorrowBookResponse>(
        API_ENDPOINTS.LOANS.CREATE,
        request,
      );
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book', variables.bookId] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['my-loans'] });
    },
  });
};

/**
 * Request payload for renewing a loan
 */
interface RenewLoanRequest {
  loanId: string;
}

/**
 * Response from renewing a loan
 */
interface RenewLoanResponse {
  loan: Loan;
  message: string;
}

/**
 * Hook to renew a loan
 *
 * Renews an active loan, extending the due date by renewal period (default 7 days).
 *
 * Renewal is allowed only if:
 * - Loan status is ACTIVE
 * - Member is not suspended
 * - Renewal count < max renewals (default 1)
 * - Request made at least 1 day before due date
 *
 * @returns Mutation with renewLoan function, loading state, and error
 */
export const useRenewLoan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ loanId }: RenewLoanRequest) => {
      const { data } = await apiClient.post<RenewLoanResponse>(API_ENDPOINTS.LOANS.RENEW(loanId));
      return data;
    },
    onSuccess: () => {
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['my-loans'] });
    },
  });
};
