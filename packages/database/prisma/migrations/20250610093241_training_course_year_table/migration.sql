/*
  Warnings:

  - You are about to drop the column `endDate` on the `TrainingCourse` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `TrainingCourse` table. All the data in the column will be lost.
  - You are about to drop the column `trainingFormId` on the `TrainingCourse` table. All the data in the column will be lost.
  - You are about to drop the column `trainingLevelId` on the `TrainingCourse` table. All the data in the column will be lost.
  - You are about to drop the column `trainingTypeId` on the `TrainingCourse` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ql-dao-tao"."TrainingCourse" DROP CONSTRAINT "TrainingCourse_trainingFormId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."TrainingCourse" DROP CONSTRAINT "TrainingCourse_trainingLevelId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."TrainingCourse" DROP CONSTRAINT "TrainingCourse_trainingTypeId_fkey";

-- AlterTable
ALTER TABLE "ql-dao-tao"."FixedClass" ADD COLUMN     "graduated" BOOLEAN DEFAULT false,
ADD COLUMN     "startYear" INTEGER,
ADD COLUMN     "summary" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingCourse" DROP COLUMN "endDate",
DROP COLUMN "startDate",
DROP COLUMN "trainingFormId",
DROP COLUMN "trainingLevelId",
DROP COLUMN "trainingTypeId",
ADD COLUMN     "academicYear" TEXT,
ADD COLUMN     "admissionQuota" INTEGER,
ADD COLUMN     "endYear" INTEGER,
ADD COLUMN     "maxTrainingTime" DOUBLE PRECISION,
ADD COLUMN     "startYear" INTEGER;
