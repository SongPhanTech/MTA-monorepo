/*
  Warnings:

  - Made the column `code` on table `TrainingCourseRegulation` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "ql-dao-tao"."TrainingCourseRegulation_code_key";

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingCourseRegulation" ALTER COLUMN "code" SET NOT NULL;
