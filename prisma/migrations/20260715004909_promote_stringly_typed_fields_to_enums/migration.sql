-- CreateEnum
CREATE TYPE "InsightClassification" AS ENUM ('baseline', 'intervention');

-- CreateEnum
CREATE TYPE "InsightPriority" AS ENUM ('normal', 'elevated', 'high');

-- CreateEnum
CREATE TYPE "ProfileTheme" AS ENUM ('light', 'dark');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('onlyMe', 'friends', 'public');

-- DropForeignKey
ALTER TABLE "AIInsight" DROP CONSTRAINT "AIInsight_checkInId_fkey";

-- DropIndex
DROP INDEX "User_email_createdAt_active_idx";

-- AlterTable: cast existing values instead of dropping the column, to avoid data loss
ALTER TABLE "AIInsight"
    ALTER COLUMN "classification" DROP DEFAULT,
    ALTER COLUMN "classification" TYPE "InsightClassification" USING ("classification"::text::"InsightClassification"),
    ALTER COLUMN "classification" SET DEFAULT 'baseline',
    ALTER COLUMN "priority" DROP DEFAULT,
    ALTER COLUMN "priority" TYPE "InsightPriority" USING ("priority"::text::"InsightPriority"),
    ALTER COLUMN "priority" SET DEFAULT 'normal';

-- AlterTable: cast existing values instead of dropping the column, to avoid data loss
ALTER TABLE "Profile"
    ALTER COLUMN "profileVisibility" DROP DEFAULT,
    ALTER COLUMN "profileVisibility" TYPE "ProfileVisibility" USING ("profileVisibility"::text::"ProfileVisibility"),
    ALTER COLUMN "profileVisibility" SET DEFAULT 'friends',
    ALTER COLUMN "theme" DROP DEFAULT,
    ALTER COLUMN "theme" TYPE "ProfileTheme" USING ("theme"::text::"ProfileTheme"),
    ALTER COLUMN "theme" SET DEFAULT 'light';

-- AddForeignKey
ALTER TABLE "AIInsight" ADD CONSTRAINT "AIInsight_checkInId_fkey" FOREIGN KEY ("checkInId") REFERENCES "DailyCheckIn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
