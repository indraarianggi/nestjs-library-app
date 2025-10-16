# Library Management System - Frontend

Web-based Library Management System frontend built with React, TypeScript, and Vite.

## 📋 Project Overview

This is the frontend application for the Library Management System, providing interfaces for:

- **Public users**: Browse catalog, view book details, register
- **Members**: Borrow books, manage loans, view profile and membership
- **Administrators**: Manage books, authors, categories, members, loans, and system settings

## 🛠️ Tech Stack

- **Framework**: React 18.x
- **Language**: TypeScript 5.x
- **Build Tool**: Vite 5.x
- **UI Framework**: Tailwind CSS 4.x + shadcn/ui
- **State Management**: Zustand (global state) + React Query (server state)
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Validation**: Zod
- **Testing**: Vitest + React Testing Library + Playwright (E2E)
- **Code Quality**: ESLint + Prettier
- **Package Manager**: pnpm

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v20.x LTS or higher
- **pnpm**: v8.x or higher (Install with `npm install -g pnpm`)
- **Backend API**: The NestJS backend should be running on `http://localhost:3000`

## 🚀 Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd fullstack-library-management/frontend
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure the following variables:
   ```env
   VITE_API_URL=http://localhost:3000/api
   VITE_SENTRY_DSN=  # Optional: Sentry DSN for error tracking
   ```

## 🏃 Running the Development Server

Start the development server:

```bash
pnpm run dev
```

The application will be available at [http://localhost:5173](http://localhost:5173)

- Hot Module Replacement (HMR) is enabled by default
- API requests to `/api/*` are proxied to `http://localhost:3000`

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start development server on port 5173 |
| `pnpm run build` | Build for production (output: `dist/`) |
| `pnpm run preview` | Preview production build locally |
| `pnpm run lint` | Run ESLint (fails if warnings exist) |
| `pnpm run lint:fix` | Run ESLint and auto-fix issues |
| `pnpm run format` | Format code with Prettier |
| `pnpm run format:check` | Check code formatting |
| `pnpm run test` | Run tests (to be configured) |

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── assets/            # Images, fonts, etc.
│   ├── components/        # Reusable React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── layout/       # Layout components (Header, Footer, Sidebar)
│   │   ├── forms/        # Form components
│   │   └── shared/       # Shared components (DataTable, Pagination, etc.)
│   ├── pages/            # Route pages
│   │   ├── public/       # Public pages (Home, Catalog, Login, Register)
│   │   ├── member/       # Member dashboard pages
│   │   └── admin/        # Admin dashboard pages
│   ├── features/         # Feature-specific logic
│   │   ├── auth/         # Authentication (hooks, store, types)
│   │   ├── books/        # Books management
│   │   └── loans/        # Loans management
│   ├── lib/              # Third-party configurations
│   │   ├── api/          # Axios instance and API endpoints
│   │   ├── react-query.ts # React Query configuration
│   │   └── utils.ts      # Utility functions
│   ├── schemas/          # Zod validation schemas
│   ├── types/            # TypeScript type definitions
│   ├── hooks/            # Global custom hooks
│   ├── routes/           # Route configuration and guards
│   ├── App.tsx           # Root component
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles (Tailwind CSS v4)
├── .env.example          # Example environment variables
├── .env                  # Local environment variables (gitignored)
├── .gitignore
├── .prettierrc           # Prettier configuration
├── .prettierignore
├── eslint.config.js      # ESLint configuration
├── tsconfig.json         # TypeScript configuration (root)
├── tsconfig.app.json     # TypeScript configuration (app)
├── tsconfig.node.json    # TypeScript configuration (node)
├── vite.config.ts        # Vite configuration
├── package.json
└── README.md
```

## 🎨 Styling

This project uses **Tailwind CSS v4** with a CSS-first configuration approach:

- Theme configuration is done via CSS variables in `src/index.css`
- The traditional `tailwind.config.js` is not needed for most use cases
- **shadcn/ui** components are used for the UI component library
- Dark mode support is built-in via Tailwind's dark mode utilities

## 🔐 Authentication

- Session-based authentication using **Better Auth**
- Sessions are stored in HTTP-only cookies
- Axios is configured with `withCredentials: true` to send cookies automatically
- Protected routes use `ProtectedRoute` and `AdminRoute` guards

## 🧭 Routing

Routes are organized by role:

- **Public Routes**: `/`, `/books`, `/books/:id`, `/login`, `/register`
- **Member Routes**: `/member`, `/member/profile`, `/member/loans`, `/member/membership`
- **Admin Routes**: `/admin`, `/admin/books`, `/admin/authors`, `/admin/categories`, `/admin/members`, `/admin/loans`, `/admin/settings`

## 📡 API Integration

- **Base URL**: Configured via `VITE_API_URL` environment variable
- **HTTP Client**: Axios with interceptors for error handling
- **Server State**: Managed with React Query (TanStack Query)
- **API Proxy**: Vite dev server proxies `/api/*` to backend

## 🧪 Testing

Testing setup (to be completed in Phase 8):

- **Unit Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright
- **Coverage Target**: >70% for components

## 🏗️ Building for Production

1. **Build the application**:
   ```bash
   pnpm run build
   ```

2. **Preview the build locally**:
   ```bash
   pnpm run preview
   ```

3. **Deploy**:
   - The `dist/` folder contains the production-ready files
   - Serve with any static file server (Nginx, Vercel, Netlify, etc.)
   - Configure environment variables in your hosting platform

## 🐳 Docker Support

Docker support will be added in Phase 9 (FE-9.4).

## 🔧 Configuration

### TypeScript

- **Strict mode** is enabled for type safety
- **Path aliases**: `@/` maps to `./src/`
- **Target**: ES2022 for modern JavaScript features

### ESLint

- React recommended rules
- TypeScript ESLint rules
- Prettier integration to avoid conflicts
- Unused variables with `_` prefix are ignored

### Prettier

- Semi-colons: enabled
- Single quotes: enabled
- Trailing commas: all
- Print width: 100 characters
- Tab width: 2 spaces

## 🤝 Contributing

1. Follow the existing code style and conventions
2. Run `pnpm run lint` and `pnpm run format` before committing
3. Ensure all TypeScript errors are resolved
4. Write tests for new features (when test setup is complete)

## 📝 Development Workflow

1. **Create a new branch** for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** and test locally

3. **Lint and format**:
   ```bash
   pnpm run lint:fix
   pnpm run format
   ```

4. **Build to verify**:
   ```bash
   pnpm run build
   ```

5. **Commit and push**:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

## 🐛 Troubleshooting

### Port 5173 already in use

```bash
# Kill the process using port 5173
lsof -ti:5173 | xargs kill -9
# Or use a different port
pnpm run dev -- --port 5174
```

### API proxy not working

- Ensure the backend is running on `http://localhost:3000`
- Check the `VITE_API_URL` in `.env`
- Verify the proxy configuration in `vite.config.ts`

### TypeScript path alias not resolving

- Restart your editor/IDE
- Check `tsconfig.app.json` has the correct `paths` configuration
- Check `vite.config.ts` has the correct `resolve.alias` configuration

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Vite Documentation](https://vite.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)

## 📄 License

This project is part of the Library Management System and follows the same license as the parent project.

## 👥 Team

- Frontend Engineers: Implementing React components and features
- Backend Engineers: Providing API endpoints
- Tech Leads: Architecture and code reviews

## 🎯 Next Steps

After completing the project setup (FE-1.1), proceed to:

- **FE-1.2**: Tailwind CSS 4.x + shadcn/ui Setup
- **FE-1.3**: Install Core shadcn/ui Components
- **FE-1.4**: Axios HTTP Client Configuration
- **FE-1.5**: React Router Configuration

Refer to `frontend-tasks.md` for the complete task list.
