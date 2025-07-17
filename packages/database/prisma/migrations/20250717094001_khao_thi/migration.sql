/*
  Warnings:

  - You are about to drop the `SurveyAnswer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_GroupToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "khao-thi"."QuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'ESSAY', 'FILL_IN_BLANK', 'ORDERING');

-- CreateEnum
CREATE TYPE "khao-thi"."ExamStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ONGOING', 'FINISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."PeriodType" AS ENUM ('THEORY', 'PRACTICE', 'LAB', 'SEMINAR', 'EXAM', 'MAKEUP', 'REVIEW');

-- CreateEnum
CREATE TYPE "ql-danh-muc"."NotificationType" AS ENUM ('GENERAL', 'ACADEMIC', 'EXAM', 'EVENT', 'SCHOLARSHIP', 'TUITION', 'URGENT', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "ql-danh-muc"."NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."ResearchProjectStatus" AS ENUM ('OPEN', 'FULL', 'CLOSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."ThesisProjectStatus" AS ENUM ('OPEN', 'FULL', 'CLOSED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."ThesisRegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "khao-thi"."SurveyAnswer" DROP CONSTRAINT "SurveyAnswer_surveyQuestionId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."Feedback" DROP CONSTRAINT "Feedback_userId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."_GroupToUser" DROP CONSTRAINT "_GroupToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."_GroupToUser" DROP CONSTRAINT "_GroupToUser_B_fkey";

-- DropForeignKey
ALTER TABLE "tro-ly-ao"."Conversation" DROP CONSTRAINT "Conversation_userId_fkey";

-- DropForeignKey
ALTER TABLE "tro-ly-ao"."Document" DROP CONSTRAINT "Document_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "tro-ly-ao"."Document" DROP CONSTRAINT "Document_uploadedById_fkey";

-- DropForeignKey
ALTER TABLE "tro-ly-ao"."FAQ" DROP CONSTRAINT "FAQ_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "tro-ly-ao"."FAQ" DROP CONSTRAINT "FAQ_uploadedById_fkey";

-- AlterTable
ALTER TABLE "mta"."DM_NhanVien" ADD COLUMN     "groupId" TEXT;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD COLUMN     "notificationId" TEXT;

-- DropTable
DROP TABLE "khao-thi"."SurveyAnswer";

-- DropTable
DROP TABLE "ql-nguoi-dung"."User";

-- DropTable
DROP TABLE "ql-nguoi-dung"."_GroupToUser";

-- CreateTable
CREATE TABLE "khao-thi"."QuestionBank" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "subjectVersionId" TEXT NOT NULL,

    CONSTRAINT "QuestionBank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."Difficulty" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER,

    CONSTRAINT "Difficulty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."KnowledgeBlock" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "KnowledgeBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."Question" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "type" "khao-thi"."QuestionType" NOT NULL,
    "point" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "explanation" TEXT,
    "isAutoGraded" BOOLEAN NOT NULL DEFAULT false,
    "questionBankId" TEXT NOT NULL,
    "knowledgeBlockId" TEXT,
    "difficultyId" TEXT,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."MultipleChoiceOption" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "questionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "correctOrder" INTEGER NOT NULL,

    CONSTRAINT "OrderingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."Answer" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "isCorrect" BOOLEAN,
    "score" DOUBLE PRECISION,
    "comment" TEXT,
    "essayAnswer" TEXT NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."SelectedMultipleChoiceOption" (
    "answerId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,

    CONSTRAINT "SelectedMultipleChoiceOption_pkey" PRIMARY KEY ("answerId","optionId")
);

-- CreateTable
CREATE TABLE "khao-thi"."FillInBlankAnswer" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "answerId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "FillInBlankAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."OrderingAnswer" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "answerId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "OrderingAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."Exam" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "status" "khao-thi"."ExamStatus" NOT NULL DEFAULT 'DRAFT',
    "subjectVersionId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "passScore" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT true,
    "shuffleAnswers" BOOLEAN NOT NULL DEFAULT true,
    "showResult" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."TestStructureRule" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "knowledgeBlockId" TEXT NOT NULL,
    "difficultyId" TEXT NOT NULL,
    "questionType" "khao-thi"."QuestionType" NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "TestStructureRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."ExamSession" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "isGraded" BOOLEAN NOT NULL DEFAULT false,
    "studentId" TEXT,
    "examId" TEXT NOT NULL,
    "roomId" TEXT,

    CONSTRAINT "ExamSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."ExamSessionQuestion" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "ExamSessionQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."ClassSchedule" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subjectClassId" TEXT NOT NULL,
    "periodType" "ql-dao-tao"."PeriodType" NOT NULL DEFAULT 'THEORY',
    "startPeriod" INTEGER NOT NULL,
    "endPeriod" INTEGER NOT NULL,
    "classDate" DATE NOT NULL,
    "roomId" TEXT,
    "lecturerId" TEXT,
    "notes" TEXT,
    "isReplacement" BOOLEAN NOT NULL DEFAULT false,
    "originalScheduleId" TEXT,
    "cancelReason" TEXT,

    CONSTRAINT "ClassSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."Notification" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "ql-danh-muc"."NotificationType" NOT NULL DEFAULT 'GENERAL',
    "priority" "ql-danh-muc"."NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "targetAll" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."ResearchProject" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "objectives" TEXT,
    "methodology" TEXT,
    "expectedResults" TEXT,
    "requirements" TEXT,
    "supervisorId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "maxStudents" INTEGER NOT NULL,
    "currentStudents" INTEGER NOT NULL DEFAULT 0,
    "registrationStart" TIMESTAMP(3) NOT NULL,
    "registrationEnd" TIMESTAMP(3) NOT NULL,
    "projectStart" TIMESTAMP(3),
    "projectEnd" TIMESTAMP(3),
    "status" "ql-dao-tao"."ResearchProjectStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "ResearchProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."StudentResearchRegistration" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "researchProjectId" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivation" TEXT,
    "experience" TEXT,
    "status" "ql-dao-tao"."RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewNote" TEXT,

    CONSTRAINT "StudentResearchRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."ThesisProject" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "objectives" TEXT,
    "scope" TEXT,
    "methodology" TEXT,
    "expectedResults" TEXT,
    "requirements" TEXT,
    "technologies" TEXT,
    "supervisorId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "maxStudents" INTEGER NOT NULL,
    "currentStudents" INTEGER NOT NULL DEFAULT 0,
    "registrationStart" TIMESTAMP(3) NOT NULL,
    "registrationEnd" TIMESTAMP(3) NOT NULL,
    "projectStart" TIMESTAMP(3),
    "projectEnd" TIMESTAMP(3),
    "status" "ql-dao-tao"."ThesisProjectStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "ThesisProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."StudentThesisRegistration" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "thesisProjectId" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivation" TEXT,
    "experience" TEXT,
    "proposedIdeas" TEXT,
    "status" "ql-dao-tao"."ThesisRegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewNote" TEXT,

    CONSTRAINT "StudentThesisRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."SurveyChoice" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "answer" TEXT,
    "surveyQuestionId" TEXT NOT NULL,

    CONSTRAINT "SurveyChoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."SurveySession" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "surveyId" TEXT NOT NULL,
    "studentId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SurveySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."SurveyResponse" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "surveySessionId" TEXT NOT NULL,
    "surveyQuestionId" TEXT NOT NULL,
    "answerText" TEXT,
    "surveyChoiceId" TEXT,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."_FixedClassToNotification" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FixedClassToNotification_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."_NotificationToTrainingCourse" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_NotificationToTrainingCourse_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."_NotificationToStudent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_NotificationToStudent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuestionBank_code_key" ON "khao-thi"."QuestionBank"("code");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionBank_subjectVersionId_name_key" ON "khao-thi"."QuestionBank"("subjectVersionId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Difficulty_code_key" ON "khao-thi"."Difficulty"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Difficulty_name_key" ON "khao-thi"."Difficulty"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Difficulty_level_key" ON "khao-thi"."Difficulty"("level");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeBlock_code_key" ON "khao-thi"."KnowledgeBlock"("code");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeBlock_name_key" ON "khao-thi"."KnowledgeBlock"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Question_code_key" ON "khao-thi"."Question"("code");

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
CREATE UNIQUE INDEX "Answer_code_key" ON "khao-thi"."Answer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_sessionId_questionId_key" ON "khao-thi"."Answer"("sessionId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "FillInBlankAnswer_code_key" ON "khao-thi"."FillInBlankAnswer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FillInBlankAnswer_answerId_slotId_key" ON "khao-thi"."FillInBlankAnswer"("answerId", "slotId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderingAnswer_code_key" ON "khao-thi"."OrderingAnswer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OrderingAnswer_answerId_itemId_key" ON "khao-thi"."OrderingAnswer"("answerId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_code_key" ON "khao-thi"."Exam"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSession_code_key" ON "khao-thi"."ExamSession"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSessionQuestion_sessionId_questionId_key" ON "khao-thi"."ExamSessionQuestion"("sessionId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSessionQuestion_sessionId_order_key" ON "khao-thi"."ExamSessionQuestion"("sessionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSchedule_code_key" ON "ql-dao-tao"."ClassSchedule"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSchedule_originalScheduleId_key" ON "ql-dao-tao"."ClassSchedule"("originalScheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSchedule_subjectClassId_classDate_startPeriod_key" ON "ql-dao-tao"."ClassSchedule"("subjectClassId", "classDate", "startPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_code_key" ON "ql-danh-muc"."Notification"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchProject_code_key" ON "ql-dao-tao"."ResearchProject"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentResearchRegistration_code_key" ON "ql-dao-tao"."StudentResearchRegistration"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentResearchRegistration_studentId_researchProjectId_key" ON "ql-dao-tao"."StudentResearchRegistration"("studentId", "researchProjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ThesisProject_code_key" ON "ql-dao-tao"."ThesisProject"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentThesisRegistration_code_key" ON "ql-dao-tao"."StudentThesisRegistration"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentThesisRegistration_studentId_thesisProjectId_key" ON "ql-dao-tao"."StudentThesisRegistration"("studentId", "thesisProjectId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyChoice_code_key" ON "khao-thi"."SurveyChoice"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SurveySession_code_key" ON "khao-thi"."SurveySession"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SurveySession_surveyId_studentId_key" ON "khao-thi"."SurveySession"("surveyId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyResponse_code_key" ON "khao-thi"."SurveyResponse"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyResponse_surveySessionId_surveyQuestionId_key" ON "khao-thi"."SurveyResponse"("surveySessionId", "surveyQuestionId");

-- CreateIndex
CREATE INDEX "_FixedClassToNotification_B_index" ON "ql-dao-tao"."_FixedClassToNotification"("B");

-- CreateIndex
CREATE INDEX "_NotificationToTrainingCourse_B_index" ON "ql-danh-muc"."_NotificationToTrainingCourse"("B");

-- CreateIndex
CREATE INDEX "_NotificationToStudent_B_index" ON "ql-danh-muc"."_NotificationToStudent"("B");

-- AddForeignKey
ALTER TABLE "khao-thi"."QuestionBank" ADD CONSTRAINT "QuestionBank_subjectVersionId_fkey" FOREIGN KEY ("subjectVersionId") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."Question" ADD CONSTRAINT "Question_questionBankId_fkey" FOREIGN KEY ("questionBankId") REFERENCES "khao-thi"."QuestionBank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."Question" ADD CONSTRAINT "Question_knowledgeBlockId_fkey" FOREIGN KEY ("knowledgeBlockId") REFERENCES "khao-thi"."KnowledgeBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."Question" ADD CONSTRAINT "Question_difficultyId_fkey" FOREIGN KEY ("difficultyId") REFERENCES "khao-thi"."Difficulty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."MultipleChoiceOption" ADD CONSTRAINT "MultipleChoiceOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "khao-thi"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."FillInBlankSlot" ADD CONSTRAINT "FillInBlankSlot_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "khao-thi"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."OrderingItem" ADD CONSTRAINT "OrderingItem_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "khao-thi"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."Answer" ADD CONSTRAINT "Answer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "khao-thi"."ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "khao-thi"."Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SelectedMultipleChoiceOption" ADD CONSTRAINT "SelectedMultipleChoiceOption_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "khao-thi"."Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SelectedMultipleChoiceOption" ADD CONSTRAINT "SelectedMultipleChoiceOption_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "khao-thi"."MultipleChoiceOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."FillInBlankAnswer" ADD CONSTRAINT "FillInBlankAnswer_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "khao-thi"."Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."FillInBlankAnswer" ADD CONSTRAINT "FillInBlankAnswer_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "khao-thi"."FillInBlankSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."OrderingAnswer" ADD CONSTRAINT "OrderingAnswer_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "khao-thi"."Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."OrderingAnswer" ADD CONSTRAINT "OrderingAnswer_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "khao-thi"."OrderingItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."Exam" ADD CONSTRAINT "Exam_subjectVersionId_fkey" FOREIGN KEY ("subjectVersionId") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."TestStructureRule" ADD CONSTRAINT "TestStructureRule_examId_fkey" FOREIGN KEY ("examId") REFERENCES "khao-thi"."Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."TestStructureRule" ADD CONSTRAINT "TestStructureRule_knowledgeBlockId_fkey" FOREIGN KEY ("knowledgeBlockId") REFERENCES "khao-thi"."KnowledgeBlock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."TestStructureRule" ADD CONSTRAINT "TestStructureRule_difficultyId_fkey" FOREIGN KEY ("difficultyId") REFERENCES "khao-thi"."Difficulty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamSession" ADD CONSTRAINT "ExamSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamSession" ADD CONSTRAINT "ExamSession_examId_fkey" FOREIGN KEY ("examId") REFERENCES "khao-thi"."Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamSession" ADD CONSTRAINT "ExamSession_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ql-dao-tao"."Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamSessionQuestion" ADD CONSTRAINT "ExamSessionQuestion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "khao-thi"."ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamSessionQuestion" ADD CONSTRAINT "ExamSessionQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "khao-thi"."Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ClassSchedule" ADD CONSTRAINT "ClassSchedule_subjectClassId_fkey" FOREIGN KEY ("subjectClassId") REFERENCES "ql-dao-tao"."SubjectClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ClassSchedule" ADD CONSTRAINT "ClassSchedule_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ql-dao-tao"."Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ClassSchedule" ADD CONSTRAINT "ClassSchedule_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ClassSchedule" ADD CONSTRAINT "ClassSchedule_originalScheduleId_fkey" FOREIGN KEY ("originalScheduleId") REFERENCES "ql-dao-tao"."ClassSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."Notification" ADD CONSTRAINT "Notification_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "mta"."DM_NhanVien"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "mta"."DM_NhanVien"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."Document" ADD CONSTRAINT "Document_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "mta"."DM_NhanVien"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."FAQ" ADD CONSTRAINT "FAQ_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "mta"."DM_NhanVien"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."FAQ" ADD CONSTRAINT "FAQ_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "mta"."DM_NhanVien"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "mta"."DM_NhanVien"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mta"."DM_NhanVien" ADD CONSTRAINT "DM_NhanVien_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ql-nguoi-dung"."Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "mta"."DM_NhanVien"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ResearchProject" ADD CONSTRAINT "ResearchProject_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ResearchProject" ADD CONSTRAINT "ResearchProject_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentResearchRegistration" ADD CONSTRAINT "StudentResearchRegistration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentResearchRegistration" ADD CONSTRAINT "StudentResearchRegistration_researchProjectId_fkey" FOREIGN KEY ("researchProjectId") REFERENCES "ql-dao-tao"."ResearchProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentResearchRegistration" ADD CONSTRAINT "StudentResearchRegistration_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ThesisProject" ADD CONSTRAINT "ThesisProject_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ThesisProject" ADD CONSTRAINT "ThesisProject_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentThesisRegistration" ADD CONSTRAINT "StudentThesisRegistration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentThesisRegistration" ADD CONSTRAINT "StudentThesisRegistration_thesisProjectId_fkey" FOREIGN KEY ("thesisProjectId") REFERENCES "ql-dao-tao"."ThesisProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentThesisRegistration" ADD CONSTRAINT "StudentThesisRegistration_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SurveyChoice" ADD CONSTRAINT "SurveyChoice_surveyQuestionId_fkey" FOREIGN KEY ("surveyQuestionId") REFERENCES "khao-thi"."SurveyQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SurveySession" ADD CONSTRAINT "SurveySession_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "khao-thi"."Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SurveySession" ADD CONSTRAINT "SurveySession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SurveyResponse" ADD CONSTRAINT "SurveyResponse_surveySessionId_fkey" FOREIGN KEY ("surveySessionId") REFERENCES "khao-thi"."SurveySession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SurveyResponse" ADD CONSTRAINT "SurveyResponse_surveyQuestionId_fkey" FOREIGN KEY ("surveyQuestionId") REFERENCES "khao-thi"."SurveyQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SurveyResponse" ADD CONSTRAINT "SurveyResponse_surveyChoiceId_fkey" FOREIGN KEY ("surveyChoiceId") REFERENCES "khao-thi"."SurveyChoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "mta"."DM_NhanVien"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "ql-danh-muc"."Notification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_FixedClassToNotification" ADD CONSTRAINT "_FixedClassToNotification_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."FixedClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_FixedClassToNotification" ADD CONSTRAINT "_FixedClassToNotification_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-danh-muc"."Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."_NotificationToTrainingCourse" ADD CONSTRAINT "_NotificationToTrainingCourse_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-danh-muc"."Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."_NotificationToTrainingCourse" ADD CONSTRAINT "_NotificationToTrainingCourse_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."TrainingCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."_NotificationToStudent" ADD CONSTRAINT "_NotificationToStudent_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-danh-muc"."Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."_NotificationToStudent" ADD CONSTRAINT "_NotificationToStudent_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
