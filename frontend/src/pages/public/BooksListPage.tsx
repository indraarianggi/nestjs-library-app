import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { useQueryStates } from 'nuqs';
import { parseAsString, parseAsInteger, parseAsBoolean } from 'nuqs';
import { useBooks } from '@/features/books/hooks/useBooks';
import { useAuthorsForDropdown } from '@/features/authors/hooks';
import { useCategoriesForDropdown } from '@/features/categories/hooks';
import { BookCard } from '@/components/books/BookCard';
import { SearchBar } from '@/components/shared/SearchBar';
import { Pagination } from '@/components/shared/Pagination';
import { BookCardSkeleton } from '@/components/shared/skeletons/BookCardSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

/**
 * BooksListPage Component
 *
 * Main catalog page with search, filters, sorting, and pagination.
 * All state synced with URL query parameters for shareable URLs.
 *
 * Features:
 * - Search by title or author
 * - Filter by category, author, availability
 * - Sort by relevance, title, newest
 * - Pagination (20 books per page)
 * - Responsive grid layout
 * - URL state management
 * - Loading, empty, and error states
 */
export const BooksListPage = () => {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // URL state management using nuqs
  const [searchParams, setSearchParams] = useQueryStates({
    q: parseAsString.withDefault(''),
    categoryId: parseAsString.withDefault(''),
    authorId: parseAsString.withDefault(''),
    availability: parseAsBoolean.withDefault(false),
    sortBy: parseAsString.withDefault('relevance'),
    sortOrder: parseAsString.withDefault('asc'),
    page: parseAsInteger.withDefault(1),
  });

  // Extract values from state object
  const {
    q: searchQuery,
    categoryId,
    authorId,
    availability,
    sortBy,
    sortOrder,
    page,
  } = searchParams;

  // Type assertions for sortBy and sortOrder
  const typedSortBy = sortBy as 'relevance' | 'title' | 'createdAt';
  const typedSortOrder = sortOrder as 'asc' | 'desc';

  // Fetch books with current filters
  const { data, isLoading, error, refetch } = useBooks({
    page,
    pageSize: 10,
    q: searchQuery || undefined,
    categoryId: categoryId || undefined,
    authorId: authorId || undefined,
    availability: availability || undefined,
    sortBy: typedSortBy !== 'relevance' ? typedSortBy : undefined,
    sortOrder: typedSortBy !== 'relevance' ? typedSortOrder : undefined,
  });

  // Fetch authors and categories for filter dropdowns
  const { data: authors } = useAuthorsForDropdown();
  const { data: categories } = useCategoriesForDropdown();

  // Filter handlers using nuqs
  const handleSearchChange = (value: string) => {
    const trimmedValue = value.trim();
    setSearchParams({
      q: trimmedValue === '' ? null : trimmedValue,
      page: 1,
    });
  };

  const handleCategoryChange = (value: string) => {
    setSearchParams({
      categoryId: value === 'all' ? null : value,
      page: 1,
    });
  };

  const handleAuthorChange = (value: string) => {
    setSearchParams({
      authorId: value === 'all' ? null : value,
      page: 1,
    });
  };

  const handleAvailabilityChange = (checked: boolean) => {
    setSearchParams({
      availability: checked || null,
      page: 1,
    });
  };

  const handleSortChange = (value: string) => {
    if (value === 'relevance') {
      setSearchParams({
        sortBy: 'relevance',
        sortOrder: 'asc',
        page: 1,
      });
    } else if (value === 'title-asc') {
      setSearchParams({
        sortBy: 'title',
        sortOrder: 'asc',
        page: 1,
      });
    } else if (value === 'title-desc') {
      setSearchParams({
        sortBy: 'title',
        sortOrder: 'desc',
        page: 1,
      });
    } else if (value === 'newest') {
      setSearchParams({
        sortBy: 'createdAt',
        sortOrder: 'desc',
        page: 1,
      });
    }
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setSearchParams({
      q: null,
      categoryId: null,
      authorId: null,
      availability: false,
      sortBy: 'relevance',
      sortOrder: 'asc',
      page: 1,
    });
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery || categoryId || authorId || availability;

  // Get current sort value for display
  const getSortValue = () => {
    if (typedSortBy === 'relevance') return 'relevance';
    if (typedSortBy === 'title' && typedSortOrder === 'asc') return 'title-asc';
    if (typedSortBy === 'title' && typedSortOrder === 'desc') return 'title-desc';
    if (typedSortBy === 'createdAt' && typedSortOrder === 'desc') return 'newest';
    return 'relevance';
  };

  // Filter Section Component (reused for desktop and mobile)
  const FilterSection = () => (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="space-y-2">
        <Label htmlFor="category-filter">Category</Label>
        <Select value={categoryId || 'all'} onValueChange={handleCategoryChange}>
          <SelectTrigger id="category-filter">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories?.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Author Filter */}
      <div className="space-y-2">
        <Label htmlFor="author-filter">Author</Label>
        <Select value={authorId || 'all'} onValueChange={handleAuthorChange}>
          <SelectTrigger id="author-filter">
            <SelectValue placeholder="All authors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All authors</SelectItem>
            {authors?.map((author) => (
              <SelectItem key={author.id} value={author.id}>
                {author.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Availability Filter */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="availability-filter"
          checked={availability}
          onCheckedChange={handleAvailabilityChange}
        />
        <Label
          htmlFor="availability-filter"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          Available only
        </Label>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Books Catalog</h1>
        <p className="text-muted-foreground">Browse our collection of {data?.total || 0} books</p>
      </div>

      {/* Search and Filters Bar */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end">
        {/* Search Bar */}
        <div className="flex-1">
          <Label className="mb-2 block">Search</Label>
          <SearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by title or author..."
            loading={isLoading}
          />
        </div>

        {/* Sorting Dropdown */}
        <div className="w-full md:w-64">
          <Label htmlFor="sort" className="mb-2 block">
            Sort by
          </Label>
          <Select value={getSortValue()} onValueChange={handleSortChange}>
            <SelectTrigger id="sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="title-asc">Title (A-Z)</SelectItem>
              <SelectItem value="title-desc">Title (Z-A)</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mobile Filters Button */}
        <div className="md:hidden">
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    Active
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Refine your search results</SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <FilterSection />
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleClearFilters();
                      setMobileFiltersOpen(false);
                    }}
                    className="w-full mt-6"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-8">
        {/* Desktop Filters Sidebar */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Filters</h2>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-8 text-xs"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>
            <FilterSection />
          </div>
        </aside>

        {/* Books Grid */}
        <div className="flex-1">
          {/* Error State */}
          {error && (
            <ErrorState
              message="Failed to load books. Please try again."
              onRetry={() => refetch()}
            />
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <BookCardSkeleton key={index} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && data?.items.length === 0 && (
            <EmptyState
              icon="search"
              title="No books found"
              message={
                hasActiveFilters
                  ? 'Try adjusting your filters or search query.'
                  : 'No books available in the catalog.'
              }
              action={
                hasActiveFilters
                  ? {
                      label: 'Clear Filters',
                      onClick: handleClearFilters,
                      variant: 'outline',
                    }
                  : undefined
              }
            />
          )}

          {/* Books Grid */}
          {!isLoading && !error && data && data.items.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.items.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={page}
                    totalPages={data.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
