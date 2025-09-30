-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectClass" ADD COLUMN     "enteredExamScore" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enteredScore" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scoreChecked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scoreSubmitted" BOOLEAN NOT NULL DEFAULT false;
