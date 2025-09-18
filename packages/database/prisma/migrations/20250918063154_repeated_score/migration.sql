-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentSubjectScore" ADD COLUMN     "repeated" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingCourse" ADD COLUMN     "scoreToRetain" DOUBLE PRECISION NOT NULL DEFAULT 6.9;
