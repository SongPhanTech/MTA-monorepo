/*
  Warnings:

  - Added the required column `studentSubjectScoreId` to the `StudentThesisRegistration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentThesisRegistration" ADD COLUMN     "studentSubjectScoreId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentThesisRegistration" ADD CONSTRAINT "StudentThesisRegistration_studentSubjectScoreId_fkey" FOREIGN KEY ("studentSubjectScoreId") REFERENCES "ql-dao-tao"."StudentSubjectScore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
