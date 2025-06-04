/*
  Warnings:

  - You are about to drop the `FixedClassStudent` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[codeTrainingField]` on the table `TrainingField` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `codeTrainingField` to the `TrainingField` table without a default value. This is not possible if the table is not empty.
  - Added the required column `englishName` to the `TrainingField` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `TrainingField` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publishDate` to the `TrainingField` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ql-danh-muc"."TrainingFieldStatus" AS ENUM ('ACTIVE', 'IN_ACTIVE');

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."FixedClassStudent" DROP CONSTRAINT "FixedClassStudent_fixedClassId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."FixedClassStudent" DROP CONSTRAINT "FixedClassStudent_userProfileId_fkey";

-- AlterTable
ALTER TABLE "ql-danh-muc"."TrainingField" ADD COLUMN     "codeTrainingField" TEXT NOT NULL,
ADD COLUMN     "englishName" TEXT NOT NULL,
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "publishDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" "ql-danh-muc"."TrainingFieldStatus" NOT NULL DEFAULT 'ACTIVE';

-- DropTable
DROP TABLE "ql-nguoi-dung"."FixedClassStudent";

-- CreateTable
CREATE TABLE "ql-dao-tao"."SubjectClass" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "subjectId" TEXT NOT NULL,
    "examDate" TIMESTAMP(3),

    CONSTRAINT "SubjectClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."FixedClassStudent" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fixedClassId" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "status" "ql-nguoi-dung"."FixedClassStudentStatus" NOT NULL DEFAULT 'ENROLLED',

    CONSTRAINT "FixedClassStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."SubjectClassStudent" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subjectClassId" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "attendanceScore" DOUBLE PRECISION,
    "midtermScore" DOUBLE PRECISION,
    "finalScore" DOUBLE PRECISION,

    CONSTRAINT "SubjectClassStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."_TrainingFieldToTrainingObjectType" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TrainingFieldToTrainingObjectType_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TrainingFieldToTrainingObjectType_B_index" ON "ql-danh-muc"."_TrainingFieldToTrainingObjectType"("B");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingField_codeTrainingField_key" ON "ql-danh-muc"."TrainingField"("codeTrainingField");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClass" ADD CONSTRAINT "SubjectClass_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "ql-dao-tao"."Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."TrainingField" ADD CONSTRAINT "TrainingField_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ql-danh-muc"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."FixedClassStudent" ADD CONSTRAINT "FixedClassStudent_fixedClassId_fkey" FOREIGN KEY ("fixedClassId") REFERENCES "ql-dao-tao"."FixedClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."FixedClassStudent" ADD CONSTRAINT "FixedClassStudent_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClassStudent" ADD CONSTRAINT "SubjectClassStudent_subjectClassId_fkey" FOREIGN KEY ("subjectClassId") REFERENCES "ql-dao-tao"."SubjectClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClassStudent" ADD CONSTRAINT "SubjectClassStudent_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."_TrainingFieldToTrainingObjectType" ADD CONSTRAINT "_TrainingFieldToTrainingObjectType_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-danh-muc"."TrainingField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."_TrainingFieldToTrainingObjectType" ADD CONSTRAINT "_TrainingFieldToTrainingObjectType_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-danh-muc"."TrainingObjectType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
