-- Enable pg_trgm extension for trigram search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "BookStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CopyStatus" AS ENUM ('AVAILABLE', 'ON_LOAN', 'LOST', 'DAMAGED');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('REQUESTED', 'APPROVED', 'ACTIVE', 'OVERDUE', 'RETURNED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('IDR');

-- CreateEnum
CREATE TYPE "SmtpProvider" AS ENUM ('MAILTRAP');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_profile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "member_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "author" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "isbn" TEXT NOT NULL,
    "publication_year" SMALLINT,
    "language" TEXT,
    "cover_image_url" TEXT,
    "status" "BookStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_author" (
    "book_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,

    CONSTRAINT "book_author_pkey" PRIMARY KEY ("book_id","author_id")
);

-- CreateTable
CREATE TABLE "book_category" (
    "book_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,

    CONSTRAINT "book_category_pkey" PRIMARY KEY ("book_id","category_id")
);

-- CreateTable
CREATE TABLE "book_copy" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "book_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "status" "CopyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "location_code" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "book_copy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "copy_id" UUID NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'REQUESTED',
    "borrowed_at" TIMESTAMPTZ(6),
    "due_date" TIMESTAMPTZ(6),
    "returned_at" TIMESTAMPTZ(6),
    "renewal_count" INTEGER NOT NULL DEFAULT 0,
    "penalty_accrued" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setting" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "approvals_required" BOOLEAN NOT NULL DEFAULT true,
    "loan_days" INTEGER NOT NULL DEFAULT 14,
    "renewal_days" INTEGER NOT NULL DEFAULT 7,
    "renewal_min_days_before_due" INTEGER NOT NULL DEFAULT 1,
    "max_renewals" INTEGER NOT NULL DEFAULT 1,
    "overdue_fee_per_day" DECIMAL(12,2) NOT NULL DEFAULT 1000,
    "overdue_fee_cap_per_loan" DECIMAL(12,2) NOT NULL DEFAULT 1000000,
    "currency" "Currency" NOT NULL DEFAULT 'IDR',
    "max_concurrent_loans" INTEGER NOT NULL DEFAULT 5,
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "due_soon_days" INTEGER NOT NULL DEFAULT 3,
    "due_date_notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "from_email" TEXT NOT NULL DEFAULT 'admin-library@mail.com',
    "smtp_provider" "SmtpProvider" NOT NULL DEFAULT 'MAILTRAP',
    "send_hour_UTC" INTEGER NOT NULL DEFAULT 8,
    "time_zone" TEXT NOT NULL DEFAULT 'UTC',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "member_profile_user_id_key" ON "member_profile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "author_name_key" ON "author"("name");

-- CreateIndex
CREATE INDEX "idx_authors_name_trgm" ON "author" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE UNIQUE INDEX "category_name_key" ON "category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "book_isbn_key" ON "book"("isbn");

-- CreateIndex
CREATE INDEX "idx_books_title_trgm" ON "book" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "idx_books_status" ON "book"("status");

-- CreateIndex
CREATE INDEX "idx_books_created_at" ON "book"("created_at", "id");

-- CreateIndex
CREATE INDEX "idx_book_author_auth" ON "book_author"("author_id", "book_id");

-- CreateIndex
CREATE INDEX "idx_book_category_cat" ON "book_category"("category_id", "book_id");

-- CreateIndex
CREATE UNIQUE INDEX "book_copy_code_key" ON "book_copy"("code");

-- CreateIndex
CREATE INDEX "idx_copy_book" ON "book_copy"("book_id");

-- CreateIndex
CREATE INDEX "idx_loan_user" ON "loan"("user_id");

-- CreateIndex
CREATE INDEX "idx_loan_book" ON "loan"("book_id");

-- CreateIndex
CREATE INDEX "idx_loan_copy" ON "loan"("copy_id");

-- CreateIndex
CREATE INDEX "idx_loan_status_due" ON "loan"("status", "due_date");

-- CreateIndex
CREATE INDEX "idx_loan_due_date" ON "loan"("due_date");

-- CreateIndex
CREATE INDEX "idx_loans_created_at" ON "loan"("created_at", "id");

-- AddForeignKey
ALTER TABLE "member_profile" ADD CONSTRAINT "member_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_author" ADD CONSTRAINT "book_author_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_author" ADD CONSTRAINT "book_author_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "author"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_category" ADD CONSTRAINT "book_category_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_category" ADD CONSTRAINT "book_category_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_copy" ADD CONSTRAINT "book_copy_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan" ADD CONSTRAINT "loan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan" ADD CONSTRAINT "loan_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan" ADD CONSTRAINT "loan_copy_id_fkey" FOREIGN KEY ("copy_id") REFERENCES "book_copy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
