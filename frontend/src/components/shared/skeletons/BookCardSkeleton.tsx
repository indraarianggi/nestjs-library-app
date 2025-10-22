import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

/**
 * BookCardSkeleton Component
 * 
 * Loading skeleton for book card in catalog grid.
 * Matches the layout of actual book cards with cover, title, authors, and categories.
 */
export const BookCardSkeleton = () => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4">
        {/* Book Cover Image Skeleton */}
        <Skeleton className="w-full aspect-[2/3] rounded-md mb-4" />
        
        {/* Book Title Skeleton */}
        <Skeleton className="h-5 w-4/5 mb-2" />
        <Skeleton className="h-5 w-3/5" />
      </CardHeader>
      
      <CardContent className="flex-1 p-4 pt-0">
        {/* Authors Skeleton */}
        <div className="space-y-2 mb-3">
          <Skeleton className="h-4 w-2/3" />
        </div>
        
        {/* Categories Skeleton */}
        <div className="flex gap-2 flex-wrap">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        {/* Availability and Button Skeleton */}
        <div className="w-full space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-full" />
        </div>
      </CardFooter>
    </Card>
  );
};
