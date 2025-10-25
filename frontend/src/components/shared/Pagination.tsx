import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Pagination Component Props
 */
interface PaginationProps {
  /**
   * Current active page (1-indexed)
   */
  currentPage: number;
  /**
   * Total number of pages
   */
  totalPages: number;
  /**
   * Callback when page changes
   */
  onPageChange: (page: number) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Generate page numbers array with smart ellipsis
 *
 * Logic:
 * - If totalPages <= 7: show all pages [1, 2, 3, 4, 5, 6, 7]
 * - If currentPage near start (≤ 4): [1, 2, 3, 4, 5, ..., last]
 * - If currentPage in middle: [1, ..., current-1, current, current+1, ..., last]
 * - If currentPage near end (≥ totalPages - 3): [1, ..., last-4, last-3, last-2, last-1, last]
 */
const generatePageNumbers = (
  currentPage: number,
  totalPages: number,
): (number | 'ellipsis-start' | 'ellipsis-end')[] => {
  // Edge cases
  if (totalPages <= 0) return [];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];

  // Always show first page
  pages.push(1);

  if (currentPage <= 4) {
    // Near start: [1, 2, 3, 4, 5, ..., last]
    for (let i = 2; i <= Math.min(5, totalPages - 1); i++) {
      pages.push(i);
    }
    if (totalPages > 6) {
      pages.push('ellipsis-end');
    }
    pages.push(totalPages);
  } else if (currentPage >= totalPages - 3) {
    // Near end: [1, ..., last-4, last-3, last-2, last-1, last]
    pages.push('ellipsis-start');
    for (let i = totalPages - 4; i <= totalPages; i++) {
      if (i > 1) {
        pages.push(i);
      }
    }
  } else {
    // Middle: [1, ..., current-1, current, current+1, ..., last]
    pages.push('ellipsis-start');
    pages.push(currentPage - 1);
    pages.push(currentPage);
    pages.push(currentPage + 1);
    pages.push('ellipsis-end');
    pages.push(totalPages);
  }

  return pages;
};

/**
 * Pagination Component
 *
 * Reusable pagination component for list pages with smart page number display.
 * Features:
 * - Previous/Next navigation buttons with icons
 * - Jump to first/last page buttons
 * - Page numbers with smart ellipsis (max 7 visible)
 * - Current page highlighted
 * - Proper disabled states
 * - Accessible with ARIA labels
 * - Responsive design (smaller buttons on mobile)
 *
 * @example
 * ```tsx
 * const [page, setPage] = useState(1);
 *
 * <Pagination
 *   currentPage={page}
 *   totalPages={20}
 *   onPageChange={setPage}
 * />
 * ```
 */
export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) => {
  // Handle edge cases
  if (totalPages <= 1) return null;

  const pageNumbers = generatePageNumbers(currentPage, totalPages);

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return (
    <nav
      role="navigation"
      aria-label="Pagination navigation"
      className={cn('flex items-center justify-center gap-1', className)}
    >
      {/* First Page Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(1)}
        disabled={isFirstPage}
        aria-label="Go to first page"
        aria-disabled={isFirstPage}
        className="h-8 w-8 md:h-9 md:w-9"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>

      {/* Previous Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isFirstPage}
        aria-label="Go to previous page"
        aria-disabled={isFirstPage}
        className="h-8 w-8 md:h-9 md:w-9"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground md:h-9 md:w-9"
                aria-hidden="true"
              >
                ...
              </span>
            );
          }

          const isActive = page === currentPage;

          return (
            <Button
              key={page}
              variant={isActive ? 'default' : 'outline'}
              size="icon"
              onClick={() => onPageChange(page)}
              disabled={isActive}
              aria-label={`Go to page ${page}`}
              aria-current={isActive ? 'page' : undefined}
              aria-disabled={isActive}
              className={cn('h-8 w-8 md:h-9 md:w-9 text-sm', isActive && 'pointer-events-none')}
            >
              {page}
            </Button>
          );
        })}
      </div>

      {/* Next Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLastPage}
        aria-label="Go to next page"
        aria-disabled={isLastPage}
        className="h-8 w-8 md:h-9 md:w-9"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Last Page Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(totalPages)}
        disabled={isLastPage}
        aria-label="Go to last page"
        aria-disabled={isLastPage}
        className="h-8 w-8 md:h-9 md:w-9"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </nav>
  );
};
