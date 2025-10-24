# Frontend Development Tasks - Library Management System

## Overview
This document outlines all frontend development tasks for the Library Management System using React, Vite, TypeScript, Tailwind CSS, and shadcn/ui. Tasks are organized by feature area and prioritized to enable parallel development with the backend team.

**Tech Stack:**
- React 18.x + TypeScript 5.x
- Vite 5.x (build tool)
- Tailwind CSS 4.x + shadcn/ui (UI components)
- Zustand (global state management)
- React Query (server state management)
- React Router v6 (routing)
- Axios (HTTP client)
- Zod (validation)
- Vitest + React Testing Library (unit tests)
- Playwright (E2E tests)

---

## Phase 1: Foundation & Setup (Week 1)

### TASK FE-1.1: Project Setup and Configuration ✅
**Priority:** HIGH | **Estimated Time:** 4 hours | **Dependencies:** None | **Status:** COMPLETED

**Description:**
Initialize React + Vite project with TypeScript, configure tooling, and set up project structure.

**Acceptance Criteria:**
- [x] Vite project initialized with React + TypeScript template
- [x] TypeScript 5.x configured with strict mode
- [x] ESLint and Prettier configured with React rules
- [x] Path aliases configured (@/ for src/)
- [x] Package.json scripts: dev, build, preview, lint, test
- [x] Git repository initialized with .gitignore
- [x] README.md with setup instructions
- [x] Environment variables setup (.env.example)

**Environment Variables:**
```
VITE_API_URL=http://localhost:3000/api
VITE_SENTRY_DSN=
```

**Definition of Done:**
- ✅ Project runs successfully with `pnpm run dev`
- ✅ Hot module replacement works
- ✅ All linting rules pass

---

### TASK FE-1.2: Tailwind CSS 3.x + shadcn/ui Setup ✅
**Priority:** HIGH | **Estimated Time:** 4 hours | **Dependencies:** FE-1.1 | **Status:** COMPLETED

**Description:**
Configure Tailwind CSS 3.x and initialize shadcn/ui component library.

**Acceptance Criteria:**
- [x] Tailwind CSS 3.x installed with PostCSS
- [x] Tailwind configuration in tailwind.config.ts
- [x] CSS directives in index.css (@tailwind base, components, utilities)
- [x] shadcn/ui dependencies installed (class-variance-authority, lucide-react, tailwind-merge)
- [x] Component library folder structure: src/components/ui/
- [x] Theme configured (light/dark mode support via ThemeProvider)
- [x] CSS variables for theming defined in index.css
- [x] Global styles configured
- [x] Font family imported (Inter from Google Fonts)
- [x] cn() utility function created in @/lib/utils.ts
- [x] components.json configured for shadcn/ui
- [x] Button component created as example

**Note:** Using Tailwind CSS 3.x for better compatibility with shadcn/ui. Theme switching implemented via ThemeProvider with class-based dark mode.

**Definition of Done:**
- ✅ Tailwind utility classes work
- ✅ shadcn/ui components can be installed
- ✅ Theme variables accessible
- ✅ Dark mode toggle ready
- ✅ Build succeeds without errors

---

### TASK FE-1.3: Install Core shadcn/ui Components ✅
**Priority:** HIGH | **Estimated Time:** 3 hours | **Dependencies:** FE-1.2 | **Status:** COMPLETED

**Description:**
Install essential shadcn/ui components needed across the application.

**Components to Install:**
- [x] Button
- [x] Input
- [x] Label
- [x] Card
- [x] Table
- [x] Dialog (Modal)
- [x] Form
- [x] Select
- [x] Dropdown Menu
- [x] Pagination
- [x] Badge
- [x] Alert
- [x] Toast/Sonner (notifications)
- [x] Skeleton (loading states)
- [x] Avatar
- [x] Tabs
- [x] Separator
- [x] Checkbox
- [x] Textarea

**Acceptance Criteria:**
- [x] All components installed via shadcn CLI
- [x] Components accessible in src/components/ui/
- [x] Components properly typed with TypeScript
- [x] Basic component demos work
- [x] Additional dependencies installed (sonner, @radix-ui/react-icons)

**Definition of Done:**
- ✅ All listed components installed (19 total)
- ✅ Components can be imported and used
- ✅ No TypeScript errors
- ✅ Lint passes
- ✅ Build succeeds

---

### TASK FE-1.4: Axios HTTP Client Configuration ✅
**Priority:** HIGH | **Estimated Time:** 3 hours | **Dependencies:** FE-1.1 | **Status:** COMPLETED

**Description:**
Set up Axios instance with interceptors for API communication.

**Acceptance Criteria:**
- [x] Axios installed (v1.12.2)
- [x] API client configured in src/lib/api/axios.ts
- [x] Base URL from environment variable (VITE_API_URL)
- [x] withCredentials: true (for session cookies)
- [x] Request interceptor (add headers, logging in dev mode)
- [x] Response interceptor (error handling, status code handling)
- [x] 401 responses redirect to login (with path checks)
- [x] Console logging for errors (Sentry integration ready)
- [x] API endpoints defined in src/lib/api/endpoints.ts
- [x] API types defined in src/types/api.types.ts
- [x] Centralized exports in src/lib/api/index.ts

**Files Created:**
- ✅ src/lib/api/axios.ts - HTTP client with interceptors
- ✅ src/lib/api/endpoints.ts - All API endpoint constants
- ✅ src/types/api.types.ts - Common API response types
- ✅ src/lib/api/index.ts - Centralized exports

**Definition of Done:**
- ✅ API client ready for use
- ✅ Error handling works (401, 403, 404, 500+)
- ✅ Session cookies sent automatically
- ✅ All endpoints defined and typed
- ✅ TypeScript types for requests/responses
- ✅ Build succeeds

---

### TASK FE-1.5: React Router Configuration ✅
**Priority:** HIGH | **Estimated Time:** 4 hours | **Dependencies:** FE-1.1 | **Status:** COMPLETED

**Description:**
Set up React Router v6 with route structure and protected routes.

**Routes Structure:**
```
Public Routes:
- / (Home)
- /login
- /register
- /books (Catalog)
- /books/:id (Book Detail)

Member Routes (Protected):
- /member (Dashboard)
- /member/profile
- /member/loans
- /member/membership

Admin Routes (Protected):
- /admin (Dashboard)
- /admin/books
- /admin/books/new
- /admin/books/:id/edit
- /admin/authors
- /admin/categories
- /admin/members
- /admin/members/:id
- /admin/loans
- /admin/settings
```

**Acceptance Criteria:**
- [x] React Router v6 installed (v7.9.4)
- [x] RouterProvider configured in App.tsx
- [x] Routes defined in src/routes/index.tsx
- [x] ProtectedRoute component for auth check
- [x] AdminRoute component for admin-only routes
- [x] 404 Not Found page
- [x] All routes created with placeholder pages
- [x] Navigation between routes works

**Technical Details:**
```typescript
// src/routes/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
};

// src/routes/AdminRoute.tsx
export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />;
  
  return <>{children}</>;
};
```

**Definition of Done:**
- All routes accessible
- Protected routes redirect to login
- Admin routes check role
- Clean URLs (no hash)

---

### TASK FE-1.6: React Query Setup ✅
**Priority:** HIGH | **Estimated Time:** 3 hours | **Dependencies:** FE-1.4 | **Status:** COMPLETED

**Description:**
Configure React Query (TanStack Query) for server state management.

**Acceptance Criteria:**
- [x] @tanstack/react-query installed (v5.90.5)
- [x] QueryClient configured in src/lib/react-query.ts
- [x] QueryClientProvider in main.tsx
- [x] React Query DevTools configured (development only, v5.90.2)
- [x] Default options configured:
  - staleTime: 5 minutes ✅
  - gcTime: 10 minutes (formerly cacheTime) ✅
  - refetchOnWindowFocus: false ✅
  - retry: 1 ✅
- [x] Ready for use in API hooks

**Technical Details:**
```typescript
// src/lib/react-query.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// src/main.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  {import.meta.env.DEV && <ReactQueryDevtools />}
</QueryClientProvider>
```

**Definition of Done:**
- React Query ready for use
- DevTools accessible in development
- Default config applied

---

### TASK FE-1.7: Zustand Store for Auth State ✅
**Priority:** HIGH | **Estimated Time:** 3 hours | **Dependencies:** FE-1.4 | **Status:** COMPLETED

**Description:**
Set up Zustand store for global authentication state management.

**Acceptance Criteria:**
- [x] Zustand installed (v5.0.8)
- [x] Auth store created in src/features/auth/store/authStore.ts
- [x] Store holds: user, isAuthenticated, isLoading, error
- [x] Actions: setUser, clearUser, setLoading, setError
- [x] TypeScript types defined in src/types/auth.types.ts
- [x] Store ready for use with useAuth hook

**Technical Details:**
```typescript
// src/features/auth/store/authStore.ts
import { create } from 'zustand';
import { User } from '@/types/auth.types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  clearUser: () => set({ user: null, isAuthenticated: false, isLoading: false }),
}));
```

**Definition of Done:**
- Auth store works across components
- State updates trigger re-renders
- TypeScript types correct

---

### TASK FE-1.8: Zod Validation Schemas ✅
**Priority:** MEDIUM | **Estimated Time:** 4 hours | **Dependencies:** FE-1.1 | **Status:** COMPLETED

**Description:**
Create Zod schemas for form validation matching backend DTOs.

**Schemas to Create:**
- [x] Auth schemas (login, register) - src/schemas/auth.schema.ts
- [x] Book schemas (create, update, filter) - src/schemas/book.schema.ts
- [x] Author schemas (create, update) - src/schemas/author.schema.ts
- [x] Category schemas (create, update) - src/schemas/category.schema.ts
- [x] Loan schemas (create) - src/schemas/loan.schema.ts
- [x] Member schemas (update) - src/schemas/member.schema.ts
- [x] Settings schema (update) - src/schemas/settings.schema.ts

**Example:**
```typescript
// src/schemas/auth.schema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
```

**Acceptance Criteria:**
- [x] All schemas match backend DTOs
- [x] Validation messages user-friendly
- [x] TypeScript types inferred from schemas
- [x] Reusable across forms

**Definition of Done:**
- ✅ All schemas created
- ✅ Types exported
- ✅ Validation works in forms
- ✅ Build and lint pass successfully

---

## Phase 2: Authentication & Layout (Week 1-2)

### TASK FE-2.1: Login Page ✅
**Priority:** HIGH | **Estimated Time:** 6 hours | **Dependencies:** FE-1.3, FE-1.8 | **Status:** COMPLETED

**Description:**
Create login page with email/password form and session handling.

**Page:** `/login`

**Acceptance Criteria:**
- [x] LoginForm component with email and password fields
- [x] Form validation using Zod schema
- [x] Submit calls POST /api/auth/login
- [x] On success, save user to auth store and redirect to dashboard
- [x] On error, show error message (toast or alert)
- [x] Loading state during submission
- [x] Link to registration page
- [x] "Forgot password?" link (placeholder)
- [x] Responsive design (mobile-friendly)

**Technical Details:**
```typescript
// src/pages/public/Login.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@/schemas/auth.schema';
import { useLogin } from '@/features/auth/hooks/useAuth';

export const Login = () => {
  const { mutate: login, isLoading, error } = useLogin();
  
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });
  
  const onSubmit = (data: LoginInput) => {
    login(data);
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Form fields */}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
```

**Definition of Done:**
- Login form works end-to-end
- Validation displays errors
- Successful login redirects correctly
- Error handling works

---

### TASK FE-2.2: Registration Page ✅
**Priority:** HIGH | **Estimated Time:** 6 hours | **Dependencies:** FE-1.3, FE-1.8 | **Status:** COMPLETED

**Description:**
Create registration page with member profile fields.

**Page:** `/register`

**Acceptance Criteria:**
- [x] RegisterForm with fields: email, password, firstName, lastName, phone (optional), address (optional)
- [x] Form validation using Zod schema
- [x] Password strength indicator (password hint displayed)
- [x] Submit calls POST /api/auth/register
- [x] On success, save user and redirect to member dashboard
- [x] On error (e.g., email exists), show error message
- [x] Loading state during submission
- [x] Link to login page
- [x] Terms of service checkbox (optional for MVP)
- [x] Responsive design

**Definition of Done:**
- Registration form works end-to-end
- Validation displays errors
- Successful registration logs user in
- Error handling for duplicate emails

---

### TASK FE-2.3: Auth Hooks (useAuth, useLogin, useRegister, useLogout, useRefreshToken) ✅
**Priority:** HIGH | **Estimated Time:** 5 hours | **Dependencies:** FE-1.6, FE-1.7 | **Status:** COMPLETED

**Description:**
Create custom React hooks for JWT-based authentication operations using React Query.

**Hooks to Create:**
- [x] useAuth - Get current user from stored JWT token
- [x] useLogin - Login mutation with JWT token storage
- [x] useRegister - Register mutation with JWT token storage
- [x] useLogout - Logout mutation with token cleanup
- [x] useRefreshToken - Refresh access token using refresh token

**Acceptance Criteria:**
- [x] useAuth hook decodes JWT from localStorage and validates
- [x] useLogin hook calls login API, stores tokens, and updates auth store
- [x] useRegister hook calls register API, stores tokens, and updates auth store
- [x] useLogout hook calls logout API, clears tokens from storage, and clears auth store
- [x] useRefreshToken hook exchanges refresh token for new access/refresh tokens
- [x] All hooks handle loading and error states
- [x] Token storage in localStorage (accessToken, refreshToken)
- [x] Axios interceptor automatically includes access token in Authorization header
- [x] Axios interceptor refreshes expired access token automatically
- [x] Auth state synced with token validity

**Technical Details:**
```typescript
// src/features/auth/hooks/useAuth.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import apiClient from '@/lib/api/axios';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { jwtDecode } from 'jwt-decode';

export const useAuth = () => {
  const { user, setUser, clearUser } = useAuthStore();
  
  // Check token on mount
  useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        clearUser();
        return null;
      }
      
      try {
        // Decode and validate token
        const decoded = jwtDecode(accessToken);
        const isExpired = decoded.exp * 1000 < Date.now();
        
        if (isExpired) {
          // Try refresh
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const { data } = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken });
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            const newDecoded = jwtDecode(data.accessToken);
            setUser({ id: newDecoded.sub, email: newDecoded.email, role: newDecoded.role });
            return newDecoded;
          }
          clearUser();
          return null;
        }
        
        setUser({ id: decoded.sub, email: decoded.email, role: decoded.role });
        return decoded;
      } catch (error) {
        clearUser();
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return null;
      }
    },
    staleTime: Infinity,
    retry: false,
  });
  
  return { user, isAuthenticated: !!user };
};

export const useLogin = () => {
  const { setUser } = useAuthStore();
  
  return useMutation({
    mutationFn: async (credentials: LoginInput) => {
      const { data } = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      return data;
    },
    onSuccess: (data) => {
      // Store tokens in localStorage
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Update auth store
      setUser(data.user);
      
      // Redirect based on role
      window.location.href = data.user.role === 'ADMIN' ? '/admin' : '/member';
    },
  });
};

export const useRegister = () => {
  const { setUser } = useAuthStore();
  
  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const { data } = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, input);
      return data;
    },
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setUser(data.user);
      window.location.href = '/member';
    },
  });
};

export const useLogout = () => {
  const { clearUser } = useAuthStore();
  
  return useMutation({
    mutationFn: async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
    },
    onSuccess: () => {
      // Clear tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Clear auth store
      clearUser();
      
      // Redirect to login
      window.location.href = '/login';
    },
    onError: () => {
      // Even if logout fails, clear local state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      clearUser();
      window.location.href = '/login';
    },
  });
};

export const useRefreshToken = () => {
  return useMutation({
    mutationFn: async (refreshToken: string) => {
      const { data } = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken });
      return data;
    },
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
    },
  });
};
```

**Axios Interceptor for Token Management:**
```typescript
// src/lib/api/axios.ts (add to existing file)

// Request interceptor - add access token
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - refresh token on 401
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        processQueue(new Error('No refresh token'), null);
        isRefreshing = false;
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        apiClient.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        
        processQueue(null, data.accessToken);
        isRefreshing = false;
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

**Definition of Done:**
- All auth hooks working
- JWT tokens stored and managed correctly
- Automatic token refresh on expiry
- Logout clears all tokens and cached data
- Auth state persists across page reloads via token validation

---

### TASK FE-2.4: Header Component (Public & Authenticated) ✅
**Priority:** MEDIUM | **Estimated Time:** 5 hours | **Dependencies:** FE-2.3 | **Status:** COMPLETED

**Description:**
Create responsive header with navigation, search, and user menu.

**Features:**
- Logo/brand name (left)
- Navigation links:
  - Public: Home, Catalog, Login, Register
  - Authenticated Member: Catalog, My Loans, Profile, Logout
  - Authenticated Admin: Admin Dashboard, Catalog, Logout
- User avatar/dropdown menu (when logged in)
- Mobile menu toggle (hamburger)
- Responsive design

**Acceptance Criteria:**
- [x] Header component in src/components/layout/Header.tsx
- [x] Shows different links based on auth state
- [x] User dropdown with name, role, profile, logout
- [x] Mobile-responsive with hamburger menu
- [x] Active link highlighting
- [x] Smooth dropdown animations
- [x] Works with React Router links

**Definition of Done:**
- Header displays correctly for all auth states
- Navigation works on desktop and mobile
- User dropdown works

---

### TASK FE-2.5: Footer Component ✅
**Priority:** LOW | **Estimated Time:** 2 hours | **Dependencies:** FE-1.2 | **Status:** COMPLETED

**Description:**
Create footer with links and copyright information.

**Features:**
- Copyright notice
- Links: About, Contact, Privacy, Terms
- Social media icons (placeholder)
- Responsive design

**Acceptance Criteria:**
- [x] Footer component in src/components/layout/Footer.tsx
- [x] Displays on all pages
- [x] Links styled and accessible
- [x] Responsive layout

**Definition of Done:**
- Footer displays on all pages
- Links work
- Looks professional

---

### TASK FE-2.6: Dashboard Layouts (Member & Admin) ✅
**Priority:** MEDIUM | **Estimated Time:** 5 hours | **Dependencies:** FE-2.4 | **Status:** COMPLETED

**Description:**
Create layout components for member and admin dashboards with sidebar navigation.

**Layouts:**
1. **MemberDashboardLayout** - For /member/* routes
2. **AdminDashboardLayout** - For /admin/* routes

**Features:**
- Sidebar navigation with icons
- Main content area
- Breadcrumbs (optional)
- Mobile-responsive (collapsible sidebar)

**Acceptance Criteria:**
- [x] MemberDashboardLayout in src/components/layout/MemberDashboardLayout.tsx
  - Sidebar links: Dashboard, Profile, Loans, Membership
- [x] AdminDashboardLayout in src/components/layout/AdminDashboardLayout.tsx
  - Sidebar links: Dashboard, Books, Authors, Categories, Members, Loans, Settings
- [x] Sidebar icons from lucide-react
- [x] Active link highlighting
- [x] Collapsible sidebar on mobile
- [x] Smooth transitions

**Definition of Done:**
- Both layouts render correctly
- Sidebar navigation works
- Responsive on mobile

---

## Phase 3: Public Catalog (Week 2-3)

### TASK FE-3.1: Home Page ✅
**Priority:** MEDIUM | **Estimated Time:** 4 hours | **Dependencies:** FE-2.4, FE-2.5 | **Status:** COMPLETED

**Description:**
Create landing page with hero section and featured books.

**Page:** `/`

**Features:**
- Hero section with CTA (Browse Catalog, Login/Register)
- Featured books carousel (optional)
- Quick stats (Total books, Categories, Active members)
- Call-to-action to browse catalog

**Acceptance Criteria:**
- [x] Hero section with engaging copy
- [x] CTA buttons link to /books and /register
- [x] Optional: Display 5-10 featured books (implemented: 6 books grid)
- [x] Responsive design (mobile, tablet, desktop)
- [x] Fast loading (< 2s) with skeleton loading states

**Implementation Details:**
- ✅ Enhanced hero section with gradient background, decorative elements, and compelling copy
- ✅ Dynamic stats section fetching real data from API (books count, categories count)
- ✅ Featured books section displaying latest 6 books with cover images, authors, categories, and availability
- ✅ Additional CTA section at the bottom encouraging user registration and catalog browsing
- ✅ Responsive design using Tailwind breakpoints (sm:, md:, lg:)
- ✅ Loading states with Skeleton components for all async data
- ✅ Accessibility: proper ARIA labels, semantic HTML, keyboard navigation
- ✅ Image lazy loading for performance optimization
- ✅ Icons from lucide-react for visual enhancement

**Definition of Done:**
- ✅ Home page looks professional and engaging
- ✅ All links work correctly (routing to /books and /register)
- ✅ Responsive on all devices (mobile, tablet, desktop)
- ✅ Build succeeds with no errors
- ✅ Performance optimized with lazy loading

---

### TASK FE-3.2: Books Catalog Page - List and Search
**Priority:** HIGH | **Estimated Time:** 10 hours | **Dependencies:** FE-1.6, FE-2.4

**Description:**
Create catalog page with search, filters, sorting, and pagination.

**Page:** `/books`

**Features:**
- Search bar (by title or author)
- Filters:
  - Category (dropdown/multi-select)
  - Author (dropdown/multi-select)
  - Availability (checkbox: "Available only")
- Sorting: Relevance, Title (A-Z, Z-A), Newest
- Pagination (20 books per page)
- Book cards with:
  - Cover image (or placeholder)
  - Title, authors
  - Categories (badges)
  - Available copies indicator
  - "View Details" button

**Acceptance Criteria:**
- [ ] useBooks hook fetches books from GET /api/books
- [ ] Search query updates URL params (e.g., ?q=harry)
- [ ] Filters update URL params and trigger refetch
- [ ] Sorting updates URL params
- [ ] Pagination works (prev/next, page numbers)
- [ ] Loading state (skeleton cards)
- [ ] Empty state ("No books found")
- [ ] Error handling (toast notification)
- [ ] Responsive grid (1-2-3-4 columns based on screen size)

**Technical Details:**
```typescript
// src/features/books/hooks/useBooks.ts
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/axios';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export const useBooks = (filters: BookFilters) => {
  return useQuery({
    queryKey: ['books', filters],
    queryFn: async () => {
      const { data } = await apiClient.get(API_ENDPOINTS.BOOKS.LIST, {
        params: filters,
      });
      return data;
    },
  });
};
```

**Definition of Done:**
- Catalog page fully functional
- Search and filters work
- Performance is acceptable
- UI is intuitive

---

### TASK FE-3.3: Book Detail Page
**Priority:** HIGH | **Estimated Time:** 6 hours | **Dependencies:** FE-3.2

**Description:**
Create book detail page with full information and borrow action.

**Page:** `/books/:id`

**Features:**
- Book cover image (large)
- Title, subtitle
- Authors (linked, future)
- Categories (badges)
- Description
- Publication year, language, ISBN
- Available copies indicator
- "Borrow" button (if logged in and available)
- "Login to Borrow" button (if not logged in)
- "Not Available" indicator (if no copies)

**Acceptance Criteria:**
- [ ] useBookDetail hook fetches book from GET /api/books/:id
- [ ] All book information displayed
- [ ] Borrow button visible only if:
  - User is authenticated
  - User is MEMBER (not ADMIN)
  - Book has availableCopies > 0
- [ ] Borrow button calls POST /api/loans
- [ ] On successful borrow, show success toast and redirect to /member/loans
- [ ] Loading state (skeleton)
- [ ] Error handling (404 Not Found)
- [ ] Responsive layout

**Definition of Done:**
- Book details displayed correctly
- Borrow action works for eligible members
- Proper guards and error handling

---

### TASK FE-3.4: SearchBar Component (Reusable)
**Priority:** MEDIUM | **Estimated Time:** 3 hours | **Dependencies:** FE-1.3

**Description:**
Create reusable search bar component with debouncing.

**Features:**
- Search input with icon
- Debounced search (300ms delay)
- Clear button (X icon)
- Loading indicator during search
- Accessible (aria-labels)

**Acceptance Criteria:**
- [ ] SearchBar component in src/components/shared/SearchBar.tsx
- [ ] Accepts value, onChange, placeholder props
- [ ] Debounced onChange using useDebounce hook
- [ ] Visual feedback on focus
- [ ] Clear button clears input
- [ ] Responsive design

**Definition of Done:**
- SearchBar reusable across pages
- Debouncing works
- Accessible

---

### TASK FE-3.5: Pagination Component (Reusable)
**Priority:** MEDIUM | **Estimated Time:** 3 hours | **Dependencies:** FE-1.3

**Description:**
Create reusable pagination component for list pages.

**Features:**
- Previous/Next buttons
- Page numbers (with ellipsis for many pages)
- Current page highlighted
- Jump to first/last page buttons
- Disabled states

**Acceptance Criteria:**
- [ ] Pagination component in src/components/shared/Pagination.tsx
- [ ] Accepts: currentPage, totalPages, onPageChange props
- [ ] Shows max 7 page numbers with ellipsis
- [ ] Previous/Next buttons work
- [ ] Jump to first/last works
- [ ] Accessible (aria-labels)
- [ ] Responsive design

**Definition of Done:**
- Pagination reusable
- All navigation works
- Accessible

---

## Phase 4: Member Dashboard (Week 3-4)

### TASK FE-4.1: Member Dashboard Home
**Priority:** MEDIUM | **Estimated Time:** 5 hours | **Dependencies:** FE-2.6

**Description:**
Create member dashboard home page with overview and quick stats.

**Page:** `/member`

**Features:**
- Welcome message with member name
- Stats cards:
  - Active loans count
  - Overdue loans count (if any)
  - Total loans count
- Quick actions:
  - Browse Catalog
  - View My Loans
- Upcoming due dates list (next 3 loans)

**Acceptance Criteria:**
- [ ] useMyLoans hook fetches active loans
- [ ] Stats calculated from loans data
- [ ] Quick action buttons link to relevant pages
- [ ] Upcoming due dates sorted by dueDate
- [ ] Overdue loans highlighted in red
- [ ] Loading state (skeleton)
- [ ] Responsive design

**Definition of Done:**
- Dashboard provides useful overview
- Stats are accurate
- Links work

---

### TASK FE-4.2: My Loans Page (Active & History)
**Priority:** HIGH | **Estimated Time:** 8 hours | **Dependencies:** FE-2.6

**Description:**
Create page for members to view and manage their loans.

**Page:** `/member/loans`

**Features:**
- Tabs: Active Loans, Loan History
- Active Loans table:
  - Book title, cover
  - Borrowed date
  - Due date (highlighted if soon/overdue)
  - Renewal status (can renew?, renewals used)
  - Actions: Renew button, Return button (if self-return enabled)
- Loan History table:
  - Book title
  - Borrowed date, Returned date
  - Penalty (if any)
- Filter by status (optional)
- Pagination

**Acceptance Criteria:**
- [ ] useMyLoans hook fetches loans from GET /api/my/loans
- [ ] Tabs switch between active and history
- [ ] Renew button visible if eligible
- [ ] Renew button calls POST /api/loans/:id/renew
- [ ] Success/error toasts for actions
- [ ] Overdue loans highlighted
- [ ] Due soon (3 days) indicator
- [ ] Loading and error states
- [ ] Responsive table (mobile: card layout)

**Technical Details:**
```typescript
// Renew eligibility logic (client-side)
const canRenew = (loan) => {
  const daysUntilDue = Math.ceil((new Date(loan.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return (
    loan.status === 'ACTIVE' &&
    loan.renewalCount < 1 &&
    daysUntilDue >= 1 &&
    !loan.user.memberProfile.status !== 'SUSPENDED'
  );
};
```

**Definition of Done:**
- Member can view all loans
- Renew action works
- UI is intuitive
- Responsive on mobile

---

### TASK FE-4.3: Member Profile Page
**Priority:** MEDIUM | **Estimated Time:** 5 hours | **Dependencies:** FE-2.6

**Description:**
Create page for members to view and edit their profile.

**Page:** `/member/profile`

**Features:**
- Display profile information:
  - Email (read-only)
  - First name, Last name
  - Phone, Address
- Edit button toggles edit mode
- Save and Cancel buttons in edit mode
- Form validation

**Acceptance Criteria:**
- [ ] useProfile hook fetches profile from GET /api/me (or derived from auth)
- [ ] Edit mode with form inputs
- [ ] Update profile calls PATCH /api/me (or /api/members/:id if admin endpoint)
- [ ] Success/error toasts
- [ ] Loading state during save
- [ ] Form validation using Zod
- [ ] Responsive design

**Note:** Backend may need a member-specific profile endpoint (GET/PATCH /api/me) or reuse /api/members/:id with ownership check.

**Definition of Done:**
- Member can view and edit profile
- Validation works
- Changes persist

---

### TASK FE-4.4: Membership Status Page
**Priority:** LOW | **Estimated Time:** 3 hours | **Dependencies:** FE-2.6

**Description:**
Create page showing membership status and borrowing limits.

**Page:** `/member/membership`

**Features:**
- Membership status badge (ACTIVE, PENDING, SUSPENDED)
- Member since date
- Current borrowing limits:
  - Active loans: X / Y
  - Renewals available per loan: 1
- Outstanding penalties (if any)
- Contact admin link (if suspended or pending)

**Acceptance Criteria:**
- [ ] Display membership status prominently
- [ ] Show borrowing statistics
- [ ] Explain status if not ACTIVE
- [ ] Responsive design

**Definition of Done:**
- Member can see their status
- Information is clear
- UI is user-friendly

---

## Phase 5: Admin Dashboard - Books Management (Week 4-5)

### TASK FE-5.1: Admin Dashboard Home
**Priority:** MEDIUM | **Estimated Time:** 5 hours | **Dependencies:** FE-2.6

**Description:**
Create admin dashboard home page with system overview.

**Page:** `/admin`

**Features:**
- Stats cards:
  - Total books
  - Total members
  - Active loans
  - Overdue loans
- Recent activity (last 10 actions from audit logs)
- Quick actions: Add Book, Add Member, View Loans

**Acceptance Criteria:**
- [ ] Fetch stats from multiple endpoints or dedicated stats endpoint
- [ ] Recent activity displays user, action, timestamp
- [ ] Quick action buttons link to relevant pages
- [ ] Loading state (skeleton)
- [ ] Responsive design

**Definition of Done:**
- Dashboard provides useful overview
- Stats are accurate
- Links work

---

### TASK FE-5.2: Books List Page (Admin)
**Priority:** HIGH | **Estimated Time:** 8 hours | **Dependencies:** FE-2.6

**Description:**
Create page for admin to view and manage all books.

**Page:** `/admin/books`

**Features:**
- Data table with columns:
  - Cover (thumbnail)
  - Title
  - Authors (comma-separated)
  - Categories (badges)
  - ISBN
  - Total copies
  - Available copies
  - Status (ACTIVE, ARCHIVED)
  - Actions (Edit, Delete, View Copies)
- Search by title or author
- Filter by category, status
- Sorting
- Pagination
- "Add Book" button (top-right)

**Acceptance Criteria:**
- [ ] useBooks hook fetches books (admin view may include archived)
- [ ] Search and filters work
- [ ] Edit button navigates to /admin/books/:id/edit
- [ ] Delete button confirms and calls DELETE /api/books/:id
- [ ] View Copies navigates to /admin/books/:id/copies
- [ ] Add Book button navigates to /admin/books/new
- [ ] Loading and error states
- [ ] Responsive table (mobile: card layout)

**Definition of Done:**
- Admin can view and manage books
- Search and filters functional
- Actions work correctly

---

### TASK FE-5.3: Add/Edit Book Form
**Priority:** HIGH | **Estimated Time:** 10 hours | **Dependencies:** FE-5.2

**Description:**
Create form for adding new books or editing existing ones.

**Pages:**
- `/admin/books/new` (Add)
- `/admin/books/:id/edit` (Edit)

**Form Fields:**
- Title (required)
- Subtitle (optional)
- Description (textarea, optional)
- ISBN (required, validated format)
- Publication Year (number, optional)
- Language (optional)
- Cover Image URL (optional, URL validated)
- Authors (multi-select from existing authors, required)
- Categories (multi-select from existing categories, required)

**Acceptance Criteria:**
- [ ] BookForm component reused for add and edit
- [ ] Form validation using Zod schema
- [ ] Fetch authors and categories for selects
- [ ] Create book calls POST /api/books
- [ ] Update book calls PATCH /api/books/:id
- [ ] Pre-populate form in edit mode
- [ ] Success toast and redirect to /admin/books on success
- [ ] Error handling (409 for duplicate ISBN)
- [ ] Loading state during submission
- [ ] Responsive design

**Technical Details:**
```typescript
// Multi-select for authors
<MultiSelect
  options={authors.map(a => ({ label: a.name, value: a.id }))}
  value={selectedAuthors}
  onChange={setSelectedAuthors}
  placeholder="Select authors"
/>
```

**Definition of Done:**
- Admin can add new books
- Admin can edit existing books
- Validation works
- Form UX is smooth

---

### TASK FE-5.4: Book Copies Management Page
**Priority:** MEDIUM | **Estimated Time:** 6 hours | **Dependencies:** FE-5.2

**Description:**
Create page for admin to manage book copies (inventory).

**Page:** `/admin/books/:id/copies`

**Features:**
- Book title displayed at top
- "Add Copies" button (opens dialog)
- Data table with columns:
  - Code
  - Status (AVAILABLE, ON_LOAN, LOST, DAMAGED)
  - Location Code
  - Created Date
  - Actions (Edit Status, Delete)
- Filter by status
- Pagination

**Add Copies Dialog:**
- Number of copies (1-100)
- Location code (optional, applies to all)

**Edit Status Dialog:**
- Status dropdown
- Location code input

**Acceptance Criteria:**
- [ ] useBookCopies hook fetches copies from GET /api/books/:id/copies
- [ ] Add Copies dialog calls POST /api/books/:id/copies
- [ ] Edit Status dialog calls PATCH /api/copies/:copyId
- [ ] Delete confirms and calls DELETE /api/copies/:copyId
- [ ] Filter by status works
- [ ] Loading and error states
- [ ] Responsive design

**Definition of Done:**
- Admin can view and manage copies
- Add, edit, delete actions work
- UI is intuitive

---

### TASK FE-5.5: Authors Management Page
**Priority:** MEDIUM | **Estimated Time:** 6 hours | **Dependencies:** FE-2.6

**Description:**
Create page for admin to manage authors.

**Page:** `/admin/authors`

**Features:**
- Data table with columns:
  - Name
  - Bio (truncated)
  - Created Date
  - Actions (Edit, Delete)
- Search by name
- "Add Author" button
- Add/Edit Author dialog:
  - Name (required, unique)
  - Bio (textarea, optional)

**Acceptance Criteria:**
- [ ] useAuthors hook fetches authors
- [ ] Add Author dialog calls POST /api/authors
- [ ] Edit Author dialog calls PATCH /api/authors/:id
- [ ] Delete confirms and calls DELETE /api/authors/:id
- [ ] Search works
- [ ] Loading and error states
- [ ] Responsive design

**Definition of Done:**
- Admin can CRUD authors
- Validation works (unique name)
- UI is straightforward

---

### TASK FE-5.6: Categories Management Page
**Priority:** MEDIUM | **Estimated Time:** 6 hours | **Dependencies:** FE-2.6

**Description:**
Create page for admin to manage categories/genres.

**Page:** `/admin/categories`

**Features:**
- Data table with columns:
  - Name
  - Description (truncated)
  - Created Date
  - Actions (Edit, Delete)
- Search by name
- "Add Category" button
- Add/Edit Category dialog:
  - Name (required, unique)
  - Description (textarea, optional)

**Acceptance Criteria:**
- [ ] useCategories hook fetches categories
- [ ] Add Category dialog calls POST /api/categories
- [ ] Edit Category dialog calls PATCH /api/categories/:id
- [ ] Delete confirms and calls DELETE /api/categories/:id
- [ ] Search works
- [ ] Loading and error states
- [ ] Responsive design

**Definition of Done:**
- Admin can CRUD categories
- Validation works (unique name)
- UI is straightforward

---

## Phase 6: Admin Dashboard - Members & Loans (Week 5-6)

### TASK FE-6.1: Members List Page (Admin)
**Priority:** HIGH | **Estimated Time:** 8 hours | **Dependencies:** FE-2.6

**Description:**
Create page for admin to view and manage members.

**Page:** `/admin/members`

**Features:**
- Data table with columns:
  - Name (first + last)
  - Email
  - Status (PENDING, ACTIVE, SUSPENDED badge)
  - Active Loans Count
  - Member Since
  - Actions (View Details, Activate, Suspend)
- Search by name or email
- Filter by status
- Pagination

**Acceptance Criteria:**
- [ ] useMembers hook fetches members from GET /api/members
- [ ] Search and filter work
- [ ] View Details navigates to /admin/members/:id
- [ ] Activate button (if PENDING) calls POST /api/members/:id/activate
- [ ] Suspend button (if ACTIVE) confirms and calls POST /api/members/:id/suspend
- [ ] Loading and error states
- [ ] Responsive table

**Definition of Done:**
- Admin can view and manage members
- Search and filters functional
- Actions work correctly

---

### TASK FE-6.2: Member Detail Page (Admin)
**Priority:** MEDIUM | **Estimated Time:** 6 hours | **Dependencies:** FE-6.1

**Description:**
Create page for admin to view detailed member information and activity.

**Page:** `/admin/members/:id`

**Features:**
- Member profile card:
  - Name, Email, Phone, Address
  - Status badge
  - Member since
  - Last login
  - Admin notes (editable)
- Statistics:
  - Total loans count
  - Active loans count
  - Overdue loans count
  - Total penalties
- Recent loans table (last 10)
- Actions: Edit Profile, Activate, Suspend

**Acceptance Criteria:**
- [ ] useMemberDetail hook fetches member from GET /api/members/:id
- [ ] Display all member information
- [ ] Edit Profile opens dialog with editable fields
- [ ] Update profile calls PATCH /api/members/:id
- [ ] Activate/Suspend buttons work
- [ ] Recent loans displayed
- [ ] Loading and error states
- [ ] Responsive design

**Definition of Done:**
- Admin can view full member details
- Edit profile works
- Status actions work

---

### TASK FE-6.3: Loans List Page (Admin)
**Priority:** HIGH | **Estimated Time:** 10 hours | **Dependencies:** FE-2.6

**Description:**
Create page for admin to view and manage all loans.

**Page:** `/admin/loans`

**Features:**
- Data table with columns:
  - Member (name, email)
  - Book (title, cover)
  - Copy Code
  - Status (badge)
  - Borrowed Date
  - Due Date (highlighted if overdue)
  - Returned Date (if returned)
  - Penalty (if any)
  - Actions (Approve, Reject, Return)
- Filters:
  - Status (REQUESTED, ACTIVE, OVERDUE, RETURNED, etc.)
  - Member (search/select)
  - Due date range
- Sorting
- Pagination
- Tabs or filter presets: All, Requested, Active, Overdue, Returned

**Acceptance Criteria:**
- [ ] useLoans hook fetches loans from GET /api/loans
- [ ] Filters update URL params and refetch
- [ ] Approve button (if REQUESTED) calls POST /api/loans/:id/approve
- [ ] Reject button (if REQUESTED) confirms and calls POST /api/loans/:id/reject
- [ ] Return button calls POST /api/loans/:id/return
- [ ] Overdue loans highlighted
- [ ] Loading and error states
- [ ] Responsive table (mobile: card layout)

**Definition of Done:**
- Admin can view all loans
- Filters and search work
- Approve/Reject/Return actions work
- UI handles large datasets well

---

### TASK FE-6.4: System Settings Page (Admin)
**Priority:** MEDIUM | **Estimated Time:** 8 hours | **Dependencies:** FE-2.6

**Description:**
Create page for admin to configure system settings.

**Page:** `/admin/settings`

**Sections:**
1. **Borrowing Policy:**
   - Approvals Required (toggle)
   - Loan Days (number input, 1-90)
   - Renewal Days (number input, 1-30)
   - Max Renewals (number input, 0-5)
   - Max Concurrent Loans (number input, 1-20)
   - Renewal Min Days Before Due (number input, 1-7)

2. **Overdue Fees:**
   - Overdue Fee Per Day (IDR)
   - Overdue Fee Cap Per Loan (IDR)
   - Currency (dropdown, default IDR)

3. **Notifications:**
   - Notifications Enabled (toggle)
   - Due Soon Days (number input, 1-14)
   - Due Date Notifications Enabled (toggle)
   - From Email (email input)
   - SMTP Provider (dropdown, default MAILTRAP)
   - Send Hour UTC (number input, 0-23)
   - Time Zone (text input)

**Acceptance Criteria:**
- [ ] useSettings hook fetches settings from GET /api/settings
- [ ] Form pre-populated with current settings
- [ ] Update settings calls PATCH /api/settings
- [ ] Validation using Zod schema
- [ ] Success toast on save
- [ ] Warning if changing critical settings
- [ ] Loading state during save
- [ ] Responsive design

**Definition of Done:**
- Admin can view and update all settings
- Validation works
- Changes take effect immediately
- UI groups related settings clearly

---

## Phase 7: Shared Components & UX (Week 6-7)

### TASK FE-7.1: DataTable Component (Reusable) ✅
**Priority:** HIGH | **Estimated Time:** 8 hours | **Dependencies:** FE-1.3 | **Status:** COMPLETED

**Description:**
Create reusable data table component with sorting, filtering, and actions.

**Features:**
- Column definitions (label, accessor, sortable)
- Sorting (click column header)
- Row actions (edit, delete, custom)
- Empty state
- Loading state (skeleton rows)
- Responsive (card layout on mobile)
- Accessible (aria-labels, keyboard navigation)

**Acceptance Criteria:**
- [x] DataTable component in src/components/shared/DataTable.tsx
- [x] Accepts: data, columns, loading, onSort, onRowClick props
- [x] Column sorting works
- [x] Actions column renders custom buttons
- [x] Empty state displays message
- [x] Loading shows skeletons
- [x] Responsive layout switches on mobile
- [x] TypeScript generics for type safety

**Technical Details:**
```typescript
interface Column<T> {
  label: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onSort?: (column: keyof T) => void;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({ data, columns, loading, ... }: DataTableProps<T>) {
  // Implementation
}
```

**Definition of Done:**
- ✅ DataTable reusable across admin pages
- ✅ All features work
- ✅ Responsive and accessible

---

### TASK FE-7.2: ConfirmDialog Component (Reusable) ✅
**Priority:** MEDIUM | **Estimated Time:** 3 hours | **Dependencies:** FE-1.3 | **Status:** COMPLETED

**Description:**
Create reusable confirmation dialog for destructive actions.

**Features:**
- Title and message
- Confirm and Cancel buttons
- Danger variant (red confirm button)
- Async action support (loading state)
- Keyboard support (Enter to confirm, Esc to cancel)

**Acceptance Criteria:**
- [x] ConfirmDialog component in src/components/shared/ConfirmDialog.tsx
- [x] Accepts: open, title, message, onConfirm, onCancel, loading props
- [x] Confirm button shows loading spinner during async action
- [x] Keyboard shortcuts work
- [x] Accessible (focus management)

**Usage Example:**
```typescript
<ConfirmDialog
  open={isOpen}
  title="Delete Book"
  message="Are you sure you want to delete this book? This action cannot be undone."
  onConfirm={handleDelete}
  onCancel={() => setIsOpen(false)}
  loading={isDeleting}
  variant="danger"
/>
```

**Definition of Done:**
- ✅ ConfirmDialog reusable
- ✅ Works for all destructive actions
- ✅ Accessible

---

### TASK FE-7.3: Toast Notifications (Global) ✅
**Priority:** MEDIUM | **Estimated Time:** 3 hours | **Dependencies:** FE-1.3 | **Status:** COMPLETED

**Description:**
Set up global toast notification system using shadcn/ui Sonner.

**Features:**
- Success, error, warning, info variants
- Auto-dismiss (configurable duration)
- Manual dismiss (X button)
- Multiple toasts stacking
- Position (top-right default)

**Acceptance Criteria:**
- [x] Sonner installed and configured
- [x] Toaster component added to root layout
- [x] Toast variants styled consistently (via existing Sonner component)
- [x] Accessible (aria-live)

**Usage Example:**
```typescript
import { toast } from 'sonner';

toast.success('Book created successfully!');
toast.error('Failed to delete author. It is referenced by books.');
toast.loading('Saving...', { id: 'save-book' });
toast.success('Saved!', { id: 'save-book' }); // Update loading toast
```

**Definition of Done:**
- ✅ Toast notifications work globally
- ✅ All variants styled
- ✅ Ready to be used consistently across app

---

### TASK FE-7.4: Loading States (Skeletons) ✅
**Priority:** MEDIUM | **Estimated Time:** 4 hours | **Dependencies:** FE-1.3 | **Status:** COMPLETED

**Description:**
Create skeleton loading components for different content types.

**Skeletons to Create:**
- BookCardSkeleton (for catalog grid)
- TableRowSkeleton (for data tables)
- FormSkeleton (for forms)
- DetailPageSkeleton (for detail pages)

**Acceptance Criteria:**
- [x] Skeleton components in src/components/shared/skeletons/
- [x] Use shadcn/ui Skeleton component
- [x] Skeletons match actual content layout
- [x] Animated shimmer effect
- [x] Responsive

**Files Created:**
- ✅ src/components/shared/skeletons/BookCardSkeleton.tsx
- ✅ src/components/shared/skeletons/TableRowSkeleton.tsx (includes TableSkeletonLoader)
- ✅ src/components/shared/skeletons/FormSkeleton.tsx
- ✅ src/components/shared/skeletons/DetailPageSkeleton.tsx
- ✅ src/components/shared/skeletons/index.ts (barrel export)

**Definition of Done:**
- ✅ Loading states look polished
- ✅ Skeletons reduce perceived loading time
- ✅ All skeleton components match actual content layouts
- ✅ Responsive and accessible

---

### TASK FE-7.5: Error States and Empty States ✅
**Priority:** MEDIUM | **Estimated Time:** 4 hours | **Dependencies:** FE-1.3 | **Status:** COMPLETED

**Description:**
Create reusable components for error and empty states.

**Components:**
- ErrorState (for failed API calls)
- EmptyState (for no data)

**Features:**
- Icon or illustration
- Title and message
- Action button (e.g., "Try Again", "Add First Item")

**Acceptance Criteria:**
- [x] ErrorState component with retry button
- [x] EmptyState component with custom message and action
- [x] Used consistently across all list pages
- [x] Accessible

**Files Created:**
- ✅ src/components/shared/ErrorState.tsx (includes ErrorStateInline variant)
- ✅ src/components/shared/EmptyState.tsx (includes EmptyStateInline variant)

**Features Implemented:**
- ErrorState with customizable title, message, and retry action
- ErrorStateInline for compact error display
- EmptyState with preset icons (inbox, search, file, book, users, clipboard) or custom icons
- EmptyStateInline for compact empty state display
- Proper ARIA attributes and accessibility
- Loading state support for retry actions
- Card and non-card variants

**Usage Example:**
```typescript
{isError && <ErrorState message="Failed to load books" onRetry={refetch} />}
{data.length === 0 && <EmptyState message="No books found" action={{ label: "Add Book", onClick: () => navigate('/admin/books/new') }} />}
```

**Definition of Done:**
- ✅ Error and empty states polished
- ✅ Highly reusable with flexible props
- ✅ Accessible and responsive
- ✅ Improves UX significantly

---

### TASK FE-7.6: Responsive Mobile Navigation ✅
**Priority:** MEDIUM | **Estimated Time:** 5 hours | **Dependencies:** FE-2.4, FE-2.6 | **Status:** COMPLETED

**Description:**
Enhance mobile navigation with hamburger menu and bottom nav (optional).

**Features:**
- Hamburger menu in header (mobile)
- Slide-out navigation drawer
- Smooth animations
- Close on route change
- Close on overlay click
- Accessible (focus trap)

**Acceptance Criteria:**
- [x] Mobile menu works on tablets and phones
- [x] Menu slides from left
- [x] Backdrop/overlay dims background
- [x] Close button visible
- [x] Menu closes on navigation
- [x] Accessible (keyboard, screen readers)

**Enhancements Made:**
- ✅ Added useLocation hook to auto-close menu on route change
- ✅ Changed slide direction from right to left (common pattern)
- ✅ Added mobile menu header with logo and explicit close button
- ✅ Enhanced ARIA labels for better accessibility
- ✅ Added role="navigation" for screen reader support
- ✅ Improved keyboard navigation support
- ✅ Sheet component provides smooth animations via Radix UI
- ✅ Focus trap handled by Sheet/Dialog primitive
- ✅ Overlay click to close (built-in)
- ✅ ESC key to close (built-in)

**Files Modified:**
- ✅ src/components/layout/Header.tsx - Enhanced mobile navigation

**Definition of Done:**
- ✅ Mobile navigation smooth with animations
- ✅ Works on all mobile devices (responsive)
- ✅ Fully accessible (WCAG compliant)
- ✅ Auto-closes on route changes
- ✅ Proper focus management

---

## Phase 8: Testing (Week 7-8)

### TASK FE-8.1: Unit Tests - Components
**Priority:** HIGH | **Estimated Time:** 16 hours | **Dependencies:** All component implementations

**Description:**
Write unit tests for all components using Vitest and React Testing Library.

**Components to Test:**
- Auth components (LoginForm, RegisterForm)
- Layout components (Header, Footer, Sidebar)
- Shared components (DataTable, Pagination, SearchBar, ConfirmDialog)
- Form components (BookForm, AuthorForm, CategoryForm)
- Book components (BookCard, BookDetail)

**Acceptance Criteria:**
- [ ] Test coverage > 70% for components
- [ ] Test user interactions (clicks, inputs)
- [ ] Test conditional rendering
- [ ] Test error states
- [ ] Mock API calls
- [ ] Tests run in isolation
- [ ] Tests are fast (< 10 seconds total)

**Testing Library Best Practices:**
- Query by role, label, text (not test IDs)
- Test user behavior, not implementation
- Mock external dependencies (API, router)

**Definition of Done:**
- All major components tested
- Coverage target met
- All tests pass
- Tests are maintainable

---

### TASK FE-8.2: Integration Tests - User Flows
**Priority:** MEDIUM | **Estimated Time:** 12 hours | **Dependencies:** FE-8.1

**Description:**
Write integration tests for key user flows using Vitest and React Testing Library.

**Flows to Test:**
1. Registration and login flow
2. Browse catalog and view book details
3. Member borrow and renew flow
4. Admin create book flow
5. Admin approve loan flow

**Acceptance Criteria:**
- [ ] Mock API responses using MSW (Mock Service Worker)
- [ ] Test multi-step flows end-to-end
- [ ] Assert on URL changes (routing)
- [ ] Assert on toast notifications
- [ ] Test error scenarios

**Definition of Done:**
- Critical flows tested
- Tests cover happy paths and errors
- All tests pass

---

### TASK FE-8.3: E2E Tests - Critical Scenarios
**Priority:** MEDIUM | **Estimated Time:** 12 hours | **Dependencies:** Backend deployed

**Description:**
Write end-to-end tests using Playwright for critical business scenarios.

**Scenarios to Test:**
1. **Member Registration to Borrowing:**
   - Register → Login → Browse → Borrow → View loan
2. **Admin Book Management:**
   - Login as admin → Create book → Add copies → View in catalog
3. **Loan Approval Workflow:**
   - Member borrows → Admin approves → Member sees active loan

**Acceptance Criteria:**
- [ ] Playwright configured
- [ ] Tests run against real backend (test environment)
- [ ] Tests clean up data after run
- [ ] Screenshots captured on failure
- [ ] Tests run in CI/CD

**Definition of Done:**
- Critical E2E scenarios covered
- Tests reliable (no flakiness)
- All tests pass

---

## Phase 9: Polish & Deployment Preparation (Week 8)

### TASK FE-9.1: Accessibility Audit (WCAG 2.1 AA)
**Priority:** HIGH | **Estimated Time:** 6 hours | **Dependencies:** All UI implementations

**Description:**
Audit application for accessibility and fix issues.

**Checks:**
- Keyboard navigation (tab order, focus visible)
- Screen reader support (aria-labels, roles, live regions)
- Color contrast (text, buttons, links)
- Form labels and error messages
- Focus management (modals, drawers)
- Semantic HTML

**Tools:**
- axe DevTools browser extension
- WAVE browser extension
- Lighthouse accessibility audit

**Acceptance Criteria:**
- [ ] All pages keyboard navigable
- [ ] All interactive elements accessible
- [ ] Color contrast ratios meet WCAG AA
- [ ] Forms have proper labels and error messages
- [ ] ARIA attributes used correctly
- [ ] No automated accessibility violations

**Definition of Done:**
- Lighthouse accessibility score > 90
- Manual testing with screen reader passes
- All critical a11y issues fixed

---

### TASK FE-9.2: Performance Optimization
**Priority:** HIGH | **Estimated Time:** 8 hours | **Dependencies:** All feature implementations

**Description:**
Optimize application performance for production.

**Optimizations:**
- Code splitting (lazy load routes)
- Image optimization (lazy loading, WebP)
- Bundle size analysis (remove unused dependencies)
- React Query cache optimization
- Debounce/throttle expensive operations
- Memoization (useMemo, useCallback, React.memo)
- Virtualization for long lists (optional)

**Acceptance Criteria:**
- [ ] Routes lazy loaded with React.lazy and Suspense
- [ ] Images lazy loaded with loading="lazy"
- [ ] Bundle size < 500KB (gzipped)
- [ ] Lighthouse performance score > 90
- [ ] Time to Interactive (TTI) < 3 seconds
- [ ] No unnecessary re-renders (React DevTools Profiler)

**Definition of Done:**
- Performance metrics meet targets
- Bundle optimized
- App feels fast and responsive

---

### TASK FE-9.3: Error Tracking - Sentry Integration
**Priority:** MEDIUM | **Estimated Time:** 3 hours | **Dependencies:** FE-1.1

**Description:**
Integrate Sentry for error tracking and monitoring.

**Acceptance Criteria:**
- [ ] @sentry/react installed
- [ ] Sentry initialized in main.tsx
- [ ] Error boundary configured
- [ ] Source maps uploaded for production
- [ ] User context set (if logged in)
- [ ] Custom error tags/breadcrumbs

**Technical Details:**
```typescript
// src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// Wrap App with ErrorBoundary
<Sentry.ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</Sentry.ErrorBoundary>
```

**Definition of Done:**
- Errors logged to Sentry
- User context captured
- Source maps working

---

### TASK FE-9.4: Environment Configuration - Production Build
**Priority:** HIGH | **Estimated Time:** 4 hours | **Dependencies:** FE-1.1

**Description:**
Prepare production-ready build configuration.

**Acceptance Criteria:**
- [ ] Production environment variables documented
- [ ] Build script optimized (vite build)
- [ ] Preview script for testing prod build locally
- [ ] Docker support (Dockerfile, nginx config)
- [ ] CSP headers configured (if applicable)
- [ ] Robots.txt and sitemap.xml (optional)

**Environment Variables (Production):**
```
VITE_API_URL=https://api.library.example.com/api
VITE_SENTRY_DSN=...
```

**Nginx Configuration:**
```nginx
server {
  listen 80;
  server_name library.example.com;
  root /usr/share/nginx/html;
  index index.html;
  
  # React Router (SPA fallback)
  location / {
    try_files $uri $uri/ /index.html;
  }
  
  # Cache static assets
  location /assets {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

**Definition of Done:**
- Production build works
- Docker image can be created
- Environment config documented

---

### TASK FE-9.5: Documentation - User Guide & Developer Guide
**Priority:** MEDIUM | **Estimated Time:** 6 hours | **Dependencies:** None

**Description:**
Create comprehensive documentation for users and developers.

**Documentation to Create:**
- **README.md:**
  - Project overview
  - Tech stack
  - Prerequisites
  - Installation steps
  - Running locally
  - Running tests
  - Building for production
  - Environment variables
  - Deployment instructions

- **USER_GUIDE.md:**
  - How to register and login
  - How to browse catalog
  - How to borrow and renew books
  - How to view loans
  - Admin features overview

- **CONTRIBUTING.md:**
  - Code style guidelines
  - Component conventions
  - Git workflow
  - PR process
  - Testing requirements

**Definition of Done:**
- Documentation complete and accurate
- Screenshots included where helpful
- New developers can onboard using docs

---

## Summary

### Total Estimated Time: **35-40 days** (single developer)

### Task Dependencies Flow:
```
Phase 1 (Setup) 
  → Phase 2 (Auth & Layout) 
    → Phase 3 (Public Catalog) 
      → Phase 4 (Member Dashboard)
        → Phase 5 (Admin Books)
          → Phase 6 (Admin Members & Loans)
            → Phase 7 (Shared Components)
              → Phase 8 (Testing)
                → Phase 9 (Polish & Deploy)
```

### Parallelization Opportunities:
- Shared components can be built alongside feature pages
- Member and Admin dashboards can be developed in parallel (different developers)
- Testing can start as soon as individual features complete
- Documentation can be written incrementally
- Performance optimization can be done during feature development

### Critical Path (High Priority):
1. Project setup and tooling (FE-1.1 to FE-1.8)
2. Authentication (FE-2.1 to FE-2.3)
3. Public catalog (FE-3.2, FE-3.3)
4. Member loans (FE-4.2)
5. Admin books management (FE-5.2, FE-5.3)
6. Admin loans management (FE-6.3)

### Integration Points with Backend:
- **API Contract**: Refer to `api-contract.yaml` and backend Swagger docs
- **Authentication**: Session-based via cookies, automatically sent with Axios `withCredentials: true`
- **Error Handling**: Consistent error response format from backend
- **Pagination**: Standard query params (page, pageSize) and response format
- **CORS**: Backend must allow frontend origin
- **Development**: Use Vite proxy to avoid CORS issues locally

### Notes for Backend Team:
- Frontend expects consistent error response format:
  ```json
  {
    "statusCode": 400,
    "message": "Validation failed",
    "error": "Bad Request",
    "details": [...],
    "timestamp": "...",
    "path": "..."
  }
  ```
- Pagination response format:
  ```json
  {
    "items": [...],
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
  ```
- Session cookies must have `SameSite=Lax` or `None` (for cross-origin dev)
- CORS must allow credentials and frontend origin

### Testing Strategy:
- Unit tests: Components in isolation (Vitest + React Testing Library)
- Integration tests: User flows with mocked API (MSW)
- E2E tests: Critical scenarios with real backend (Playwright)
- Coverage target: > 70% for components

### Deployment Checklist:
- [ ] Environment variables configured
- [ ] Production build tested locally
- [ ] Docker image built and tested
- [ ] HTTPS configured
- [ ] Error tracking active (Sentry)
- [ ] Performance metrics meet targets
- [ ] Accessibility audit passed
- [ ] Documentation complete

---

## Next Steps:
1. Review and approve task breakdown with team
2. Set up project tracking (e.g., GitHub Projects, Jira)
3. Assign tasks based on dependencies and developer availability
4. Begin Phase 1: Foundation & Setup
5. Daily standups to track progress and blockers
6. Weekly demos to showcase completed features
7. Continuous integration with backend team
8. Regular code reviews for quality assurance

---

**End of Frontend Task Breakdown**
