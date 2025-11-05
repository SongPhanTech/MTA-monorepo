/*
  Warnings:

  - You are about to drop the column `clusterSurveyId` on the `SurveyQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `surveyId` on the `SurveyQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `surveyTopicId` on the `SurveyQuestionGroup` table. All the data in the column will be lost.
  - The `examPostponed` column on the `StudentSubjectScoreHistory` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `currentStudents` on the `ThesisProject` table. All the data in the column will be lost.
  - You are about to drop the `_ExamToRoom` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[questionBankId,knowledgeBlockId,questionPoint,questionType]` on the table `TestStructureRule` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `additionalSuggestion` to the `ClusterSurvey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `surveyTopicId` to the `ClusterSurvey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subjectVersionId` to the `Exam` table without a default value. This is not possible if the table is not empty.
  - Made the column `surveyQuestionGroupId` on table `SurveyQuestion` required. This step will fail if there are existing NULL values in that column.
  - Made the column `endDate` on table `Semester` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ql-dao-tao"."SubjectClassStatus" AS ENUM ('DRAFT', 'OFFICIAL');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."TrainingScoreStatus" AS ENUM ('PENDING', 'APPROVED');

-- AlterEnum
ALTER TYPE "khao-thi"."EvaluationMemberRole" ADD VALUE 'ADVISORY_BOARD';

-- AlterEnum
ALTER TYPE "ql-dao-tao"."SubjectVersionType" ADD VALUE 'Practice';

-- DropForeignKey
ALTER TABLE "khao-thi"."SurveyQuestion" DROP CONSTRAINT "SurveyQuestion_clusterSurveyId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."SurveyQuestion" DROP CONSTRAINT "SurveyQuestion_surveyId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."SurveyQuestion" DROP CONSTRAINT "SurveyQuestion_surveyQuestionGroupId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."SurveyQuestionGroup" DROP CONSTRAINT "SurveyQuestionGroup_surveyTopicId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."TestStructureRule" DROP CONSTRAINT "TestStructureRule_examId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."_ExamToRoom" DROP CONSTRAINT "_ExamToRoom_A_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."_ExamToRoom" DROP CONSTRAINT "_ExamToRoom_B_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."StudentSubjectScoreHistory" DROP CONSTRAINT "StudentSubjectScoreHistory_updatedById_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."StudentThesisRegistration" DROP CONSTRAINT "StudentThesisRegistration_studentSubjectScoreId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."ThesisProject" DROP CONSTRAINT "ThesisProject_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."ThesisProject" DROP CONSTRAINT "ThesisProject_subjectClassId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."ThesisProject" DROP CONSTRAINT "ThesisProject_supervisorId_fkey";

-- AlterTable
ALTER TABLE "khao-thi"."ClusterSurvey" ADD COLUMN     "additionalSuggestion" BOOLEAN NOT NULL,
ADD COLUMN     "surveyTopicId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "khao-thi"."Exam" ADD COLUMN     "createdExamCode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lockExamSessions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subjectVersionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "khao-thi"."SurveyQuestion" DROP COLUMN "clusterSurveyId",
DROP COLUMN "surveyId",
ALTER COLUMN "surveyQuestionGroupId" SET NOT NULL;

-- AlterTable
ALTER TABLE "khao-thi"."SurveyQuestionGroup" DROP COLUMN "surveyTopicId";

-- AlterTable
ALTER TABLE "khao-thi"."SurveySession" ADD COLUMN     "profileId" TEXT;

-- AlterTable
ALTER TABLE "khao-thi"."TestStructureRule" ADD COLUMN     "questionBankId" TEXT,
ALTER COLUMN "examId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ql-dao-tao"."ExpertProfile" ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankName" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."Semester" ALTER COLUMN "endDate" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentGraduationApplication" ADD COLUMN     "diplomaTypeId" TEXT,
ADD COLUMN     "gpa" DECIMAL(5,2),
ADD COLUMN     "graduation" BOOLEAN,
ADD COLUMN     "rankId" TEXT,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "trainingMajorId" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentSubjectScoreHistory" ALTER COLUMN "examPostponedReason" SET DATA TYPE TEXT,
DROP COLUMN "examPostponed",
ADD COLUMN     "examPostponed" BOOLEAN,
ALTER COLUMN "updatedById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentThesisRegistration" ALTER COLUMN "studentSubjectScoreId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentTrainingScore" ADD COLUMN     "status" "ql-dao-tao"."TrainingScoreStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "score" DROP NOT NULL,
ALTER COLUMN "score" DROP DEFAULT,
ALTER COLUMN "studentTrainingType" SET DEFAULT 'GOOD';

-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectClass" ADD COLUMN     "approveLecturerAssignmentAt" TIMESTAMP(3),
ADD COLUMN     "status" "ql-dao-tao"."SubjectClassStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "ql-dao-tao"."ThesisProject" DROP COLUMN "currentStudents",
ADD COLUMN     "thesisSessionId" TEXT,
ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "summary" DROP NOT NULL,
ALTER COLUMN "subjectClassId" DROP NOT NULL,
ALTER COLUMN "supervisorId" DROP NOT NULL,
ALTER COLUMN "organizationId" DROP NOT NULL,
ALTER COLUMN "maxStudents" DROP NOT NULL;

-- DropTable
DROP TABLE "khao-thi"."_ExamToRoom";

-- CreateTable
CREATE TABLE "ql-dao-tao"."SubjectClassHistory" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subjectClassId" TEXT NOT NULL,
    "scoreDeadLineStart" TIMESTAMP(3),
    "scoreDeadline" TIMESTAMP(3),
    "examScoreDeadline" TIMESTAMP(3),
    "isLockScore" BOOLEAN,
    "isLockExamScore" BOOLEAN,
    "scoreSubmitted" BOOLEAN,
    "scoreChecked" BOOLEAN,
    "updatedById" TEXT,

    CONSTRAINT "SubjectClassHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."ThesisSession" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "trainingObjectTypeId" TEXT NOT NULL,
    "trainingCourseId" TEXT NOT NULL,
    "decisionNumber" TEXT,
    "decisionMaker" TEXT,
    "decisionDate" TIMESTAMP(3),
    "defenseDecisionNumber" TEXT,
    "defenseDecisionMaker" TEXT,
    "defenseDecisionDate" TIMESTAMP(3),
    "chief" TEXT,

    CONSTRAINT "ThesisSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."CriterionAssignment" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluationCriterionId" TEXT NOT NULL,
    "lecturerId" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CriterionAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."ExamRoomSlot" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "examId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "cap" INTEGER NOT NULL,

    CONSTRAINT "ExamRoomSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."_SubjectClassToSurvey" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SubjectClassToSurvey_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "khao-thi"."_SurveyQuestionGroupToSurveyTopic" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SurveyQuestionGroupToSurveyTopic_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "khao-thi"."_ClusterSurveyToSurveyQuestion" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ClusterSurveyToSurveyQuestion_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "khao-thi"."_SurveyToSurveyQuestion" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SurveyToSurveyQuestion_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubjectClassHistory_code_key" ON "ql-dao-tao"."SubjectClassHistory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ThesisSession_code_key" ON "ql-dao-tao"."ThesisSession"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CriterionAssignment_code_key" ON "khao-thi"."CriterionAssignment"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ExamRoomSlot_code_key" ON "khao-thi"."ExamRoomSlot"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ExamRoomSlot_examId_roomId_key" ON "khao-thi"."ExamRoomSlot"("examId", "roomId");

-- CreateIndex
CREATE INDEX "_SubjectClassToSurvey_B_index" ON "ql-dao-tao"."_SubjectClassToSurvey"("B");

-- CreateIndex
CREATE INDEX "_SurveyQuestionGroupToSurveyTopic_B_index" ON "khao-thi"."_SurveyQuestionGroupToSurveyTopic"("B");

-- CreateIndex
CREATE INDEX "_ClusterSurveyToSurveyQuestion_B_index" ON "khao-thi"."_ClusterSurveyToSurveyQuestion"("B");

-- CreateIndex
CREATE INDEX "_SurveyToSurveyQuestion_B_index" ON "khao-thi"."_SurveyToSurveyQuestion"("B");

-- CreateIndex
CREATE UNIQUE INDEX "TestStructureRule_questionBankId_knowledgeBlockId_questionP_key" ON "khao-thi"."TestStructureRule"("questionBankId", "knowledgeBlockId", "questionPoint", "questionType");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentSubjectScoreHistory" ADD CONSTRAINT "StudentSubjectScoreHistory_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClassHistory" ADD CONSTRAINT "SubjectClassHistory_subjectClassId_fkey" FOREIGN KEY ("subjectClassId") REFERENCES "ql-dao-tao"."SubjectClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClassHistory" ADD CONSTRAINT "SubjectClassHistory_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ThesisSession" ADD CONSTRAINT "ThesisSession_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ThesisSession" ADD CONSTRAINT "ThesisSession_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ThesisProject" ADD CONSTRAINT "ThesisProject_subjectClassId_fkey" FOREIGN KEY ("subjectClassId") REFERENCES "ql-dao-tao"."SubjectClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ThesisProject" ADD CONSTRAINT "ThesisProject_thesisSessionId_fkey" FOREIGN KEY ("thesisSessionId") REFERENCES "ql-dao-tao"."ThesisSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ThesisProject" ADD CONSTRAINT "ThesisProject_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "ql-dao-tao"."ExpertProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ThesisProject" ADD CONSTRAINT "ThesisProject_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentThesisRegistration" ADD CONSTRAINT "StudentThesisRegistration_studentSubjectScoreId_fkey" FOREIGN KEY ("studentSubjectScoreId") REFERENCES "ql-dao-tao"."StudentSubjectScore"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."CriterionAssignment" ADD CONSTRAINT "CriterionAssignment_evaluationCriterionId_fkey" FOREIGN KEY ("evaluationCriterionId") REFERENCES "khao-thi"."EvaluationCriterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."CriterionAssignment" ADD CONSTRAINT "CriterionAssignment_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ClusterSurvey" ADD CONSTRAINT "ClusterSurvey_surveyTopicId_fkey" FOREIGN KEY ("surveyTopicId") REFERENCES "khao-thi"."SurveyTopic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SurveyQuestion" ADD CONSTRAINT "SurveyQuestion_surveyQuestionGroupId_fkey" FOREIGN KEY ("surveyQuestionGroupId") REFERENCES "khao-thi"."SurveyQuestionGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SurveySession" ADD CONSTRAINT "SurveySession_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."Exam" ADD CONSTRAINT "Exam_subjectVersionId_fkey" FOREIGN KEY ("subjectVersionId") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamRoomSlot" ADD CONSTRAINT "ExamRoomSlot_examId_fkey" FOREIGN KEY ("examId") REFERENCES "khao-thi"."Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamRoomSlot" ADD CONSTRAINT "ExamRoomSlot_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ql-dao-tao"."Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."TestStructureRule" ADD CONSTRAINT "TestStructureRule_examId_fkey" FOREIGN KEY ("examId") REFERENCES "khao-thi"."Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."TestStructureRule" ADD CONSTRAINT "TestStructureRule_questionBankId_fkey" FOREIGN KEY ("questionBankId") REFERENCES "khao-thi"."QuestionBank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentGraduationApplication" ADD CONSTRAINT "StudentGraduationApplication_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "ql-dao-tao"."AcademicRankingConvert"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentGraduationApplication" ADD CONSTRAINT "StudentGraduationApplication_trainingMajorId_fkey" FOREIGN KEY ("trainingMajorId") REFERENCES "ql-dao-tao"."TrainingMajor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentGraduationApplication" ADD CONSTRAINT "StudentGraduationApplication_diplomaTypeId_fkey" FOREIGN KEY ("diplomaTypeId") REFERENCES "ql-dao-tao"."DiplomaType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_SubjectClassToSurvey" ADD CONSTRAINT "_SubjectClassToSurvey_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."SubjectClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_SubjectClassToSurvey" ADD CONSTRAINT "_SubjectClassToSurvey_B_fkey" FOREIGN KEY ("B") REFERENCES "khao-thi"."Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."_SurveyQuestionGroupToSurveyTopic" ADD CONSTRAINT "_SurveyQuestionGroupToSurveyTopic_A_fkey" FOREIGN KEY ("A") REFERENCES "khao-thi"."SurveyQuestionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."_SurveyQuestionGroupToSurveyTopic" ADD CONSTRAINT "_SurveyQuestionGroupToSurveyTopic_B_fkey" FOREIGN KEY ("B") REFERENCES "khao-thi"."SurveyTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."_ClusterSurveyToSurveyQuestion" ADD CONSTRAINT "_ClusterSurveyToSurveyQuestion_A_fkey" FOREIGN KEY ("A") REFERENCES "khao-thi"."ClusterSurvey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."_ClusterSurveyToSurveyQuestion" ADD CONSTRAINT "_ClusterSurveyToSurveyQuestion_B_fkey" FOREIGN KEY ("B") REFERENCES "khao-thi"."SurveyQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."_SurveyToSurveyQuestion" ADD CONSTRAINT "_SurveyToSurveyQuestion_A_fkey" FOREIGN KEY ("A") REFERENCES "khao-thi"."Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."_SurveyToSurveyQuestion" ADD CONSTRAINT "_SurveyToSurveyQuestion_B_fkey" FOREIGN KEY ("B") REFERENCES "khao-thi"."SurveyQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
