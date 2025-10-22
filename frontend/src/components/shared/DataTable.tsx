import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyStateInline } from '@/components/shared/EmptyState';
import { TableSkeletonLoader } from '@/components/shared/skeletons';

/**
 * Column definition for the DataTable
 *
 * @template T - The type of data being displayed
 */
export interface Column<T> {
  /**
   * Label to display in the column header
   */
  label: string;
  /**
   * Accessor to retrieve the column value from the row data.
   * Can be a key of T or a function that returns a React node.
   */
  accessor: keyof T | ((row: T) => React.ReactNode);
  /**
   * Whether this column is sortable
   * @default false
   */
  sortable?: boolean;
  /**
   * Optional custom class name for the column
   */
  className?: string;
  /**
   * Optional custom header class name
   */
  headerClassName?: string;
}

/**
 * Props for the DataTable component
 *
 * @template T - The type of data being displayed
 */
export interface DataTableProps<T> {
  /**
   * Array of data to display in the table
   */
  data: T[];
  /**
   * Column definitions
   */
  columns: Column<T>[];
  /**
   * Whether the table is in a loading state
   * @default false
   */
  loading?: boolean;
  /**
   * Message to display when there is no data
   * @default "No data available"
   */
  emptyMessage?: string;
  /**
   * Callback when a sortable column header is clicked
   */
  onSort?: (column: keyof T) => void;
  /**
   * Callback when a row is clicked
   */
  onRowClick?: (row: T) => void;
  /**
   * Current sort column key
   */
  sortColumn?: keyof T;
  /**
   * Current sort direction
   */
  sortDirection?: 'asc' | 'desc';
  /**
   * Optional custom class name for the table
   */
  className?: string;
  /**
   * Whether to show card wrapper on mobile (for responsive card layout)
   * @default true
   */
  showMobileCards?: boolean;
  /**
   * Optional key extractor for row keys (if data doesn't have an 'id' field)
   */
  keyExtractor?: (row: T, index: number) => string | number;
}

/**
 * DataTable Component
 *
 * A reusable, accessible data table component with sorting, loading states,
 * empty states, and responsive design (switches to card layout on mobile).
 *
 * Features:
 * - TypeScript generics for type safety
 * - Column sorting with visual indicators
 * - Row actions support
 * - Empty state with custom message
 * - Loading state with skeleton rows
 * - Responsive (table on desktop, cards on mobile)
 * - Accessible with ARIA attributes and keyboard navigation
 * - Clickable rows
 *
 * @template T - The type of data being displayed in the table.
 */
export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  onSort,
  onRowClick,
  sortColumn,
  sortDirection,
  className,
  showMobileCards = true,
  keyExtractor,
}: DataTableProps<T>) {
  const [internalSortColumn, setInternalSortColumn] = useState<keyof T | undefined>(sortColumn);
  const [internalSortDirection, setInternalSortDirection] = useState<'asc' | 'desc'>('asc');

  // Use controlled sort if provided, otherwise use internal state
  const currentSortColumn = sortColumn !== undefined ? sortColumn : internalSortColumn;
  const currentSortDirection = sortDirection !== undefined ? sortDirection : internalSortDirection;

  /**
   * Handle column header click for sorting
   */
  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;

    const columnKey = typeof column.accessor === 'function' ? undefined : column.accessor;
    if (!columnKey) return;

    // Toggle sort direction if same column, otherwise start with 'asc'
    const newDirection =
      currentSortColumn === columnKey && currentSortDirection === 'asc' ? 'desc' : 'asc';

    setInternalSortColumn(columnKey);
    setInternalSortDirection(newDirection);

    if (onSort) {
      onSort(columnKey);
    }
  };

  /**
   * Get sort icon for a column header
   */
  const getSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;

    const columnKey = typeof column.accessor === 'function' ? undefined : column.accessor;
    const isActive = currentSortColumn === columnKey;

    if (!isActive) {
      return <ChevronsUpDown className="ml-2 h-4 w-4" aria-hidden="true" />;
    }

    return currentSortDirection === 'asc' ? (
      <ChevronUp className="ml-2 h-4 w-4" aria-hidden="true" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" aria-hidden="true" />
    );
  };

  /**
   * Get cell value from row data
   */
  const getCellValue = (row: T, column: Column<T>): React.ReactNode => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return row[column.accessor] as React.ReactNode;
  };

  /**
   * Get row key
   */
  const getRowKey = (row: T, index: number): string | number => {
    if (keyExtractor) {
      return keyExtractor(row, index);
    }
    // Try to use 'id' field if available
    if ('id' in row) {
      return String(row.id);
    }
    return index;
  };

  /**
   * Handle row click
   */
  const handleRowClick = (row: T) => {
    if (onRowClick) {
      onRowClick(row);
    }
  };

  /**
   * Handle keyboard navigation on rows
   */
  const handleRowKeyDown = (event: React.KeyboardEvent, row: T) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleRowClick(row);
    }
  };

  /**
   * Render mobile card layout
   */
  const renderMobileCards = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (data.length === 0) {
      return <EmptyStateInline message={emptyMessage} />;
    }

    return (
      <div className="space-y-4" role="list">
        {data.map((row, rowIndex) => (
          <Card
            key={getRowKey(row, rowIndex)}
            className={cn('transition-colors', onRowClick && 'cursor-pointer hover:bg-muted/50')}
            onClick={() => onRowClick && handleRowClick(row)}
            role={onRowClick ? 'button' : 'listitem'}
            tabIndex={onRowClick ? 0 : undefined}
            onKeyDown={(e) => onRowClick && handleRowKeyDown(e, row)}
          >
            <CardContent className="p-4 space-y-3">
              {columns.map((column, colIndex) => (
                <div key={colIndex} className="flex flex-col space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">{column.label}</span>
                  <div className={cn('text-sm', column.className)}>{getCellValue(row, column)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  /**
   * Render desktop table layout
   */
  const renderDesktopTable = () => {
    return (
      <div className={cn('w-full', className)}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => {
                const columnKey =
                  typeof column.accessor === 'function' ? undefined : column.accessor;
                const isSortable = column.sortable && columnKey;
                const isActive = currentSortColumn === columnKey;

                return (
                  <TableHead
                    key={index}
                    className={cn(
                      column.headerClassName,
                      isSortable && 'cursor-pointer select-none hover:bg-muted/50',
                      isActive && 'bg-muted/30',
                    )}
                    onClick={() => isSortable && handleSort(column)}
                    role={isSortable ? 'button' : undefined}
                    aria-sort={
                      isActive
                        ? currentSortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                    tabIndex={isSortable ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (isSortable && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        handleSort(column);
                      }
                    }}
                  >
                    <div className="flex items-center">
                      <span>{column.label}</span>
                      {isSortable && getSortIcon(column)}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeletonLoader rows={5} columnCount={columns.length} showActions={false} />
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32">
                  <EmptyStateInline message={emptyMessage} />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => (
                <TableRow
                  key={getRowKey(row, rowIndex)}
                  className={cn(onRowClick && 'cursor-pointer')}
                  onClick={() => onRowClick && handleRowClick(row)}
                  role={onRowClick ? 'button' : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={(e) => onRowClick && handleRowKeyDown(e, row)}
                >
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex} className={column.className}>
                      {getCellValue(row, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <>
      {/* Desktop table view - hidden on mobile if showMobileCards is true */}
      <div className={cn(showMobileCards && 'hidden md:block')}>{renderDesktopTable()}</div>

      {/* Mobile card view - only shown on mobile if showMobileCards is true */}
      {showMobileCards && <div className="md:hidden">{renderMobileCards()}</div>}

      {/* If showMobileCards is false, always show table */}
      {!showMobileCards && renderDesktopTable()}
    </>
  );
}
