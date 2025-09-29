/*
  Warnings:

  - Made the column `code` on table `StudentSemesterResult` required. This step will fail if there are existing NULL values in that column.
  - Made the column `code` on table `StudentYearResult` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "ql-dao-tao"."StudentSemesterResult_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."StudentYearResult_code_key";

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentSemesterResult" ALTER COLUMN "code" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentYearResult" ALTER COLUMN "code" SET NOT NULL;
