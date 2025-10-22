import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';

/**
 * TableRowSkeleton Component
 * 
 * Loading skeleton for table rows in data tables.
 * Flexible number of columns to match different table layouts.
 */
interface TableRowSkeletonProps {
  /**
   * Number of columns in the table
   */
  columnCount: number;
  /**
   * Whether to show action buttons column
   */
  showActions?: boolean;
}

export const TableRowSkeleton = ({
  columnCount,
  showActions = false,
}: TableRowSkeletonProps) => {
  return (
    <TableRow>
      {Array.from({ length: columnCount }).map((_, index) => (
        <TableCell key={index}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
      {showActions && (
        <TableCell>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </TableCell>
      )}
    </TableRow>
  );
};

/**
 * TableSkeletonLoader Component
 * 
 * Renders multiple table row skeletons for loading state.
 */
interface TableSkeletonLoaderProps {
  /**
   * Number of rows to display
   */
  rows?: number;
  /**
   * Number of columns in the table
   */
  columnCount: number;
  /**
   * Whether to show action buttons column
   */
  showActions?: boolean;
}

export const TableSkeletonLoader = ({
  rows = 5,
  columnCount,
  showActions = false,
}: TableSkeletonLoaderProps) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <TableRowSkeleton
          key={index}
          columnCount={columnCount}
          showActions={showActions}
        />
      ))}
    </>
  );
};
