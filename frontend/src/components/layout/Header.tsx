import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  User,
  LogOut,
  Home,
  Book,
  ClipboardList,
  LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLogout } from '@/features/auth/hooks/useAuth';
import { cn } from '@/lib/utils';

/**
 * Header Component
 * 
 * Responsive header with auth-aware navigation.
 * Shows different links based on authentication state and user role.
 */
export const Header = () => {
  const { user, memberProfile, isAuthenticated } = useAuth();
  const { logout, isLoading: isLoggingOut } = useLogout();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (memberProfile?.firstName) {
      return memberProfile.firstName.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Get display name
  const getDisplayName = () => {
    if (memberProfile?.firstName && memberProfile?.lastName) {
      return `${memberProfile.firstName} ${memberProfile.lastName}`;
    }
    return user?.email || 'User';
  };

  // Navigation links based on auth state and role
  const getNavLinks = () => {
    if (!isAuthenticated) {
      return [
        { to: '/', label: 'Home', icon: Home },
        { to: '/books', label: 'Catalog', icon: Book },
      ];
    }

    if (user?.role === 'ADMIN') {
      return [
        { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
        { to: '/books', label: 'Catalog', icon: Book },
      ];
    }

    // MEMBER role
    return [
      { to: '/books', label: 'Catalog', icon: Book },
      { to: '/member/loans', label: 'My Loans', icon: ClipboardList },
      { to: '/member/profile', label: 'Profile', icon: User },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4">
        {/* Logo/Brand */}
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <Book className="h-6 w-6" />
          <span className="font-bold text-lg hidden sm:inline-block">Library System</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:flex-1 md:items-center md:gap-6">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Right side - Auth buttons or User Menu */}
        <div className="flex flex-1 items-center justify-end gap-2">
          {!isAuthenticated ? (
            // Public: Login/Register buttons
            <>
              <Link to="/login" className="hidden sm:inline-block">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register" className="hidden sm:inline-block">
                <Button size="sm">Register</Button>
              </Link>
            </>
          ) : (
            // Authenticated: User dropdown menu
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    <div className="pt-1">
                      <Badge variant={user?.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {user?.role}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user?.role === 'MEMBER' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/member/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mobile Menu Toggle */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4 mt-8">
                {/* Mobile Navigation Links */}
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent',
                          isActive
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground'
                        )
                      }
                    >
                      <Icon className="h-5 w-5" />
                      {link.label}
                    </NavLink>
                  );
                })}

                {/* Mobile Auth Links */}
                {!isAuthenticated && (
                  <>
                    <hr className="my-2" />
                    <NavLink
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent text-muted-foreground"
                    >
                      Login
                    </NavLink>
                    <NavLink
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent text-muted-foreground"
                    >
                      Register
                    </NavLink>
                  </>
                )}

                {/* Mobile Logout Button */}
                {isAuthenticated && (
                  <>
                    <hr className="my-2" />
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      disabled={isLoggingOut}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent text-muted-foreground text-left"
                    >
                      <LogOut className="h-5 w-5" />
                      {isLoggingOut ? 'Logging out...' : 'Logout'}
                    </button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
