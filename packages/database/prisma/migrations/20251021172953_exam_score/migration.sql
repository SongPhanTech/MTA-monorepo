/*
  Warnings:

  - The values [OnlineWritten,OfflineChoices,OnlineChoices] on the enum `ExamType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `endTime` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `maxScore` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `passScore` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `showResult` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `shuffleAnswers` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `shuffleQuestions` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `ExamSession` table. All the data in the column will be lost.
  - You are about to drop the column `examBankId` on the `ExamSession` table. All the data in the column will be lost.
  - You are about to drop the column `examFaxId` on the `ExamSession` table. All the data in the column will be lost.
  - You are about to drop the column `roomId` on the `ExamSession` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `ExamSession` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `ExamSession` table. All the data in the column will be lost.
  - You are about to drop the column `englishName` on the `ArchivedAward` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `ArchivedAward` table. All the data in the column will be lost.
  - You are about to drop the column `englishName` on the `ArchivedCertificate` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `ArchivedCertificate` table. All the data in the column will be lost.
  - You are about to drop the column `trainingLanguage` on the `CurriculumVersion` table. All the data in the column will be lost.
  - You are about to drop the column `print` on the `TrainingBlockSubject` table. All the data in the column will be lost.
  - You are about to drop the column `project` on the `TrainingBlockSubject` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `FAQ` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the `Answer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ExamFax` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[studentSubjectScoreId]` on the table `ExamSession` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[examCode,examRoomId]` on the table `ExamSession` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[registerNumber]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[doctoralCode]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `examRoomId` to the `ExamSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentSubjectScoreId` to the `ExamSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `awardId` to the `ArchivedAward` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `ArchivedAward` table without a default value. This is not possible if the table is not empty.
  - Added the required column `certificateId` to the `ArchivedCertificate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `issuedBy` to the `ArchivedCertificate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `issuedDate` to the `ArchivedCertificate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `score` to the `ArchivedCertificate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `ArchivedCertificate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trainingObjectTypeId` to the `Curriculum` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trainingObjectTypeId` to the `SubjectVersion` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ql-dao-tao"."ScoreConvertStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."ArchivedCertificateStatus" AS ENUM ('PENDING', 'CANCEL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."SubjectClassType" AS ENUM ('NORMAL', 'RETAKE', 'REEXAM');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "khao-thi"."QuestionType" ADD VALUE 'SINGLE_CHOICE';
ALTER TYPE "khao-thi"."QuestionType" ADD VALUE 'MULTIPLE_CHOICE';
ALTER TYPE "khao-thi"."QuestionType" ADD VALUE 'FILL_IN_BLANK';
ALTER TYPE "khao-thi"."QuestionType" ADD VALUE 'ORDERING';

-- AlterEnum
BEGIN;
CREATE TYPE "ql-dao-tao"."ExamType_new" AS ENUM ('OfflineWritten', 'Oral', 'Practice', 'Project', 'Other');
ALTER TABLE "ql-dao-tao"."SubjectVersion" ALTER COLUMN "examType" TYPE "ql-dao-tao"."ExamType_new" USING ("examType"::text::"ql-dao-tao"."ExamType_new");
ALTER TABLE "ql-dao-tao"."SubjectClass" ALTER COLUMN "examType" TYPE "ql-dao-tao"."ExamType_new" USING ("examType"::text::"ql-dao-tao"."ExamType_new");
ALTER TYPE "ql-dao-tao"."ExamType" RENAME TO "ExamType_old";
ALTER TYPE "ql-dao-tao"."ExamType_new" RENAME TO "ExamType";
DROP TYPE "ql-dao-tao"."ExamType_old";
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ql-dao-tao"."SemesterType" ADD VALUE 'FIRST_SUPPLEMENTARY';
ALTER TYPE "ql-dao-tao"."SemesterType" ADD VALUE 'SECOND_SUPPLEMENTARY';
ALTER TYPE "ql-dao-tao"."SemesterType" ADD VALUE 'SUMMER';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ql-dao-tao"."SubjectVersionType" ADD VALUE 'Internship';
ALTER TYPE "ql-dao-tao"."SubjectVersionType" ADD VALUE 'Research';

-- DropForeignKey
ALTER TABLE "khao-thi"."Answer" DROP CONSTRAINT "Answer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."Answer" DROP CONSTRAINT "Answer_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."Exam" DROP CONSTRAINT "Exam_questionBankId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."ExamFax" DROP CONSTRAINT "ExamFax_examId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."ExamSession" DROP CONSTRAINT "ExamSession_examBankId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."ExamSession" DROP CONSTRAINT "ExamSession_examFaxId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."ExamSession" DROP CONSTRAINT "ExamSession_roomId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."ExamSession" DROP CONSTRAINT "ExamSession_studentId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."SurveyChoice" DROP CONSTRAINT "SurveyChoice_surveyId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."TrainingBlockOnCurriculumVersion" DROP CONSTRAINT "TrainingBlockOnCurriculumVersion_curriculumVersionId_fkey";

-- DropForeignKey
ALTER TABLE "ql-ho-so"."QuaTrinhCongTac" DROP CONSTRAINT "QuaTrinhCongTac_chucVuId_fkey";

-- DropForeignKey
ALTER TABLE "ql-ho-so"."QuaTrinhCongTac" DROP CONSTRAINT "QuaTrinhCongTac_loaiHinhCongTacId_fkey";

-- DropIndex
DROP INDEX "khao-thi"."ExamSession_examFaxId_key";

-- DropIndex
DROP INDEX "khao-thi"."ExamSession_studentId_examId_key";

-- AlterTable
ALTER TABLE "khao-thi"."Exam" DROP COLUMN "endTime",
DROP COLUMN "maxScore",
DROP COLUMN "passScore",
DROP COLUMN "showResult",
DROP COLUMN "shuffleAnswers",
DROP COLUMN "shuffleQuestions",
DROP COLUMN "startTime",
DROP COLUMN "title",
ADD COLUMN     "lockExamCode" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "questionBankId" DROP NOT NULL,
ALTER COLUMN "duration" DROP NOT NULL;

-- AlterTable
ALTER TABLE "khao-thi"."ExamSession" DROP COLUMN "endTime",
DROP COLUMN "examBankId",
DROP COLUMN "examFaxId",
DROP COLUMN "roomId",
DROP COLUMN "startTime",
DROP COLUMN "studentId",
ADD COLUMN     "examCode" TEXT,
ADD COLUMN     "examRoomId" TEXT NOT NULL,
ADD COLUMN     "studentSubjectScoreId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "khao-thi"."Survey" ADD COLUMN     "clusterSurveyId" TEXT;

-- AlterTable
ALTER TABLE "khao-thi"."SurveyChoice" ADD COLUMN     "clusterSurveyId" TEXT,
ALTER COLUMN "surveyId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "khao-thi"."SurveyQuestion" ADD COLUMN     "clusterSurveyId" TEXT;

-- AlterTable
ALTER TABLE "khao-thi"."SurveySession" ADD COLUMN     "surveyObjectTypeId" TEXT;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD COLUMN     "studentScoreConvertId" TEXT,
ADD COLUMN     "trainingCourseId" TEXT,
ADD COLUMN     "trainingFieldId" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."ArchivedAward" DROP COLUMN "englishName",
DROP COLUMN "name",
ADD COLUMN     "awardId" TEXT NOT NULL,
ADD COLUMN     "date" TIMESTAMP(3),
ADD COLUMN     "status" "ql-dao-tao"."ArchivedCertificateStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "studentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ql-dao-tao"."ArchivedCertificate" DROP COLUMN "englishName",
DROP COLUMN "name",
ADD COLUMN     "certificateId" TEXT NOT NULL,
ADD COLUMN     "expiredDate" TIMESTAMP(3),
ADD COLUMN     "issuedBy" TEXT NOT NULL,
ADD COLUMN     "issuedDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "score" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "status" "ql-dao-tao"."ArchivedCertificateStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "studentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ql-dao-tao"."ClassRegisterSessionCredit" ADD COLUMN     "base10Max" DOUBLE PRECISION,
ADD COLUMN     "base10Min" DOUBLE PRECISION,
ADD COLUMN     "base4Max" DOUBLE PRECISION,
ADD COLUMN     "base4Min" DOUBLE PRECISION,
ADD COLUMN     "baseScore" "ql-dao-tao"."AcademicRankingBaseType" NOT NULL DEFAULT 'Base10';

-- AlterTable
ALTER TABLE "ql-dao-tao"."Curriculum" ADD COLUMN     "trainingObjectTypeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ql-dao-tao"."CurriculumVersion" DROP COLUMN "trainingLanguage",
ADD COLUMN     "isLock" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trainingLanguageId" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."Student" ADD COLUMN     "admissionCombination" TEXT,
ADD COLUMN     "basic" DOUBLE PRECISION,
ADD COLUMN     "careerYear" INTEGER,
ADD COLUMN     "competencyScore" DOUBLE PRECISION,
ADD COLUMN     "curriculumVersionParallelId" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "departmentAddress" TEXT,
ADD COLUMN     "doctoralCode" TEXT,
ADD COLUMN     "facility" DOUBLE PRECISION,
ADD COLUMN     "foreignLanguage" TEXT,
ADD COLUMN     "priorityReason" TEXT,
ADD COLUMN     "registerNumber" TEXT,
ADD COLUMN     "universityGraduationYear" INTEGER,
ADD COLUMN     "universityMajor" TEXT,
ADD COLUMN     "universityRank" TEXT,
ADD COLUMN     "universitySchool" TEXT,
ADD COLUMN     "universityTrainingType" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentSubjectScore" ADD COLUMN     "examId" TEXT,
ADD COLUMN     "isImproving" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "repeatedReason" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectClass" ADD COLUMN     "scoreDeadLineStart" TIMESTAMP(3),
ADD COLUMN     "sendLecturerAssignmentAt" TIMESTAMP(3),
ADD COLUMN     "submitLecturerAssignmentAt" TIMESTAMP(3),
ADD COLUMN     "trainingLocationId" TEXT,
ADD COLUMN     "type" "ql-dao-tao"."SubjectClassType" NOT NULL DEFAULT 'NORMAL',
ALTER COLUMN "startDate" DROP NOT NULL,
ALTER COLUMN "schedule" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectVersion" ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onePoint" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "schedulePeriod" INTEGER,
ADD COLUMN     "subjectVersionCategoryId" TEXT,
ADD COLUMN     "trainingObjectTypeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingBlock" ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingBlockOnCurriculumVersion" ADD COLUMN     "curriculumId" TEXT,
ALTER COLUMN "curriculumVersionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingBlockSubject" DROP COLUMN "print",
DROP COLUMN "project";

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingCourse" ADD COLUMN     "admissionDecision" TEXT,
ADD COLUMN     "admissionEndDate" TIMESTAMP(3),
ADD COLUMN     "admissionStartDate" TIMESTAMP(3),
ADD COLUMN     "isGeneralInfoLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRegulationLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isScoreConfigLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "regulation" TEXT,
ADD COLUMN     "studentRecognitionDecision" TEXT,
ADD COLUMN     "trainingLanguageId" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingField" ADD COLUMN     "decisionNo" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingLocation" ADD COLUMN     "dM_TinhId" UUID,
ADD COLUMN     "dM_Tinh_NewId" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingMajor" ADD COLUMN     "secondOrganizationId" UUID,
ADD COLUMN     "thirdOrganizationId" UUID;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingObjectType" ADD COLUMN     "trainingFormId" TEXT,
ADD COLUMN     "trainingLevelId" TEXT;

-- AlterTable
ALTER TABLE "ql-ho-so"."QuaTrinhCongTac" ADD COLUMN     "diaChi" TEXT,
ALTER COLUMN "chucVuId" DROP NOT NULL,
ALTER COLUMN "loaiHinhCongTacId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tro-ly-ao"."Conversation" DROP COLUMN "type",
ADD COLUMN     "topicId" TEXT;

-- AlterTable
ALTER TABLE "tro-ly-ao"."Document" DROP COLUMN "type",
ADD COLUMN     "classificationId" TEXT;

-- AlterTable
ALTER TABLE "tro-ly-ao"."FAQ" DROP COLUMN "type",
ADD COLUMN     "topicId" TEXT;

-- AlterTable
ALTER TABLE "tro-ly-ao"."Prompt" DROP COLUMN "type",
ADD COLUMN     "topicId" TEXT;

-- DropTable
DROP TABLE "khao-thi"."Answer";

-- DropTable
DROP TABLE "khao-thi"."ExamFax";

-- DropEnum
DROP TYPE "ql-dao-tao"."TrainingLanguage";

-- DropEnum
DROP TYPE "tro-ly-ao"."DocumentType";

-- CreateTable
CREATE TABLE "he-thong"."ChangeLog" (
    "id" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "oldData" JSONB,
    "newData" JSONB,
    "transactionId" TEXT,
    "source" TEXT,
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "ChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tro-ly-ao"."DocumentTopic" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "DocumentTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tro-ly-ao"."CitationMessage" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT,
    "index" INTEGER,
    "documentId" TEXT,
    "documentType" TEXT,
    "messageId" TEXT,

    CONSTRAINT "CitationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tro-ly-ao"."Topic" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tro-ly-ao"."DocumentClassification" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DocumentClassification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."PlanTrainingDelay" (
    "id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainingObjectTypeId" TEXT NOT NULL,

    CONSTRAINT "PlanTrainingDelay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."PlanTrainingDelaySubject" (
    "id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "planTrainingDelayId" TEXT NOT NULL,
    "subjectVersionId" TEXT NOT NULL,

    CONSTRAINT "PlanTrainingDelaySubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."PlanTraining" (
    "id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainingObjectTypeId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,

    CONSTRAINT "PlanTraining_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."PlanTrainingSubject" (
    "id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "planTrainingId" TEXT NOT NULL,
    "subjectVersionId" TEXT NOT NULL,
    "subjectClassType" "ql-dao-tao"."SubjectClassType" NOT NULL DEFAULT 'NORMAL',

    CONSTRAINT "PlanTrainingSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."StudentScoreConvert" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "StudentScoreConvert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."SubjectScoreConvert" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentScoreConvertId" TEXT NOT NULL,
    "subjectVersionId" TEXT NOT NULL,
    "status" "ql-dao-tao"."ScoreConvertStatus" NOT NULL DEFAULT 'PENDING',
    "score" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SubjectScoreConvert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."StudentSubjectScoreHistory" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentSubjectScoreId" TEXT NOT NULL,
    "attendanceScore" DOUBLE PRECISION,
    "midtermScore" DOUBLE PRECISION,
    "examScore" DOUBLE PRECISION,
    "finalScore" DECIMAL(5,1),
    "manualFinalScore" DOUBLE PRECISION,
    "examPostponedReason" BOOLEAN,
    "examPostponed" TEXT,
    "examBanned" BOOLEAN,
    "examBannedReason" TEXT,
    "suspended" BOOLEAN,
    "suspendedReason" TEXT,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "StudentSubjectScoreHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."TrainingLanguage" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."SubjectVersionCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "SubjectVersionCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."SubjectVersionHistory" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subjectVersionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "SubjectVersionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."Certificate" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "englishName" TEXT,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."CertificateOnSubject" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalScore" DOUBLE PRECISION NOT NULL,
    "certificateId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "CertificateOnSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."Award" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "englishName" TEXT,
    "bonusScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Award_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."ClusterSurvey" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "anonymous" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ClusterSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."MultipleChoiceOption" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "questionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,

    CONSTRAINT "MultipleChoiceOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."FillInBlankSlot" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "correctAnswer" TEXT NOT NULL,

    CONSTRAINT "FillInBlankSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."OrderingItem" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "questionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "correctOrder" INTEGER NOT NULL,

    CONSTRAINT "OrderingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."ExamRoom" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "examId" TEXT NOT NULL,
    "roomId" TEXT,
    "firstSupervisorId" TEXT,
    "secondSupervisorId" TEXT,
    "lockExamCode" BOOLEAN NOT NULL DEFAULT false,
    "start" INTEGER,
    "end" INTEGER,

    CONSTRAINT "ExamRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."_FixedClassToPlanTrainingSubject" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FixedClassToPlanTrainingSubject_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."_FixedClassToPlanTrainingDelaySubject" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FixedClassToPlanTrainingDelaySubject_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."_AwardToSubject" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AwardToSubject_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "khao-thi"."_ClusterSurveyToSurveyObjectType" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ClusterSurveyToSurveyObjectType_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "khao-thi"."_ClusterSurveyToLecturer" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ClusterSurveyToLecturer_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."_gpaScore" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_gpaScore_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."_supplementaryScore" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_supplementaryScore_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "ChangeLog_tableName_recordId_idx" ON "he-thong"."ChangeLog"("tableName", "recordId");

-- CreateIndex
CREATE INDEX "ChangeLog_userProfileId_idx" ON "he-thong"."ChangeLog"("userProfileId");

-- CreateIndex
CREATE INDEX "ChangeLog_changedAt_idx" ON "he-thong"."ChangeLog"("changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTopic_code_key" ON "tro-ly-ao"."DocumentTopic"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTopic_documentId_topicId_key" ON "tro-ly-ao"."DocumentTopic"("documentId", "topicId");

-- CreateIndex
CREATE UNIQUE INDEX "CitationMessage_code_key" ON "tro-ly-ao"."CitationMessage"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_code_key" ON "tro-ly-ao"."Topic"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentClassification_code_key" ON "tro-ly-ao"."DocumentClassification"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentClassification_name_key" ON "tro-ly-ao"."DocumentClassification"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PlanTrainingDelaySubject_planTrainingDelayId_subjectVersion_key" ON "ql-dao-tao"."PlanTrainingDelaySubject"("planTrainingDelayId", "subjectVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentScoreConvert_code_key" ON "ql-dao-tao"."StudentScoreConvert"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectScoreConvert_code_key" ON "ql-dao-tao"."SubjectScoreConvert"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSubjectScoreHistory_code_key" ON "ql-dao-tao"."StudentSubjectScoreHistory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingLanguage_code_key" ON "ql-dao-tao"."TrainingLanguage"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectVersionCategory_code_key" ON "ql-dao-tao"."SubjectVersionCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectVersionHistory_code_key" ON "ql-dao-tao"."SubjectVersionHistory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_code_key" ON "ql-dao-tao"."Certificate"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CertificateOnSubject_code_key" ON "ql-dao-tao"."CertificateOnSubject"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Award_code_key" ON "ql-dao-tao"."Award"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ClusterSurvey_code_key" ON "khao-thi"."ClusterSurvey"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MultipleChoiceOption_code_key" ON "khao-thi"."MultipleChoiceOption"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FillInBlankSlot_code_key" ON "khao-thi"."FillInBlankSlot"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FillInBlankSlot_questionId_order_key" ON "khao-thi"."FillInBlankSlot"("questionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "OrderingItem_code_key" ON "khao-thi"."OrderingItem"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OrderingItem_questionId_correctOrder_key" ON "khao-thi"."OrderingItem"("questionId", "correctOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ExamRoom_code_key" ON "khao-thi"."ExamRoom"("code");

-- CreateIndex
CREATE INDEX "_FixedClassToPlanTrainingSubject_B_index" ON "ql-dao-tao"."_FixedClassToPlanTrainingSubject"("B");

-- CreateIndex
CREATE INDEX "_FixedClassToPlanTrainingDelaySubject_B_index" ON "ql-dao-tao"."_FixedClassToPlanTrainingDelaySubject"("B");

-- CreateIndex
CREATE INDEX "_AwardToSubject_B_index" ON "ql-dao-tao"."_AwardToSubject"("B");

-- CreateIndex
CREATE INDEX "_ClusterSurveyToSurveyObjectType_B_index" ON "khao-thi"."_ClusterSurveyToSurveyObjectType"("B");

-- CreateIndex
CREATE INDEX "_ClusterSurveyToLecturer_B_index" ON "khao-thi"."_ClusterSurveyToLecturer"("B");

-- CreateIndex
CREATE INDEX "_gpaScore_B_index" ON "ql-dao-tao"."_gpaScore"("B");

-- CreateIndex
CREATE INDEX "_supplementaryScore_B_index" ON "ql-dao-tao"."_supplementaryScore"("B");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSession_studentSubjectScoreId_key" ON "khao-thi"."ExamSession"("studentSubjectScoreId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSession_examCode_examRoomId_key" ON "khao-thi"."ExamSession"("examCode", "examRoomId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_registerNumber_key" ON "ql-dao-tao"."Student"("registerNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Student_doctoralCode_key" ON "ql-dao-tao"."Student"("doctoralCode");

-- AddForeignKey
ALTER TABLE "he-thong"."ChangeLog" ADD CONSTRAINT "ChangeLog_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."QuaTrinhCongTac" ADD CONSTRAINT "QuaTrinhCongTac_chucVuId_fkey" FOREIGN KEY ("chucVuId") REFERENCES "mta"."DM_ChucVu"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."QuaTrinhCongTac" ADD CONSTRAINT "QuaTrinhCongTac_loaiHinhCongTacId_fkey" FOREIGN KEY ("loaiHinhCongTacId") REFERENCES "ql-ho-so"."DM_LoaiHinhCongTac"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."Document" ADD CONSTRAINT "Document_classificationId_fkey" FOREIGN KEY ("classificationId") REFERENCES "tro-ly-ao"."DocumentClassification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."DocumentTopic" ADD CONSTRAINT "DocumentTopic_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "tro-ly-ao"."Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."DocumentTopic" ADD CONSTRAINT "DocumentTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "tro-ly-ao"."Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."FAQ" ADD CONSTRAINT "FAQ_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "tro-ly-ao"."Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."Prompt" ADD CONSTRAINT "Prompt_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "tro-ly-ao"."Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."Conversation" ADD CONSTRAINT "Conversation_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "tro-ly-ao"."Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."CitationMessage" ADD CONSTRAINT "CitationMessage_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "tro-ly-ao"."Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."PlanTrainingDelay" ADD CONSTRAINT "PlanTrainingDelay_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."PlanTrainingDelaySubject" ADD CONSTRAINT "PlanTrainingDelaySubject_planTrainingDelayId_fkey" FOREIGN KEY ("planTrainingDelayId") REFERENCES "ql-dao-tao"."PlanTrainingDelay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."PlanTrainingDelaySubject" ADD CONSTRAINT "PlanTrainingDelaySubject_subjectVersionId_fkey" FOREIGN KEY ("subjectVersionId") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."PlanTraining" ADD CONSTRAINT "PlanTraining_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."PlanTraining" ADD CONSTRAINT "PlanTraining_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."PlanTrainingSubject" ADD CONSTRAINT "PlanTrainingSubject_planTrainingId_fkey" FOREIGN KEY ("planTrainingId") REFERENCES "ql-dao-tao"."PlanTraining"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."PlanTrainingSubject" ADD CONSTRAINT "PlanTrainingSubject_subjectVersionId_fkey" FOREIGN KEY ("subjectVersionId") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentScoreConvert" ADD CONSTRAINT "StudentScoreConvert_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectScoreConvert" ADD CONSTRAINT "SubjectScoreConvert_studentScoreConvertId_fkey" FOREIGN KEY ("studentScoreConvertId") REFERENCES "ql-dao-tao"."StudentScoreConvert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectScoreConvert" ADD CONSTRAINT "SubjectScoreConvert_subjectVersionId_fkey" FOREIGN KEY ("subjectVersionId") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentSubjectScore" ADD CONSTRAINT "StudentSubjectScore_examId_fkey" FOREIGN KEY ("examId") REFERENCES "khao-thi"."Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentSubjectScoreHistory" ADD CONSTRAINT "StudentSubjectScoreHistory_studentSubjectScoreId_fkey" FOREIGN KEY ("studentSubjectScoreId") REFERENCES "ql-dao-tao"."StudentSubjectScore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentSubjectScoreHistory" ADD CONSTRAINT "StudentSubjectScoreHistory_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ArchivedCertificate" ADD CONSTRAINT "ArchivedCertificate_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "ql-dao-tao"."Certificate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ArchivedCertificate" ADD CONSTRAINT "ArchivedCertificate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ArchivedAward" ADD CONSTRAINT "ArchivedAward_awardId_fkey" FOREIGN KEY ("awardId") REFERENCES "ql-dao-tao"."Award"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ArchivedAward" ADD CONSTRAINT "ArchivedAward_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingCourse" ADD CONSTRAINT "TrainingCourse_trainingLanguageId_fkey" FOREIGN KEY ("trainingLanguageId") REFERENCES "ql-dao-tao"."TrainingLanguage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Curriculum" ADD CONSTRAINT "Curriculum_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CurriculumVersion" ADD CONSTRAINT "CurriculumVersion_trainingLanguageId_fkey" FOREIGN KEY ("trainingLanguageId") REFERENCES "ql-dao-tao"."TrainingLanguage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectVersion" ADD CONSTRAINT "SubjectVersion_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectVersion" ADD CONSTRAINT "SubjectVersion_subjectVersionCategoryId_fkey" FOREIGN KEY ("subjectVersionCategoryId") REFERENCES "ql-dao-tao"."SubjectVersionCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectVersionHistory" ADD CONSTRAINT "SubjectVersionHistory_subjectVersionId_fkey" FOREIGN KEY ("subjectVersionId") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectVersionHistory" ADD CONSTRAINT "SubjectVersionHistory_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClass" ADD CONSTRAINT "SubjectClass_trainingLocationId_fkey" FOREIGN KEY ("trainingLocationId") REFERENCES "ql-dao-tao"."TrainingLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingObjectType" ADD CONSTRAINT "TrainingObjectType_trainingFormId_fkey" FOREIGN KEY ("trainingFormId") REFERENCES "ql-dao-tao"."TrainingForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingObjectType" ADD CONSTRAINT "TrainingObjectType_trainingLevelId_fkey" FOREIGN KEY ("trainingLevelId") REFERENCES "ql-dao-tao"."TrainingLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingLocation" ADD CONSTRAINT "TrainingLocation_dM_TinhId_fkey" FOREIGN KEY ("dM_TinhId") REFERENCES "mta"."DM_Tinh"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingLocation" ADD CONSTRAINT "TrainingLocation_dM_Tinh_NewId_fkey" FOREIGN KEY ("dM_Tinh_NewId") REFERENCES "mta"."DM_Tinh_New"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingMajor" ADD CONSTRAINT "TrainingMajor_secondOrganizationId_fkey" FOREIGN KEY ("secondOrganizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingMajor" ADD CONSTRAINT "TrainingMajor_thirdOrganizationId_fkey" FOREIGN KEY ("thirdOrganizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingBlock" ADD CONSTRAINT "TrainingBlock_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ql-dao-tao"."TrainingBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingBlockOnCurriculumVersion" ADD CONSTRAINT "TrainingBlockOnCurriculumVersion_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "ql-dao-tao"."CurriculumVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingBlockOnCurriculumVersion" ADD CONSTRAINT "TrainingBlockOnCurriculumVersion_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "ql-dao-tao"."Curriculum"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CertificateOnSubject" ADD CONSTRAINT "CertificateOnSubject_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "ql-dao-tao"."Certificate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CertificateOnSubject" ADD CONSTRAINT "CertificateOnSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "ql-dao-tao"."Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Student" ADD CONSTRAINT "Student_curriculumVersionParallelId_fkey" FOREIGN KEY ("curriculumVersionParallelId") REFERENCES "ql-dao-tao"."CurriculumVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_trainingFieldId_fkey" FOREIGN KEY ("trainingFieldId") REFERENCES "ql-dao-tao"."TrainingField"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_studentScoreConvertId_fkey" FOREIGN KEY ("studentScoreConvertId") REFERENCES "ql-dao-tao"."StudentScoreConvert"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."Survey" ADD CONSTRAINT "Survey_clusterSurveyId_fkey" FOREIGN KEY ("clusterSurveyId") REFERENCES "khao-thi"."ClusterSurvey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SurveyQuestion" ADD CONSTRAINT "SurveyQuestion_clusterSurveyId_fkey" FOREIGN KEY ("clusterSurveyId") REFERENCES "khao-thi"."ClusterSurvey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SurveyChoice" ADD CONSTRAINT "SurveyChoice_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "khao-thi"."Survey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SurveyChoice" ADD CONSTRAINT "SurveyChoice_clusterSurveyId_fkey" FOREIGN KEY ("clusterSurveyId") REFERENCES "khao-thi"."ClusterSurvey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SurveySession" ADD CONSTRAINT "SurveySession_surveyObjectTypeId_fkey" FOREIGN KEY ("surveyObjectTypeId") REFERENCES "khao-thi"."SurveyObjectType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."MultipleChoiceOption" ADD CONSTRAINT "MultipleChoiceOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "khao-thi"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."FillInBlankSlot" ADD CONSTRAINT "FillInBlankSlot_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "khao-thi"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."OrderingItem" ADD CONSTRAINT "OrderingItem_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "khao-thi"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."Exam" ADD CONSTRAINT "Exam_questionBankId_fkey" FOREIGN KEY ("questionBankId") REFERENCES "khao-thi"."QuestionBank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamRoom" ADD CONSTRAINT "ExamRoom_examId_fkey" FOREIGN KEY ("examId") REFERENCES "khao-thi"."Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamRoom" ADD CONSTRAINT "ExamRoom_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ql-dao-tao"."Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamRoom" ADD CONSTRAINT "ExamRoom_firstSupervisorId_fkey" FOREIGN KEY ("firstSupervisorId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamRoom" ADD CONSTRAINT "ExamRoom_secondSupervisorId_fkey" FOREIGN KEY ("secondSupervisorId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamSession" ADD CONSTRAINT "ExamSession_examRoomId_fkey" FOREIGN KEY ("examRoomId") REFERENCES "khao-thi"."ExamRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamSession" ADD CONSTRAINT "ExamSession_studentSubjectScoreId_fkey" FOREIGN KEY ("studentSubjectScoreId") REFERENCES "ql-dao-tao"."StudentSubjectScore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_FixedClassToPlanTrainingSubject" ADD CONSTRAINT "_FixedClassToPlanTrainingSubject_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."FixedClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_FixedClassToPlanTrainingSubject" ADD CONSTRAINT "_FixedClassToPlanTrainingSubject_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."PlanTrainingSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_FixedClassToPlanTrainingDelaySubject" ADD CONSTRAINT "_FixedClassToPlanTrainingDelaySubject_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."FixedClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_FixedClassToPlanTrainingDelaySubject" ADD CONSTRAINT "_FixedClassToPlanTrainingDelaySubject_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."PlanTrainingDelaySubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_AwardToSubject" ADD CONSTRAINT "_AwardToSubject_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."Award"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_AwardToSubject" ADD CONSTRAINT "_AwardToSubject_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."_ClusterSurveyToSurveyObjectType" ADD CONSTRAINT "_ClusterSurveyToSurveyObjectType_A_fkey" FOREIGN KEY ("A") REFERENCES "khao-thi"."ClusterSurvey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."_ClusterSurveyToSurveyObjectType" ADD CONSTRAINT "_ClusterSurveyToSurveyObjectType_B_fkey" FOREIGN KEY ("B") REFERENCES "khao-thi"."SurveyObjectType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."_ClusterSurveyToLecturer" ADD CONSTRAINT "_ClusterSurveyToLecturer_A_fkey" FOREIGN KEY ("A") REFERENCES "khao-thi"."ClusterSurvey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."_ClusterSurveyToLecturer" ADD CONSTRAINT "_ClusterSurveyToLecturer_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_gpaScore" ADD CONSTRAINT "_gpaScore_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."StudentGraduationApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_gpaScore" ADD CONSTRAINT "_gpaScore_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."StudentSubjectScore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_supplementaryScore" ADD CONSTRAINT "_supplementaryScore_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."StudentGraduationApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_supplementaryScore" ADD CONSTRAINT "_supplementaryScore_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."StudentSubjectScore"("id") ON DELETE CASCADE ON UPDATE CASCADE;
