import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';
import { NotFound } from '@/pages/NotFound';

// Layouts
import { RootLayout } from '@/components/layout/RootLayout';
import { MemberDashboardLayout } from '@/components/layout/MemberDashboardLayout';
import { AdminDashboardLayout } from '@/components/layout/AdminDashboardLayout';

// Public pages
import { Home } from '@/pages/public/Home';
import { Login } from '@/pages/public/Login';
import { Register } from '@/pages/public/Register';
import { BooksListPage } from '@/pages/public/BooksListPage';
import { BookDetailPage } from '@/pages/public/BookDetailPage';
import { About } from '@/pages/public/About';
import { Contact } from '@/pages/public/Contact';
import { Privacy } from '@/pages/public/Privacy';
import { Terms } from '@/pages/public/Terms';

// Member pages
import { MemberDashboard } from '@/pages/member/Dashboard';
import { MemberProfile } from '@/pages/member/Profile';
import { MemberLoans } from '@/pages/member/Loans';
import { MemberMembership } from '@/pages/member/Membership';

// Admin pages
import { AdminDashboard } from '@/pages/admin/Dashboard';
import { AdminBooks } from '@/pages/admin/Books';
import { BookForm } from '@/pages/admin/BookForm';
import { AdminAuthors } from '@/pages/admin/Authors';
import { AdminCategories } from '@/pages/admin/Categories';
import { AdminMembers } from '@/pages/admin/Members';
import { MemberDetail } from '@/pages/admin/MemberDetail';
import { AdminLoans } from '@/pages/admin/Loans';
import { AdminSettings } from '@/pages/admin/Settings';

export const router = createBrowserRouter([
  // Public routes with RootLayout
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: <Register />,
      },
      {
        path: 'books',
        element: <BooksListPage />,
      },
      {
        path: 'books/:id',
        element: <BookDetailPage />,
      },
      {
        path: 'about',
        element: <About />,
      },
      {
        path: 'contact',
        element: <Contact />,
      },
      {
        path: 'privacy',
        element: <Privacy />,
      },
      {
        path: 'terms',
        element: <Terms />,
      },
    ],
  },

  // Member routes (Protected) with MemberDashboardLayout
  {
    path: '/member',
    element: (
      <ProtectedRoute>
        <MemberDashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <MemberDashboard />,
      },
      {
        path: 'profile',
        element: <MemberProfile />,
      },
      {
        path: 'loans',
        element: <MemberLoans />,
      },
      {
        path: 'membership',
        element: <MemberMembership />,
      },
    ],
  },

  // Admin routes (Protected) with AdminDashboardLayout
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminDashboardLayout />
      </AdminRoute>
    ),
    children: [
      {
        index: true,
        element: <AdminDashboard />,
      },
      {
        path: 'books',
        element: <AdminBooks />,
      },
      {
        path: 'books/new',
        element: <BookForm />,
      },
      {
        path: 'books/:id/edit',
        element: <BookForm />,
      },
      {
        path: 'authors',
        element: <AdminAuthors />,
      },
      {
        path: 'categories',
        element: <AdminCategories />,
      },
      {
        path: 'members',
        element: <AdminMembers />,
      },
      {
        path: 'members/:id',
        element: <MemberDetail />,
      },
      {
        path: 'loans',
        element: <AdminLoans />,
      },
      {
        path: 'settings',
        element: <AdminSettings />,
      },
    ],
  },

  // 404 route
  {
    path: '*',
    element: <NotFound />,
  },
]);
