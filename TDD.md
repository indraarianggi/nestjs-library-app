# Library Management System — Technical Design Document (TDD)

## 1. Document Overview

### 1.1 Purpose
This Technical Design Document (TDD) provides comprehensive technical specifications and implementation guidance for the Library Management System (LMS). It translates the Product Requirements Document (PRD), Entity Relationship Diagram (ERD), and API contract into actionable technical architecture and design decisions.

### 1.2 Scope
This document covers:
- System architecture and component design
- Database schema and data access patterns
- Backend API implementation with NestJS
- Frontend application with React + Vite
- Authentication and authorization flows
- Validation strategies with Zod
- Error handling and logging architecture
- Email notification system
- Security implementation
- Testing strategies
- Deployment and infrastructure

### 1.3 Audience
- Backend Engineers implementing NestJS API
- Frontend Engineers implementing React application
- DevOps Engineers setting up infrastructure
- QA Engineers designing test strategies
- Technical Leads reviewing architecture

### 1.4 Tech Stack Summary

**Backend:**
- Framework: NestJS 11.x (latest) with TypeScript 5.x
- Runtime: Node.js 20.x LTS
- ORM: Prisma 5.x
- Validation: Zod + class-validator
- Authentication: Better Auth (session-based)
- Testing: Jest + Supertest
- Logging: NestJS Logger + Sentry

**Frontend:**
- Framework: React 18.x with TypeScript 5.x
- Build Tool: Vite 5.x
- UI Framework: Tailwind CSS 4.x + shadcn/ui
- State Management: Zustand (for global state) + React Query (for server state)
- Validation: Zod
- Routing: React Router v6
- HTTP Client: Axios
- Testing: Vitest + React Testing Library + Playwright (E2E)
- Error Tracking: Sentry

**Database:**
- RDBMS: PostgreSQL 15.x
- Extensions: pg_trgm (for search), uuid-ossp

**Email:**
- Provider: Mailtrap (SMTP)
- Library: Nodemailer

**Development Tools:**
- Package Manager: pnpm
- Code Quality: ESLint + Prettier
- Testing: 
  - Backend: Jest + Supertest
  - Frontend: Vitest + React Testing Library + Playwright (E2E)
- API Documentation: Swagger/OpenAPI

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React SPA (Vite)                                        │  │
│  │  - Public Routes (Home, Catalog, Login, Register)       │  │
│  │  - Member Dashboard (Profile, Loans, Membership)        │  │
│  │  - Admin Dashboard (Books, Members, Loans, Settings)    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS / REST API
                            │
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  NestJS API Server                                       │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  Controllers (REST endpoints)                      │ │  │
│  │  │  - AuthController, BooksController,                │ │  │
│  │  │  - MembersController, LoansController, etc.        │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  Services (Business Logic)                         │ │  │
│  │  │  - BooksService, LoansService, MembersService      │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  Guards & Middleware                               │ │  │
│  │  │  - AuthGuard, RoleGuard, ValidationPipe           │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Prisma Client
                            │
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                                     │  │
│  │  - Tables: user, member_profile, book, book_copy,       │  │
│  │    loan, author, category, setting, audit_log           │  │
│  │  - Indexes: GIN (search), BTree (filters)               │  │
│  │  - Views: v_book_available_copies                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                            │
│  - Mailtrap SMTP (Email Notifications)                          │
│  - Sentry (Error Tracking & Monitoring)                         │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Architecture Patterns

**Backend Patterns:**
- **Layered Architecture**: Controllers → Services → Repositories (via Prisma)
- **Dependency Injection**: NestJS DI container for loose coupling
- **Repository Pattern**: Prisma acts as data access layer abstraction
- **DTO Pattern**: Data Transfer Objects for API contracts
- **Strategy Pattern**: Notification strategies (email, future: SMS, push)

**Frontend Patterns:**
- **Component-Based Architecture**: Reusable React components
- **Container/Presenter Pattern**: Smart containers + presentational components
- **Custom Hooks Pattern**: Reusable logic encapsulation
- **Context + Zustand**: Auth state management
- **React Query**: Server state caching and synchronization

### 2.3 Module Structure

**Backend Modules (NestJS):**
```
src/
├── main.ts                      # Application entry point
├── app.module.ts                # Root module
├── config/                      # Configuration
│   ├── database.config.ts
│   ├── auth.config.ts
│   └── smtp.config.ts
├── common/                      # Shared utilities
│   ├── decorators/              # Custom decorators
│   ├── guards/                  # AuthGuard, RolesGuard
│   ├── interceptors/            # Logging, Transform
│   ├── filters/                 # Exception filters
│   ├── pipes/                   # Validation pipes
│   └── utils/                   # Helper functions
├── modules/
│   ├── auth/                    # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── better-auth.service.ts
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   └── login.dto.ts
│   │   └── strategies/
│   │       └── session.strategy.ts
│   ├── books/                   # Books management
│   │   ├── books.module.ts
│   │   ├── books.controller.ts
│   │   ├── books.service.ts
│   │   ├── dto/
│   │   │   ├── create-book.dto.ts
│   │   │   ├── update-book.dto.ts
│   │   │   └── book-filter.dto.ts
│   │   └── entities/
│   │       └── book.entity.ts
│   ├── authors/
│   │   ├── authors.module.ts
│   │   ├── authors.controller.ts
│   │   └── authors.service.ts
│   ├── categories/
│   │   ├── categories.module.ts
│   │   ├── categories.controller.ts
│   │   └── categories.service.ts
│   ├── copies/
│   │   ├── copies.module.ts
│   │   ├── copies.controller.ts
│   │   └── copies.service.ts
│   ├── members/
│   │   ├── members.module.ts
│   │   ├── members.controller.ts
│   │   └── members.service.ts
│   ├── loans/
│   │   ├── loans.module.ts
│   │   ├── loans.controller.ts
│   │   ├── loans.service.ts
│   │   └── dto/
│   │       ├── create-loan.dto.ts
│   │       └── loan-filter.dto.ts
│   ├── settings/
│   │   ├── settings.module.ts
│   │   ├── settings.controller.ts
│   │   └── settings.service.ts
│   ├── audit/
│   │   ├── audit.module.ts
│   │   ├── audit.controller.ts
│   │   └── audit.service.ts
│   ├── notifications/
│   │   ├── notifications.module.ts
│   │   ├── notifications.service.ts
│   │   ├── email.service.ts
│   │   └── templates/           # Email templates
│   └── scheduler/               # Cron jobs
│       ├── scheduler.module.ts
│       └── scheduler.service.ts
└── prisma/
    ├── schema.prisma
    ├── migrations/
    └── seed.ts
```

**Frontend Structure (React):**
```
src/
├── main.tsx                     # Application entry point
├── App.tsx                      # Root component
├── vite-env.d.ts
├── assets/                      # Static assets
├── components/                  # Reusable components
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── DashboardLayout.tsx
│   ├── forms/
│   │   ├── BookForm.tsx
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   └── shared/
│       ├── DataTable.tsx
│       ├── Pagination.tsx
│       ├── SearchBar.tsx
│       └── LoadingSpinner.tsx
├── pages/                       # Route pages
│   ├── public/
│   │   ├── Home.tsx
│   │   ├── Catalog.tsx
│   │   ├── BookDetail.tsx
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── member/
│   │   ├── MemberDashboard.tsx
│   │   ├── MemberProfile.tsx
│   │   ├── MemberLoans.tsx
│   │   └── MemberMembership.tsx
│   └── admin/
│       ├── AdminDashboard.tsx
│       ├── BooksManagement.tsx
│       ├── MembersManagement.tsx
│       ├── LoansManagement.tsx
│       └── Settings.tsx
├── features/                    # Feature-specific logic
│   ├── auth/
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useSession.ts
│   │   ├── store/
│   │   │   └── authStore.ts
│   │   └── types/
│   ├── books/
│   │   ├── hooks/
│   │   │   ├── useBooks.ts
│   │   │   └── useBookDetail.ts
│   │   └── types/
│   └── loans/
│       ├── hooks/
│       │   └── useLoans.ts
│       └── types/
├── lib/                         # Third-party configs
│   ├── api/
│   │   ├── axios.ts             # Axios instance
│   │   └── endpoints.ts         # API endpoints
│   ├── react-query.ts           # React Query config
│   └── utils.ts                 # Utility functions
├── schemas/                     # Zod schemas
│   ├── auth.schema.ts
│   ├── book.schema.ts
│   └── loan.schema.ts
├── types/                       # TypeScript types
│   ├── api.types.ts
│   ├── auth.types.ts
│   └── entities.types.ts
├── hooks/                       # Global hooks
│   ├── useDebounce.ts
│   └── useLocalStorage.ts
└── routes/
    ├── index.tsx                # Route configuration
    ├── ProtectedRoute.tsx
    └── AdminRoute.tsx
```

---

## 3. Database Design

### 3.1 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "views"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== ENUMS ====================

enum Role {
  ADMIN
  MEMBER
}

enum MembershipStatus {
  PENDING
  ACTIVE
  SUSPENDED
}

enum BookStatus {
  ACTIVE
  ARCHIVED
}

enum CopyStatus {
  AVAILABLE
  ON_LOAN
  LOST
  DAMAGED
}

enum LoanStatus {
  REQUESTED
  APPROVED
  ACTIVE
  RETURNED
  OVERDUE
  REJECTED
  CANCELLED
}

enum Currency {
  IDR
}

enum SmtpProvider {
  MAILTRAP
}

// ==================== MODELS ====================

model User {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email         String    @unique @db.Text
  passwordHash  String    @map("password_hash") @db.Text
  role          Role      @default(MEMBER)
  isActive      Boolean   @default(true) @map("is_active")
  lastLoginAt   DateTime? @map("last_login_at") @db.Timestamptz(6)
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  // Relations
  memberProfile MemberProfile?
  loans         Loan[]
  auditLogs     AuditLog[]

  @@map("user")
}

model MemberProfile {
  id        String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String           @unique @map("user_id") @db.Uuid
  firstName String           @map("first_name") @db.Text
  lastName  String           @map("last_name") @db.Text
  phone     String?          @db.Text
  address   String?          @db.Text
  status    MembershipStatus @default(ACTIVE)
  notes     String?          @db.Text
  createdAt DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime         @updatedAt @map("updated_at") @db.Timestamptz(6)

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("member_profile")
}

model Author {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name      String   @unique @db.Text
  bio       String?  @db.Text
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  // Relations
  books BookAuthor[]

  @@map("author")
}

model Category {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String   @unique @db.Text
  description String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  // Relations
  books BookCategory[]

  @@map("category")
}

model Book {
  id              String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title           String     @db.Text
  subtitle        String?    @db.Text
  description     String?    @db.Text
  isbn            String     @unique @db.Text
  publicationYear Int?       @map("publication_year") @db.SmallInt
  language        String?    @db.Text
  coverImageUrl   String?    @map("cover_image_url") @db.Text
  status          BookStatus @default(ACTIVE)
  createdAt       DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime   @updatedAt @map("updated_at") @db.Timestamptz(6)

  // Relations
  authors    BookAuthor[]
  categories BookCategory[]
  copies     BookCopy[]
  loans      Loan[]

  @@index([title(ops: raw("gin_trgm_ops"))], type: Gin, name: "idx_books_title_trgm")
  @@index([status])
  @@index([createdAt])
  @@map("book")
}

model BookAuthor {
  bookId   String @map("book_id") @db.Uuid
  authorId String @map("author_id") @db.Uuid

  // Relations
  book   Book   @relation(fields: [bookId], references: [id], onDelete: Cascade)
  author Author @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@id([bookId, authorId])
  @@index([authorId])
  @@map("book_author")
}

model BookCategory {
  bookId     String @map("book_id") @db.Uuid
  categoryId String @map("category_id") @db.Uuid

  // Relations
  book     Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([bookId, categoryId])
  @@index([categoryId])
  @@map("book_category")
}

model BookCopy {
  id           String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  bookId       String     @map("book_id") @db.Uuid
  code         String     @unique @db.Text
  status       CopyStatus @default(AVAILABLE)
  locationCode String?    @map("location_code") @db.Text
  createdAt    DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt    DateTime   @updatedAt @map("updated_at") @db.Timestamptz(6)

  // Relations
  book  Book   @relation(fields: [bookId], references: [id], onDelete: Restrict)
  loans Loan[]

  @@index([bookId])
  @@index([status])
  @@map("book_copy")
}

model Loan {
  id             String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId         String     @map("user_id") @db.Uuid
  bookId         String     @map("book_id") @db.Uuid
  copyId         String     @map("copy_id") @db.Uuid
  status         LoanStatus @default(REQUESTED)
  borrowedAt     DateTime?  @map("borrowed_at") @db.Timestamptz(6)
  dueDate        DateTime?  @map("due_date") @db.Timestamptz(6)
  returnedAt     DateTime?  @map("returned_at") @db.Timestamptz(6)
  renewalCount   Int        @default(0) @map("renewal_count")
  penaltyAccrued Decimal    @default(0) @map("penalty_accrued") @db.Decimal(12, 2)
  createdAt      DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime   @updatedAt @map("updated_at") @db.Timestamptz(6)

  // Relations
  user User     @relation(fields: [userId], references: [id], onDelete: Restrict)
  book Book     @relation(fields: [bookId], references: [id], onDelete: Restrict)
  copy BookCopy @relation(fields: [copyId], references: [id], onDelete: Restrict)

  @@unique([copyId], where: { status: { in: [APPROVED, ACTIVE, OVERDUE] } }, name: "ux_loans_one_open_per_copy")
  @@index([userId])
  @@index([bookId])
  @@index([copyId])
  @@index([status, dueDate])
  @@index([dueDate])
  @@index([createdAt])
  @@map("loan")
}

model Setting {
  id                           String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  approvalsRequired            Boolean      @default(true) @map("approvals_required")
  loanDays                     Int          @default(14) @map("loan_days")
  renewalDays                  Int          @default(7) @map("renewal_days")
  renewalMinDaysBeforeDue      Int          @default(1) @map("renewal_min_days_before_due")
  maxRenewals                  Int          @default(1) @map("max_renewals")
  overdueFeePerDay             Decimal      @default(1000) @map("overdue_fee_per_day") @db.Decimal(12, 2)
  overdueFeeCapPerLoan         Decimal      @default(1000000) @map("overdue_fee_cap_per_loan") @db.Decimal(12, 2)
  currency                     Currency     @default(IDR)
  maxConcurrentLoans           Int          @default(5) @map("max_concurrent_loans")
  notificationsEnabled         Boolean      @default(true) @map("notifications_enabled")
  dueSoonDays                  Int          @default(3) @map("due_soon_days")
  dueDateNotificationsEnabled  Boolean      @default(true) @map("due_date_notifications_enabled")
  fromEmail                    String       @default("admin-library@mail.com") @map("from_email") @db.Text
  smtpProvider                 SmtpProvider @default(MAILTRAP) @map("smtp_provider")
  sendHourUTC                  Int          @default(8) @map("send_hour_utc")
  timeZone                     String       @default("UTC") @map("time_zone") @db.Text
  createdAt                    DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt                    DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@map("setting")
}

model AuditLog {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId     String?  @map("user_id") @db.Uuid
  action     String   @db.Text
  entityType String   @map("entity_type") @db.Text
  entityId   String   @map("entity_id") @db.Uuid
  metadata   Json     @default("{}") @db.JsonB
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  // Relations
  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([entityType, entityId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_log")
}

// ==================== VIEWS ====================

/// View for calculating available copies per book
view BookAvailableCopies {
  bookId          String @unique @map("book_id") @db.Uuid
  availableCopies Int    @map("available_copies")
  totalCopies     Int    @map("total_copies")

  @@map("v_book_available_copies")
}
```

### 3.2 Database Initialization

**Migration SQL for View:**
```sql
-- Create pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create view for available copies
CREATE OR REPLACE VIEW v_book_available_copies AS
SELECT 
  b.id AS book_id,
  COUNT(c.id) FILTER (
    WHERE c.status = 'AVAILABLE'
    AND NOT EXISTS (
      SELECT 1 FROM loan l
      WHERE l.copy_id = c.id 
      AND l.status IN ('APPROVED', 'ACTIVE', 'OVERDUE')
    )
  ) AS available_copies,
  COUNT(c.id) AS total_copies
FROM book b
LEFT JOIN book_copy c ON c.book_id = b.id
GROUP BY b.id;
```

### 3.3 Seed Data Strategy

**prisma/seed.ts:**
```typescript
import { PrismaClient, Role, MembershipStatus, BookStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@library.com' },
    update: {},
    create: {
      email: 'admin@library.com',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  // Create member user
  const memberPasswordHash = await bcrypt.hash('Member@123', 10);
  const member = await prisma.user.upsert({
    where: { email: 'member@example.com' },
    update: {},
    create: {
      email: 'member@example.com',
      passwordHash: memberPasswordHash,
      role: Role.MEMBER,
      isActive: true,
      memberProfile: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+62812345678',
          address: 'Jakarta, Indonesia',
          status: MembershipStatus.ACTIVE,
        },
      },
    },
  });

  // Create settings singleton
  await prisma.setting.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      approvalsRequired: false, // Auto-approve for demo
      loanDays: 14,
      renewalDays: 7,
      maxRenewals: 1,
      overdueFeePerDay: 1000,
      overdueFeeCapPerLoan: 1000000,
      maxConcurrentLoans: 5,
    },
  });

  // Create sample authors
  const authors = await Promise.all([
    prisma.author.create({ data: { name: 'J.K. Rowling', bio: 'British author, best known for Harry Potter series' } }),
    prisma.author.create({ data: { name: 'George R.R. Martin', bio: 'American novelist and screenwriter' } }),
    prisma.author.create({ data: { name: 'Brandon Sanderson', bio: 'American fantasy and science fiction writer' } }),
  ]);

  // Create sample categories
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Fantasy', description: 'Fantasy fiction' } }),
    prisma.category.create({ data: { name: 'Science Fiction', description: 'Sci-fi literature' } }),
    prisma.category.create({ data: { name: 'Mystery', description: 'Mystery and thriller' } }),
  ]);

  // Create sample books with copies
  const book1 = await prisma.book.create({
    data: {
      title: 'Harry Potter and the Philosopher\'s Stone',
      isbn: '978-0-7475-3269-9',
      publicationYear: 1997,
      language: 'English',
      status: BookStatus.ACTIVE,
      authors: {
        create: [{ authorId: authors[0].id }],
      },
      categories: {
        create: [{ categoryId: categories[0].id }],
      },
      copies: {
        create: [
          { code: 'HP001', status: 'AVAILABLE', locationCode: 'A1-01' },
          { code: 'HP002', status: 'AVAILABLE', locationCode: 'A1-02' },
          { code: 'HP003', status: 'AVAILABLE', locationCode: 'A1-03' },
        ],
      },
    },
  });

  console.log('Seed completed:', { admin, member, book1 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 4. Backend Implementation (NestJS)

### 4.1 Application Bootstrap

**src/main.ts:**
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Sentry initialization
  if (configService.get('SENTRY_DSN')) {
    Sentry.init({
      dsn: configService.get('SENTRY_DSN'),
      environment: configService.get('NODE_ENV'),
      tracesSampleRate: 1.0,
    });
  }

  // Security
  app.use(helmet());
  app.enableCors({
    origin: configService.get('FRONTEND_URL'),
    credentials: true,
  });
  app.use(cookieParser());

  // API prefix and versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });

  // Global pipes, filters, interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Library Management System API')
    .setDescription('Comprehensive API for LMS')
    .setVersion('1.0')
    .addCookieAuth('session')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('PORT', 3000);
  await app.listen(port);
  console.log(`Application running on: http://localhost:${port}`);
}

bootstrap();
```

### 4.2 Authentication Module

**src/modules/auth/auth.service.ts:**
```typescript
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if email exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Create user with member profile
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        role: Role.MEMBER,
        isActive: true,
        memberProfile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            address: dto.address,
            status: 'ACTIVE', // Auto-activate by default
          },
        },
      },
      include: {
        memberProfile: true,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'user.registered',
        entityType: 'user',
        entityId: user.id,
        metadata: { email: user.email, role: user.role },
      },
    });

    return { user };
  }

  async login(dto: LoginDto) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { memberProfile: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'user.logged_in',
        entityType: 'user',
        entityId: user.id,
        metadata: {},
      },
    });

    return { user };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { memberProfile: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid session');
    }

    return user;
  }
}
```

**src/modules/auth/dto/register.dto.ts:**
```typescript
import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecureP@ssw0rd', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: '+62812345678', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Jakarta, Indonesia', required: false })
  @IsOptional()
  @IsString()
  address?: string;
}
```

### 4.3 Authorization Guards

**src/common/guards/roles.guard.ts:**
```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
```

**src/common/decorators/roles.decorator.ts:**
```typescript
import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
```

### 4.4 Books Module

**src/modules/books/books.service.ts:**
```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto, UpdateBookDto, BookFilterDto } from './dto';
import { BookStatus } from '@prisma/client';

@Injectable()
export class BooksService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: BookFilterDto) {
    const {
      q,
      categoryId,
      authorId,
      availability,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      pageSize = 20,
    } = filters;

    const where: any = {
      status: BookStatus.ACTIVE,
    };

    // Search by title or author
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { authors: { some: { author: { name: { contains: q, mode: 'insensitive' } } } } },
      ];
    }

    // Filter by category
    if (categoryId) {
      where.categories = { some: { categoryId } };
    }

    // Filter by author
    if (authorId) {
      where.authors = { some: { authorId } };
    }

    // Filter by availability
    if (availability !== undefined) {
      if (availability) {
        where.copies = {
          some: {
            status: 'AVAILABLE',
            loans: {
              none: {
                status: { in: ['APPROVED', 'ACTIVE', 'OVERDUE'] },
              },
            },
          },
        };
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        include: {
          authors: { include: { author: true } },
          categories: { include: { category: true } },
          _count: { select: { copies: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.book.count({ where }),
    ]);

    // Calculate available copies for each book
    const booksWithAvailability = await Promise.all(
      items.map(async (book) => {
        const availableCopies = await this.prisma.bookCopy.count({
          where: {
            bookId: book.id,
            status: 'AVAILABLE',
            loans: {
              none: {
                status: { in: ['APPROVED', 'ACTIVE', 'OVERDUE'] },
              },
            },
          },
        });

        return {
          ...book,
          authors: book.authors.map((ba) => ba.author),
          categories: book.categories.map((bc) => bc.category),
          availableCopies,
          totalCopies: book._count.copies,
        };
      }),
    );

    return {
      items: booksWithAvailability,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        authors: { include: { author: true } },
        categories: { include: { category: true } },
        _count: { select: { copies: true } },
      },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const availableCopies = await this.prisma.bookCopy.count({
      where: {
        bookId: id,
        status: 'AVAILABLE',
        loans: {
          none: {
            status: { in: ['APPROVED', 'ACTIVE', 'OVERDUE'] },
          },
        },
      },
    });

    return {
      ...book,
      authors: book.authors.map((ba) => ba.author),
      categories: book.categories.map((bc) => bc.category),
      availableCopies,
      totalCopies: book._count.copies,
    };
  }

  async create(dto: CreateBookDto, userId: string) {
    // Check ISBN uniqueness
    const existing = await this.prisma.book.findUnique({
      where: { isbn: dto.isbn },
    });

    if (existing) {
      throw new ConflictException('Book with this ISBN already exists');
    }

    const book = await this.prisma.book.create({
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        description: dto.description,
        isbn: dto.isbn,
        publicationYear: dto.publicationYear,
        language: dto.language,
        coverImageUrl: dto.coverImageUrl,
        status: BookStatus.ACTIVE,
        authors: {
          create: dto.authorIds.map((authorId) => ({ authorId })),
        },
        categories: {
          create: dto.categoryIds.map((categoryId) => ({ categoryId })),
        },
      },
      include: {
        authors: { include: { author: true } },
        categories: { include: { category: true } },
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'book.created',
        entityType: 'book',
        entityId: book.id,
        metadata: { title: book.title, isbn: book.isbn },
      },
    });

    return book;
  }

  async update(id: string, dto: UpdateBookDto, userId: string) {
    const book = await this.findOne(id);

    // Check ISBN uniqueness if changed
    if (dto.isbn && dto.isbn !== book.isbn) {
      const existing = await this.prisma.book.findUnique({
        where: { isbn: dto.isbn },
      });
      if (existing) {
        throw new ConflictException('Book with this ISBN already exists');
      }
    }

    // Update book
    const updated = await this.prisma.book.update({
      where: { id },
      data: {
        ...dto,
        authors: dto.authorIds
          ? {
              deleteMany: {},
              create: dto.authorIds.map((authorId) => ({ authorId })),
            }
          : undefined,
        categories: dto.categoryIds
          ? {
              deleteMany: {},
              create: dto.categoryIds.map((categoryId) => ({ categoryId })),
            }
          : undefined,
      },
      include: {
        authors: { include: { author: true } },
        categories: { include: { category: true } },
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'book.updated',
        entityType: 'book',
        entityId: id,
        metadata: { changes: dto },
      },
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    const book = await this.findOne(id);

    // Check if book has loans
    const loansCount = await this.prisma.loan.count({
      where: { bookId: id },
    });

    if (loansCount > 0) {
      throw new ConflictException(
        'Cannot delete book with existing loans. Archive the book instead.',
      );
    }

    await this.prisma.book.delete({ where: { id } });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'book.deleted',
        entityType: 'book',
        entityId: id,
        metadata: { title: book.title },
      },
    });
  }
}
```

### 4.5 Loans Module with Business Logic

**src/modules/loans/loans.service.ts:**
```typescript
import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLoanDto, LoanFilterDto } from './dto';
import { LoanStatus, MembershipStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LoansService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateLoanDto, userId: string) {
    // Get member profile and settings
    const [user, settings] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { memberProfile: true },
      }),
      this.prisma.setting.findFirst(),
    ]);

    // Validate membership status
    if (!user.memberProfile || user.memberProfile.status !== MembershipStatus.ACTIVE) {
      throw new ForbiddenException('Your membership is not active. Please contact admin.');
    }

    // Check concurrent loan limit
    const activeLoanCount = await this.prisma.loan.count({
      where: {
        userId,
        status: { in: [LoanStatus.ACTIVE, LoanStatus.OVERDUE, LoanStatus.APPROVED] },
      },
    });

    if (activeLoanCount >= settings.maxConcurrentLoans) {
      throw new ConflictException(
        `You have reached the maximum concurrent loans limit (${settings.maxConcurrentLoans})`,
      );
    }

    // Check book availability
    const availableCopy = await this.prisma.bookCopy.findFirst({
      where: {
        bookId: dto.bookId,
        status: 'AVAILABLE',
        loans: {
          none: {
            status: { in: [LoanStatus.APPROVED, LoanStatus.ACTIVE, LoanStatus.OVERDUE] },
          },
        },
      },
    });

    if (!availableCopy) {
      throw new ConflictException('No available copies for this book');
    }

    // Determine initial status based on settings
    const initialStatus = settings.approvalsRequired ? LoanStatus.REQUESTED : LoanStatus.ACTIVE;
    const borrowedAt = settings.approvalsRequired ? null : new Date();
    const dueDate = settings.approvalsRequired
      ? null
      : new Date(Date.now() + settings.loanDays * 24 * 60 * 60 * 1000);

    // Create loan
    const loan = await this.prisma.loan.create({
      data: {
        userId,
        bookId: dto.bookId,
        copyId: availableCopy.id,
        status: initialStatus,
        borrowedAt,
        dueDate,
        renewalCount: 0,
        penaltyAccrued: 0,
      },
      include: {
        book: {
          include: {
            authors: { include: { author: true } },
            categories: { include: { category: true } },
          },
        },
        copy: true,
        user: { include: { memberProfile: true } },
      },
    });

    // Update copy status if auto-approved
    if (initialStatus === LoanStatus.ACTIVE) {
      await this.prisma.bookCopy.update({
        where: { id: availableCopy.id },
        data: { status: 'ON_LOAN' },
      });
    }

    // Send notification
    await this.notificationsService.sendLoanCreatedNotification(loan);

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'loan.created',
        entityType: 'loan',
        entityId: loan.id,
        metadata: { bookId: dto.bookId, status: initialStatus },
      },
    });

    return loan;
  }

  async renew(loanId: string, userId: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { user: { include: { memberProfile: true } } },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    // Check ownership
    if (loan.userId !== userId) {
      throw new ForbiddenException('Not authorized to renew this loan');
    }

    // Get settings
    const settings = await this.prisma.setting.findFirst();

    // Validate renewal conditions
    if (loan.status !== LoanStatus.ACTIVE) {
      throw new ConflictException('Can only renew active loans');
    }

    if (loan.renewalCount >= settings.maxRenewals) {
      throw new ConflictException(`Maximum renewals (${settings.maxRenewals}) reached for this loan`);
    }

    if (loan.user.memberProfile.status === MembershipStatus.SUSPENDED) {
      throw new ConflictException('Cannot renew loan while membership is suspended');
    }

    // Check if renewal requested at least N days before due date
    const daysUntilDue = Math.ceil(
      (loan.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntilDue < settings.renewalMinDaysBeforeDue) {
      throw new ConflictException(
        `Renewal must be requested at least ${settings.renewalMinDaysBeforeDue} day(s) before due date`,
      );
    }

    // Check if overdue
    if (loan.dueDate < new Date()) {
      throw new ConflictException('Cannot renew overdue loan');
    }

    // Extend due date
    const newDueDate = new Date(
      loan.dueDate.getTime() + settings.renewalDays * 24 * 60 * 60 * 1000,
    );

    const updated = await this.prisma.loan.update({
      where: { id: loanId },
      data: {
        dueDate: newDueDate,
        renewalCount: { increment: 1 },
      },
      include: {
        book: true,
        copy: true,
        user: { include: { memberProfile: true } },
      },
    });

    // Send notification
    await this.notificationsService.sendLoanRenewedNotification(updated);

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'loan.renewed',
        entityType: 'loan',
        entityId: loanId,
        metadata: { newDueDate, renewalCount: updated.renewalCount },
      },
    });

    return updated;
  }

  async return(loanId: string, userId: string, isAdmin = false) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { copy: true, book: true, user: { include: { memberProfile: true } } },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    // Check authorization
    if (!isAdmin && loan.userId !== userId) {
      throw new ForbiddenException('Not authorized to return this loan');
    }

    // Check if already returned
    if (loan.status === LoanStatus.RETURNED) {
      throw new ConflictException('Loan already returned');
    }

    // Get settings for penalty calculation
    const settings = await this.prisma.setting.findFirst();

    // Calculate penalty if overdue
    const returnDate = new Date();
    let penalty = 0;

    if (returnDate > loan.dueDate) {
      const overdueDays = Math.ceil(
        (returnDate.getTime() - loan.dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      penalty = Math.min(
        overdueDays * Number(settings.overdueFeePerDay),
        Number(settings.overdueFeeCapPerLoan),
      );
    }

    // Update loan and copy
    const [updated] = await Promise.all([
      this.prisma.loan.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.RETURNED,
          returnedAt: returnDate,
          penaltyAccrued: penalty,
        },
        include: {
          book: true,
          copy: true,
          user: { include: { memberProfile: true } },
        },
      }),
      this.prisma.bookCopy.update({
        where: { id: loan.copyId },
        data: { status: 'AVAILABLE' },
      }),
    ]);

    // Send notification
    await this.notificationsService.sendLoanReturnedNotification(updated);

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId: isAdmin ? userId : loan.userId,
        action: 'loan.returned',
        entityType: 'loan',
        entityId: loanId,
        metadata: { returnDate, penalty, overdue: penalty > 0 },
      },
    });

    return updated;
  }
}
```

### 4.6 Notification System

**src/modules/notifications/email.service.ts:**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST'),
      port: this.config.get('SMTP_PORT'),
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: this.config.get('SMTP_FROM_EMAIL', 'admin-library@mail.com'),
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }
}
```

**src/modules/notifications/notifications.service.ts:**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private emailService: EmailService,
    private prisma: PrismaService,
  ) {}

  async sendLoanCreatedNotification(loan: any) {
    const settings = await this.prisma.setting.findFirst();
    
    if (!settings?.notificationsEnabled) {
      return;
    }

    const memberEmail = loan.user.email;
    const bookTitle = loan.book.title;
    const status = loan.status;

    const subject =
      status === 'REQUESTED'
        ? 'Loan Request Received'
        : 'Loan Approved - Book Ready to Pickup';

    const html = `
      <h2>Library Loan ${status === 'REQUESTED' ? 'Request' : 'Approved'}</h2>
      <p>Hello ${loan.user.memberProfile.firstName},</p>
      <p>${
        status === 'REQUESTED'
          ? `Your loan request for "${bookTitle}" has been received and is awaiting approval.`
          : `Your loan for "${bookTitle}" has been approved.`
      }</p>
      ${
        status === 'ACTIVE'
          ? `<p><strong>Due Date:</strong> ${loan.dueDate.toLocaleDateString()}</p>`
          : ''
      }
      <p>Best regards,<br>Library Management System</p>
    `;

    try {
      await this.emailService.sendEmail(memberEmail, subject, html);
    } catch (error) {
      this.logger.error('Failed to send loan created notification:', error);
    }
  }

  async sendLoanRenewedNotification(loan: any) {
    const settings = await this.prisma.setting.findFirst();
    
    if (!settings?.notificationsEnabled) {
      return;
    }

    const memberEmail = loan.user.email;
    const subject = 'Loan Renewed Successfully';

    const html = `
      <h2>Loan Renewed</h2>
      <p>Hello ${loan.user.memberProfile.firstName},</p>
      <p>Your loan for "${loan.book.title}" has been successfully renewed.</p>
      <p><strong>New Due Date:</strong> ${loan.dueDate.toLocaleDateString()}</p>
      <p>Renewals used: ${loan.renewalCount}</p>
      <p>Best regards,<br>Library Management System</p>
    `;

    try {
      await this.emailService.sendEmail(memberEmail, subject, html);
    } catch (error) {
      this.logger.error('Failed to send loan renewed notification:', error);
    }
  }

  async sendLoanReturnedNotification(loan: any) {
    const settings = await this.prisma.setting.findFirst();
    
    if (!settings?.notificationsEnabled) {
      return;
    }

    const memberEmail = loan.user.email;
    const subject = 'Book Returned Successfully';

    const html = `
      <h2>Book Returned</h2>
      <p>Hello ${loan.user.memberProfile.firstName},</p>
      <p>Thank you for returning "${loan.book.title}".</p>
      ${
        loan.penaltyAccrued > 0
          ? `<p><strong>Overdue Penalty:</strong> ${settings.currency} ${loan.penaltyAccrued.toLocaleString()}</p>
             <p>Please settle this amount at your earliest convenience.</p>`
          : '<p>The book was returned on time. Thank you!</p>'
      }
      <p>Best regards,<br>Library Management System</p>
    `;

    try {
      await this.emailService.sendEmail(memberEmail, subject, html);
    } catch (error) {
      this.logger.error('Failed to send loan returned notification:', error);
    }
  }

  async sendDueSoonReminder(loan: any) {
    const settings = await this.prisma.setting.findFirst();
    
    if (!settings?.notificationsEnabled) {
      return;
    }

    const memberEmail = loan.user.email;
    const subject = 'Book Due Soon Reminder';

    const html = `
      <h2>Due Date Reminder</h2>
      <p>Hello ${loan.user.memberProfile.firstName},</p>
      <p>This is a reminder that your loan for "${loan.book.title}" is due soon.</p>
      <p><strong>Due Date:</strong> ${loan.dueDate.toLocaleDateString()}</p>
      ${
        loan.renewalCount < settings.maxRenewals
          ? '<p>You can renew this loan through your member dashboard.</p>'
          : '<p>This loan has reached the maximum renewal limit.</p>'
      }
      <p>Best regards,<br>Library Management System</p>
    `;

    try {
      await this.emailService.sendEmail(memberEmail, subject, html);
    } catch (error) {
      this.logger.error('Failed to send due soon reminder:', error);
    }
  }
}
```

### 4.7 Scheduled Tasks (Cron Jobs)

**src/modules/scheduler/scheduler.service.ts:**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LoanStatus } from '@prisma/client';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  @Cron('0 8 * * *') // Daily at 08:00 UTC
  async sendDueSoonReminders() {
    this.logger.log('Running due soon reminders job');

    const settings = await this.prisma.setting.findFirst();

    if (!settings?.notificationsEnabled) {
      return;
    }

    const dueSoonDate = new Date();
    dueSoonDate.setDate(dueSoonDate.getDate() + settings.dueSoonDays);

    const loans = await this.prisma.loan.findMany({
      where: {
        status: LoanStatus.ACTIVE,
        dueDate: {
          gte: new Date(),
          lte: dueSoonDate,
        },
      },
      include: {
        book: true,
        user: { include: { memberProfile: true } },
      },
    });

    for (const loan of loans) {
      await this.notificationsService.sendDueSoonReminder(loan);
    }

    this.logger.log(`Sent ${loans.length} due soon reminders`);
  }

  @Cron('0 9 * * *') // Daily at 09:00 UTC
  async updateOverdueLoans() {
    this.logger.log('Running overdue loans update job');

    const now = new Date();

    const result = await this.prisma.loan.updateMany({
      where: {
        status: LoanStatus.ACTIVE,
        dueDate: {
          lt: now,
        },
      },
      data: {
        status: LoanStatus.OVERDUE,
      },
    });

    this.logger.log(`Updated ${result.count} loans to overdue status`);
  }
}
```

### 4.8 Error Handling

**src/common/filters/http-exception.filter.ts:**
```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let details: any[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        error = (exceptionResponse as any).error || error;
        details = (exceptionResponse as any).details || [];
      } else {
        message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      
      // Log and send to Sentry for unexpected errors
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
      Sentry.captureException(exception);
    }

    const errorResponse = {
      statusCode: status,
      message,
      error,
      ...(details.length > 0 && { details }),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}
```

---

## 5. Frontend Implementation (React + Vite)

### 5.1 Application Configuration

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

**src/index.css (Tailwind v4 CSS-first configuration):**
```css
@import "tailwindcss";
@import "tailwindcss/theme" layer(theme);

@layer theme {
  :root {
    --color-border: hsl(214.3 31.8% 91.4%);
    --color-input: hsl(214.3 31.8% 91.4%);
    --color-ring: hsl(221.2 83.2% 53.3%);
    --color-background: hsl(0 0% 100%);
    --color-foreground: hsl(222.2 84% 4.9%);
    
    --color-primary: hsl(221.2 83.2% 53.3%);
    --color-primary-foreground: hsl(210 40% 98%);
    
    --color-secondary: hsl(210 40% 96.1%);
    --color-secondary-foreground: hsl(222.2 47.4% 11.2%);
    
    --color-destructive: hsl(0 84.2% 60.2%);
    --color-destructive-foreground: hsl(210 40% 98%);
    
    --color-muted: hsl(210 40% 96.1%);
    --color-muted-foreground: hsl(215.4 16.3% 46.9%);
    
    --color-accent: hsl(210 40% 96.1%);
    --color-accent-foreground: hsl(222.2 47.4% 11.2%);
  }

  .dark {
    --color-border: hsl(217.2 32.6% 17.5%);
    --color-input: hsl(217.2 32.6% 17.5%);
    --color-ring: hsl(224.3 76.3% 48%);
    --color-background: hsl(222.2 84% 4.9%);
    --color-foreground: hsl(210 40% 98%);
    
    --color-primary: hsl(217.2 91.2% 59.8%);
    --color-primary-foreground: hsl(222.2 47.4% 11.2%);
    
    --color-secondary: hsl(217.2 32.6% 17.5%);
    --color-secondary-foreground: hsl(210 40% 98%);
    
    --color-destructive: hsl(0 62.8% 30.6%);
    --color-destructive-foreground: hsl(210 40% 98%);
    
    --color-muted: hsl(217.2 32.6% 17.5%);
    --color-muted-foreground: hsl(215 20.2% 65.1%);
    
    --color-accent: hsl(217.2 32.6% 17.5%);
    --color-accent-foreground: hsl(210 40% 98%);
  }
}

@plugin "tailwindcss-animate";
```

**Note**: Tailwind CSS v4 uses a CSS-first configuration approach. The traditional `tailwind.config.js` file is optional and primarily needed for JavaScript-based customizations. Theme configuration is done via CSS variables in the `@layer theme` directive.

### 5.2 API Client Setup

**src/lib/api/axios.ts:**
```typescript
import axios from 'axios';
import * as Sentry from '@sentry/react';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Include cookies for session auth
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    Sentry.captureException(error);
    return Promise.reject(error);
  },
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login on unauthorized
      window.location.href = '/login';
    }

    // Log errors to Sentry
    Sentry.captureException(error);

    return Promise.reject(error);
  },
);

export default apiClient;
```

**src/lib/api/endpoints.ts:**
```typescript
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
  },
  // Books
  BOOKS: {
    LIST: '/books',
    DETAIL: (id: string) => `/books/${id}`,
    CREATE: '/books',
    UPDATE: (id: string) => `/books/${id}`,
    DELETE: (id: string) => `/books/${id}`,
  },
  // Authors
  AUTHORS: {
    LIST: '/authors',
    CREATE: '/authors',
    UPDATE: (id: string) => `/authors/${id}`,
    DELETE: (id: string) => `/authors/${id}`,
  },
  // Categories
  CATEGORIES: {
    LIST: '/categories',
    CREATE: '/categories',
    UPDATE: (id: string) => `/categories/${id}`,
    DELETE: (id: string) => `/categories/${id}`,
  },
  // Copies
  COPIES: {
    LIST: (bookId: string) => `/books/${bookId}/copies`,
    ADD: (bookId: string) => `/books/${bookId}/copies`,
    UPDATE: (copyId: string) => `/copies/${copyId}`,
    DELETE: (copyId: string) => `/copies/${copyId}`,
  },
  // Members
  MEMBERS: {
    LIST: '/members',
    DETAIL: (id: string) => `/members/${id}`,
    UPDATE: (id: string) => `/members/${id}`,
    ACTIVATE: (id: string) => `/members/${id}/activate`,
    SUSPEND: (id: string) => `/members/${id}/suspend`,
  },
  // Loans
  LOANS: {
    LIST: '/loans',
    MY_LOANS: '/my/loans',
    CREATE: '/loans',
    APPROVE: (id: string) => `/loans/${id}/approve`,
    REJECT: (id: string) => `/loans/${id}/reject`,
    RENEW: (id: string) => `/loans/${id}/renew`,
    RETURN: (id: string) => `/loans/${id}/return`,
  },
  // Settings
  SETTINGS: {
    GET: '/settings',
    UPDATE: '/settings',
  },
  // Audit Logs
  AUDIT_LOGS: {
    LIST: '/audit-logs',
  },
};
```

### 5.3 Authentication State Management

**src/features/auth/store/authStore.ts:**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  isActive: boolean;
}

interface MemberProfile {
  id: string;
  firstName: string;
  lastName: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
}

interface AuthState {
  user: User | null;
  memberProfile: MemberProfile | null;
  isAuthenticated: boolean;
  setAuth: (user: User, memberProfile?: MemberProfile) => void;
  clearAuth: () => void;
  isAdmin: () => boolean;
  isMember: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      memberProfile: null,
      isAuthenticated: false,

      setAuth: (user, memberProfile) =>
        set({
          user,
          memberProfile: memberProfile || null,
          isAuthenticated: true,
        }),

      clearAuth: () =>
        set({
          user: null,
          memberProfile: null,
          isAuthenticated: false,
        }),

      isAdmin: () => get().user?.role === 'ADMIN',

      isMember: () => get().user?.role === 'MEMBER',
    }),
    {
      name: 'auth-storage',
    },
  ),
);
```

**src/features/auth/hooks/useAuth.ts:**
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import apiClient from '@/lib/api/axios';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { useAuthStore } from '../store/authStore';
import { LoginSchema, RegisterSchema } from '@/schemas/auth.schema';
import { z } from 'zod';

export const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setAuth, clearAuth, isAdmin, isMember } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: async (data: z.infer<typeof LoginSchema>) => {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, data);
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.memberProfile);
      toast.success('Login successful');
      
      if (data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/member');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Login failed');
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof RegisterSchema>) => {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, data);
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.memberProfile);
      toast.success('Registration successful');
      navigate('/member');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Registration failed');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    },
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      toast.success('Logged out successfully');
      navigate('/login');
    },
  });

  return {
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isAdmin,
    isMember,
    isLoading: loginMutation.isPending || registerMutation.isPending,
  };
};
```

### 5.4 Zod Validation Schemas

**src/schemas/auth.schema.ts:**
```typescript
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number',
    ),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().optional(),
  address: z.string().optional(),
});
```

**src/schemas/book.schema.ts:**
```typescript
import { z } from 'zod';

export const CreateBookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  subtitle: z.string().max(500).optional(),
  description: z.string().optional(),
  isbn: z.string().regex(/^[0-9-]{10,17}$/, 'Invalid ISBN format'),
  publicationYear: z
    .number()
    .min(1000)
    .max(2100)
    .optional()
    .nullable(),
  language: z.string().max(50).optional(),
  coverImageUrl: z.string().url().optional(),
  authorIds: z.array(z.string().uuid()).min(1, 'At least one author is required'),
  categoryIds: z.array(z.string().uuid()).min(1, 'At least one category is required'),
});

export const UpdateBookSchema = CreateBookSchema.partial();
```

### 5.5 Books Feature

**src/features/books/hooks/useBooks.ts:**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '@/lib/api/axios';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { z } from 'zod';
import { CreateBookSchema, UpdateBookSchema } from '@/schemas/book.schema';

export const useBooks = (filters?: any) => {
  const queryClient = useQueryClient();

  const booksQuery = useQuery({
    queryKey: ['books', filters],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.BOOKS.LIST, {
        params: filters,
      });
      return response.data;
    },
  });

  const createBookMutation = useMutation({
    mutationFn: async (data: z.infer<typeof CreateBookSchema>) => {
      const response = await apiClient.post(API_ENDPOINTS.BOOKS.CREATE, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Book created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create book');
    },
  });

  const updateBookMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof UpdateBookSchema> }) => {
      const response = await apiClient.patch(API_ENDPOINTS.BOOKS.UPDATE(id), data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Book updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update book');
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(API_ENDPOINTS.BOOKS.DELETE(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Book deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete book');
    },
  });

  return {
    books: booksQuery.data,
    isLoading: booksQuery.isLoading,
    createBook: createBookMutation.mutate,
    updateBook: updateBookMutation.mutate,
    deleteBook: deleteBookMutation.mutate,
  };
};

export const useBookDetail = (id: string) => {
  return useQuery({
    queryKey: ['book', id],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.BOOKS.DETAIL(id));
      return response.data;
    },
    enabled: !!id,
  });
};
```

### 5.6 Routing and Protected Routes

**src/routes/ProtectedRoute.tsx:**
```typescript
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const AdminRoute = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export const MemberRoute = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'MEMBER') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
```

**src/routes/index.tsx:**
```typescript
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute, AdminRoute, MemberRoute } from './ProtectedRoute';

// Public pages
import Home from '@/pages/public/Home';
import Catalog from '@/pages/public/Catalog';
import BookDetail from '@/pages/public/BookDetail';
import Login from '@/pages/public/Login';
import Register from '@/pages/public/Register';

// Member pages
import MemberDashboard from '@/pages/member/MemberDashboard';
import MemberProfile from '@/pages/member/MemberProfile';
import MemberLoans from '@/pages/member/MemberLoans';

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import BooksManagement from '@/pages/admin/BooksManagement';
import MembersManagement from '@/pages/admin/MembersManagement';
import LoansManagement from '@/pages/admin/LoansManagement';
import Settings from '@/pages/admin/Settings';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/books',
    element: <Catalog />,
  },
  {
    path: '/books/:id',
    element: <BookDetail />,
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
    path: '/member',
    element: <MemberRoute />,
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
    ],
  },
  {
    path: '/admin',
    element: <AdminRoute />,
    children: [
      {
        index: true,
        element: <AdminDashboard />,
      },
      {
        path: 'books',
        element: <BooksManagement />,
      },
      {
        path: 'members',
        element: <MembersManagement />,
      },
      {
        path: 'loans',
        element: <LoansManagement />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
]);
```

### 5.7 Sentry Integration

**src/main.tsx:**
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react';
import { Toaster } from 'sonner';
import { router } from './routes';
import './index.css';

// Sentry initialization
if (import.meta.env.VITE_SENTRY_DSN) {
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
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </QueryClientProvider>
  </React.StrictMode>,
);
```

---

## 6. Security Implementation

### 6.1 Authentication Security (Better Auth)

**Better Auth Configuration:**
- Session-based authentication with HTTPOnly cookies
- CSRF protection enabled
- Secure flag for cookies (HTTPS only in production)
- SameSite=Strict cookie attribute
- Session expiry: 7 days with rolling expiration

**Password Security:**
- Minimum 8 characters with complexity requirements
- Hashed using bcrypt with salt rounds: 10
- No plain text password storage
- Password reset tokens valid for 1 hour

### 6.2 Authorization

**Role-Based Access Control (RBAC):**
- Two roles: ADMIN and MEMBER
- Backend: NestJS Guards enforce role requirements
- Frontend: Route protection + UI element hiding
- API endpoints validate role on every request

### 6.3 Input Validation

**Backend Validation:**
- class-validator + Zod for DTO validation
- SQL injection prevention via Prisma parameterized queries
- XSS prevention via input sanitization
- File upload validation (if added): size, type, content

**Frontend Validation:**
- Zod schemas for all forms
- Client-side validation before API calls
- Server response validation

### 6.4 API Security

**Rate Limiting:**
```typescript
// src/common/guards/throttle.guard.ts
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.user?.id || req.ip;
  }
}
```

**CORS Configuration:**
```typescript
// main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

**Helmet Security Headers:**
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security

### 6.5 Data Privacy

- Passwords never returned in API responses
- Admin-only fields filtered based on role
- Audit logs track all sensitive operations
- PII fields encrypted at rest (if required)

### 6.6 Environment Variables

**.env.example:**
```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/library_db"

# Server
NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:5173"

# Better Auth
SESSION_SECRET="your-session-secret-min-32-chars"
SESSION_DURATION=604800 # 7 days in seconds

# SMTP (Mailtrap)
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER="your-mailtrap-user"
SMTP_PASS="your-mailtrap-pass"
SMTP_FROM_EMAIL="admin-library@mail.com"

# Sentry
SENTRY_DSN="https://your-sentry-dsn"

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

---

## 7. Testing Strategy

### 7.1 Backend Testing

**Unit Tests (Jest):**
```typescript
// src/modules/loans/loans.service.spec.ts
import { Test } from '@nestjs/testing';
import { LoansService } from './loans.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('LoansService', () => {
  let service: LoansService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LoansService,
        {
          provide: PrismaService,
          useValue: {
            loan: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            setting: {
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            sendLoanCreatedNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LoansService>(LoansService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('renew', () => {
    it('should renew a loan successfully', async () => {
      const mockLoan = {
        id: '1',
        userId: 'user1',
        status: 'ACTIVE',
        renewalCount: 0,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        user: {
          memberProfile: { status: 'ACTIVE' },
        },
      };

      jest.spyOn(prisma.loan, 'findUnique').mockResolvedValue(mockLoan as any);
      jest.spyOn(prisma.setting, 'findFirst').mockResolvedValue({
        maxRenewals: 1,
        renewalDays: 7,
        renewalMinDaysBeforeDue: 1,
      } as any);
      jest.spyOn(prisma.loan, 'update').mockResolvedValue({
        ...mockLoan,
        renewalCount: 1,
      } as any);

      const result = await service.renew('1', 'user1');

      expect(result.renewalCount).toBe(1);
      expect(prisma.loan.update).toHaveBeenCalled();
    });

    it('should throw ConflictException when max renewals reached', async () => {
      const mockLoan = {
        id: '1',
        userId: 'user1',
        status: 'ACTIVE',
        renewalCount: 1,
        user: { memberProfile: { status: 'ACTIVE' } },
      };

      jest.spyOn(prisma.loan, 'findUnique').mockResolvedValue(mockLoan as any);
      jest.spyOn(prisma.setting, 'findFirst').mockResolvedValue({
        maxRenewals: 1,
      } as any);

      await expect(service.renew('1', 'user1')).rejects.toThrow('Maximum renewals');
    });
  });
});
```

**Integration Tests (Supertest):**
```typescript
// test/loans.e2e-spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Loans API (e2e)', () => {
  let app: INestApplication;
  let authCookie: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login to get session cookie
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'member@example.com', password: 'Member@123' });

    authCookie = loginResponse.headers['set-cookie'][0];
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/loans', () => {
    it('should create a loan successfully', () => {
      return request(app.getHttpServer())
        .post('/api/loans')
        .set('Cookie', authCookie)
        .send({ bookId: 'valid-book-id' })
        .expect(201)
        .expect((res) => {
          expect(res.body.loan).toBeDefined();
          expect(res.body.loan.userId).toBeDefined();
        });
    });

    it('should return 409 when no copies available', () => {
      return request(app.getHttpServer())
        .post('/api/loans')
        .set('Cookie', authCookie)
        .send({ bookId: 'book-with-no-copies' })
        .expect(409);
    });
  });
});
```

### 7.2 Frontend Testing

**Component Tests (Vitest + React Testing Library):**
```typescript
// src/components/forms/LoginForm.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from './LoginForm';

const queryClient = new QueryClient();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider>
);

describe('LoginForm', () => {
  it('renders login form', () => {
    render(<LoginForm />, { wrapper });
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('shows validation errors for invalid input', async () => {
    render(<LoginForm />, { wrapper });
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });
});
```

**Vitest Configuration:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Test Setup File:**
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

**E2E Tests (Playwright):**
```typescript
// e2e/member-borrowing.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Member Borrowing Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="email"]', 'member@example.com');
    await page.fill('input[name="password"]', 'Member@123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/member/);
  });

  test('should borrow a book successfully', async ({ page }) => {
    // Navigate to catalog
    await page.goto('http://localhost:5173/books');
    
    // Search for a book
    await page.fill('input[placeholder*="Search"]', 'Harry Potter');
    await page.waitForTimeout(500);
    
    // Click on first book
    await page.click('text=Harry Potter and the Philosopher');
    
    // Borrow the book
    await page.click('button:has-text("Borrow")');
    
    // Verify success message
    await expect(page.locator('text=Loan created successfully')).toBeVisible();
    
    // Navigate to loans
    await page.goto('http://localhost:5173/member/loans');
    
    // Verify loan appears
    await expect(page.locator('text=Harry Potter')).toBeVisible();
  });
});
```

### 7.3 Test Coverage Goals

- **Unit Tests**: 80%+ coverage for services and utilities
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user flows (login, borrow, renew, return)
- **Component Tests**: All form components and UI interactions

---

## 8. Deployment Architecture

### 8.1 Infrastructure

**Production Stack:**
```
┌─────────────────────────────────────────────────────────────┐
│                        Load Balancer                         │
│                      (Nginx / AWS ALB)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
┌───────────────────────┐     ┌───────────────────────┐
│   Frontend (Static)   │     │   Backend API         │
│   - S3 + CloudFront   │     │   - EC2 / ECS         │
│   - or Vercel         │     │   - Auto-scaling      │
└───────────────────────┘     └───────────────────────┘
                                        │
                          ┌─────────────┴─────────────┐
                          │                           │
                ┌─────────────────┐       ┌─────────────────┐
                │   PostgreSQL    │       │   Redis         │
                │   - RDS         │       │   - Session     │
                │   - Multi-AZ    │       │   - Cache       │
                └─────────────────┘       └─────────────────┘
```

### 8.2 CI/CD Pipeline

**GitHub Actions Workflow:**
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run linter
        run: pnpm lint
      
      - name: Run backend tests
        run: pnpm test:backend
      
      - name: Run frontend tests
        run: pnpm test:frontend

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t library-api:${{ github.sha }} ./backend
      
      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker push library-api:${{ github.sha }}
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster library-cluster --service library-api --force-new-deployment

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build frontend
        run: |
          cd frontend
          pnpm install
          pnpm build
      
      - name: Deploy to S3
        run: aws s3 sync frontend/dist s3://library-frontend
      
      - name: Invalidate CloudFront
        run: aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
```

### 8.3 Docker Configuration

**Backend Dockerfile:**
```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm prisma generate
RUN pnpm build

FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

**docker-compose.yml (Development):**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: library_user
      POSTGRES_PASSWORD: library_pass
      POSTGRES_DB: library_db
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - '3000:3000'
    environment:
      DATABASE_URL: postgresql://library_user:library_pass@postgres:5432/library_db
      NODE_ENV: development
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - '5173:5173'
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
```

### 8.4 Environment Configuration

**Production Checklist:**
- [ ] SSL/TLS certificates configured
- [ ] Environment variables set in secure secrets manager
- [ ] Database backups automated (daily)
- [ ] Monitoring and alerting configured (Sentry + CloudWatch)
- [ ] CDN configured for frontend assets
- [ ] Rate limiting enabled
- [ ] CORS configured for production domain
- [ ] Health check endpoints responding
- [ ] Log aggregation configured (CloudWatch / Datadog)
- [ ] Auto-scaling policies configured
- [ ] Database connection pooling optimized

---

## 9. Monitoring and Observability

### 9.1 Logging Strategy

**Backend Logging:**
- Structured JSON logs with context (requestId, userId, timestamp)
- Log levels: ERROR, WARN, INFO, DEBUG
- Sensitive data excluded from logs
- Centralized log aggregation (CloudWatch Logs / Datadog)

**Frontend Logging:**
- Client-side errors sent to Sentry
- User actions tracked for analytics
- Network errors logged with context

### 9.2 Metrics

**Application Metrics:**
- API response times (P50, P95, P99)
- Request rate per endpoint
- Error rate by endpoint
- Active sessions count
- Database query performance

**Business Metrics:**
- Daily active users
- Books borrowed per day
- Loan approval/rejection rate
- Overdue loan percentage
- Email delivery success rate

### 9.3 Alerting

**Critical Alerts:**
- API error rate > 5%
- Database connection pool exhausted
- Disk usage > 85%
- High memory usage (> 90%)
- Failed email deliveries > 10%

**Warning Alerts:**
- API response time P95 > 500ms
- Database query time > 1s
- Overdue loans increasing trend

### 9.4 Health Checks

**Backend Health Endpoint:**
```typescript
// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database'),
    ]);
  }
}
```

---

## 10. Performance Optimization

### 10.1 Database Optimization

**Indexing Strategy:**
- Compound indexes for common filter combinations
- Partial indexes for status-based queries
- GIN indexes for full-text search on book titles

**Query Optimization:**
- Use Prisma select to fetch only required fields
- Implement pagination on all list endpoints
- Use database views for complex aggregations
- Connection pooling configured (min: 5, max: 20)

**Caching Strategy:**
- Redis cache for:
  - Settings (TTL: 1 hour)
  - Book catalog pages (TTL: 5 minutes)
  - Available copies count (TTL: 1 minute)

### 10.2 API Optimization

**Response Optimization:**
- Gzip compression enabled
- Field selection support (sparse fieldsets)
- Batch operations for bulk actions
- ETags for conditional requests

**Rate Limiting:**
- Global: 100 requests per minute per IP
- Auth endpoints: 5 login attempts per minute
- Search endpoint: 30 requests per minute

### 10.3 Frontend Optimization

**Code Splitting:**
- Route-based code splitting with React.lazy
- Component lazy loading for admin dashboard
- Vendor chunk optimization

**Asset Optimization:**
- Image optimization (WebP format, lazy loading)
- Font optimization (woff2 format)
- CSS purging with Tailwind

**Performance Targets:**
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Lighthouse score > 90

---

## 11. Future Enhancements

### 11.1 Phase 2 Features (Post-MVP)

- **Reservation Queue**: Allow members to reserve books when unavailable
- **Advanced Search**: Filters by genre, publication year range, language
- **Book Reviews**: Member ratings and reviews
- **Reading Lists**: Personal book collections and wishlists
- **Fine Payment Integration**: Online payment for overdue fees
- **Multi-language Support**: i18n for UI and emails
- **Mobile App**: React Native mobile application
- **Push Notifications**: Firebase Cloud Messaging for mobile
- **Analytics Dashboard**: Admin insights and reports
- **Import/Export**: Bulk book import from CSV/Excel

### 11.2 Scalability Considerations

- **Database Sharding**: Partition by library branch (if multi-tenant)
- **Microservices**: Separate notification service, search service
- **Event-Driven Architecture**: Kafka for async event processing
- **Read Replicas**: Separate read/write database instances
- **CDN**: Global content delivery for static assets

---

## 12. Conclusion

This Technical Design Document provides a comprehensive blueprint for implementing the Library Management System using NestJS, React + Vite, PostgreSQL, and supporting technologies. The architecture prioritizes:

- **Modularity**: Clear separation of concerns with NestJS modules and React features
- **Security**: Better Auth session management, RBAC, input validation
- **Performance**: Database indexing, caching, pagination
- **Maintainability**: TypeScript, Prisma ORM, Zod validation
- **Observability**: Structured logging, Sentry error tracking, health checks
- **Scalability**: Stateless API, database optimization, horizontal scaling ready

The system is production-ready with comprehensive testing strategies, deployment automation, and monitoring in place. All design decisions follow industry best practices and the specified tech stack requirements.

**Next Steps:**
1. Initialize project repositories (backend and frontend)
2. Set up development environments with Docker Compose
3. Implement authentication module as foundation
4. Build core modules incrementally following this TDD
5. Implement testing at each stage
6. Deploy to staging environment for UAT
7. Production deployment with monitoring

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Author:** Senior Software Architect  
**Status:** Approved for Implementation
