# Library Management System (Web) — Product Requirements Document (PRD)

## 1) Overview and Goals

- Product: Web-based Library Management System (LMS)
- Stack: TypeScript, NestJS (backend), React + Vite (frontend), Tailwind CSS + shadcn/ui (UI), PostgreSQL + Prisma ORM (DB), Better Auth (authentication)
- Roles: Admin, Member
- Summary: Provide an end-to-end library management solution enabling administrators to manage books and memberships, and members/public users to browse, borrow, and manage loans. Membership is evergreen (no expiry) and can be suspended by Admin. Include email notifications for key loan events.

Goals

- Enable efficient catalog administration (books, authors, categories/genres, copies/stock).
- Provide reliable membership lifecycle management (activation, suspension, status visibility) with evergreen membership.
- Support member borrowing with availability checks, due dates, single renewal per loan, returns, and overdue handling.
- Deliver a performant, secure public catalog with search, filters, and a borrow action respecting auth and availability.

## 2) Success Metrics / KPIs

- Admin efficiency: < 3 minutes to add a new book with copies; < 1 minute to update stock.
- Catalog discoverability: Search/filter latency P95 < 300 ms (server-side); result CTR > 15% per session.
- Borrow flow success: > 95% successful borrow attempts when copies are available; < 1% failed due to system errors.
- Membership activation time: 90% of sign-ups activated instantly (auto-approval default); manual approvals resolved < 24h.
- Data integrity: Zero orphan copies or loans in weekly integrity checks.

## 3) In-Scope vs Out-of-Scope

In Scope (MVP)

- Admin Dashboard: CRUD for books, authors, categories/genres, copies/stock; manage memberships (approve/activate, suspend, profile updates); monitor borrowing & returns; basic overdue fee calculation.
- Member Dashboard: View membership status and profile, borrowing history, active loans, and renewals (single renewal per loan).
- Public Website: Home, Catalog (search, filter, sorting), Book detail, Borrow action (requires auth), Login/Register.
- Authentication & Authorization: Better Auth for authN; role-based authZ; session handling.
- Borrowing Policy (default): 14-day loan, one renewal per loan (+7 days), overdue fee per day (configurable, currency IDR), no reservations queue in MVP.
- Notifications (Email via SMTP/Mailtrap): Loan created/approved/rejected, loan returned confirmations, due-soon (3 days before due date at 08:00 UTC), and due-date notifications (08:00 UTC). No overdue reminders in MVP. From email: admin-library@mail.com.

Out of Scope (MVP)

- Payments processing for fines/fees, online checkout, invoicing.
- eBook/DRM integrations; self-checkout kiosks; barcode scanning.
- Inter-library loans; advanced acquisition workflows.
- Multi-tenant libraries; complex role hierarchies beyond Admin/Member.
- Push/SMS notifications; notification preference center (beyond basic email) — future scope.

## 4) User Personas and Roles

- Admin

  - Needs: Fast catalog and membership management; visibility into loans, overdue items, and penalties.
  - Pain points: Data consistency, bulk updates, tracking overdue items efficiently.

- Member
  - Needs: Simple discovery, transparent availability, frictionless borrow/renew/return; clear due dates and penalties.
  - Pain points: Unclear status, inability to renew, surprise overdue fees.

## 5) User Stories and Acceptance Criteria

### A) Admin Dashboard

1. Manage Books (CRUD)

- As an Admin, I can create, edit, and delete books, including authors and categories/genres, and manage copies to control stock/availability.
  - Acceptance Criteria
    - Given valid book data, when I create a book, then it appears in the catalog with 200 OK and persisted fields.
    - Given existing books, when I update title/author/category/metadata, then changes are reflected in list and detail views.
    - Given a book with no active loans on any copies, when I delete it, then all related copies are soft-deleted/archived; if loans exist, deletion is blocked with clear error.
    - Given a book, when I add N copies, then available copies increase by N; copies cannot be removed if currently on loan.

2. Manage Memberships

- As an Admin, I can activate, suspend, or update member profiles and view membership status.
  - Acceptance Criteria
    - When I approve/activate a pending member, status = active, and the member can borrow immediately.
    - When I suspend a member, their new borrow actions are blocked; active loans remain but renewals are blocked.
    - Profile updates validate fields and audit-log the change.

3. Monitor Borrowing & Returns

- As an Admin, I can view borrowing requests, active loans, overdue items, returns, and penalties.
  - Acceptance Criteria
    - Loans list supports filters (status, due date window, member, book) and pagination/sorting.
    - Overdue loans are highlighted with computed penalty.
    - Returns set copy to available and close the loan with return date.
    - If approvals are enabled (config), Admin can approve or reject requested loans; otherwise loans are auto-approved.

### B) Member Dashboard

1. Manage Membership

- As a Member, I can view my membership status and profile.
  - Acceptance Criteria
    - Membership status shows one of: pending, active, suspended (no expiry state).

2. Track Borrowing

- As a Member, I can view active loans, due dates, renewals (single renewal per loan), and past loans.
  - Acceptance Criteria
    - Active loans display due date, renewal remaining count, and penalty if overdue.
    - Renewal succeeds only if: loan status = active, copies allow renewals, renewal count < 1, and no member suspension.
    - History lists past loans with return dates.

### C) Public Website

1. Home Page

- As a visitor, I can view a simple landing with access to catalog, login, register.
  - Acceptance Criteria: Links visible; no PII displayed.

2. Catalog (Search & Filter)

- As a visitor/member, I can search by title/author, filter by category/genre, availability, and sort by relevance/title/recent.
  - Acceptance Criteria
    - Server-side pagination with default pageSize=20, max=100.
    - Response time P95 < 300 ms (server) for typical queries on indexed columns.

3. Book Detail & Borrow Action

- As a visitor, I can view details (title, authors, categories, description, available copies). As a member, I can initiate a borrow if copies are available.
  - Acceptance Criteria
    - Borrow button visible to authenticated members with active membership and available copies > 0.
    - Borrow creates a loan with due date based on policy; copy availability decreases by 1.
    - If approvals enabled, loan is created in requested status and not counted as active until approved.

4. Authentication Pages

- As a visitor, I can register and log in.
  - Acceptance Criteria: Registration creates a Member user; email/password validated via Better Auth; login establishes secure session.

## 6) Information Architecture & Navigation

Sitemaps

- Public/Member

  - Home (/)
  - Catalog (/books)
    - Book Detail (/books/:id)
  - Login (/login)
  - Register (/register)
  - Member Dashboard (/member)
    - Profile (/member/profile)
    - Membership (/member/membership)
    - Loans (/member/loans)

- Admin Dashboard (/admin)
  - Overview (/admin)
  - Books (/admin/books)
    - Create/Edit (/admin/books/new, /admin/books/:id/edit)
    - Copies (/admin/books/:id/copies)
  - Authors (/admin/authors)
  - Categories (/admin/categories)
  - Memberships (/admin/members)
    - Detail (/admin/members/:id)
  - Loans (/admin/loans)
    - Overdue (/admin/loans?status=overdue)
  - Settings (policy) (/admin/settings)

## 7) Functional Requirements

### A) Books Management

- Fields: title, subtitle, description, ISBN (unique), publicationYear, language, coverImageURL, categories (many-to-many), authors (many-to-many), copies (1..N), status (active/archived).
- Copies: uniquely identified, status (available, on_loan, lost, damaged), locationCode (optional), barcode (optional, unique if used).
- Actions: Create/Update/Delete book; add/remove copies (remove only if copy not on loan); archive book if any historical loans exist.
- Validation: Unique ISBN; at least one author and one category recommended (not mandatory for MVP); cannot delete book with active or historical loans (archive instead).

### B) Membership Management

- Member profile: firstName, lastName, email (unique), phone (optional), address (optional), membershipStatus (pending, active, suspended), notes (admin-only).
- Evergreen membership: no expiry date; Admin may suspend to restrict borrowing/renewals.
- Actions: Admin approve/activate; suspend; update profile fields.
- Rules: Suspended cannot borrow/renew; Pending cannot borrow until activated.

### C) Borrowing & Returns Monitoring

- Borrow policy (default, configurable in settings):
  - Loan period: 14 days; Renewal: 1 time per loan for +7 days; Overdue fee: configurable per-day amount in IDR; Max concurrent active loans per member: 5.
- Borrow Flow
  1. Availability check on Book: availableCopies > 0.
  2. If member active and below concurrent-loan limit, create Loan with dueDate = today + 14 days, decrement available copy.
  3. If approvals enabled (system setting), loan status = requested; Admin must approve -> active; otherwise auto-approve to active.

4. Renewal: allowed if policy permits and loan not overdue/suspended; renewalCount must be < 1; renewal must be requested at least 1 day before due date.
5. Return: set loan returnedAt; copy -> available; compute overdue days and fee (IDR), capped at Settings.overdueFeeCapPerLoan.

- Admin Monitoring: Lists for requested, active, overdue; actions to approve/reject, mark returned, waive/adjust fees (MVP: adjust allowed; payment out of scope).

### D) Public Catalog

- Search: by title, author name; Filter: categories/genres, availability; Sort: relevance (default), title asc/desc, newest.
- Book Detail: show metadata, authors, categories, availability count.
- Borrow Action: available to authenticated active members; if not authed -> redirect to login; if suspended -> error.

### E) Authentication, Authorization, Session (Better Auth)

- AuthN: Email/password via Better Auth; secure cookies (HTTPOnly, SameSite=Lax/Strict), CSRF protection for state-changing actions.
- AuthZ: Role-based (Admin vs Member); server-side guards for NestJS controllers; client routes protected in React.
- Session: Rolling session expiry (e.g., 7 days); logout invalidates session; device/session management optional later.

### F) Notifications (Email)

- Channel: Email only via SMTP (MVP). Provider: Mailtrap.
- Triggers: loan created (requested/active), loan approved/rejected, due-soon reminder (3 days before due at 08:00 UTC), due-date notification (on due date at 08:00 UTC), loan returned confirmation. No overdue reminders in MVP.
- Content: Minimal branded templates; English; links to relevant pages. From email: admin-library@mail.com.
- Configuration (in Settings): enable/disable notifications, dueSoonDays (default 3), dueDateNotificationsEnabled (default true), fromEmail (default "admin-library@mail.com"), smtpProvider (enum: MAILTRAP), sendHourUTC (int, default 8), timeZone (string, default "UTC").

## 8) Data Model (ERD-Level)

Entities (Prisma-friendly; IDs as cuid/uuid; timestamps createdAt/updatedAt)

- User

  - id, email (unique), passwordHash, role (enum: ADMIN, MEMBER), isActive (bool), lastLoginAt
  - 1:1 MemberProfile (nullable for Admin)

- MemberProfile

  - id, userId (unique FK->User), firstName, lastName, phone?, address?, status (enum: PENDING, ACTIVE, SUSPENDED), notes?

- Author

  - id, name (unique), bio?

- Category

  - id, name (unique), description?

- Book

  - id, title, subtitle?, description?, isbn (unique), publicationYear?, language?, coverImageURL?, status (enum: ACTIVE, ARCHIVED)

- BookAuthor (join)

  - bookId, authorId (composite PK unique)

- BookCategory (join)

  - bookId, categoryId (composite PK unique)

- BookCopy

  - id, bookId (FK), code (unique, e.g., barcode or generated), status (enum: AVAILABLE, ON_LOAN, LOST, DAMAGED), locationCode?
  - Constraint: At most one active loan per copy at a time.

- Loan

  - id, userId (FK->User), bookId (FK->Book), copyId (FK->BookCopy), status (enum: REQUESTED, APPROVED, ACTIVE, RETURNED, OVERDUE, REJECTED, CANCELLED)
  - borrowedAt, dueDate, returnedAt?, renewalCount (int, default 0)
  - penaltyAccrued (numeric, default 0)
  - Constraint: copyId unique where status in (APPROVED, ACTIVE, OVERDUE) — enforced via partial index or app logic.

- Setting (singleton rows)

  - id, approvalsRequired (bool, default true), loanDays (int, default 14), renewalDays (int, default 7), renewalMinDaysBeforeDue (int, default 1), maxRenewals (int, default 1), overdueFeePerDay (numeric, default 1000), overdueFeeCapPerLoan (numeric, default 1000000), currency (enum: IDR), maxConcurrentLoans (int, default 5), notificationsEnabled (bool, default true), dueSoonDays (int, default 3), dueDateNotificationsEnabled (bool, default true), fromEmail (string, default "admin-library@mail.com"), smtpProvider (enum: MAILTRAP), sendHourUTC (int, default 8), timeZone (string, default "UTC")

- AuditLog
  - id, userId?, action (string enum), entityType, entityId, metadata (JSONB), createdAt

Indexes & Constraints

- Unique: User.email, Book.isbn, Author.name, Category.name, BookCopy.code.
- Foreign keys with onDelete: restrict for entities with historical references (e.g., Book with loans -> ARCHIVE instead of delete).
- Search performance: GIN trigram or tsvector indexes for title/author; BTree indexes on categoryId, status, dueDate.

## 9) API Endpoints (NestJS style)

Notes

- All list endpoints support: page (default 1), pageSize (default 20, max 100), sortBy (whitelist), sortOrder (asc|desc), filters as query params.
- Auth: Better Auth session cookie; use guards for roles.
- Errors: 400 validation, 401 unauthenticated, 403 unauthorized, 404 not found, 409 conflict, 422 semantic validation, 500 server error.

Auth

- POST /api/auth/register (public)
  - Req: { email, password, firstName, lastName }
  - Res: 201 { user: {id,email,role}, memberProfile: {...}, session }
  - Errors: 409 email exists, 400 invalid.
- POST /api/auth/login (public)
  - Req: { email, password }
  - Res: 200 { user, session }
  - Errors: 401 invalid credentials.
- POST /api/auth/logout (auth)
  - Res: 204

Books

- GET /api/books (public)
  - Query: q, categoryId, authorId, availability (true|false), sortBy (relevance|title|createdAt), sortOrder, page, pageSize
  - Res: 200 { items: [...], page, pageSize, total }
- GET /api/books/:id (public)
  - Res: 200 { book, authors, categories, availableCopies }
- POST /api/books (admin)
  - Req: { title, isbn, ... }
  - Res: 201 { book }
  - Errors: 409 duplicate isbn.
- PATCH /api/books/:id (admin)
  - Res: 200 { book }
- DELETE /api/books/:id (admin)
  - Res: 204 or 409 if active/historical loans (archive required).

Authors

- GET /api/authors (public)
- POST /api/authors (admin)
- PATCH /api/authors/:id (admin)
- DELETE /api/authors/:id (admin, 409 if referenced by books unless removed first)

Categories

- GET /api/categories (public)
- POST /api/categories (admin)
- PATCH /api/categories/:id (admin)
- DELETE /api/categories/:id (admin, 409 if referenced)

Book Copies

- GET /api/books/:id/copies (admin)
- POST /api/books/:id/copies (admin) — add N copies; body: { count, locationCode? }
- PATCH /api/copies/:copyId (admin) — update status/location
- DELETE /api/copies/:copyId (admin) — only if not on loan; else 409

Memberships

- GET /api/members (admin) — filters: status, q, page
- GET /api/members/:id (admin)
- PATCH /api/members/:id (admin) — update profile/status
- POST /api/members/:id/activate (admin)
- POST /api/members/:id/suspend (admin)

Loans

- GET /api/loans (admin) — filter: status, memberId, bookId, dueBefore/After
- GET /api/my/loans (member) — current user loans
- POST /api/loans (member)
  - Req: { bookId }
  - Behavior: validates availability, membership eligibility; creates loan in requested or active depending on approvalsRequired; assigns available copy.
  - Errors: 403 if suspended; 409 if no copies; 409 if over limit.
- POST /api/loans/:id/approve (admin) — if approvals enabled
- POST /api/loans/:id/reject (admin)
- POST /api/loans/:id/renew (member)
  - Errors: 409 if renewalCount >= 1, overdue, suspended, or renewal requested less than 1 day before due date.
- POST /api/loans/:id/return (member or admin)
  - Behavior: sets returnedAt, updates copy to available, computes penalties (IDR) capped at Settings.overdueFeeCapPerLoan.
  - Errors: 409 if already returned.

Settings

- GET /api/settings (admin)
- PATCH /api/settings (admin) — update policy fields (loanDays, renewalDays, renewalMinDaysBeforeDue, maxRenewals, overdueFeePerDay, overdueFeeCapPerLoan, currency, maxConcurrentLoans, notificationsEnabled, dueSoonDays, dueDateNotificationsEnabled, fromEmail, smtpProvider, sendHourUTC, timeZone)

Audit Logs

- GET /api/audit-logs (admin) — filter by user, action, entityType, date range

## 10) Permissions Matrix

| Action                     | Admin              | Member                  |
| -------------------------- | ------------------ | ----------------------- |
| View public catalog        | Yes                | Yes                     |
| View book detail           | Yes                | Yes                     |
| Search/filter books        | Yes                | Yes                     |
| Create/update/delete books | Yes                | No                      |
| Manage authors/categories  | Yes                | No                      |
| Add/remove copies          | Yes                | No                      |
| View all memberships       | Yes                | No                      |
| Activate/suspend member    | Yes                | No                      |
| Update member profiles     | Yes                | Own profile only        |
| View all loans             | Yes                | Own loans only          |
| Create loan (borrow)       | N/A                | Yes (if active)         |
| Approve/reject loan        | Yes (if enabled)   | No                      |
| Renew loan                 | N/A                | Yes (policy permitting) |
| Return loan                | Yes (force/assist) | Yes (self)              |
| View/update settings       | Yes                | No                      |

## 11) Non-Functional Requirements

Performance

- Server-side pagination on all lists; default 20 items; indexes on searchable columns.
- P95 server response time: < 300 ms for catalog queries on indexed fields.

Security

- Better Auth for email/password; salted hashing (Argon2/bcrypt per library); secure cookies (HTTPOnly, SameSite), CSRF protection.
- RBAC enforced in NestJS guards; input validation with DTOs (class-validator).
- Rate limiting on auth endpoints; lockout after repeated failed logins.
- Secrets via environment variables; no secrets in repo.

Privacy & Compliance

- Store minimal PII; allow profile edits; log access in audit logs; data retention policy TBD.

Reliability & Backup

- Daily DB backups; point-in-time recovery recommended; migrations managed via Prisma.
- Graceful shutdown; transactional writes for loan/copy updates to prevent inconsistencies.

Observability

- Structured logs (requestId, userId); basic metrics (requests, latency, error rate); health checks (/health).
- Email delivery metrics (send success/failure, retries); queue depth if using a job queue.

## 12) Analytics & Audit Logging

Analytics (product)

- Events: search_performed, book_viewed, borrow_attempted, borrow_succeeded/failed_reason, renewal_attempted, return_completed, login, register, notification_sent.

Audit Logs (security/ops)

- Record: who, action, entityType, entityId, timestamp, metadata (old/new values for critical changes).
- Actions to log: auth events, book CRUD, copy changes, membership status changes, loan lifecycle changes, settings changes.

## 13) Localization & Accessibility

- Localization: English (en) MVP; structure UI and email templates for i18n readiness later.
- Accessibility: WCAG 2.1 AA baseline; keyboard navigation; sufficient contrast; shadcn/ui components configured for a11y.

## 14) Rollout Plan & Milestones

Phase 1: Foundations (Weeks 1–2)

- Set up project scaffolds (NestJS, React+Vite, Tailwind, shadcn/ui, Prisma, Better Auth); DB schema; migrations; seed data.
- Implement auth, roles, and base entities (User, MemberProfile, Author, Category, Book, BookCopy).

Phase 2: Catalog & Admin (Weeks 3–5)

- Public catalog (list/detail, search/filter/sort, pagination); Admin CRUD for books/authors/categories/copies.
- Basic audit logging; admin lists with filters.

Phase 3: Borrowing, Member, Notifications (Weeks 6–7)

- Loan flow (create, approve optional, renew once per loan, return, overdue computation); Member dashboard (profile, membership, loans); Email notifications (due-soon and due-date, loan lifecycle) via Mailtrap.

Phase 4: Polishing & NFRs (Weeks 8–9)

- Performance tuning, access controls, validations, observability, backups, edge cases; finalize settings screen; UAT and bug fixes.

## 15) Risks, Assumptions, and Open Questions

Risks

- Data integrity around concurrent loans and copy availability if transactions are not carefully applied.
- Search performance on large catalogs without proper indexing.

Assumptions

- Approvals enabled by default; can be disabled via Settings.
- Evergreen membership (no expiry); suspension is the only membership restriction mechanism.
- Email is the only notification channel in MVP; no overdue reminders, only due-soon (3 days) and due-date notifications.
- Single library instance; no multi-tenant.

Open Questions

- None for MVP.
