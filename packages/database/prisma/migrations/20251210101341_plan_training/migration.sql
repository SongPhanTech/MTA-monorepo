/*
  Warnings:

  - You are about to drop the column `scoreScaleId` on the `CriterionCatalog` table. All the data in the column will be lost.
  - You are about to drop the column `evaluationCouncilId` on the `EvaluationCriterion` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `EvaluationCriterion` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `EvaluationCriterion` table. All the data in the column will be lost.
  - You are about to drop the column `scoreScaleId` on the `EvaluationCriterion` table. All the data in the column will be lost.
  - You are about to drop the column `standardId` on the `EvaluationCriterion` table. All the data in the column will be lost.
  - You are about to drop the column `createdExamCode` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `lockExamCode` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `end` on the `ExamRoom` table. All the data in the column will be lost.
  - You are about to drop the column `firstSupervisorId` on the `ExamRoom` table. All the data in the column will be lost.
  - You are about to drop the column `lockExamCode` on the `ExamRoom` table. All the data in the column will be lost.
  - You are about to drop the column `secondSupervisorId` on the `ExamRoom` table. All the data in the column will be lost.
  - You are about to drop the column `start` on the `ExamRoom` table. All the data in the column will be lost.
  - You are about to drop the column `evaluationCriterionId` on the `RequirementCriterion` table. All the data in the column will be lost.
  - You are about to drop the column `surveyId` on the `SurveyChoice` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `initSize` on the `FixedClass` table. All the data in the column will be lost.
  - You are about to drop the column `subjectVersionId` on the `PlanTrainingSubject` table. All the data in the column will be lost.
  - You are about to drop the column `trainingFormId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `trainingLevelId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `trainingObjectTypeId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `trainingTypeId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `examId` on the `StudentSubjectScore` table. All the data in the column will be lost.
  - You are about to drop the column `curriculumId` on the `TrainingBlockOnCurriculumVersion` table. All the data in the column will be lost.
  - You are about to drop the `CriterionAssignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EvaluationSecretarYCouncil` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EvaluationSecretaryMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EvaluationStandard` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ExamRoomSlot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ExamSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ScoreScaleCatalog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PlanTrainingDelay` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PlanTrainingDelaySubject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TrainingKPI` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_FixedClassToPlanTrainingDelaySubject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_FixedClassToPlanTrainingSubject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_SubjectClassToSurvey` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[periodId]` on the table `EvaluationCouncil` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[criterionPeriodId]` on the table `EvaluationCriterion` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[examId,roomId]` on the table `ExamRoom` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[trainingObjectTypeId,semesterId,trainingCourseId]` on the table `PlanTraining` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `criterionPeriodId` to the `EvaluationCriterion` table without a default value. This is not possible if the table is not empty.
  - Made the column `score` on table `EvaluationCriterion` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `semesterId` to the `Exam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `analysisCriterionId` to the `RequirementCriterion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `objectType` to the `StandardCatalog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trainingTypeId` to the `CurriculumVersion` table without a default value. This is not possible if the table is not empty.
  - Made the column `diplomaTypeId` on table `CurriculumVersion` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `trainingBlockSubjectId` to the `PlanTrainingSubject` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ql-dao-tao"."CurriculumVersionType" AS ENUM ('FRAMEWORK', 'FULL_COURSE');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."ThesisType" AS ENUM ('THESIS', 'PROJECT');

-- CreateEnum
CREATE TYPE "khao-thi"."EvaluationPeriodStatus" AS ENUM ('COUNCIL_ESTABLISHED', 'ASSIGNMENT', 'ANALYSIS_WRITING', 'SECRETARY_REVIEW', 'DIRECTOR_REVIEW', 'EVALUATION_WRITING', 'CROSS_REVIEW_ASSIGNMENT', 'CROSS_REVIEW', 'CONSOLIDATION', 'COUNCIL_APPROVAL', 'COMPLETED');

-- CreateEnum
CREATE TYPE "khao-thi"."StandardCatalogType" AS ENUM ('ASSET', 'PROGRAM');

-- CreateEnum
CREATE TYPE "khao-thi"."EvaluationCriterionStatus" AS ENUM ('PENDING', 'SUBMITTED', 'REVISION', 'APPROVED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "khao-thi"."EvaluationStatus" AS ENUM ('LOCK', 'PENDING', 'SUBMITTED', 'REVISION', 'APPROVED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "khao-thi"."SurveyType" AS ENUM ('SINGLE', 'CLUSTER');

-- AlterEnum
ALTER TYPE "khao-thi"."EvaluationMemberRole" ADD VALUE 'SPECIALIZED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ql-dao-tao"."PeriodType" ADD VALUE 'CHECK';
ALTER TYPE "ql-dao-tao"."PeriodType" ADD VALUE 'WEEK';

-- AlterEnum
ALTER TYPE "ql-dao-tao"."SubjectVersionType" ADD VALUE 'Graduation';

-- DropForeignKey
ALTER TABLE "khao-thi"."CriterionAssignment" DROP CONSTRAINT "CriterionAssignment_evaluationCriterionId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."CriterionAssignment" DROP CONSTRAINT "CriterionAssignment_lecturerId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."CriterionCatalog" DROP CONSTRAINT "CriterionCatalog_scoreScaleId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."EvaluationCriterion" DROP CONSTRAINT "EvaluationCriterion_evaluationCouncilId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."EvaluationCriterion" DROP CONSTRAINT "EvaluationCriterion_scoreScaleId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."EvaluationCriterion" DROP CONSTRAINT "EvaluationCriterion_standardId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."EvaluationSecretarYCouncil" DROP CONSTRAINT "EvaluationSecretarYCouncil_periodId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."EvaluationSecretaryMember" DROP CONSTRAINT "EvaluationSecretaryMember_evaluationSecretarYCouncilId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."EvaluationSecretaryMember" DROP CONSTRAINT "EvaluationSecretaryMember_lecturerId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."EvaluationStandard" DROP CONSTRAINT "EvaluationStandard_periodId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."ExamRoom" DROP CONSTRAINT "ExamRoom_firstSupervisorId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."ExamRoom" DROP CONSTRAINT "ExamRoom_secondSupervisorId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."ExamRoomSlot" DROP CONSTRAINT "ExamRoomSlot_examId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."ExamRoomSlot" DROP CONSTRAINT "ExamRoomSlot_roomId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."ExamSession" DROP CONSTRAINT "ExamSession_examId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."ExamSession" DROP CONSTRAINT "ExamSession_examRoomId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."ExamSession" DROP CONSTRAINT "ExamSession_studentSubjectScoreId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."RequirementCriterion" DROP CONSTRAINT "RequirementCriterion_evaluationCriterionId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."SurveyChoice" DROP CONSTRAINT "SurveyChoice_surveyId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."SurveyQuestion" DROP CONSTRAINT "SurveyQuestion_surveyQuestionGroupId_fkey";

-- DropForeignKey
ALTER TABLE "ql-danh-muc"."Notification" DROP CONSTRAINT "Notification_createdById_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."ClassSchedule" DROP CONSTRAINT "ClassSchedule_subjectClassId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."CurriculumVersion" DROP CONSTRAINT "CurriculumVersion_diplomaTypeId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."PlanTrainingDelay" DROP CONSTRAINT "PlanTrainingDelay_trainingObjectTypeId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."PlanTrainingDelaySubject" DROP CONSTRAINT "PlanTrainingDelaySubject_planTrainingDelayId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."PlanTrainingDelaySubject" DROP CONSTRAINT "PlanTrainingDelaySubject_subjectVersionId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."PlanTrainingSubject" DROP CONSTRAINT "PlanTrainingSubject_subjectVersionId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."Student" DROP CONSTRAINT "Student_trainingFormId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."Student" DROP CONSTRAINT "Student_trainingLevelId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."Student" DROP CONSTRAINT "Student_trainingObjectTypeId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."Student" DROP CONSTRAINT "Student_trainingTypeId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."StudentSubjectScore" DROP CONSTRAINT "StudentSubjectScore_examId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."TrainingBlockOnCurriculumVersion" DROP CONSTRAINT "TrainingBlockOnCurriculumVersion_curriculumId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."_FixedClassToPlanTrainingDelaySubject" DROP CONSTRAINT "_FixedClassToPlanTrainingDelaySubject_A_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."_FixedClassToPlanTrainingDelaySubject" DROP CONSTRAINT "_FixedClassToPlanTrainingDelaySubject_B_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."_FixedClassToPlanTrainingSubject" DROP CONSTRAINT "_FixedClassToPlanTrainingSubject_A_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."_FixedClassToPlanTrainingSubject" DROP CONSTRAINT "_FixedClassToPlanTrainingSubject_B_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."_SubjectClassToSurvey" DROP CONSTRAINT "_SubjectClassToSurvey_A_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."_SubjectClassToSurvey" DROP CONSTRAINT "_SubjectClassToSurvey_B_fkey";

-- DropIndex
DROP INDEX "khao-thi"."EvaluationCriterion_standardId_name_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."TrainingField_name_key";

-- AlterTable
ALTER TABLE "he-thong"."Config" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "khao-thi"."AnalysisFormEvidence" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "khao-thi"."ClusterSurvey" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "khao-thi"."CriterionCatalog" DROP COLUMN "scoreScaleId",
ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "khao-thi"."Difficulty" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "khao-thi"."EvaluationCouncil" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "khao-thi"."EvaluationCouncilMember" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "khao-thi"."EvaluationCriterion" DROP COLUMN "evaluationCouncilId",
DROP COLUMN "name",
DROP COLUMN "order",
DROP COLUMN "scoreScaleId",
DROP COLUMN "standardId",
ADD COLUMN     "createdBy" UUID,
ADD COLUMN     "criterionPeriodId" TEXT NOT NULL,
ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "deadlineReview" TIMESTAMP(3),
ADD COLUMN     "lecturerId" TEXT,
ADD COLUMN     "reviewerId" TEXT,
ADD COLUMN     "status" "khao-thi"."EvaluationStatus" NOT NULL DEFAULT 'LOCK',
ALTER COLUMN "score" SET NOT NULL,
ALTER COLUMN "score" SET DEFAULT '',
ALTER COLUMN "score" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "khao-thi"."EvaluationPeriod" ADD COLUMN     "createdBy" UUID,
ADD COLUMN     "semesterId" TEXT,
ADD COLUMN     "status" "khao-thi"."EvaluationPeriodStatus" NOT NULL DEFAULT 'COUNCIL_ESTABLISHED';

-- AlterTable
ALTER TABLE "khao-thi"."Evidence" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "khao-thi"."EvidenceCategory" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "khao-thi"."EvidenceFile" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "khao-thi"."Exam" DROP COLUMN "createdExamCode",
DROP COLUMN "lockExamCode",
DROP COLUMN "status",
ADD COLUMN     "createdBy" UUID,
ADD COLUMN     "semesterId" TEXT NOT NULL,
ADD COLUMN     "session" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "khao-thi"."ExamBank" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "khao-thi"."ExamBankQuestion" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "khao-thi"."ExamRoom" DROP COLUMN "end",
DROP COLUMN "firstSupervisorId",
DROP COLUMN "lockExamCode",
DROP COLUMN "secondSupervisorId",
DROP COLUMN "start",
ADD COLUMN     "capacity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "khao-thi"."FillInBlankSlot" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "khao-thi"."KnowledgeBlock" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "khao-thi"."MultipleChoiceOption" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "khao-thi"."OrderingItem" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "khao-thi"."Question" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "khao-thi"."QuestionBank" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "khao-thi"."RequirementCriterion" DROP COLUMN "evaluationCriterionId",
ADD COLUMN     "analysisCriterionId" TEXT NOT NULL,
ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "khao-thi"."RequirementCriterionCatalog" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "khao-thi"."StandardCatalog" ADD COLUMN     "createdBy" UUID,
ADD COLUMN     "objectType" "khao-thi"."StandardCatalogType" NOT NULL;

-- AlterTable
ALTER TABLE "khao-thi"."Survey" ADD COLUMN     "createdBy" UUID,
ADD COLUMN     "semesterId" TEXT,
ADD COLUMN     "subjectClassId" TEXT;

-- AlterTable
ALTER TABLE "khao-thi"."SurveyChoice" DROP COLUMN "surveyId",
ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "khao-thi"."SurveyObjectType" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "khao-thi"."SurveyQuestion" ADD COLUMN     "createdBy" UUID,
ALTER COLUMN "surveyQuestionGroupId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "khao-thi"."SurveyQuestionGroup" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "khao-thi"."SurveyResponse" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "khao-thi"."SurveySession" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "khao-thi"."SurveyTopic" ADD COLUMN     "createdBy" UUID,
ADD COLUMN     "type" "khao-thi"."SurveyType";

-- AlterTable
ALTER TABLE "khao-thi"."TestStructureRule" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "mta"."DM_DonVi" ADD COLUMN     "iCapDonVi" INTEGER,
ADD COLUMN     "iLoaiDonVi" INTEGER,
ADD COLUMN     "iNhomDonVi" INTEGER;

-- AlterTable
ALTER TABLE "mta"."DM_NhanVien" ADD COLUMN     "bLaGiangVien" BOOLEAN;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD COLUMN     "createdBy" UUID,
ADD COLUMN     "librarySubmissionId" TEXT;

-- AlterTable
ALTER TABLE "ql-danh-muc"."LecturerType" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-danh-muc"."Notification" DROP COLUMN "createdById",
ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-danh-muc"."StaffPosition" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-danh-muc"."StaffType" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-danh-muc"."TemplateFile" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."AcademicActionCondition" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."AcademicActionConfig" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."AcademicActionRuleSet" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."AcademicRankingConvert" ADD COLUMN     "classificationEnglish" TEXT,
ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."AcademicWarning" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."AcademicWarningRule" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."ApplicationCheckResult" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."ArchivedAward" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."ArchivedAwardOnStudentSubjectScore" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."ArchivedCertificate" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."ArchivedCertificateOnStudentSubjectScore" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."Award" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."Building" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."Certificate" ADD COLUMN     "createdBy" UUID,
ADD COLUMN     "outputStandardId" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."CertificateOnSubject" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."ClassRegisterLogs" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."ClassRegisterSession" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."ClassRegisterSessionCredit" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."ClassSchedule" ADD COLUMN     "createdBy" UUID,
ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "location" TEXT,
ADD COLUMN     "startTime" TIMESTAMP(3),
ALTER COLUMN "subjectClassId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ql-dao-tao"."Council" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."CouncilMember" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."Curriculum" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."CurriculumVersion" ADD COLUMN     "createdBy" UUID,
ADD COLUMN     "trainingTypeId" TEXT NOT NULL,
ADD COLUMN     "type" "ql-dao-tao"."CurriculumVersionType" NOT NULL DEFAULT 'FULL_COURSE',
ALTER COLUMN "diplomaTypeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-dao-tao"."Decision" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."DefaultCouncilRolePayAmount" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."DefenseRecord" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."DefenseSession" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."DiplomaType" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."DiplomaVerificationApplication" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."DisciplinaryWarning" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."DisciplinaryWarningReason" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."EquivalencyGroup" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."ExpertProfile" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."FixedClass" DROP COLUMN "initSize",
ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."GraduationDecision" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."GraduationRankDowngradeCondition" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."GraduationRankDowngradeRule" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."GraduationSession" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."Invitation" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."Lecturer" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."LecturerHistory" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."LibrarySubmission" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."Milestone" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."Note" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."NoteFolder" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."NoteReminder" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."NoteTag" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."PaymentRecord" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."PlanTraining" ADD COLUMN     "trainingCourseId" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."PlanTrainingSubject" DROP COLUMN "subjectVersionId",
ADD COLUMN     "studentCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trainingBlockSubjectId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ql-dao-tao"."PriorityObject" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."RankingCondition" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."ResearchProject" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."Room" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."Scholarship" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."ScholarshipAward" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."ScholarshipCriteria" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."SchoolYear" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."ScoreConvert" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."Semester" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."Staff" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."StaffHistory" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."Student" DROP COLUMN "trainingFormId",
DROP COLUMN "trainingLevelId",
DROP COLUMN "trainingObjectTypeId",
DROP COLUMN "trainingTypeId",
ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentAcademicDecision" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentGraduationApplication" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentResearchRegistration" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentScoreConvert" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentSemesterResult" ADD COLUMN     "rankId" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentSubjectScore" DROP COLUMN "examId",
ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentSubjectScoreHistory" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentThesisRegistration" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentTrainingScore" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentYearResult" ADD COLUMN     "rankId" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."Subject" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectClass" ALTER COLUMN "isLockExamScore" SET DEFAULT false;

-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectClassHistory" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectClassTime" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectInGroup" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectScoreConvert" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectVersion" ADD COLUMN     "createdBy" UUID,
ALTER COLUMN "period" DROP NOT NULL,
ALTER COLUMN "period" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectVersionCategory" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectVersionHistory" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."SupervisorPaymentRecord" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."ThesisProject" ADD COLUMN     "createdBy" UUID,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "thesisType" "ql-dao-tao"."ThesisType" NOT NULL DEFAULT 'PROJECT',
ADD COLUMN     "type" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."ThesisSession" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingBlock" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingBlockOnCurriculumVersion" DROP COLUMN "curriculumId",
ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingBlockSubject" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingCourse" ADD COLUMN     "createdBy" UUID,
ADD COLUMN     "maxReExamScore" DOUBLE PRECISION NOT NULL DEFAULT 6.9,
ADD COLUMN     "reduceReExamScore" DOUBLE PRECISION NOT NULL DEFAULT 1,
ALTER COLUMN "scoreToTakeExam" SET DEFAULT 5,
ALTER COLUMN "scoreToPass" SET DEFAULT 5,
ALTER COLUMN "scoreToRetain" SET DEFAULT 10.5;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingField" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingFieldOnTrainingObjectType" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingForm" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingLanguage" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingLevel" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingLocation" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingMajor" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingMajorOnTrainingObjectType" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingObjectType" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingScoreSession" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingTime" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingType" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."BoiDuongQuocPhongAnNinh" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."CapBac" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."ChienDau" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_BacLuong" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_ChiHuyQuanLy" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_ChucDanhCMNVGiangVien" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_ChucDanhCMNVKySu" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_ChucDanhCMNVNghienCuuVien" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_ChuyenMonKyThuat" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_ChuyenNganhDaoTaoBacDH" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_HinhThucKhenThuongChinhQuyen" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_HinhThucKhenThuongDang" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_LoaiHinhCongTac" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_LoaiHinhDiHocTap" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_LoaiThuongTat" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_Ngach" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_NganhHoc" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_NhomMau" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_NuocCuDiHocTap" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_SucKhoe" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_TinhTrangCongTac" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_TinhTrangDiHocTap" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_TinhTrangHonNhan" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_ToChucXaHoi" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_TrangThaiLamViec" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_TrinhDoHocVan" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_TrinhDoLyLuanChinhTri" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_TrinhDoQuanLyNhaNuoc" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_TruongDaoTaoBacDH" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_XepLoaiDanhGiaCanBo" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DM_XepLoaiDanhGiaChatLuongDangVien" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DanhHieu" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."DoiTuongChinhSach" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."HocHam" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."HocVi" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."KeKhaiTaiSan" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."KhenThuong" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."KyLuat" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."NgoaiNgu" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."NuocNgoai" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."QuaTrinhCongTac" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."QuaTrinhCuDiCongTac" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."QuaTrinhCuDiDaoTao" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."QuaTrinhHocTap" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."QuaTrinhLuong" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."Relative" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."ThuongTat" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."TiengDanToc" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."TinHoc" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."ToChucXaHoi" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."TrinhDoLyLuanChinhTri" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-ho-so"."TrinhDoQuanLyNhaNuoc" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-nguoi-dung"."BlockedIp" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-nguoi-dung"."Feedback" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-nguoi-dung"."Group" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-nguoi-dung"."Permission" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-nguoi-dung"."Role" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD COLUMN     "bLaGiangVien" BOOLEAN,
ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "tro-ly-ao"."ChatBotConfig" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "tro-ly-ao"."CitationMessage" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "tro-ly-ao"."Conversation" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "tro-ly-ao"."Document" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "tro-ly-ao"."DocumentClassification" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "tro-ly-ao"."DocumentTopic" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "tro-ly-ao"."FAQ" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "tro-ly-ao"."Message" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "tro-ly-ao"."Prompt" ADD COLUMN     "createdBy" UUID;

-- AlterTable
ALTER TABLE "tro-ly-ao"."Topic" ADD COLUMN     "createdBy" UUID,
ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tro-ly-ao"."UserSession" ADD COLUMN     "createdBy" UUID;

-- DropTable
DROP TABLE "khao-thi"."CriterionAssignment";

-- DropTable
DROP TABLE "khao-thi"."EvaluationSecretarYCouncil";

-- DropTable
DROP TABLE "khao-thi"."EvaluationSecretaryMember";

-- DropTable
DROP TABLE "khao-thi"."EvaluationStandard";

-- DropTable
DROP TABLE "khao-thi"."ExamRoomSlot";

-- DropTable
DROP TABLE "khao-thi"."ExamSession";

-- DropTable
DROP TABLE "khao-thi"."ScoreScaleCatalog";

-- DropTable
DROP TABLE "ql-dao-tao"."PlanTrainingDelay";

-- DropTable
DROP TABLE "ql-dao-tao"."PlanTrainingDelaySubject";

-- DropTable
DROP TABLE "ql-dao-tao"."TrainingKPI";

-- DropTable
DROP TABLE "ql-dao-tao"."_FixedClassToPlanTrainingDelaySubject";

-- DropTable
DROP TABLE "ql-dao-tao"."_FixedClassToPlanTrainingSubject";

-- DropTable
DROP TABLE "ql-dao-tao"."_SubjectClassToSurvey";

-- DropEnum
DROP TYPE "khao-thi"."EvaluationSecretaryMemberRole";

-- DropEnum
DROP TYPE "khao-thi"."ExamStatus";

-- CreateTable
CREATE TABLE "he-thong"."Suggestion" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."LoadCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "standardHours" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "note" TEXT,
    "isOverageCalculated" BOOLEAN NOT NULL,

    CONSTRAINT "LoadCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."OutputStandard" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "name" TEXT NOT NULL,

    CONSTRAINT "OutputStandard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."OutputStandardOnCurriculum" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "outputStandardId" TEXT NOT NULL,
    "curriculumVersionId" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "semesterIndex" INTEGER,

    CONSTRAINT "OutputStandardOnCurriculum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."EvaluationCriterionComment" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "reviewerId" TEXT NOT NULL,
    "requirementCriterionId" TEXT,
    "content" TEXT,
    "analysisCriterionId" TEXT,
    "evaluationCriterionId" TEXT,

    CONSTRAINT "EvaluationCriterionComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."StandardPeriod" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "periodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "opening" TEXT NOT NULL DEFAULT '',
    "conclusion" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "StandardPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."CriterionPeriod" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "evaluationStandardId" TEXT NOT NULL,

    CONSTRAINT "CriterionPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."AnalysisCriterion" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "criterionPeriodId" TEXT NOT NULL,
    "lecturerId" TEXT,
    "deadline" TIMESTAMP(3),
    "status" "khao-thi"."EvaluationCriterionStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "AnalysisCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."ExamList" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "examRoomId" TEXT,
    "firstSupervisorId" TEXT,
    "secondSupervisorId" TEXT,
    "createdExamCode" BOOLEAN NOT NULL DEFAULT false,
    "lockExamCode" BOOLEAN NOT NULL DEFAULT false,
    "start" INTEGER,
    "end" INTEGER,

    CONSTRAINT "ExamList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."ExamPaper" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "examListId" TEXT,
    "studentSubjectScoreId" TEXT NOT NULL,
    "examCode" TEXT,

    CONSTRAINT "ExamPaper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."ApplicationDowngraded" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "studentGraduationApplicationId" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,

    CONSTRAINT "ApplicationDowngraded_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."_ClassScheduleToUserProfile" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ClassScheduleToUserProfile_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "khao-thi"."_SurveyToSurveyChoice" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SurveyToSurveyChoice_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."_ApplicationDowngradedToGraduationRankDowngradeCondition" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ApplicationDowngradedToGraduationRankDowngradeConditio_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Suggestion_code_key" ON "he-thong"."Suggestion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LoadCategory_code_key" ON "ql-dao-tao"."LoadCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OutputStandard_code_key" ON "ql-dao-tao"."OutputStandard"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OutputStandardOnCurriculum_code_key" ON "ql-dao-tao"."OutputStandardOnCurriculum"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OutputStandardOnCurriculum_outputStandardId_curriculumVersi_key" ON "ql-dao-tao"."OutputStandardOnCurriculum"("outputStandardId", "curriculumVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationCriterionComment_code_key" ON "khao-thi"."EvaluationCriterionComment"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StandardPeriod_code_key" ON "khao-thi"."StandardPeriod"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StandardPeriod_periodId_name_key" ON "khao-thi"."StandardPeriod"("periodId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CriterionPeriod_code_key" ON "khao-thi"."CriterionPeriod"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisCriterion_code_key" ON "khao-thi"."AnalysisCriterion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisCriterion_criterionPeriodId_key" ON "khao-thi"."AnalysisCriterion"("criterionPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamList_code_key" ON "khao-thi"."ExamList"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ExamPaper_code_key" ON "khao-thi"."ExamPaper"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ExamPaper_studentSubjectScoreId_key" ON "khao-thi"."ExamPaper"("studentSubjectScoreId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamPaper_examCode_examListId_key" ON "khao-thi"."ExamPaper"("examCode", "examListId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationDowngraded_code_key" ON "ql-dao-tao"."ApplicationDowngraded"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationDowngraded_studentGraduationApplicationId_key" ON "ql-dao-tao"."ApplicationDowngraded"("studentGraduationApplicationId");

-- CreateIndex
CREATE INDEX "_ClassScheduleToUserProfile_B_index" ON "ql-dao-tao"."_ClassScheduleToUserProfile"("B");

-- CreateIndex
CREATE INDEX "_SurveyToSurveyChoice_B_index" ON "khao-thi"."_SurveyToSurveyChoice"("B");

-- CreateIndex
CREATE INDEX "_ApplicationDowngradedToGraduationRankDowngradeConditio_B_index" ON "ql-dao-tao"."_ApplicationDowngradedToGraduationRankDowngradeCondition"("B");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationCouncil_periodId_key" ON "khao-thi"."EvaluationCouncil"("periodId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationCriterion_criterionPeriodId_key" ON "khao-thi"."EvaluationCriterion"("criterionPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamRoom_examId_roomId_key" ON "khao-thi"."ExamRoom"("examId", "roomId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanTraining_trainingObjectTypeId_semesterId_trainingCourse_key" ON "ql-dao-tao"."PlanTraining"("trainingObjectTypeId", "semesterId", "trainingCourseId");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."PlanTraining" ADD CONSTRAINT "PlanTraining_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."PlanTrainingSubject" ADD CONSTRAINT "PlanTrainingSubject_trainingBlockSubjectId_fkey" FOREIGN KEY ("trainingBlockSubjectId") REFERENCES "ql-dao-tao"."TrainingBlockSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CurriculumVersion" ADD CONSTRAINT "CurriculumVersion_trainingTypeId_fkey" FOREIGN KEY ("trainingTypeId") REFERENCES "ql-dao-tao"."TrainingType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CurriculumVersion" ADD CONSTRAINT "CurriculumVersion_diplomaTypeId_fkey" FOREIGN KEY ("diplomaTypeId") REFERENCES "ql-dao-tao"."DiplomaType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ClassSchedule" ADD CONSTRAINT "ClassSchedule_subjectClassId_fkey" FOREIGN KEY ("subjectClassId") REFERENCES "ql-dao-tao"."SubjectClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Certificate" ADD CONSTRAINT "Certificate_outputStandardId_fkey" FOREIGN KEY ("outputStandardId") REFERENCES "ql-dao-tao"."OutputStandard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."OutputStandardOnCurriculum" ADD CONSTRAINT "OutputStandardOnCurriculum_outputStandardId_fkey" FOREIGN KEY ("outputStandardId") REFERENCES "ql-dao-tao"."OutputStandard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."OutputStandardOnCurriculum" ADD CONSTRAINT "OutputStandardOnCurriculum_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "ql-dao-tao"."CurriculumVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentSemesterResult" ADD CONSTRAINT "StudentSemesterResult_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "ql-dao-tao"."AcademicRankingConvert"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentYearResult" ADD CONSTRAINT "StudentYearResult_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "ql-dao-tao"."AcademicRankingConvert"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_librarySubmissionId_fkey" FOREIGN KEY ("librarySubmissionId") REFERENCES "ql-dao-tao"."LibrarySubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."EvaluationPeriod" ADD CONSTRAINT "EvaluationPeriod_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."EvaluationCriterionComment" ADD CONSTRAINT "EvaluationCriterionComment_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."EvaluationCriterionComment" ADD CONSTRAINT "EvaluationCriterionComment_requirementCriterionId_fkey" FOREIGN KEY ("requirementCriterionId") REFERENCES "khao-thi"."RequirementCriterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."EvaluationCriterionComment" ADD CONSTRAINT "EvaluationCriterionComment_analysisCriterionId_fkey" FOREIGN KEY ("analysisCriterionId") REFERENCES "khao-thi"."AnalysisCriterion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."EvaluationCriterionComment" ADD CONSTRAINT "EvaluationCriterionComment_evaluationCriterionId_fkey" FOREIGN KEY ("evaluationCriterionId") REFERENCES "khao-thi"."EvaluationCriterion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."StandardPeriod" ADD CONSTRAINT "StandardPeriod_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "khao-thi"."EvaluationPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."CriterionPeriod" ADD CONSTRAINT "CriterionPeriod_evaluationStandardId_fkey" FOREIGN KEY ("evaluationStandardId") REFERENCES "khao-thi"."StandardPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."AnalysisCriterion" ADD CONSTRAINT "AnalysisCriterion_criterionPeriodId_fkey" FOREIGN KEY ("criterionPeriodId") REFERENCES "khao-thi"."CriterionPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."AnalysisCriterion" ADD CONSTRAINT "AnalysisCriterion_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."EvaluationCriterion" ADD CONSTRAINT "EvaluationCriterion_criterionPeriodId_fkey" FOREIGN KEY ("criterionPeriodId") REFERENCES "khao-thi"."CriterionPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."EvaluationCriterion" ADD CONSTRAINT "EvaluationCriterion_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."EvaluationCriterion" ADD CONSTRAINT "EvaluationCriterion_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "khao-thi"."EvaluationCouncilMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."RequirementCriterion" ADD CONSTRAINT "RequirementCriterion_analysisCriterionId_fkey" FOREIGN KEY ("analysisCriterionId") REFERENCES "khao-thi"."AnalysisCriterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."Survey" ADD CONSTRAINT "Survey_subjectClassId_fkey" FOREIGN KEY ("subjectClassId") REFERENCES "ql-dao-tao"."SubjectClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."Survey" ADD CONSTRAINT "Survey_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SurveyQuestion" ADD CONSTRAINT "SurveyQuestion_surveyQuestionGroupId_fkey" FOREIGN KEY ("surveyQuestionGroupId") REFERENCES "khao-thi"."SurveyQuestionGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."Exam" ADD CONSTRAINT "Exam_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamList" ADD CONSTRAINT "ExamList_examRoomId_fkey" FOREIGN KEY ("examRoomId") REFERENCES "khao-thi"."ExamRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamList" ADD CONSTRAINT "ExamList_firstSupervisorId_fkey" FOREIGN KEY ("firstSupervisorId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamList" ADD CONSTRAINT "ExamList_secondSupervisorId_fkey" FOREIGN KEY ("secondSupervisorId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamPaper" ADD CONSTRAINT "ExamPaper_examListId_fkey" FOREIGN KEY ("examListId") REFERENCES "khao-thi"."ExamList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamPaper" ADD CONSTRAINT "ExamPaper_studentSubjectScoreId_fkey" FOREIGN KEY ("studentSubjectScoreId") REFERENCES "ql-dao-tao"."StudentSubjectScore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ApplicationDowngraded" ADD CONSTRAINT "ApplicationDowngraded_studentGraduationApplicationId_fkey" FOREIGN KEY ("studentGraduationApplicationId") REFERENCES "ql-dao-tao"."StudentGraduationApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ApplicationDowngraded" ADD CONSTRAINT "ApplicationDowngraded_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "ql-dao-tao"."AcademicRankingConvert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_ClassScheduleToUserProfile" ADD CONSTRAINT "_ClassScheduleToUserProfile_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."ClassSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_ClassScheduleToUserProfile" ADD CONSTRAINT "_ClassScheduleToUserProfile_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."_SurveyToSurveyChoice" ADD CONSTRAINT "_SurveyToSurveyChoice_A_fkey" FOREIGN KEY ("A") REFERENCES "khao-thi"."Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."_SurveyToSurveyChoice" ADD CONSTRAINT "_SurveyToSurveyChoice_B_fkey" FOREIGN KEY ("B") REFERENCES "khao-thi"."SurveyChoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_ApplicationDowngradedToGraduationRankDowngradeCondition" ADD CONSTRAINT "_ApplicationDowngradedToGraduationRankDowngradeCondition_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."ApplicationDowngraded"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_ApplicationDowngradedToGraduationRankDowngradeCondition" ADD CONSTRAINT "_ApplicationDowngradedToGraduationRankDowngradeCondition_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."GraduationRankDowngradeCondition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
