/*
  Warnings:

  - Added the required column `type` to the `AcademicRankingConvert` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ql-dao-tao"."AcademicRankingBaseType" AS ENUM ('Base10', 'Base4');

-- AlterTable
ALTER TABLE "ql-dao-tao"."AcademicRankingConvert" ADD COLUMN     "type" "ql-dao-tao"."AcademicRankingBaseType" NOT NULL,
ALTER COLUMN "base10Min" DROP NOT NULL,
ALTER COLUMN "base10Max" DROP NOT NULL,
ALTER COLUMN "base4Min" DROP NOT NULL,
ALTER COLUMN "base4Max" DROP NOT NULL;
