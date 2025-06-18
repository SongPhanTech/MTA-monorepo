/*
  Warnings:

  - Added the required column `maxStudent` to the `SubjectClass` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectClass" ADD COLUMN     "maxStudent" INTEGER NOT NULL;
