/*
  Warnings:

  - You are about to drop the column `email_verified` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `verification` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `password_hash` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "LoanStatus" ADD VALUE 'CANCELLED';

-- DropForeignKey
ALTER TABLE "public"."account" DROP CONSTRAINT "account_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."session" DROP CONSTRAINT "session_user_id_fkey";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "email_verified",
DROP COLUMN "image",
DROP COLUMN "name",
ADD COLUMN     "password_hash" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."account";

-- DropTable
DROP TABLE "public"."session";

-- DropTable
DROP TABLE "public"."verification";

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_key" ON "refresh_token"("token");

-- CreateIndex
CREATE INDEX "idx_refresh_token_user" ON "refresh_token"("user_id");

-- CreateIndex
CREATE INDEX "idx_refresh_token_expires" ON "refresh_token"("expires_at");

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
