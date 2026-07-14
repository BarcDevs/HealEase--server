-- AlterTable
ALTER TABLE "User" ADD COLUMN     "confirmEmailAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "confirmEmailExpiration" TIMESTAMP(3),
ADD COLUMN     "confirmEmailOTP" INTEGER;
