import { useState, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

/**
 * SearchBar Component Props
 */
interface SearchBarProps {
  /**
   * Current search value
   */
  value: string;
  /**
   * Callback when search value changes (debounced)
   */
  onChange: (value: string) => void;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Loading state indicator
   */
  loading?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * SearchBar Component
 *
 * Reusable search bar component with debouncing, loading state, and clear functionality.
 * Features:
 * - 300ms debounced search
 * - Search icon on the left
 * - Clear button (X icon) when input has value
 * - Loading indicator during search
 * - Keyboard support (Escape to clear)
 * - Accessible with proper ARIA labels
 * - Responsive design
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState('');
 *
 * <SearchBar
 *   value={search}
 *   onChange={setSearch}
 *   placeholder="Search books..."
 *   loading={isLoading}
 * />
 * ```
 */
export const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search...',
  loading = false,
  className,
}: SearchBarProps) => {
  // Local state for immediate input updates
  const [localValue, setLocalValue] = useState(value);

  // Debounced value with 300ms delay
  const debouncedValue = useDebounce(localValue, 300);

  // Sync external value changes with local state
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Call onChange with debounced value
  useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, value]);

  const handleClear = () => {
    setLocalValue('');
    // onChange('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className={cn('relative w-full', className)}>
      {/* Search Icon */}
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
        <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </div>

      {/* Search Input */}
      <Input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="pl-9 pr-9"
        aria-label={placeholder}
        aria-busy={loading}
        aria-live="polite"
      />

      {/* Right Side Icons (Loading or Clear) */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        {loading ? (
          <Loader2
            className="h-4 w-4 animate-spin text-muted-foreground"
            aria-label="Searching..."
          />
        ) : localValue ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="h-6 w-6 hover:bg-transparent"
            aria-label="Clear search"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
          </Button>
        ) : null}
      </div>
    </div>
  );
};
