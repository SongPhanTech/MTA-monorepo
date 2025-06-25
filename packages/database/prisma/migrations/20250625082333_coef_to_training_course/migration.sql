/*
  Warnings:

  - You are about to drop the column `coef_1` on the `CurriculumVersion` table. All the data in the column will be lost.
  - You are about to drop the column `coef_2` on the `CurriculumVersion` table. All the data in the column will be lost.
  - You are about to drop the column `coef_3` on the `CurriculumVersion` table. All the data in the column will be lost.
  - You are about to drop the column `scoreToPass` on the `CurriculumVersion` table. All the data in the column will be lost.
  - You are about to drop the column `scoreToTakeExam` on the `CurriculumVersion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ql-dao-tao"."CurriculumVersion" DROP COLUMN "coef_1",
DROP COLUMN "coef_2",
DROP COLUMN "coef_3",
DROP COLUMN "scoreToPass",
DROP COLUMN "scoreToTakeExam";

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingCourse" ADD COLUMN     "coef_1" DOUBLE PRECISION,
ADD COLUMN     "coef_2" DOUBLE PRECISION,
ADD COLUMN     "coef_3" DOUBLE PRECISION,
ADD COLUMN     "scoreToPass" DOUBLE PRECISION,
ADD COLUMN     "scoreToTakeExam" DOUBLE PRECISION;
