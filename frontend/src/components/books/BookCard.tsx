import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle, CircleAlert } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Book } from '@/types/entities.types';

interface BookCardProps {
  book: Book;
  showBtn?: boolean;
}

/**
 * BookCard Component
 *
 * Displays a book in the catalog grid with cover, title, authors, categories,
 * availability status, and a "View Details" button.
 *
 * Features:
 * - Cover image or placeholder
 * - Title (with subtitle if available)
 * - Authors (comma-separated)
 * - Categories as badges
 * - Available copies indicator
 * - "View Details" button linking to /books/:id
 * - Responsive design
 */
export const BookCard = ({ book, showBtn = true }: BookCardProps) => {
  const { id, title, coverImageUrl, authors, categories, availableCopies } = book;

  // Format authors as comma-separated string
  const authorsText = authors.map((author) => author.name).join(', ');

  return (
    <Card className="h-full flex flex-col hover:shadow-lg hover:border-primary/50 transition-all duration-200 group">
      <CardHeader className="p-4 pb-3">
        {/* Book Cover Image or Placeholder */}
        <Link
          to={`/books/${id}`}
          className="mb-4 aspect-[3/4] overflow-hidden rounded-lg bg-muted flex items-center justify-center"
        >
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt={`${title} cover`}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <BookOpen className="h-16 w-16 text-muted-foreground/50" aria-hidden="true" />
          )}
        </Link>

        {/* Book Title */}
        <Link to={`/books/${id}`} className="hover:underline group-hover:text-primary">
          <h3 className="font-semibold text-base line-clamp-2 leading-tight">{title}</h3>
        </Link>
      </CardHeader>

      <CardContent className="flex-1 p-4 pt-0">
        {/* Authors */}
        {authors.length > 0 && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-1" title={authorsText}>
            {authorsText}
          </p>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-3">
            {categories.slice(0, 3).map((category) => (
              <Badge key={category.id} variant="secondary" className="text-xs">
                {category.name}
              </Badge>
            ))}
            {categories.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{categories.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Available Copies Indicator */}
        <div className="flex items-center gap-2 text-sm">
          {availableCopies > 0 ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">
                {availableCopies} {availableCopies === 1 ? 'copy' : 'copies'} available
              </span>
            </>
          ) : (
            <>
              <CircleAlert className="h-4 w-4 text-red-500" />
              <span className="text-red-500 font-medium">Not available</span>
            </>
          )}
        </div>
      </CardContent>

      {showBtn ? (
        <CardFooter className="p-4 pt-0 flex flex-col gap-2">
          {/* View Details Button */}
          <Button asChild className="w-full" variant={availableCopies > 0 ? 'default' : 'outline'}>
            <Link to={`/books/${id}`}>View Details</Link>
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
};
