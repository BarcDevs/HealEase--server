-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetPasswordAttempts" INTEGER NOT NULL DEFAULT 0;
