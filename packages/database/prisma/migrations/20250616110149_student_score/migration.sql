/*
  Warnings:

  - You are about to drop the column `endDate` on the `ScoreConvert` table. All the data in the column will be lost.
  - You are about to drop the column `score10From` on the `ScoreConvert` table. All the data in the column will be lost.
  - You are about to drop the column `score10To` on the `ScoreConvert` table. All the data in the column will be lost.
  - You are about to drop the column `score4` on the `ScoreConvert` table. All the data in the column will be lost.
  - You are about to drop the column `scoreChar` on the `ScoreConvert` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `ScoreConvert` table. All the data in the column will be lost.
  - You are about to drop the `SubjectClassStudent` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `base10Max` to the `ScoreConvert` table without a default value. This is not possible if the table is not empty.
  - Added the required column `base10Min` to the `ScoreConvert` table without a default value. This is not possible if the table is not empty.
  - Added the required column `base4` to the `ScoreConvert` table without a default value. This is not possible if the table is not empty.
  - Added the required column `classification` to the `ScoreConvert` table without a default value. This is not possible if the table is not empty.
  - Added the required column `letter` to the `ScoreConvert` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pass` to the `ScoreConvert` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trainingCourseId` to the `ScoreConvert` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClassStudent" DROP CONSTRAINT "SubjectClassStudent_studentId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClassStudent" DROP CONSTRAINT "SubjectClassStudent_subjectClassId_fkey";

-- DropIndex
DROP INDEX "he-thong"."Config_code_key";

-- DropIndex
DROP INDEX "khao-thi"."Survey_code_key";

-- DropIndex
DROP INDEX "khao-thi"."SurveyAnswer_code_key";

-- DropIndex
DROP INDEX "khao-thi"."SurveyObjectType_code_key";

-- DropIndex
DROP INDEX "khao-thi"."SurveyQuestion_code_key";

-- DropIndex
DROP INDEX "khao-thi"."SurveyQuestionType_code_key";

-- DropIndex
DROP INDEX "khao-thi"."SurveyTopic_code_key";

-- DropIndex
DROP INDEX "ql-danh-muc"."AcademicDegreeType_code_key";

-- DropIndex
DROP INDEX "ql-danh-muc"."AcademicRankType_code_key";

-- DropIndex
DROP INDEX "ql-danh-muc"."Commune_code_key";

-- DropIndex
DROP INDEX "ql-danh-muc"."Ethnicity_code_key";

-- DropIndex
DROP INDEX "ql-danh-muc"."LecturerType_code_key";

-- DropIndex
DROP INDEX "ql-danh-muc"."Level_code_key";

-- DropIndex
DROP INDEX "ql-danh-muc"."Nationality_code_key";

-- DropIndex
DROP INDEX "ql-danh-muc"."Organization_code_key";

-- DropIndex
DROP INDEX "ql-danh-muc"."OrganizationType_code_key";

-- DropIndex
DROP INDEX "ql-danh-muc"."PositionCPV_code_key";

-- DropIndex
DROP INDEX "ql-danh-muc"."Province_code_key";

-- DropIndex
DROP INDEX "ql-danh-muc"."Rank_code_key";

-- DropIndex
DROP INDEX "ql-danh-muc"."RegistrationArea_code_key";

-- DropIndex
DROP INDEX "ql-danh-muc"."Religion_code_key";

-- DropIndex
DROP INDEX "ql-danh-muc"."StaffPosition_code_key";

-- DropIndex
DROP INDEX "ql-danh-muc"."StaffType_code_key";

-- DropIndex
DROP INDEX "ql-danh-muc"."TemplateFile_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."Building_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."Curriculum_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."CurriculumVersion_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."DiplomaType_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."FixedClass_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."Lecturer_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."LecturerHistory_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."Milestone_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."PriorityObject_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."Room_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."SchoolYear_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."ScoreConvert_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."Semester_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."Staff_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."StaffHistory_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."Student_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."StudyRank_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."Subject_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."SubjectClass_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."SubjectVersion_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."TrainingBlock_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."TrainingBlockOnCurriculumVersion_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."TrainingBlockSubject_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."TrainingCourse_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."TrainingField_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."TrainingFieldOnTrainingObjectType_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."TrainingForm_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."TrainingKPI_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."TrainingLevel_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."TrainingLocation_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."TrainingMajor_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."TrainingMajorOnTrainingObjectType_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."TrainingObjectType_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."TrainingRank_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."TrainingTime_code_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."TrainingType_code_key";

-- DropIndex
DROP INDEX "ql-nguoi-dung"."BlockedIp_code_key";

-- DropIndex
DROP INDEX "ql-nguoi-dung"."Feedback_code_key";

-- DropIndex
DROP INDEX "ql-nguoi-dung"."Group_code_key";

-- DropIndex
DROP INDEX "ql-nguoi-dung"."Permission_code_key";

-- DropIndex
DROP INDEX "ql-nguoi-dung"."Role_code_key";

-- DropIndex
DROP INDEX "ql-nguoi-dung"."User_code_key";

-- DropIndex
DROP INDEX "ql-nguoi-dung"."UserProfile_code_key";

-- DropIndex
DROP INDEX "tro-ly-ao"."ChatBotConfig_code_key";

-- DropIndex
DROP INDEX "tro-ly-ao"."Conversation_code_key";

-- DropIndex
DROP INDEX "tro-ly-ao"."Document_code_key";

-- DropIndex
DROP INDEX "tro-ly-ao"."FAQ_code_key";

-- DropIndex
DROP INDEX "tro-ly-ao"."Message_code_key";

-- DropIndex
DROP INDEX "tro-ly-ao"."Prompt_code_key";

-- AlterTable
ALTER TABLE "ql-dao-tao"."ScoreConvert" DROP COLUMN "endDate",
DROP COLUMN "score10From",
DROP COLUMN "score10To",
DROP COLUMN "score4",
DROP COLUMN "scoreChar",
DROP COLUMN "startDate",
ADD COLUMN     "base10Max" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "base10Min" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "base4" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "classification" TEXT NOT NULL,
ADD COLUMN     "improvementRegister" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "letter" TEXT NOT NULL,
ADD COLUMN     "pass" BOOLEAN NOT NULL,
ADD COLUMN     "trainingCourseId" TEXT NOT NULL;

-- DropTable
DROP TABLE "ql-dao-tao"."SubjectClassStudent";

-- CreateTable
CREATE TABLE "ql-dao-tao"."StudentSubjectScore" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subjectClassId" TEXT,
    "subjectVersionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "ql-dao-tao"."SubjectClassStudentStatus" NOT NULL DEFAULT 'Studying',
    "attendanceScore" DOUBLE PRECISION,
    "midtermScore" DOUBLE PRECISION,
    "examScore" DOUBLE PRECISION,
    "bonusScore" DOUBLE PRECISION,
    "finalScore" DOUBLE PRECISION,
    "examPostponed" BOOLEAN NOT NULL DEFAULT false,
    "examBanned" BOOLEAN NOT NULL DEFAULT false,
    "suspended" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StudentSubjectScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentSubjectScore_subjectClassId_studentId_key" ON "ql-dao-tao"."StudentSubjectScore"("subjectClassId", "studentId");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentSubjectScore" ADD CONSTRAINT "StudentSubjectScore_subjectClassId_fkey" FOREIGN KEY ("subjectClassId") REFERENCES "ql-dao-tao"."SubjectClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentSubjectScore" ADD CONSTRAINT "StudentSubjectScore_subjectVersionId_fkey" FOREIGN KEY ("subjectVersionId") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentSubjectScore" ADD CONSTRAINT "StudentSubjectScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ScoreConvert" ADD CONSTRAINT "ScoreConvert_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
