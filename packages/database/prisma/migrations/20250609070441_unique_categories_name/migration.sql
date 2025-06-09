/*
  Warnings:

  - You are about to drop the column `lecturerTypeId` on the `StaffPosition` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `PriorityObject` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `TrainingForm` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `TrainingLevel` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `TrainingLocation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `TrainingObjectType` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `TrainingType` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "ql-danh-muc"."StaffPosition" DROP CONSTRAINT "StaffPosition_lecturerTypeId_fkey";

-- DropIndex
DROP INDEX "ql-danh-muc"."StaffPosition_name_lecturerTypeId_key";

-- AlterTable
ALTER TABLE "ql-danh-muc"."StaffPosition" DROP COLUMN "lecturerTypeId";

-- AlterTable
ALTER TABLE "ql-dao-tao"."Curriculum" ADD COLUMN     "englishName" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingMajor" ALTER COLUMN "englishName" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PriorityObject_name_key" ON "ql-dao-tao"."PriorityObject"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingForm_name_key" ON "ql-dao-tao"."TrainingForm"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingLevel_name_key" ON "ql-dao-tao"."TrainingLevel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingLocation_name_key" ON "ql-dao-tao"."TrainingLocation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingObjectType_name_key" ON "ql-dao-tao"."TrainingObjectType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingType_name_key" ON "ql-dao-tao"."TrainingType"("name");
