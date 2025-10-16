/**
 * Entity types matching backend models
 */

export type BookStatus = 'ACTIVE' | 'ARCHIVED';

export type CopyStatus = 'AVAILABLE' | 'ON_LOAN' | 'LOST' | 'DAMAGED';

export type LoanStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'ACTIVE'
  | 'RETURNED'
  | 'OVERDUE'
  | 'REJECTED'
  | 'CANCELLED';

export interface Author {
  id: string;
  name: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  isbn: string;
  publicationYear?: number;
  language?: string;
  coverImageUrl?: string;
  status: BookStatus;
  createdAt: string;
  updatedAt: string;
  authors: Author[];
  categories: Category[];
  availableCopies: number;
  totalCopies: number;
}

export interface BookCopy {
  id: string;
  bookId: string;
  code: string;
  status: CopyStatus;
  locationCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Loan {
  id: string;
  userId: string;
  bookId: string;
  copyId: string;
  status: LoanStatus;
  borrowedAt?: string;
  dueDate?: string;
  returnedAt?: string;
  renewalCount: number;
  penaltyAccrued: number;
  createdAt: string;
  updatedAt: string;
  book?: Book;
  copy?: BookCopy;
}
