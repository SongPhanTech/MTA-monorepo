-- AlterTable
ALTER TABLE "ql-dao-tao"."ThesisProject" ADD COLUMN     "editProject" TEXT,
ADD COLUMN     "isLock" BOOLEAN NOT NULL DEFAULT false;
