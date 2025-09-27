/*
  Warnings:

  - You are about to drop the column `computerSkillPass` on the `StudentSemesterResult` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentSemesterResult" DROP COLUMN "computerSkillPass",
ALTER COLUMN "foreignLangPass" DROP DEFAULT;
