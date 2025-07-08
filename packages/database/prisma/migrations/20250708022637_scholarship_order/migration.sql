/*
  Warnings:

  - Added the required column `rankOrder` to the `Scholarship` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ql-dao-tao"."Scholarship" ADD COLUMN     "rankOrder" INTEGER NOT NULL;
