-- AlterTable
ALTER TABLE "Milestone" ALTER COLUMN "period" DROP NOT NULL,
ALTER COLUMN "period" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "homeTown" TEXT;
