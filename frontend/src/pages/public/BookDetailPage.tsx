import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  BookOpen,
  Calendar,
  Globe,
  Hash,
  ChevronRight,
  UserCircle2,
  CheckCircle,
  CircleAlert,
} from 'lucide-react';
import { useBookDetail } from '@/features/books/hooks/useBookDetail';
import { useBorrowBook } from '@/features/loans/hooks/useLoans';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ErrorState } from '@/components/shared/ErrorState';
import { DetailPageSkeleton } from '@/components/shared/skeletons/DetailPageSkeleton';

export const BookDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Fetch book details
  const { data: book, isLoading, isError, error, refetch } = useBookDetail(id);

  // Borrow book mutation
  const { mutate: borrowBook, isPending: isBorrowing } = useBorrowBook();

  // Handle borrow button click
  const handleBorrow = () => {
    if (!id) return;

    borrowBook(
      { bookId: id },
      {
        onSuccess: (data) => {
          toast.success(data.message || 'Book borrowed successfully!');
          // Redirect to member loans page
          navigate('/member/loans');
        },
        onError: (err: Error) => {
          const errorMessage = err.message || 'Failed to borrow book. Please try again.';
          toast.error(errorMessage);
        },
      },
    );
  };

  // Loading state
  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  // Error state
  if (isError || !book) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorState
          title={error?.message?.includes('404') ? 'Book Not Found' : 'Error Loading Book'}
          message={
            error?.message?.includes('404')
              ? 'The book you are looking for does not exist or has been removed.'
              : error?.message || 'Failed to load book details. Please try again.'
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // Determine borrow button state and text
  const canBorrow = isAuthenticated && user?.role === 'MEMBER' && book.availableCopies > 0;
  const isNotAvailable = book.availableCopies === 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <Link to="/books" className="hover:text-foreground transition-colors">
          Catalog
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="text-foreground font-medium line-clamp-1">{book.title}</span>
      </nav>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Book Cover */}
            <div className="md:col-span-1">
              {book.coverImageUrl ? (
                <img
                  src={book.coverImageUrl}
                  alt={`${book.title} cover`}
                  className="w-full aspect-[2/3] object-cover rounded-lg shadow-md"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to placeholder on image load error
                    e.currentTarget.src =
                      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBDb3ZlcjwvdGV4dD48L3N2Zz4=';
                  }}
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-muted rounded-lg shadow-md flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <BookOpen className="h-16 w-16 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No Cover Available</p>
                  </div>
                </div>
              )}

              {/* Availability Badge */}
              <div className="mt-4 flex items-center gap-2 justify-center text-sm">
                {book.availableCopies > 0 ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">
                      {book.availableCopies} {book.availableCopies === 1 ? 'copy' : 'copies'}{' '}
                      available
                    </span>
                  </>
                ) : (
                  <>
                    <CircleAlert className="h-4 w-4 text-red-500" />
                    <span className="text-red-500">Not available</span>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                {canBorrow && (
                  <Button
                    onClick={handleBorrow}
                    disabled={isBorrowing}
                    size="lg"
                    className="w-full"
                  >
                    {isBorrowing ? 'Borrowing...' : 'Borrow This Book'}
                  </Button>
                )}

                {!isAuthenticated && (
                  <Button onClick={() => navigate('/login')} size="lg" className="w-full">
                    Login to Borrow
                  </Button>
                )}

                {isAuthenticated && user?.role === 'ADMIN' && (
                  <Button
                    onClick={() => navigate(`/admin/books/${id}/edit`)}
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    Edit Book
                  </Button>
                )}

                {isNotAvailable && isAuthenticated && user?.role === 'MEMBER' && (
                  <div className="w-full">
                    <Button disabled size="lg" variant="secondary" className="w-full">
                      Not Available
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      All copies are currently on loan. Please check back later.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Book Details */}
            <div className="md:col-span-2 space-y-6">
              {/* Title and Subtitle */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  {book.title}
                </h1>
                {book.subtitle && <p className="text-lg text-muted-foreground">{book.subtitle}</p>}
              </div>

              {/* Authors */}
              {book.authors && book.authors.length > 0 && (
                <div className="flex items-start gap-2">
                  <UserCircle2 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {book.authors.length === 1 ? 'Author' : 'Authors'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {book.authors.map((author) => (
                        <span key={author.id} className="text-base font-medium text-foreground">
                          {author.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Categories */}
              {book.categories && book.categories.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {book.categories.map((category) => (
                      <Badge key={category.id} variant="outline">
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {book.isbn && (
                  <div className="flex items-start gap-2">
                    <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ISBN</p>
                      <p className="text-sm text-foreground">{book.isbn}</p>
                    </div>
                  </div>
                )}

                {book.publicationYear && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Publication Year</p>
                      <p className="text-sm text-foreground">{book.publicationYear}</p>
                    </div>
                  </div>
                )}

                {book.language && (
                  <div className="flex items-start gap-2">
                    <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Language</p>
                      <p className="text-sm text-foreground">{book.language}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Copies</p>
                    <p className="text-sm text-foreground">{book.totalCopies}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Description */}
              {book.description && (
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">Description</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {book.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information Card */}
      {(book.authors.some((a) => a.bio) || book.categories.some((c) => c.description)) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {book.authors
              .filter((author) => author.bio)
              .map((author) => (
                <div key={author.id}>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    About {author.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{author.bio}</p>
                </div>
              ))}

            {book.categories
              .filter((category) => category.description)
              .map((category) => (
                <div key={category.id}>
                  <h3 className="text-base font-semibold text-foreground mb-2">{category.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {category.description}
                  </p>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
