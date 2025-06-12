/*
  Warnings:

  - You are about to drop the column `documentPath` on the `Curriculum` table. All the data in the column will be lost.
  - You are about to drop the column `documentPath` on the `CurriculumVersion` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `CurriculumVersion` table. All the data in the column will be lost.
  - You are about to drop the column `coef_1` on the `SubjectVersion` table. All the data in the column will be lost.
  - You are about to drop the column `coef_2` on the `SubjectVersion` table. All the data in the column will be lost.
  - You are about to drop the column `coef_3` on the `SubjectVersion` table. All the data in the column will be lost.
  - You are about to drop the column `coef_4` on the `SubjectVersion` table. All the data in the column will be lost.
  - You are about to drop the column `coef_5` on the `SubjectVersion` table. All the data in the column will be lost.
  - You are about to drop the column `documentPath` on the `SubjectVersion` table. All the data in the column will be lost.
  - You are about to drop the column `subjectTypeId` on the `SubjectVersion` table. All the data in the column will be lost.
  - You are about to drop the column `curriculumVersionId` on the `TrainingBlock` table. All the data in the column will be lost.
  - You are about to drop the column `trainingBlockId` on the `TrainingBlockSubject` table. All the data in the column will be lost.
  - The `type` column on the `TrainingBlockSubject` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `SubjectVersionType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_SubjectVersionToTrainingObjectType` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `graduation` to the `TrainingBlockSubject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `print` to the `TrainingBlockSubject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `project` to the `TrainingBlockSubject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trainingBlockOnCurriculumVersionId` to the `TrainingBlockSubject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `useForFinalScore` to the `TrainingBlockSubject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semesterStartId` to the `TrainingCourse` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ql-dao-tao"."SubjectRequirementType" AS ENUM ('None', 'Mandatory', 'Optional', 'Elective');

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."SubjectVersion" DROP CONSTRAINT "SubjectVersion_subjectTypeId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."TrainingBlock" DROP CONSTRAINT "TrainingBlock_curriculumVersionId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."TrainingBlockSubject" DROP CONSTRAINT "TrainingBlockSubject_trainingBlockId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."_SubjectVersionToTrainingObjectType" DROP CONSTRAINT "_SubjectVersionToTrainingObjectType_A_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."_SubjectVersionToTrainingObjectType" DROP CONSTRAINT "_SubjectVersionToTrainingObjectType_B_fkey";

-- AlterTable
ALTER TABLE "ql-dao-tao"."Curriculum" DROP COLUMN "documentPath",
ADD COLUMN     "documentPaths" TEXT[];

-- AlterTable
ALTER TABLE "ql-dao-tao"."CurriculumVersion" DROP COLUMN "documentPath",
DROP COLUMN "status",
ADD COLUMN     "coef_1" DOUBLE PRECISION,
ADD COLUMN     "coef_2" DOUBLE PRECISION,
ADD COLUMN     "coef_3" DOUBLE PRECISION,
ADD COLUMN     "documentPaths" TEXT[];

-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectVersion" DROP COLUMN "coef_1",
DROP COLUMN "coef_2",
DROP COLUMN "coef_3",
DROP COLUMN "coef_4",
DROP COLUMN "coef_5",
DROP COLUMN "documentPath",
DROP COLUMN "subjectTypeId",
ADD COLUMN     "documentPaths" TEXT[];

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingBlock" DROP COLUMN "curriculumVersionId";

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingBlockSubject" DROP COLUMN "trainingBlockId",
ADD COLUMN     "graduation" BOOLEAN NOT NULL,
ADD COLUMN     "print" BOOLEAN NOT NULL,
ADD COLUMN     "project" BOOLEAN NOT NULL,
ADD COLUMN     "trainingBlockOnCurriculumVersionId" TEXT NOT NULL,
ADD COLUMN     "useForFinalScore" BOOLEAN NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "ql-dao-tao"."SubjectRequirementType" NOT NULL DEFAULT 'None';

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingCourse" ADD COLUMN     "semesterStartId" TEXT NOT NULL;

-- DropTable
DROP TABLE "ql-dao-tao"."SubjectVersionType";

-- DropTable
DROP TABLE "ql-dao-tao"."_SubjectVersionToTrainingObjectType";

-- DropEnum
DROP TYPE "ql-dao-tao"."CurriculumVersionSubjectType";

-- CreateTable
CREATE TABLE "ql-dao-tao"."TrainingBlockOnCurriculumVersion" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "trainingBlockId" TEXT NOT NULL,
    "curriculumVersionId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TrainingBlockOnCurriculumVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainingBlockOnCurriculumVersion_code_key" ON "ql-dao-tao"."TrainingBlockOnCurriculumVersion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingBlockOnCurriculumVersion_trainingBlockId_curriculum_key" ON "ql-dao-tao"."TrainingBlockOnCurriculumVersion"("trainingBlockId", "curriculumVersionId");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingCourse" ADD CONSTRAINT "TrainingCourse_semesterStartId_fkey" FOREIGN KEY ("semesterStartId") REFERENCES "ql-dao-tao"."Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingBlockSubject" ADD CONSTRAINT "TrainingBlockSubject_trainingBlockOnCurriculumVersionId_fkey" FOREIGN KEY ("trainingBlockOnCurriculumVersionId") REFERENCES "ql-dao-tao"."TrainingBlockOnCurriculumVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingBlockOnCurriculumVersion" ADD CONSTRAINT "TrainingBlockOnCurriculumVersion_trainingBlockId_fkey" FOREIGN KEY ("trainingBlockId") REFERENCES "ql-dao-tao"."TrainingBlock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingBlockOnCurriculumVersion" ADD CONSTRAINT "TrainingBlockOnCurriculumVersion_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "ql-dao-tao"."CurriculumVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
