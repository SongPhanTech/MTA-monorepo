/*
  Warnings:

  - You are about to drop the column `finalRank` on the `GraduationDecision` table. All the data in the column will be lost.
  - You are about to drop the column `studyRankId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `trainingRankId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the `StudyRank` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TrainingRank` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `finalRankingId` to the `GraduationDecision` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ql-dao-tao"."Student" DROP CONSTRAINT "Student_studyRankId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."Student" DROP CONSTRAINT "Student_trainingRankId_fkey";

-- AlterTable
ALTER TABLE "ql-dao-tao"."GraduationDecision" DROP COLUMN "finalRank",
ADD COLUMN     "diplomaTypeId" TEXT,
ADD COLUMN     "finalRankingId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ql-dao-tao"."Student" DROP COLUMN "studyRankId",
DROP COLUMN "trainingRankId";

-- DropTable
DROP TABLE "ql-dao-tao"."StudyRank";

-- DropTable
DROP TABLE "ql-dao-tao"."TrainingRank";

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."GraduationDecision" ADD CONSTRAINT "GraduationDecision_finalRankingId_fkey" FOREIGN KEY ("finalRankingId") REFERENCES "ql-dao-tao"."AcademicRankingConvert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."GraduationDecision" ADD CONSTRAINT "GraduationDecision_diplomaTypeId_fkey" FOREIGN KEY ("diplomaTypeId") REFERENCES "ql-dao-tao"."DiplomaType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
