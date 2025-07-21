/*
  Warnings:

  - The values [SINGLE_CHOICE,MULTIPLE_CHOICE,FILL_IN_BLANK,ORDERING] on the enum `QuestionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `name` on the `ExamBank` table. All the data in the column will be lost.
  - You are about to drop the `FillInBlankAnswer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FillInBlankSlot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MultipleChoiceOption` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrderingAnswer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrderingItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SelectedMultipleChoiceOption` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[studentId,examId]` on the table `ExamSession` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `examId` to the `ExamBank` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "khao-thi"."QuestionType_new" AS ENUM ('ESSAY');
ALTER TABLE "khao-thi"."Question" ALTER COLUMN "type" TYPE "khao-thi"."QuestionType_new" USING ("type"::text::"khao-thi"."QuestionType_new");
ALTER TABLE "khao-thi"."TestStructureRule" ALTER COLUMN "questionType" TYPE "khao-thi"."QuestionType_new" USING ("questionType"::text::"khao-thi"."QuestionType_new");
ALTER TYPE "khao-thi"."QuestionType" RENAME TO "QuestionType_old";
ALTER TYPE "khao-thi"."QuestionType_new" RENAME TO "QuestionType";
DROP TYPE "khao-thi"."QuestionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "khao-thi"."FillInBlankAnswer" DROP CONSTRAINT "FillInBlankAnswer_answerId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."FillInBlankAnswer" DROP CONSTRAINT "FillInBlankAnswer_slotId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."FillInBlankSlot" DROP CONSTRAINT "FillInBlankSlot_questionId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."MultipleChoiceOption" DROP CONSTRAINT "MultipleChoiceOption_questionId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."OrderingAnswer" DROP CONSTRAINT "OrderingAnswer_answerId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."OrderingAnswer" DROP CONSTRAINT "OrderingAnswer_itemId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."OrderingItem" DROP CONSTRAINT "OrderingItem_questionId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."SelectedMultipleChoiceOption" DROP CONSTRAINT "SelectedMultipleChoiceOption_answerId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."SelectedMultipleChoiceOption" DROP CONSTRAINT "SelectedMultipleChoiceOption_optionId_fkey";

-- AlterTable
ALTER TABLE "khao-thi"."ExamBank" DROP COLUMN "name",
ADD COLUMN     "examId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "khao-thi"."Question" ALTER COLUMN "type" SET DEFAULT 'ESSAY';

-- DropTable
DROP TABLE "khao-thi"."FillInBlankAnswer";

-- DropTable
DROP TABLE "khao-thi"."FillInBlankSlot";

-- DropTable
DROP TABLE "khao-thi"."MultipleChoiceOption";

-- DropTable
DROP TABLE "khao-thi"."OrderingAnswer";

-- DropTable
DROP TABLE "khao-thi"."OrderingItem";

-- DropTable
DROP TABLE "khao-thi"."SelectedMultipleChoiceOption";

-- CreateIndex
CREATE UNIQUE INDEX "ExamSession_studentId_examId_key" ON "khao-thi"."ExamSession"("studentId", "examId");

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamBank" ADD CONSTRAINT "ExamBank_examId_fkey" FOREIGN KEY ("examId") REFERENCES "khao-thi"."Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
