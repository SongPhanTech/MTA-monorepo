/*
  Warnings:

  - The `status` column on the `Curriculum` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "FixedClassStudentStatus" AS ENUM ('ENROLLED', 'GRADUATED', 'DEFERRED_STUDY', 'SUSPENDED_STUDY', 'WITHDRAWN', 'TRANSFERRED', 'PENDING_GRADUATION_REVIEW', 'ACADEMIC_SUSPENSION');

-- CreateEnum
CREATE TYPE "TrainingCourseStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'SUSPEND', 'CANCEL');

-- CreateEnum
CREATE TYPE "CurriculumStatus" AS ENUM ('ACTIVE', 'INACTIVATED');

-- DropForeignKey
ALTER TABLE "FixedClass" DROP CONSTRAINT "FixedClass_managementOrganizationId_fkey";

-- DropForeignKey
ALTER TABLE "FixedClass" DROP CONSTRAINT "FixedClass_trainingCourseId_fkey";

-- AlterTable
ALTER TABLE "Curriculum" DROP COLUMN "status",
ADD COLUMN     "status" "CurriculumStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "FixedClass" ALTER COLUMN "trainingCourseId" DROP NOT NULL,
ALTER COLUMN "managementOrganizationId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TrainingCourse" ADD COLUMN     "status" "TrainingCourseStatus" NOT NULL DEFAULT 'ACTIVE';

-- DropEnum
DROP TYPE "ActiveStatus";

-- CreateTable
CREATE TABLE "FixedClassStudent" (
    "id" TEXT NOT NULL,
    "fixedClassId" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "status" "FixedClassStudentStatus" NOT NULL DEFAULT 'ENROLLED',
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "FixedClassStudent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FixedClassStudent_fixedClassId_userProfileId_key" ON "FixedClassStudent"("fixedClassId", "userProfileId");

-- AddForeignKey
ALTER TABLE "FixedClassStudent" ADD CONSTRAINT "FixedClassStudent_fixedClassId_fkey" FOREIGN KEY ("fixedClassId") REFERENCES "FixedClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedClassStudent" ADD CONSTRAINT "FixedClassStudent_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedClass" ADD CONSTRAINT "FixedClass_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "TrainingCourse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedClass" ADD CONSTRAINT "FixedClass_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
