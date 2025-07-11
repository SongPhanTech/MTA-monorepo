/*
  Warnings:

  - You are about to drop the column `status` on the `StudentSubjectScore` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentSubjectScore" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectClass" ADD COLUMN     "cancelled" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "ql-dao-tao"."SubjectClassStudentStatus";
