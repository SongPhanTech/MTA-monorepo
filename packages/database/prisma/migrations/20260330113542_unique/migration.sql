/*
  Warnings:

  - A unique constraint covering the columns `[trainingObjectTypeId,codeTkb]` on the table `SubjectVersion` will be added. If there are existing duplicate values, this will fail.
  - Made the column `code` on table `SubjectVersion` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ql-dao-tao"."FixedClassType" AS ENUM ('APPLICATION', 'RESEARCH', 'NORMAL');

-- DropIndex
DROP INDEX "ql-dao-tao"."SubjectVersion_code_key";

-- AlterTable
ALTER TABLE "ql-dao-tao"."ArchivedCertificate" ADD COLUMN     "listeningScore" DOUBLE PRECISION,
ADD COLUMN     "readingScore" DOUBLE PRECISION,
ADD COLUMN     "speakingScore" DOUBLE PRECISION,
ADD COLUMN     "writingScore" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ql-dao-tao"."FixedClass" ADD COLUMN     "classType" "ql-dao-tao"."FixedClassType" NOT NULL DEFAULT 'NORMAL';

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentResearchTopic" ADD COLUMN     "thirdSupervisorId" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentSubjectScore" ADD COLUMN     "semesterId" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectVersion" ALTER COLUMN "code" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-dao-tao"."ThesisProject" ADD COLUMN     "externalUnit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isGroupProject" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isLanguage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isProductProject" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "primarySupervisorId" TEXT,
ADD COLUMN     "secondarySupervisorId" TEXT,
ADD COLUMN     "thirdSupervisorId" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."ThesisSession" ADD COLUMN     "councilDeadline" TIMESTAMP(3),
ADD COLUMN     "topicEntryDeadline" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ql-nguoi-dung"."UserProfile" ALTER COLUMN "firstName" DROP NOT NULL,
ALTER COLUMN "firstName" SET DEFAULT '',
ALTER COLUMN "lastName" DROP NOT NULL,
ALTER COLUMN "lastName" SET DEFAULT '';

-- CreateTable
CREATE TABLE "ql-dao-tao"."AvailableTrainingTime" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "duration" DOUBLE PRECISION NOT NULL,
    "trainingObjectTypeId" TEXT,
    "semesterId" TEXT,

    CONSTRAINT "AvailableTrainingTime_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AvailableTrainingTime_code_key" ON "ql-dao-tao"."AvailableTrainingTime"("code");

-- CreateIndex
CREATE INDEX "Lecturer_userProfileId_idx" ON "ql-dao-tao"."Lecturer"("userProfileId");

-- CreateIndex
CREATE INDEX "StudentSubjectScore_subjectClassId_idx" ON "ql-dao-tao"."StudentSubjectScore"("subjectClassId");

-- CreateIndex
CREATE INDEX "StudentSubjectScore_subjectVersionId_idx" ON "ql-dao-tao"."StudentSubjectScore"("subjectVersionId");

-- CreateIndex
CREATE INDEX "SubjectClass_lecturerId_idx" ON "ql-dao-tao"."SubjectClass"("lecturerId");

-- CreateIndex
CREATE INDEX "SubjectClass_extraLecturerId_idx" ON "ql-dao-tao"."SubjectClass"("extraLecturerId");

-- CreateIndex
CREATE INDEX "SubjectClass_enterGradeLecturerId_idx" ON "ql-dao-tao"."SubjectClass"("enterGradeLecturerId");

-- CreateIndex
CREATE INDEX "SubjectClass_subjectId_idx" ON "ql-dao-tao"."SubjectClass"("subjectId");

-- CreateIndex
CREATE INDEX "SubjectClassTime_subjectClassId_idx" ON "ql-dao-tao"."SubjectClassTime"("subjectClassId");

-- CreateIndex
CREATE INDEX "SubjectVersion_subjectId_idx" ON "ql-dao-tao"."SubjectVersion"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectVersion_trainingObjectTypeId_codeTkb_key" ON "ql-dao-tao"."SubjectVersion"("trainingObjectTypeId", "codeTkb");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentSubjectScore" ADD CONSTRAINT "StudentSubjectScore_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentResearchTopic" ADD CONSTRAINT "StudentResearchTopic_thirdSupervisorId_fkey" FOREIGN KEY ("thirdSupervisorId") REFERENCES "ql-dao-tao"."ExpertProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."AvailableTrainingTime" ADD CONSTRAINT "AvailableTrainingTime_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."AvailableTrainingTime" ADD CONSTRAINT "AvailableTrainingTime_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ThesisProject" ADD CONSTRAINT "ThesisProject_primarySupervisorId_fkey" FOREIGN KEY ("primarySupervisorId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ThesisProject" ADD CONSTRAINT "ThesisProject_secondarySupervisorId_fkey" FOREIGN KEY ("secondarySupervisorId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ThesisProject" ADD CONSTRAINT "ThesisProject_thirdSupervisorId_fkey" FOREIGN KEY ("thirdSupervisorId") REFERENCES "ql-dao-tao"."ExpertProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
