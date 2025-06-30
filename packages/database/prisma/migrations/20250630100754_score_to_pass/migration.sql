-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingCourse" ADD COLUMN     "scoreToPassConditional" DOUBLE PRECISION NOT NULL DEFAULT 5,
ADD COLUMN     "scoreToPassGraduation" DOUBLE PRECISION NOT NULL DEFAULT 5.5,
ADD COLUMN     "scoreToTakeGraduation" DOUBLE PRECISION NOT NULL DEFAULT 5,
ALTER COLUMN "scoreToTakeExam" SET DEFAULT 0;
