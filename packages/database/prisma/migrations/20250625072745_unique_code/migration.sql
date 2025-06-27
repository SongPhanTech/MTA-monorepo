/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Config` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Survey` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `SurveyAnswer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `SurveyObjectType` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `SurveyQuestion` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `SurveyQuestionType` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `SurveyTopic` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `LecturerType` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `StaffPosition` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `StaffType` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `TemplateFile` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `ArchivedAward` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `ArchivedAwardOnStudentSubjectScore` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `ArchivedCertificate` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `ArchivedCertificateOnStudentSubjectScore` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Building` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Curriculum` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `CurriculumVersion` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `DiplomaType` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `FixedClass` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Lecturer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `LecturerHistory` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Milestone` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `PriorityObject` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Room` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `SchoolYear` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `ScoreConvert` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Semester` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Staff` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `StaffHistory` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `StudentSubjectScore` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `StudyRank` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Subject` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `SubjectClass` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `SubjectVersion` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `TrainingBlock` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `TrainingBlockOnCurriculumVersion` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `TrainingBlockSubject` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `TrainingCourse` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `TrainingField` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `TrainingFieldOnTrainingObjectType` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `TrainingForm` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `TrainingKPI` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `TrainingLevel` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `TrainingLocation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `TrainingMajor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `TrainingMajorOnTrainingObjectType` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `TrainingObjectType` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `TrainingRank` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `TrainingTime` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `TrainingType` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `BlockedIp` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Feedback` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Group` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Permission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Role` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `UserProfile` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `ChatBotConfig` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Document` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `FAQ` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Message` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Prompt` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ql-nguoi-dung"."StudentTrainingType" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'AVERAGE', 'POOR');

-- CreateTable
CREATE TABLE "ql-nguoi-dung"."TrainingScoreSession" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "semesterId" TEXT NOT NULL,
    "trainingObjectTypeId" TEXT,

    CONSTRAINT "TrainingScoreSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-nguoi-dung"."StudentTrainingScore" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "trainingScoreSessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "StudentTrainingScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-nguoi-dung"."StudentTrainingSemester" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "scoreAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trainingType" "ql-nguoi-dung"."StudentTrainingType" NOT NULL,

    CONSTRAINT "StudentTrainingSemester_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainingScoreSession_code_key" ON "ql-nguoi-dung"."TrainingScoreSession"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentTrainingScore_code_key" ON "ql-nguoi-dung"."StudentTrainingScore"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentTrainingScore_trainingScoreSessionId_studentId_key" ON "ql-nguoi-dung"."StudentTrainingScore"("trainingScoreSessionId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentTrainingSemester_code_key" ON "ql-nguoi-dung"."StudentTrainingSemester"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Config_code_key" ON "he-thong"."Config"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Survey_code_key" ON "khao-thi"."Survey"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyAnswer_code_key" ON "khao-thi"."SurveyAnswer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyObjectType_code_key" ON "khao-thi"."SurveyObjectType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyQuestion_code_key" ON "khao-thi"."SurveyQuestion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyQuestionType_code_key" ON "khao-thi"."SurveyQuestionType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyTopic_code_key" ON "khao-thi"."SurveyTopic"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LecturerType_code_key" ON "ql-danh-muc"."LecturerType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StaffPosition_code_key" ON "ql-danh-muc"."StaffPosition"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StaffType_code_key" ON "ql-danh-muc"."StaffType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateFile_code_key" ON "ql-danh-muc"."TemplateFile"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ArchivedAward_code_key" ON "ql-dao-tao"."ArchivedAward"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ArchivedAwardOnStudentSubjectScore_code_key" ON "ql-dao-tao"."ArchivedAwardOnStudentSubjectScore"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ArchivedCertificate_code_key" ON "ql-dao-tao"."ArchivedCertificate"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ArchivedCertificateOnStudentSubjectScore_code_key" ON "ql-dao-tao"."ArchivedCertificateOnStudentSubjectScore"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Building_code_key" ON "ql-dao-tao"."Building"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Curriculum_code_key" ON "ql-dao-tao"."Curriculum"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumVersion_code_key" ON "ql-dao-tao"."CurriculumVersion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DiplomaType_code_key" ON "ql-dao-tao"."DiplomaType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FixedClass_code_key" ON "ql-dao-tao"."FixedClass"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Lecturer_code_key" ON "ql-dao-tao"."Lecturer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LecturerHistory_code_key" ON "ql-dao-tao"."LecturerHistory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Milestone_code_key" ON "ql-dao-tao"."Milestone"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PriorityObject_code_key" ON "ql-dao-tao"."PriorityObject"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Room_code_key" ON "ql-dao-tao"."Room"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolYear_code_key" ON "ql-dao-tao"."SchoolYear"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreConvert_code_key" ON "ql-dao-tao"."ScoreConvert"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Semester_code_key" ON "ql-dao-tao"."Semester"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_code_key" ON "ql-dao-tao"."Staff"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StaffHistory_code_key" ON "ql-dao-tao"."StaffHistory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Student_code_key" ON "ql-dao-tao"."Student"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSubjectScore_code_key" ON "ql-dao-tao"."StudentSubjectScore"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudyRank_code_key" ON "ql-dao-tao"."StudyRank"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_key" ON "ql-dao-tao"."Subject"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectClass_code_key" ON "ql-dao-tao"."SubjectClass"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectVersion_code_key" ON "ql-dao-tao"."SubjectVersion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingBlock_code_key" ON "ql-dao-tao"."TrainingBlock"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingBlockOnCurriculumVersion_code_key" ON "ql-dao-tao"."TrainingBlockOnCurriculumVersion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingBlockSubject_code_key" ON "ql-dao-tao"."TrainingBlockSubject"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingCourse_code_key" ON "ql-dao-tao"."TrainingCourse"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingField_code_key" ON "ql-dao-tao"."TrainingField"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingFieldOnTrainingObjectType_code_key" ON "ql-dao-tao"."TrainingFieldOnTrainingObjectType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingForm_code_key" ON "ql-dao-tao"."TrainingForm"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingKPI_code_key" ON "ql-dao-tao"."TrainingKPI"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingLevel_code_key" ON "ql-dao-tao"."TrainingLevel"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingLocation_code_key" ON "ql-dao-tao"."TrainingLocation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingMajor_code_key" ON "ql-dao-tao"."TrainingMajor"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingMajorOnTrainingObjectType_code_key" ON "ql-dao-tao"."TrainingMajorOnTrainingObjectType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingObjectType_code_key" ON "ql-dao-tao"."TrainingObjectType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingRank_code_key" ON "ql-dao-tao"."TrainingRank"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingTime_code_key" ON "ql-dao-tao"."TrainingTime"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingType_code_key" ON "ql-dao-tao"."TrainingType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedIp_code_key" ON "ql-nguoi-dung"."BlockedIp"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_code_key" ON "ql-nguoi-dung"."Feedback"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Group_code_key" ON "ql-nguoi-dung"."Group"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "ql-nguoi-dung"."Permission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "ql-nguoi-dung"."Role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_code_key" ON "ql-nguoi-dung"."User"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_code_key" ON "ql-nguoi-dung"."UserProfile"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ChatBotConfig_code_key" ON "tro-ly-ao"."ChatBotConfig"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_code_key" ON "tro-ly-ao"."Conversation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Document_code_key" ON "tro-ly-ao"."Document"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FAQ_code_key" ON "tro-ly-ao"."FAQ"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Message_code_key" ON "tro-ly-ao"."Message"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Prompt_code_key" ON "tro-ly-ao"."Prompt"("code");

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."TrainingScoreSession" ADD CONSTRAINT "TrainingScoreSession_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."TrainingScoreSession" ADD CONSTRAINT "TrainingScoreSession_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."StudentTrainingScore" ADD CONSTRAINT "StudentTrainingScore_trainingScoreSessionId_fkey" FOREIGN KEY ("trainingScoreSessionId") REFERENCES "ql-nguoi-dung"."TrainingScoreSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."StudentTrainingScore" ADD CONSTRAINT "StudentTrainingScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."StudentTrainingSemester" ADD CONSTRAINT "StudentTrainingSemester_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."StudentTrainingSemester" ADD CONSTRAINT "StudentTrainingSemester_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
