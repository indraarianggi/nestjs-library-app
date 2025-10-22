import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

/**
 * FormSkeleton Component
 * 
 * Loading skeleton for forms with flexible field count.
 * Matches typical form layout with labels, inputs, and action buttons.
 */
interface FormSkeletonProps {
  /**
   * Number of form fields to display
   */
  fieldCount?: number;
  /**
   * Whether to show card wrapper
   */
  showCard?: boolean;
  /**
   * Whether to show form title
   */
  showTitle?: boolean;
}

export const FormSkeleton = ({
  fieldCount = 4,
  showCard = true,
  showTitle = true,
}: FormSkeletonProps) => {
  const FormContent = () => (
    <>
      {showTitle && (
        <div className="mb-6">
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      )}
      
      <div className="space-y-6">
        {Array.from({ length: fieldCount }).map((_, index) => (
          <div key={index} className="space-y-2">
            {/* Field Label */}
            <Skeleton className="h-4 w-24" />
            {/* Field Input */}
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
      
      <div className="flex justify-end gap-3 mt-8">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </>
  );

  if (showCard) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          {showTitle && (
            <>
              <Skeleton className="h-7 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Array.from({ length: fieldCount }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <FormContent />
    </div>
  );
};
