/*
  Warnings:

  - Made the column `code` on table `SubjectClass` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "ql-dao-tao"."SubjectClass_code_key";

-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectClass" ALTER COLUMN "code" SET NOT NULL;
