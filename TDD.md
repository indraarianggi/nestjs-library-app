# Technical Design Document (TDD)
## Library Management System

**Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: Active

---

## 1. Overview

The Library Management System (LMS) is a full-stack web application designed to manage library operations including book catalog management, membership lifecycle, and borrowing operations. The system supports two primary user roles—Admin and Member—with distinct capabilities and access controls.

### 1.1 System Goals

- Provide efficient book catalog and inventory management
- Enable membership lifecycle management with evergreen memberships
- Support borrowing operations with policy enforcement (14-day loans, single renewal)
- Deliver secure, performant public catalog with search and filtering
- Implement automated email notifications for loan lifecycle events

### 1.2 Key Design Principles

- **Separation of Concerns**: Clear boundaries between backend API, frontend UI, and data persistence
- **Security First**: Authentication, authorization, input validation, and data protection at all layers
- **Scalability**: Stateless architecture with horizontal scaling capability
- **Maintainability**: Type-safe codebase, modular architecture, comprehensive testing
- **Performance**: Optimized database queries, indexed search, server-side pagination

---

## 2. System Architecture

### 2.1 Architecture Style

**Layered Architecture** with clear separation:
- **Presentation Layer**: React SPA with component-based UI
- **API Layer**: RESTful NestJS backend with resource-oriented endpoints
- **Business Logic Layer**: Service classes encapsulating domain logic
- **Data Access Layer**: Prisma ORM with repository pattern
- **Database Layer**: PostgreSQL with normalized schema

### 2.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Browser                            │
│  ┌────────────────────────────────────────────────────┐     │
│  │         React SPA (TypeScript + Vite)              │     │
│  │  - React Query for state management                │     │
│  │  - Shadcn/ui + Tailwind CSS for UI                 │     │
│  │  - Zod for validation                              │     │
│  │  - React Router for navigation                     │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS/REST API
                       │ JWT Bearer Token
┌──────────────────────▼──────────────────────────────────────┐
│              NestJS Backend API Server                       │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Controllers (REST endpoints)                      │     │
│  │    - Guards (Authentication & Authorization)       │     │
│  │    - Pipes (Validation)                            │     │
│  │    - Interceptors (Logging, Transform)             │     │
│  └────────────────────┬───────────────────────────────┘     │
│  ┌────────────────────▼───────────────────────────────┐     │
│  │  Services (Business Logic)                         │     │
│  │    - Domain rules enforcement                      │     │
│  │    - Transaction coordination                      │     │
│  │    - Event emission                                │     │
│  └────────────────────┬───────────────────────────────┘     │
│  ┌────────────────────▼───────────────────────────────┐     │
│  │  Repositories (Data Access)                        │     │
│  │    - Prisma Client                                 │     │
│  │    - Query optimization                            │     │
│  └────────────────────┬───────────────────────────────┘     │
│                       │                                      │
│  ┌────────────────────▼───────────────────────────────┐     │
│  │  Supporting Services                                │     │
│  │    - Authentication (Passport.js + JWT)            │     │
│  │    - Email Service (SMTP/Mailtrap)                 │     │
│  │    - Scheduled Jobs (loan status, notifications)   │     │
│  │    - Audit Logger                                  │     │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────────┘
                       │ Prisma ORM
┌──────────────────────▼──────────────────────────────────────┐
│               PostgreSQL Database                            │
│  - Normalized schema (3NF)                                   │
│  - UUID primary keys                                         │
│  - Indexes for search/filter performance                     │
│  - Constraints for data integrity                            │
│  - View for available copies calculation                     │
└──────────────────────────────────────────────────────────────┘
```

### 2.3 Communication Patterns

- **Client ↔ Backend**: RESTful HTTP/JSON over HTTPS with JWT bearer authentication
- **Backend ↔ Database**: Prisma Client ORM with connection pooling
- **Email Notifications**: Asynchronous SMTP via queue for non-blocking operations
- **Scheduled Tasks**: Cron jobs for loan status updates and notification dispatch

---

## 3. Technology Stack

### 3.1 Backend Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Runtime** | Node.js (v18+) | Server-side JavaScript runtime |
| **Framework** | NestJS | Enterprise-grade TypeScript framework with DI, modularity |
| **Language** | TypeScript | Type safety, enhanced tooling, maintainability |
| **Database** | PostgreSQL (v14+) | ACID-compliant relational database |
| **ORM** | Prisma | Type-safe database client, migration management |
| **Authentication** | Passport.js + JWT | Strategy-based authentication, stateless tokens |
| **Validation** | Zod + class-validator | Schema validation, DTO validation |
| **Logging** | NestJS Logger + Sentry | Structured logging, error tracking |
| **Email** | Nodemailer | SMTP email delivery |
| **Scheduler** | @nestjs/schedule | Cron jobs for background tasks |

### 3.2 Frontend Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Build Tool** | Vite | Fast HMR, optimized production builds |
| **Framework** | React 18 | Component-based UI library |
| **Language** | TypeScript | Type safety across application |
| **State Management** | React Query (TanStack Query) | Server state management, caching, sync |
| **Routing** | React Router v6 | Client-side routing with nested routes |
| **UI Components** | Shadcn/ui | Accessible, customizable component library |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Validation** | Zod | Schema validation matching backend |
| **HTTP Client** | Axios | HTTP requests with interceptors |
| **Error Tracking** | Sentry | Frontend error monitoring |

### 3.3 Development Tools

- **Version Control**: Git
- **Package Manager**: npm (backend), pnpm (frontend)
- **Code Quality**: ESLint, Prettier
- **Testing**: Jest (unit), Supertest (integration), React Testing Library
- **API Documentation**: OpenAPI 3.1 (Swagger)

---

## 4. Backend Component Design

### 4.1 Module Structure

NestJS follows a modular architecture. Core modules:

```
backend/src/
├── main.ts                    # Application bootstrap
├── app.module.ts              # Root module
├── config/                    # Configuration
│   ├── database.config.ts
│   ├── auth.config.ts
│   └── email.config.ts
├── modules/
│   ├── auth/                  # Authentication & authorization
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── local.strategy.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   └── dto/
│   ├── books/                 # Book management
│   ├── authors/               # Author management
│   ├── categories/            # Category management
│   ├── copies/                # Book copy inventory
│   ├── members/               # Membership management
│   ├── loans/                 # Borrowing operations
│   ├── settings/              # System configuration
│   └── audit-logs/            # Audit trail
├── common/
│   ├── decorators/            # Custom decorators
│   ├── filters/               # Exception filters
│   ├── interceptors/          # Request/response interceptors
│   ├── pipes/                 # Validation pipes
│   └── guards/                # Global guards
├── services/
│   ├── prisma.service.ts      # Prisma client service
│   ├── email.service.ts       # Email notification service
│   └── scheduler.service.ts   # Scheduled task service
└── lib/
    └── utils/                 # Utility functions
```

### 4.2 Authentication & Authorization Architecture

**Authentication Flow**:
1. User submits email/password to `/members/login`
2. LocalStrategy validates credentials (bcrypt hash comparison)
3. Upon success, generate JWT access token (15 min) and refresh token (7 days)
4. Store refresh token in database (hashed) for revocation capability
5. Return tokens to client (access token in response, optionally as httpOnly cookie)

**Token Structure**:
- **Access Token**: Short-lived JWT containing `{ userId, role, exp }`
- **Refresh Token**: Long-lived JWT stored in database for revocation
- **Signing**: HS256 algorithm with environment-configured secret keys

**Authorization Pattern**:
- **Guards**: `JwtAuthGuard` (validates token), `RolesGuard` (checks role)
- **Decorators**: `@Roles('ADMIN')` for endpoint-level authorization
- **Metadata**: Role requirements attached via SetMetadata

### 4.3 Service Layer Patterns

**Business Logic Encapsulation**:
- Services contain all domain logic (validation, computation, orchestration)
- Controllers remain thin, delegating to services
- Services are injected via NestJS DI container

**Transaction Management**:
- Use Prisma transactions for operations affecting multiple tables
- Example: Creating a loan decrements available copies atomically
- Rollback on failure to maintain consistency

**Example Service Responsibilities**:
- **LoanService**: 
  - Validate borrowing eligibility (membership status, concurrent limit)
  - Check availability, assign copy, set due date
  - Compute overdue penalties with cap enforcement
  - Emit events for notifications

### 4.4 Data Validation Strategy

**Two-Layer Validation**:
1. **DTO Layer** (class-validator): Validate request structure and basic types
2. **Service Layer** (Zod): Deep schema validation, business rule checks

**Common Validations**:
- Required fields, type constraints, string lengths, regex patterns
- Unique constraints (email, ISBN) checked at database level
- Business rules (e.g., max concurrent loans) enforced in services

### 4.5 Error Handling

**Exception Filters**:
- Global exception filter catches all errors
- Maps Prisma errors to HTTP status codes (e.g., UniqueConstraint → 409)
- Returns consistent error response: `{ statusCode, message, error }`

**Error Categories**:
- 400: Validation errors
- 401: Authentication failures
- 403: Authorization failures (role mismatch)
- 404: Resource not found
- 409: Business rule conflicts (duplicate, constraint violation)
- 422: Semantic validation failures
- 500: Unhandled server errors (logged to Sentry)

---

## 5. Frontend Component Design

### 5.1 Application Structure

```
frontend/src/
├── main.tsx                   # Application entry
├── App.tsx                    # Root component with router
├── routes/                    # Route definitions
│   ├── index.tsx
│   ├── ProtectedRoute.tsx
│   └── RoleRoute.tsx
├── pages/                     # Page components
│   ├── public/
│   │   ├── HomePage.tsx
│   │   ├── CatalogPage.tsx
│   │   ├── BookDetailPage.tsx
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── member/
│   │   ├── MemberDashboard.tsx
│   │   ├── ProfilePage.tsx
│   │   └── LoansPage.tsx
│   └── admin/
│       ├── AdminDashboard.tsx
│       ├── BooksPage.tsx
│       ├── MembersPage.tsx
│       ├── LoansPage.tsx
│       └── SettingsPage.tsx
├── features/                  # Feature-based modules
│   ├── auth/
│   ├── books/
│   ├── loans/
│   └── members/
├── components/
│   ├── shared/                # Reusable components
│   │   ├── DataTable.tsx
│   │   ├── SearchBar.tsx
│   │   ├── Pagination.tsx
│   │   └── ErrorBoundary.tsx
│   └── ui/                    # Shadcn/ui components
├── lib/
│   ├── api/                   # API client
│   │   ├── client.ts          # Axios instance with interceptors
│   │   ├── endpoints.ts       # API endpoint definitions
│   │   └── types.ts           # API response types
│   ├── react-query.ts         # React Query configuration
│   └── utils.ts               # Utility functions
├── hooks/                     # Custom hooks
│   ├── useAuth.ts
│   ├── useDebounce.ts
│   └── usePagination.ts
├── types/                     # TypeScript types
├── constants/                 # App constants
└── styles/                    # Global styles
```

### 5.2 State Management Architecture

**React Query for Server State**:
- All backend data managed through React Query
- Queries for fetching (with caching, background refetch)
- Mutations for creating/updating/deleting
- Automatic cache invalidation on mutations

**Local State**:
- Form state: React Hook Form
- UI state: React useState/useReducer
- Auth state: Context API with React Query integration

**Query Key Structure**:
```typescript
// Hierarchical key structure
['books']                      // All books
['books', { filters }]         // Filtered books
['books', bookId]              // Single book
['books', bookId, 'copies']    // Book copies
['loans', 'my']                // Current user loans
['loans', { status }]          // Filtered loans
```

### 5.3 Routing & Navigation

**Route Structure**:
- `/` - Home page (public)
- `/books` - Catalog (public)
- `/books/:id` - Book detail (public)
- `/login`, `/register` - Auth pages (public)
- `/member/*` - Member dashboard (protected, MEMBER role)
- `/admin/*` - Admin dashboard (protected, ADMIN role)

**Route Protection**:
- `ProtectedRoute`: Requires authentication
- `RoleRoute`: Requires specific role (redirects if unauthorized)
- Auth state checked via React Query persistent auth hook

### 5.4 Form Handling

**React Hook Form + Zod**:
- Zod schemas define validation rules (shared with backend logic)
- React Hook Form manages form state and submission
- Validation errors displayed inline
- Optimistic UI updates with error rollback

### 5.5 Error Handling & UX

**Error Boundaries**:
- Global error boundary catches rendering errors
- Displays fallback UI with error message
- Logs errors to Sentry

**API Error Handling**:
- Axios interceptor catches API errors
- 401: Redirect to login, clear auth state
- 403: Display "access denied" message
- 4xx/5xx: Display user-friendly error toast/alert
- Network errors: Retry with exponential backoff (React Query)

---

## 6. Data Models & Database Design

### 6.1 Entity-Relationship Overview

Refer to **ERD.md** for complete database schema. Key relationships:

- **User** 1:1 **MemberProfile** (one-to-one for members)
- **User** 1:N **Loan** (user creates loans)
- **Book** M:N **Author** (via BookAuthor junction)
- **Book** M:N **Category** (via BookCategory junction)
- **Book** 1:N **BookCopy** (book has multiple copies)
- **BookCopy** 1:N **Loan** (copy can be loaned multiple times, one at a time)
- **User** 1:N **RefreshToken** (user has multiple refresh tokens)

### 6.2 Key Design Decisions

**UUID Primary Keys**:
- UUIDs (`gen_random_uuid()`) for all primary keys
- Eliminates enumeration attacks, enables distributed generation

**Soft Delete / Archiving**:
- Books with historical references set `status = 'ARCHIVED'` rather than deleted
- Foreign key constraints use `ON DELETE RESTRICT` for entities with history

**Computed Availability**:
- Book availability derived from copy status and active loans
- View `v_book_available_copies` precomputes counts for performance

**Audit Trail**:
- `audit_log` table records critical actions with JSONB metadata
- Tracks who, what, when, and before/after values

**Refresh Token Revocation**:
- `refresh_token` table stores hashed tokens with expiry and revocation flag
- Enables logout and token invalidation

### 6.3 Indexing Strategy

**Search Performance**:
- Trigram indexes (`pg_trgm`) on `book.title` and `author.name` for ILIKE searches
- Full-text search (`tsvector`) on book title/subtitle/description
- Choose trigram for simple partial matches, FTS for complex queries

**Filter Performance**:
- B-tree indexes on foreign keys (bookId, userId, copyId, categoryId, authorId)
- Composite index on `loan(status, due_date)` for dashboard queries
- Index on `book_category(category_id, book_id)` for category filtering

**Constraint Enforcement**:
- Partial unique index on `loan(copy_id)` where status IN ('APPROVED','ACTIVE','OVERDUE')
- Ensures one open loan per copy at database level

---

## 7. API Design & Specifications

### 7.1 RESTful Principles

Refer to **api-contract.yaml** for complete OpenAPI specification.

**Resource-Oriented Design**:
- Endpoints represent resources: `/books`, `/loans`, `/members`
- Standard HTTP methods: GET (read), POST (create), PATCH (update), DELETE (delete)
- Consistent response structure with pagination

**Versioning**:
- API version in URL path: `/api/v1/*` (future-proofing)
- Current version assumes `/api/*` (v1 implicit)

### 7.2 Pagination & Filtering

**Query Parameters**:
- `page`: Page number (default 1)
- `pageSize`: Items per page (default 20, max 100)
- `sortBy`: Field to sort by (whitelisted)
- `sortOrder`: `asc` or `desc`
- Resource-specific filters: `status`, `categoryId`, `availability`, `q` (search)

**Response Structure**:
```typescript
{
  items: T[],
  page: number,
  pageSize: number,
  total: number,
  totalPages: number
}
```

### 7.3 Error Response Format

**Consistent Error Schema**:
```typescript
{
  statusCode: number,
  message: string | string[],
  error: string  // HTTP status text
}
```

**Status Code Usage**:
- 200: Success (GET, PATCH)
- 201: Created (POST)
- 204: No Content (DELETE)
- 400: Validation error
- 401: Unauthenticated
- 403: Unauthorized (role mismatch)
- 404: Not found
- 409: Conflict (business rule violation)
- 422: Semantic validation error
- 500: Server error

---

## 8. Security Architecture

### 8.1 Authentication Security

**Password Security**:
- Passwords hashed with bcrypt (cost factor 10-12)
- Never stored or logged in plain text
- Minimum password length enforced (8 characters)

**JWT Security**:
- Access tokens signed with HS256 and secret key (256-bit minimum)
- Short expiry (15 minutes) limits exposure window
- Refresh tokens stored hashed in database for revocation
- Tokens validated on every protected route

**Session Management**:
- Stateless JWT-based authentication
- Refresh token rotation on use (revoke old, issue new)
- Logout revokes refresh token immediately

### 8.2 Authorization Security

**Role-Based Access Control (RBAC)**:
- Two roles: ADMIN (full access), MEMBER (limited access)
- Guards enforce role requirements at controller level
- Ownership checks for user-specific resources (e.g., own loans)

**Endpoint Protection Matrix**:
- Public: Catalog, book detail, login, register
- Member: Own profile, loans, borrow, renew, return
- Admin: All CRUD operations, member management, settings

### 8.3 Input Validation & Sanitization

**Multi-Layer Validation**:
1. **Type validation**: DTOs with class-validator decorators
2. **Schema validation**: Zod schemas for complex rules
3. **Business validation**: Service-layer checks

**SQL Injection Prevention**:
- Prisma uses parameterized queries (no raw SQL)
- All user input sanitized through ORM

**XSS Prevention**:
- React escapes values by default
- API responses JSON-encoded
- CSP headers in production

### 8.4 Rate Limiting & Abuse Prevention

**Rate Limiting**:
- Authentication endpoints: 5 requests/15 minutes per IP
- API endpoints: 100 requests/minute per authenticated user
- Use `@nestjs/throttler` for rate limiting

**Brute Force Protection**:
- Account lockout after 5 failed login attempts
- Exponential backoff for subsequent attempts
- CAPTCHA consideration for future enhancement

### 8.5 Data Protection

**Data in Transit**:
- HTTPS enforced in production (TLS 1.2+)
- Secure cookies with `httpOnly`, `secure`, `sameSite` flags

**Data at Rest**:
- PostgreSQL at-rest encryption (managed by hosting provider)
- Sensitive fields (passwords, tokens) hashed

**PII Protection**:
- Minimal PII collection (name, email, phone, address)
- No logging of sensitive data (passwords, tokens)
- Audit logs record actions but redact sensitive values

### 8.6 CORS Configuration

**Production CORS**:
- Whitelist specific frontend origin(s)
- Credentials allowed for cookie-based auth
- Preflight caching enabled

---

## 9. Notification System

### 9.1 Email Notification Architecture

**Email Service**:
- Nodemailer with SMTP transport (Mailtrap for MVP)
- Asynchronous sending via job queue (future: Bull/BullMQ)
- Retry logic with exponential backoff on failure

**Notification Triggers**:
1. **Loan Created**: When member creates loan (auto-approved or requested)
2. **Loan Approved**: When admin approves requested loan
3. **Loan Rejected**: When admin rejects requested loan
4. **Due Soon Reminder**: 3 days before due date (daily job at 08:00 UTC)
5. **Due Date Notification**: On due date (daily job at 08:00 UTC)
6. **Loan Returned**: When loan returned (confirmation email)

**Email Templates**:
- Simple HTML templates with library branding
- Personalized with member name, book title, dates
- Includes relevant action links (view loan, contact admin)

### 9.2 Scheduled Jobs

**Cron Schedule**:
- **Overdue Status Update**: Hourly job checks loans with `due_date < now()` and `status = 'ACTIVE'`, updates to `OVERDUE`
- **Due Soon Notifications**: Daily at 08:00 UTC, finds loans due in 3 days
- **Due Date Notifications**: Daily at 08:00 UTC, finds loans due today

**Job Implementation**:
- Use `@nestjs/schedule` for cron jobs
- Batch processing with pagination for large datasets
- Logging and error handling for failed notifications

---

## 10. Testing Strategy

### 10.1 Backend Testing

**Unit Tests (70% coverage target)**:
- **Services**: Mock repositories, test business logic in isolation
- **Controllers**: Mock services, test request/response handling
- **Utilities**: Pure function testing
- Tools: Jest, ts-jest

**Integration Tests**:
- **API Endpoints**: Test full request/response cycle with test database
- **Database**: Test Prisma queries, constraints, transactions
- Tools: Supertest, Jest, test PostgreSQL instance

**Test Database**:
- Separate test database or Docker container
- Reset/seed between test suites
- Use Prisma migrations for schema consistency

**E2E Tests**:
- Critical user flows: register → login → borrow → renew → return
- Admin flows: create book → add copies → approve loan → manage settings
- Tools: Supertest, Jest

### 10.2 Frontend Testing

**Unit Tests**:
- **Components**: Test rendering, props, interactions (React Testing Library)
- **Hooks**: Test custom hooks logic in isolation
- **Utilities**: Pure function testing
- Tools: Jest, React Testing Library

**Integration Tests**:
- **Forms**: Test validation, submission, error handling
- **API Integration**: Mock API calls, test query/mutation flows
- Tools: MSW (Mock Service Worker), React Testing Library

**E2E Tests**:
- User journeys through UI (future enhancement)
- Tools consideration: Playwright or Cypress

### 10.3 Test Pyramid

```
         /\        E2E (10%)
        /  \       - Critical user flows
       /    \      - Smoke tests
      /------\     Integration (20%)
     /        \    - API + DB
    /          \   - Component + API
   /------------\  Unit (70%)
  /              \ - Services, utilities
 /________________\- Pure functions
```

### 10.4 Continuous Integration

**CI Pipeline**:
1. Lint (ESLint, Prettier check)
2. Type check (TypeScript compilation)
3. Unit tests with coverage report
4. Integration tests
5. Build verification

**Coverage Thresholds**:
- Statements: 70%
- Branches: 65%
- Functions: 70%
- Lines: 70%

---

## 11. Deployment Architecture

### 11.1 Environment Strategy

**Environments**:
1. **Development**: Local developer machines
2. **Staging**: Pre-production environment (mirrors production)
3. **Production**: Live system

**Configuration Management**:
- Environment variables for secrets and environment-specific config
- `.env` files (not committed) for local development
- Secret management service for production (AWS Secrets Manager, HashiCorp Vault)

### 11.2 Infrastructure Components

**Backend Deployment**:
- Node.js application server (NestJS)
- Containerized with Docker (multi-stage build)
- Horizontal scaling with load balancer
- Deployment platform: AWS ECS, Kubernetes, or Heroku

**Frontend Deployment**:
- Static files from Vite production build
- CDN distribution for global performance (CloudFront, Vercel)
- Deployment platform: Vercel, Netlify, or S3 + CloudFront

**Database**:
- Managed PostgreSQL service (AWS RDS, DigitalOcean, Supabase)
- Automated backups (daily, 30-day retention)
- Point-in-time recovery enabled
- Connection pooling (PgBouncer or managed pool)

**Email Service**:
- SMTP relay (Mailtrap for MVP, migrate to SendGrid/Mailgun for production)

### 11.3 Scalability Considerations

**Horizontal Scaling**:
- Stateless backend allows multiple instances behind load balancer
- Session data in JWT (stateless) avoids sticky sessions
- Refresh tokens in database shared across instances

**Database Optimization**:
- Read replicas for read-heavy operations (catalog browsing)
- Connection pooling to handle concurrent requests
- Query optimization and index tuning

**Caching Strategy** (Future Enhancement):
- Redis for frequently accessed data (catalog, settings)
- React Query caching on frontend
- CDN caching for static assets

### 11.4 Deployment Process

**CI/CD Pipeline**:
1. Code pushed to main branch
2. Automated tests run
3. Build Docker image (backend) and static files (frontend)
4. Deploy to staging
5. Automated smoke tests on staging
6. Manual approval gate
7. Deploy to production (blue-green or rolling deployment)
8. Post-deployment health checks

**Database Migrations**:
- Prisma migrations applied before application deployment
- Backward-compatible migrations preferred
- Rollback strategy for failed migrations

---

## 12. Monitoring & Observability

### 12.1 Logging Strategy

**Structured Logging**:
- JSON log format with structured fields
- Context: `requestId`, `userId`, `timestamp`, `level`, `message`, `metadata`
- Log levels: ERROR, WARN, INFO, DEBUG

**Log Aggregation**:
- Centralized logging service (CloudWatch, Datadog, ELK stack)
- Searchable and filterable logs
- Retention policy: 30 days for INFO, 90 days for ERROR

**What to Log**:
- All HTTP requests (method, path, status, duration)
- Authentication events (login, logout, token refresh)
- Business events (loan created, book borrowed, overdue)
- Errors with stack traces and context

### 12.2 Error Tracking

**Sentry Integration**:
- Backend: Capture unhandled exceptions, HTTP errors 5xx
- Frontend: Capture JavaScript errors, React error boundaries
- Context: User ID, request ID, environment, release version
- Alerts for critical errors

### 12.3 Application Monitoring

**Health Checks**:
- `/health` endpoint: Basic liveness check
- `/health/ready` endpoint: Readiness check (DB connectivity)
- Monitored by load balancer for auto-healing

**Metrics**:
- Request rate (requests/second)
- Response time (P50, P95, P99)
- Error rate (4xx, 5xx per endpoint)
- Database query performance
- Email send success/failure rate

**APM** (Application Performance Monitoring):
- Distributed tracing for request flow
- Database query analysis
- Tools: Datadog, New Relic, or OpenTelemetry

### 12.4 Business Metrics

**Dashboards**:
- Active loans count, overdue loans count
- Daily borrows, returns, renewals
- Member registration rate, active members
- Catalog growth (books, copies added)
- Search performance (top queries, zero-result searches)

### 12.5 Alerting

**Alert Thresholds**:
- Error rate > 5% for 5 minutes
- Response time P95 > 1 second for 5 minutes
- Database connection failures
- Email send failures > 10 in 5 minutes
- Disk space < 20%

**Alert Channels**:
- Email for low-priority
- Slack/PagerDuty for critical production issues

---

## 13. Performance Optimization

### 13.1 Database Performance

**Query Optimization**:
- Use Prisma's `select` to fetch only needed fields
- Avoid N+1 queries with `include` for related data
- Use database views for complex computed values
- Analyze query plans with `EXPLAIN ANALYZE`

**Pagination**:
- Cursor-based pagination for large datasets (future enhancement)
- Offset-based pagination for MVP (with limit on max page)

### 13.2 API Performance

**Response Time Targets**:
- Catalog queries (GET /books): P95 < 300ms
- Detail queries (GET /books/:id): P95 < 150ms
- Mutations (POST, PATCH): P95 < 500ms

**Optimization Techniques**:
- Database connection pooling
- Efficient query patterns (batch loading)
- Avoid over-fetching (select only required fields)
- Compression (gzip) for API responses

### 13.3 Frontend Performance

**Loading Performance**:
- Code splitting (React lazy loading for routes)
- Tree shaking (Vite removes unused code)
- Asset optimization (image compression, lazy loading)
- CDN for static assets

**Runtime Performance**:
- React Query caching reduces redundant API calls
- Debouncing for search inputs
- Virtual scrolling for long lists (future enhancement)
- Memoization for expensive computations

---

## 14. Compliance & Data Governance

### 14.1 Data Privacy

**Minimal Data Collection**:
- Only essential PII collected (name, email, phone, address)
- No sensitive data (credit cards, government IDs) in MVP

**User Rights**:
- Profile updates via member dashboard
- Data deletion on account closure (future: GDPR compliance)

### 14.2 Audit & Compliance

**Audit Logging**:
- All critical actions logged with actor, timestamp, changes
- Audit logs immutable (insert-only table)
- Retention: 1 year minimum

**Data Retention**:
- Active user data: Indefinite
- Closed loans: Archived for historical reference
- Audit logs: 1 year
- Backup retention: 30 days

---

## 15. Future Enhancements

### 15.1 Phase 2 Features

- **Reservations**: Queue system for unavailable books
- **Payment Integration**: Online fine payment (Stripe, Midtrans)
- **Advanced Search**: Faceted search, fuzzy matching, search suggestions
- **Batch Operations**: Bulk book import, bulk copy addition
- **Mobile App**: React Native or Flutter mobile client

### 15.2 Technical Improvements

- **Caching Layer**: Redis for catalog and settings
- **Real-time Updates**: WebSocket for live notifications
- **Advanced Analytics**: Data warehouse integration
- **Multi-language Support**: i18n for UI and emails
- **Accessibility**: WCAG 2.1 AAA compliance
- **Multi-tenant**: Support for multiple libraries

---

## 16. Appendices

### 16.1 Reference Documents

- **Product Requirements Document (PRD)**: `/PRD.md`
- **Entity-Relationship Diagram (ERD)**: `/ERD.md`
- **API Contract (OpenAPI)**: `/api-contract.yaml`

### 16.2 Glossary

- **LMS**: Library Management System
- **JWT**: JSON Web Token
- **RBAC**: Role-Based Access Control
- **ORM**: Object-Relational Mapping
- **DTO**: Data Transfer Object
- **SPA**: Single Page Application
- **SMTP**: Simple Mail Transfer Protocol
- **CDN**: Content Delivery Network
- **APM**: Application Performance Monitoring

### 16.3 Key Assumptions

1. Single library instance (no multi-tenant support)
2. Evergreen memberships (no expiry dates)
3. Approvals enabled by default (configurable)
4. Email-only notifications in MVP
5. Overdue fees calculated but payment processing out of scope
6. English language only in MVP
7. Desktop-first UI design (responsive for mobile)

---

**Document End**

*This TDD serves as the authoritative architectural blueprint for the Library Management System. All implementation decisions should align with the principles, patterns, and technologies outlined herein.*
