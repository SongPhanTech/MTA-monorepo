/*
  Warnings:

  - Added the required column `trainingMajorId` to the `Curriculum` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SubjectEquivalentType" AS ENUM ('NONE', 'OneByOne', 'TwoByOne', 'ThreeByOne', 'FourByOne', 'OneByTwo', 'OneByThree');

-- CreateEnum
CREATE TYPE "CurriculumVersionSubjectType" AS ENUM ('NONE', 'MANDATORY', 'OPTIONAL', 'ELECTIVE');

-- AlterTable
ALTER TABLE "Curriculum" ADD COLUMN     "trainingMajorId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "CurriculumVersion" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CurriculumStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "curriculumId" TEXT NOT NULL,
    "infomation" TEXT,
    "documentPath" TEXT,
    "renderPath" TEXT,

    CONSTRAINT "CurriculumVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectGroup" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "managementOrganizationId" TEXT NOT NULL,
    "infomation" TEXT,

    CONSTRAINT "SubjectGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "subjectEquivalentType" "SubjectEquivalentType" NOT NULL DEFAULT 'NONE',
    "credit" INTEGER NOT NULL DEFAULT 0,
    "period" INTEGER NOT NULL DEFAULT 0,
    "numberOfTheory" INTEGER NOT NULL DEFAULT 0,
    "numberOfPractice" INTEGER NOT NULL DEFAULT 0,
    "numberOfSelfStudy" INTEGER NOT NULL DEFAULT 0,
    "numberOfProject" INTEGER NOT NULL DEFAULT 0,
    "numberOfInternship" INTEGER NOT NULL DEFAULT 0,
    "numberOfOther" INTEGER NOT NULL DEFAULT 0,
    "managementOrganizationId" TEXT NOT NULL,
    "subjectGroupId" TEXT NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumVersionSubject" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "curriculumVersionId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "traningBlockId" TEXT,
    "infomation" TEXT,
    "documentPath" TEXT,
    "renderPath" TEXT,

    CONSTRAINT "CurriculumVersionSubject_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Curriculum" ADD CONSTRAINT "Curriculum_trainingMajorId_fkey" FOREIGN KEY ("trainingMajorId") REFERENCES "TrainingMajor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumVersion" ADD CONSTRAINT "CurriculumVersion_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "Curriculum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectGroup" ADD CONSTRAINT "SubjectGroup_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_subjectGroupId_fkey" FOREIGN KEY ("subjectGroupId") REFERENCES "SubjectGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumVersionSubject" ADD CONSTRAINT "CurriculumVersionSubject_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "CurriculumVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumVersionSubject" ADD CONSTRAINT "CurriculumVersionSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumVersionSubject" ADD CONSTRAINT "CurriculumVersionSubject_traningBlockId_fkey" FOREIGN KEY ("traningBlockId") REFERENCES "TrainingBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;
