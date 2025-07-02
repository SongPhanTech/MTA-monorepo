/*
  Warnings:

  - Added the required column `studentTrainingType` to the `StudentSemesterResult` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "ql-dao-tao"."CriteriaField" ADD VALUE 'GRADUATION_GRADE_MIN';

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentSemesterResult" ADD COLUMN     "lowestGraduationScore" DOUBLE PRECISION,
ADD COLUMN     "studentTrainingType" "ql-dao-tao"."StudentTrainingType" NOT NULL;
