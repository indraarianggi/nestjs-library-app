import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <div className="space-y-4 text-center">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-3xl font-semibold">Page Not Found</h2>
        <p className="text-muted-foreground max-w-md">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <div className="flex gap-4">
        <Link to="/">
          <Button variant="default">Go Home</Button>
        </Link>
        <Link to="/books">
          <Button variant="outline">Browse Catalog</Button>
        </Link>
      </div>
    </div>
  );
};
