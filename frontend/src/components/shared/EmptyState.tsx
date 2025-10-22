import { Inbox, SearchX, FileX, BookOpen, Users, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Icon type for empty state
 */
type EmptyStateIcon =
  | 'inbox'
  | 'search'
  | 'file'
  | 'book'
  | 'users'
  | 'clipboard'
  | React.ComponentType<{ className?: string }>;

/**
 * EmptyState Component
 * 
 * Displays a message when no data is available with optional action.
 * Used consistently across all list pages for better UX.
 */
interface EmptyStateProps {
  /**
   * Icon to display (preset name or custom icon component)
   */
  icon?: EmptyStateIcon;
  /**
   * Title for the empty state
   */
  title?: string;
  /**
   * Descriptive message
   */
  message: string;
  /**
   * Optional action configuration
   */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  /**
   * Whether to show in compact mode (smaller padding)
   */
  compact?: boolean;
  /**
   * Whether to show card wrapper
   */
  showCard?: boolean;
}

/**
 * Get icon component based on preset name or return custom component
 */
const getIconComponent = (icon: EmptyStateIcon) => {
  if (typeof icon === 'string') {
    const iconMap = {
      inbox: Inbox,
      search: SearchX,
      file: FileX,
      book: BookOpen,
      users: Users,
      clipboard: ClipboardList,
    };
    return iconMap[icon] || Inbox;
  }
  return icon;
};

export const EmptyState = ({
  icon = 'inbox',
  title,
  message,
  action,
  compact = false,
  showCard = true,
}: EmptyStateProps) => {
  const IconComponent = getIconComponent(icon);

  const Content = () => (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'py-8 px-4' : 'py-12 px-6'
      }`}
      role="status"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="rounded-full bg-muted p-6 mb-4">
        <IconComponent
          className="h-10 w-10 text-muted-foreground"
          aria-hidden="true"
        />
      </div>

      {/* Title */}
      {title && (
        <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
      )}

      {/* Message */}
      <p className="text-sm text-muted-foreground max-w-md mb-6">{message}</p>

      {/* Action Button */}
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || 'default'}
          aria-label={action.label}
        >
          {action.label}
        </Button>
      )}
    </div>
  );

  if (showCard) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-0">
          <Content />
        </CardContent>
      </Card>
    );
  }

  return <Content />;
};

/**
 * EmptyStateInline Component
 * 
 * Compact inline empty state without card wrapper.
 * Useful for displaying empty states within tables or lists.
 */
interface EmptyStateInlineProps {
  message: string;
  icon?: EmptyStateIcon;
}

export const EmptyStateInline = ({
  message,
  icon = 'inbox',
}: EmptyStateInlineProps) => {
  const IconComponent = getIconComponent(icon);

  return (
    <div
      className="flex flex-col items-center justify-center py-8 text-center"
      role="status"
      aria-live="polite"
    >
      <IconComponent
        className="h-8 w-8 text-muted-foreground mb-3"
        aria-hidden="true"
      />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};
