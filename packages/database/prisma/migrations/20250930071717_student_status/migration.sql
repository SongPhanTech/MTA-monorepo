-- AlterEnum
ALTER TYPE "ql-dao-tao"."StudentStatus" ADD VALUE 'REPEATED';

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentAcademicDecision" ADD COLUMN     "updatedResult" BOOLEAN NOT NULL DEFAULT false;
