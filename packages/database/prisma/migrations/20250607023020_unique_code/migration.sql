/*
  Warnings:

  - You are about to drop the column `curriculumVersionId` on the `CurriculumVersionSubject` table. All the data in the column will be lost.
  - You are about to drop the column `lectureCode` on the `Lecturer` table. All the data in the column will be lost.
  - You are about to drop the column `lectureCode` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `lectureID` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `serviceDate` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `codeTrainingField` on the `TrainingField` table. All the data in the column will be lost.
  - You are about to drop the column `codeTrainingMajor` on the `TrainingMajor` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[order]` on the table `SchoolYear` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolYearId,order]` on the table `Semester` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolYearId,semesterType]` on the table `Semester` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `numberOfSemesters` to the `CurriculumVersion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order` to the `SchoolYear` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order` to the `Semester` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semesterId` to the `SubjectClass` table without a default value. This is not possible if the table is not empty.
  - Added the required column `curriculumVersionId` to the `TrainingBlock` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ql-dao-tao"."SemesterType" AS ENUM ('FIRST', 'SECOND');

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."CurriculumVersionSubject" DROP CONSTRAINT "CurriculumVersionSubject_curriculumVersionId_fkey";

-- DropIndex
DROP INDEX "ql-dao-tao"."Lecturer_lectureCode_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."Staff_lectureCode_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."Staff_lectureID_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."TrainingField_codeTrainingField_key";

-- DropIndex
DROP INDEX "ql-dao-tao"."TrainingMajor_codeTrainingMajor_key";

-- AlterTable
ALTER TABLE "ql-dao-tao"."CurriculumVersion" ADD COLUMN     "numberOfSemesters" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ql-dao-tao"."CurriculumVersionSubject" DROP COLUMN "curriculumVersionId";

-- AlterTable
ALTER TABLE "ql-dao-tao"."FixedClass" ADD COLUMN     "curriculumVersionId" TEXT,
ADD COLUMN     "lecturerManagementId" TEXT,
ADD COLUMN     "staffManagementId" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."Lecturer" DROP COLUMN "lectureCode",
ADD COLUMN     "from" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ql-dao-tao"."SchoolYear" ADD COLUMN     "order" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ql-dao-tao"."Semester" ADD COLUMN     "order" INTEGER NOT NULL,
ADD COLUMN     "semesterType" "ql-dao-tao"."SemesterType";

-- AlterTable
ALTER TABLE "ql-dao-tao"."Staff" DROP COLUMN "lectureCode",
DROP COLUMN "lectureID",
DROP COLUMN "serviceDate";

-- AlterTable
ALTER TABLE "ql-dao-tao"."Student" ADD COLUMN     "curriculumVersionId" TEXT,
ADD COLUMN     "studyRankId" TEXT,
ADD COLUMN     "trainingRankId" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectClass" ADD COLUMN     "extraLecturerId" TEXT,
ADD COLUMN     "lecturerId" TEXT,
ADD COLUMN     "semesterId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingBlock" ADD COLUMN     "curriculumVersionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingField" DROP COLUMN "codeTrainingField";

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingMajor" DROP COLUMN "codeTrainingMajor";

-- AlterTable
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD COLUMN     "academicDegreeDate" TIMESTAMP(3),
ADD COLUMN     "academicRankDate" TIMESTAMP(3),
ADD COLUMN     "levelId" TEXT,
ADD COLUMN     "rankDate" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolYear_order_key" ON "ql-dao-tao"."SchoolYear"("order");

-- CreateIndex
CREATE UNIQUE INDEX "Semester_schoolYearId_order_key" ON "ql-dao-tao"."Semester"("schoolYearId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Semester_schoolYearId_semesterType_key" ON "ql-dao-tao"."Semester"("schoolYearId", "semesterType");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."FixedClass" ADD CONSTRAINT "FixedClass_lecturerManagementId_fkey" FOREIGN KEY ("lecturerManagementId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."FixedClass" ADD CONSTRAINT "FixedClass_staffManagementId_fkey" FOREIGN KEY ("staffManagementId") REFERENCES "ql-dao-tao"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."FixedClass" ADD CONSTRAINT "FixedClass_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "ql-dao-tao"."CurriculumVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClass" ADD CONSTRAINT "SubjectClass_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClass" ADD CONSTRAINT "SubjectClass_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClass" ADD CONSTRAINT "SubjectClass_extraLecturerId_fkey" FOREIGN KEY ("extraLecturerId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingBlock" ADD CONSTRAINT "TrainingBlock_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "ql-dao-tao"."CurriculumVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Student" ADD CONSTRAINT "Student_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "ql-dao-tao"."CurriculumVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Student" ADD CONSTRAINT "Student_studyRankId_fkey" FOREIGN KEY ("studyRankId") REFERENCES "ql-dao-tao"."StudyRank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Student" ADD CONSTRAINT "Student_trainingRankId_fkey" FOREIGN KEY ("trainingRankId") REFERENCES "ql-dao-tao"."TrainingRank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "ql-danh-muc"."Level"("id") ON DELETE SET NULL ON UPDATE CASCADE;
