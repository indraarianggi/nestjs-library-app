import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * DetailPageSkeleton Component
 * 
 * Loading skeleton for detail pages (e.g., book detail, member detail).
 * Shows a two-column layout with image/avatar on left and details on right.
 */
interface DetailPageSkeletonProps {
  /**
   * Whether to show image/cover section
   */
  showImage?: boolean;
  /**
   * Number of detail rows to display
   */
  detailRows?: number;
  /**
   * Whether to show actions section
   */
  showActions?: boolean;
}

export const DetailPageSkeleton = ({
  showImage = true,
  detailRows = 8,
  showActions = true,
}: DetailPageSkeletonProps) => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Image/Cover Column */}
            {showImage && (
              <div className="md:col-span-1">
                <Skeleton className="w-full aspect-[2/3] rounded-lg" />
              </div>
            )}

            {/* Details Column */}
            <div className={showImage ? 'md:col-span-2' : 'md:col-span-3'}>
              <div className="space-y-6">
                {/* Tags/Badges Skeleton */}
                <div className="flex gap-2 flex-wrap">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>

                {/* Detail Rows */}
                <div className="space-y-4">
                  {Array.from({ length: detailRows }).map((_, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full col-span-2" />
                    </div>
                  ))}
                </div>

                {/* Description Section */}
                <div className="space-y-2 pt-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>

                {/* Actions */}
                {showActions && (
                  <div className="flex gap-3 pt-6">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-28" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
