/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `AcademicWarningRule` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `AcademicWarningRule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ql-dao-tao"."AcademicWarningRule" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "code" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AcademicWarningRule_code_key" ON "ql-dao-tao"."AcademicWarningRule"("code");
