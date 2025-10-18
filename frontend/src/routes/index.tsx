import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';
import { NotFound } from '@/pages/NotFound';

// Public pages
import { Home } from '@/pages/public/Home';
import { Login } from '@/pages/public/Login';
import { Register } from '@/pages/public/Register';
import { BooksListPage } from '@/pages/public/BooksListPage';
import { BookDetailPage } from '@/pages/public/BookDetailPage';

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
  // Public routes
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/books',
    element: <BooksListPage />,
  },
  {
    path: '/books/:id',
    element: <BookDetailPage />,
  },

  // Member routes (Protected)
  {
    path: '/member',
    element: (
      <ProtectedRoute>
        <MemberDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/member/profile',
    element: (
      <ProtectedRoute>
        <MemberProfile />
      </ProtectedRoute>
    ),
  },
  {
    path: '/member/loans',
    element: (
      <ProtectedRoute>
        <MemberLoans />
      </ProtectedRoute>
    ),
  },
  {
    path: '/member/membership',
    element: (
      <ProtectedRoute>
        <MemberMembership />
      </ProtectedRoute>
    ),
  },

  // Admin routes (Protected)
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminDashboard />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/books',
    element: (
      <AdminRoute>
        <AdminBooks />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/books/new',
    element: (
      <AdminRoute>
        <BookForm />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/books/:id/edit',
    element: (
      <AdminRoute>
        <BookForm />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/authors',
    element: (
      <AdminRoute>
        <AdminAuthors />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/categories',
    element: (
      <AdminRoute>
        <AdminCategories />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/members',
    element: (
      <AdminRoute>
        <AdminMembers />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/members/:id',
    element: (
      <AdminRoute>
        <MemberDetail />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/loans',
    element: (
      <AdminRoute>
        <AdminLoans />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/settings',
    element: (
      <AdminRoute>
        <AdminSettings />
      </AdminRoute>
    ),
  },

  // 404 route
  {
    path: '*',
    element: <NotFound />,
  },
]);
