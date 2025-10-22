import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  ClipboardList,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Header } from './Header';
import { cn } from '@/lib/utils';

/**
 * Member Dashboard Layout
 * 
 * Layout component for member dashboard routes (/member/*).
 * Includes sidebar navigation and main content area.
 * Responsive with collapsible sidebar.
 */
export const MemberDashboardLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sidebarLinks = [
    { to: '/member', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/member/profile', label: 'Profile', icon: User },
    { to: '/member/loans', label: 'My Loans', icon: ClipboardList },
    { to: '/member/membership', label: 'Membership', icon: CreditCard },
  ];

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col">
      {/* Sidebar Header */}
      <div className={cn('flex items-center px-4 py-4', mobile ? 'justify-start' : 'justify-between')}>
        {(!sidebarCollapsed || mobile) && (
          <h2 className="text-lg font-semibold">Member Portal</h2>
        )}
        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-8 w-8"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      <Separator />

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2 p-4">
        {sidebarLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => mobile && setMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                  sidebarCollapsed && !mobile && 'justify-center'
                )
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {(!sidebarCollapsed || mobile) && (
                <span className="text-sm font-medium">{link.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            'hidden border-r bg-background transition-all duration-300 md:block',
            sidebarCollapsed ? 'w-16' : 'w-60'
          )}
        >
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="fixed bottom-4 left-4 z-40 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <SidebarContent mobile />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-muted/10">
          <div className="container mx-auto p-6 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
