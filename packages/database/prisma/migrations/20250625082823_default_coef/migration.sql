/*
  Warnings:

  - Made the column `coef_1` on table `TrainingCourse` required. This step will fail if there are existing NULL values in that column.
  - Made the column `coef_2` on table `TrainingCourse` required. This step will fail if there are existing NULL values in that column.
  - Made the column `coef_3` on table `TrainingCourse` required. This step will fail if there are existing NULL values in that column.
  - Made the column `scoreToPass` on table `TrainingCourse` required. This step will fail if there are existing NULL values in that column.
  - Made the column `scoreToTakeExam` on table `TrainingCourse` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingCourse" ALTER COLUMN "coef_1" SET NOT NULL,
ALTER COLUMN "coef_1" SET DEFAULT 0.1,
ALTER COLUMN "coef_2" SET NOT NULL,
ALTER COLUMN "coef_2" SET DEFAULT 0.3,
ALTER COLUMN "coef_3" SET NOT NULL,
ALTER COLUMN "coef_3" SET DEFAULT 0.6,
ALTER COLUMN "scoreToPass" SET NOT NULL,
ALTER COLUMN "scoreToPass" SET DEFAULT 4,
ALTER COLUMN "scoreToTakeExam" SET NOT NULL,
ALTER COLUMN "scoreToTakeExam" SET DEFAULT 1;
