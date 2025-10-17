-- AlterTable
-- Remove password_hash column from user table
-- Password hashes are now stored in the Account table by Better Auth
ALTER TABLE "user" DROP COLUMN "password_hash";
