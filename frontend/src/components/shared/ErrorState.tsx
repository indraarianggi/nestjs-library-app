import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * ErrorState Component
 * 
 * Displays an error message with optional retry action.
 * Used for failed API calls and error scenarios throughout the application.
 */
interface ErrorStateProps {
  /**
   * Error title (optional, defaults to "Something went wrong")
   */
  title?: string;
  /**
   * Error message to display
   */
  message: string;
  /**
   * Optional retry callback function
   */
  onRetry?: () => void;
  /**
   * Whether the retry action is in loading state
   */
  isRetrying?: boolean;
  /**
   * Custom retry button label
   */
  retryLabel?: string;
  /**
   * Whether to show in compact mode (smaller padding)
   */
  compact?: boolean;
}

export const ErrorState = ({
  title = 'Something went wrong',
  message,
  onRetry,
  isRetrying = false,
  retryLabel = 'Try Again',
  compact = false,
}: ErrorStateProps) => {
  return (
    <div
      className={`flex items-center justify-center ${compact ? 'py-8' : 'py-12'}`}
      role="alert"
      aria-live="polite"
    >
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="text-lg font-semibold">{title}</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="text-sm mb-4">{message}</p>
          {onRetry && (
            <Button
              onClick={onRetry}
              disabled={isRetrying}
              variant="outline"
              size="sm"
              className="bg-background hover:bg-accent"
              aria-label={isRetrying ? 'Retrying...' : retryLabel}
            >
              {isRetrying ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Retrying...
                </>
              ) : (
                retryLabel
              )}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};

/**
 * ErrorStateInline Component
 * 
 * Compact inline error state without card wrapper.
 * Useful for displaying errors within other components.
 */
interface ErrorStateInlineProps {
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const ErrorStateInline = ({
  message,
  onRetry,
  isRetrying = false,
}: ErrorStateInlineProps) => {
  return (
    <div
      className="flex items-center gap-4 p-4 rounded-md bg-destructive/10 text-destructive"
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="h-5 w-5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onRetry && (
        <Button
          onClick={onRetry}
          disabled={isRetrying}
          variant="outline"
          size="sm"
          className="flex-shrink-0"
        >
          {isRetrying ? 'Retrying...' : 'Retry'}
        </Button>
      )}
    </div>
  );
};
