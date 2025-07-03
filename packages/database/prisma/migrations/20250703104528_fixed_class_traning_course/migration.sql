/*
  Warnings:

  - Made the column `trainingCourseId` on table `FixedClass` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ql-dao-tao"."FixedClass" DROP CONSTRAINT "FixedClass_trainingCourseId_fkey";

-- AlterTable
ALTER TABLE "ql-dao-tao"."FixedClass" ALTER COLUMN "trainingCourseId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."FixedClass" ADD CONSTRAINT "FixedClass_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
