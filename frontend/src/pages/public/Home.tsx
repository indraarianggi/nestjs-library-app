import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-4">Library Management System</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Manage your library efficiently. Browse our catalog, borrow books, and stay organized.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/books">
            <Button size="lg">Browse Catalog</Button>
          </Link>
          {!user && (
            <Link to="/register">
              <Button size="lg" variant="outline">
                Get Started
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-card border rounded-lg text-center">
            <div className="text-3xl font-bold text-primary mb-2">10,000+</div>
            <p className="text-muted-foreground">Books Available</p>
          </div>
          <div className="p-6 bg-card border rounded-lg text-center">
            <div className="text-3xl font-bold text-primary mb-2">5,000+</div>
            <p className="text-muted-foreground">Active Members</p>
          </div>
          <div className="p-6 bg-card border rounded-lg text-center">
            <div className="text-3xl font-bold text-primary mb-2">50+</div>
            <p className="text-muted-foreground">Categories</p>
          </div>
        </div>
      </div>
    </div>
  );
};
