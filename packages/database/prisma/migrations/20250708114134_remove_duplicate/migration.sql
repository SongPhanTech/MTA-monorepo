/*
  Warnings:

  - You are about to drop the column `graduationConditionId` on the `ApplicationCheckResult` table. All the data in the column will be lost.
  - You are about to drop the column `warningId` on the `DisciplinaryWarningReason` table. All the data in the column will be lost.
  - You are about to drop the column `checkResults` on the `StudentGraduationApplication` table. All the data in the column will be lost.
  - You are about to drop the `GraduationCondition` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GraduationConditionConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StudentTrainingCourse` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StudentTrainingSchoolYear` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StudentTrainingSemester` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[studentGraduationApplicationId,rankingConditionId]` on the table `ApplicationCheckResult` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `rankingConditionId` to the `ApplicationCheckResult` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ql-dao-tao"."ApplicationCheckResult" DROP CONSTRAINT "ApplicationCheckResult_graduationConditionId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."DisciplinaryWarningReason" DROP CONSTRAINT "DisciplinaryWarningReason_warningId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."GraduationCondition" DROP CONSTRAINT "GraduationCondition_configId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."GraduationConditionConfig" DROP CONSTRAINT "GraduationConditionConfig_trainingCourseId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."StudentTrainingCourse" DROP CONSTRAINT "StudentTrainingCourse_studentId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."StudentTrainingCourse" DROP CONSTRAINT "StudentTrainingCourse_trainingCourseId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."StudentTrainingSchoolYear" DROP CONSTRAINT "StudentTrainingSchoolYear_schoolYearId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."StudentTrainingSchoolYear" DROP CONSTRAINT "StudentTrainingSchoolYear_studentId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."StudentTrainingSemester" DROP CONSTRAINT "StudentTrainingSemester_semesterId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."StudentTrainingSemester" DROP CONSTRAINT "StudentTrainingSemester_studentId_fkey";

-- DropIndex
DROP INDEX "ql-dao-tao"."ApplicationCheckResult_studentGraduationApplicationId_gradu_key";

-- AlterTable
ALTER TABLE "ql-dao-tao"."ApplicationCheckResult" DROP COLUMN "graduationConditionId",
ADD COLUMN     "rankingConditionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ql-dao-tao"."DisciplinaryWarningReason" DROP COLUMN "warningId";

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentGraduationApplication" DROP COLUMN "checkResults";

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentSemesterResult" ADD COLUMN     "conductScore" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentYearResult" ADD COLUMN     "conductScore" DOUBLE PRECISION;

-- DropTable
DROP TABLE "ql-dao-tao"."GraduationCondition";

-- DropTable
DROP TABLE "ql-dao-tao"."GraduationConditionConfig";

-- DropTable
DROP TABLE "ql-dao-tao"."StudentTrainingCourse";

-- DropTable
DROP TABLE "ql-dao-tao"."StudentTrainingSchoolYear";

-- DropTable
DROP TABLE "ql-dao-tao"."StudentTrainingSemester";

-- CreateTable
CREATE TABLE "ql-dao-tao"."RankingCondition" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rankingId" TEXT NOT NULL,
    "field" "ql-dao-tao"."CriteriaField" NOT NULL,
    "operator" "ql-dao-tao"."CriteriaOperator" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RankingCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."_DisciplinaryWarningToDisciplinaryWarningReason" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DisciplinaryWarningToDisciplinaryWarningReason_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "RankingCondition_code_key" ON "ql-dao-tao"."RankingCondition"("code");

-- CreateIndex
CREATE INDEX "_DisciplinaryWarningToDisciplinaryWarningReason_B_index" ON "ql-dao-tao"."_DisciplinaryWarningToDisciplinaryWarningReason"("B");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationCheckResult_studentGraduationApplicationId_ranki_key" ON "ql-dao-tao"."ApplicationCheckResult"("studentGraduationApplicationId", "rankingConditionId");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ApplicationCheckResult" ADD CONSTRAINT "ApplicationCheckResult_rankingConditionId_fkey" FOREIGN KEY ("rankingConditionId") REFERENCES "ql-dao-tao"."RankingCondition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."RankingCondition" ADD CONSTRAINT "RankingCondition_rankingId_fkey" FOREIGN KEY ("rankingId") REFERENCES "ql-dao-tao"."AcademicRankingConvert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_DisciplinaryWarningToDisciplinaryWarningReason" ADD CONSTRAINT "_DisciplinaryWarningToDisciplinaryWarningReason_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."DisciplinaryWarning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_DisciplinaryWarningToDisciplinaryWarningReason" ADD CONSTRAINT "_DisciplinaryWarningToDisciplinaryWarningReason_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."DisciplinaryWarningReason"("id") ON DELETE CASCADE ON UPDATE CASCADE;
