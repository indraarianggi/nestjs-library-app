import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

/**
 * Root Layout
 * 
 * Main layout for public pages.
 * Includes Header and Footer with content area for nested routes.
 */
export const RootLayout = () => {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
