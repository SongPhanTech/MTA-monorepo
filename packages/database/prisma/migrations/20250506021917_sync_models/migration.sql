/*
  Warnings:

  - Made the column `updatedAt` on table `FixedClassStudent` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ql-nguoi-dung"."FixedClassStudent" ADD COLUMN     "code" TEXT,
ALTER COLUMN "updatedAt" SET NOT NULL;
