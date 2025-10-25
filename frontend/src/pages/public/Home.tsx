import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useBooksStats } from '@/features/books/hooks/useBooks';
import { useFeaturedBooks } from '@/features/books/hooks/useFeaturedBooks';
import { useCategoriesStats } from '@/features/categories/hooks/useCategories';
import { BookOpen, Users, Grid3x3, ArrowRight, Library, Search } from 'lucide-react';
import { BookCard } from '@/components/books/BookCard';
import { BookCardSkeleton } from '@/components/shared/skeletons';

/**
 * Home Page Component
 *
 * Landing page with hero section, stats, featured books, and CTAs.
 * Implements requirements from FE-3.1: Home Page
 */
export const Home = () => {
  const { user } = useAuth();

  // Fetch stats - total books
  const { data: booksData, isLoading: booksLoading } = useBooksStats();

  // Fetch stats - total categories
  const { data: categoriesData, isLoading: categoriesLoading } = useCategoriesStats();

  // Fetch featured books (first 6 available books)
  const { data: featuredBooksData, isLoading: featuredLoading } = useFeaturedBooks(6);

  const stats = {
    books: booksData?.total ?? 0,
    categories: categoriesData?.total ?? 0,
    members: 1000, // Placeholder - members endpoint is admin only. TODO: create public endpoint to fetch number of members
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-primary/10 to-background py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-2 text-sm backdrop-blur-sm">
              <Library className="h-4 w-4 text-primary" />
              <span className="font-medium">Welcome to Your Digital Library</span>
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Discover Your Next
              <span className="text-primary"> Great Read</span>
            </h1>
            <p className="mb-10 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
              Access thousands of books from our extensive collection. Browse, borrow, and manage
              your reading journey all in one place. Join our community of readers today.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link to="/books">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  <Search className="h-5 w-5" />
                  Browse Catalog
                </Button>
              </Link>
              {!user && (
                <Link to="/register">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                    <Users className="h-5 w-5" />
                    Register Now
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
        {/* Decorative background elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl opacity-20">
            <div className="aspect-square w-[40rem] rounded-full bg-gradient-to-r from-primary to-primary/50" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Total Books */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="mb-2 flex justify-center">
                  <div className="rounded-full bg-primary/10 p-3">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                </div>
                {booksLoading ? (
                  <Skeleton className="h-10 w-24 mx-auto mb-2" />
                ) : (
                  <div className="text-4xl font-bold text-primary mb-2">
                    {stats.books.toLocaleString()}+
                  </div>
                )}
                <p className="text-sm font-medium text-muted-foreground">Books Available</p>
              </CardContent>
            </Card>

            {/* Total Categories */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="mb-2 flex justify-center">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Grid3x3 className="h-8 w-8 text-primary" />
                  </div>
                </div>
                {categoriesLoading ? (
                  <Skeleton className="h-10 w-24 mx-auto mb-2" />
                ) : (
                  <div className="text-4xl font-bold text-primary mb-2">
                    {stats.categories.toLocaleString()}+
                  </div>
                )}
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
              </CardContent>
            </Card>

            {/* Active Members */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="mb-2 flex justify-center">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-primary mb-2">
                  {stats.members.toLocaleString()}+
                </div>
                <p className="text-sm font-medium text-muted-foreground">Active Members</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Books Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">Featured Books</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore our latest additions and popular titles from various genres
            </p>
          </div>

          {featuredLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <BookCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredBooksData?.items.map((book) => (
                <BookCard key={book.id} book={book} showBtn={false} />
              ))}
            </div>
          )}

          {/* View All Button */}
          <div className="mt-10 text-center">
            <Link to="/books">
              <Button size="lg" variant="outline" className="gap-2">
                View All Books
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="py-12 md:py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
            <CardContent className="p-8 md:p-12">
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                  Ready to Start Your Reading Journey?
                </h2>
                <p className="mb-8 text-lg text-muted-foreground">
                  {user
                    ? 'Explore our extensive catalog and borrow your next favorite book today.'
                    : 'Join thousands of readers and get instant access to our complete catalog. Registration is quick, free, and easy.'}
                </p>
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                  <Link to="/books">
                    <Button size="lg" className="w-full sm:w-auto gap-2">
                      <Search className="h-5 w-5" />
                      Explore Catalog
                    </Button>
                  </Link>
                  {!user && (
                    <Link to="/register">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                        Get Started Free
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};
