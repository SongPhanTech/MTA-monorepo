/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Subject` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[englishName]` on the table `Subject` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ql-dao-tao"."Subject" ADD COLUMN     "englishName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_key" ON "ql-dao-tao"."Subject"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_englishName_key" ON "ql-dao-tao"."Subject"("englishName");
