/*
  Warnings:

  - The `tuple` column on the `ScholarshipCriteria` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ql-dao-tao"."ScholarshipCriteria" DROP COLUMN "tuple",
ADD COLUMN     "tuple" TEXT[] DEFAULT ARRAY[]::TEXT[];
