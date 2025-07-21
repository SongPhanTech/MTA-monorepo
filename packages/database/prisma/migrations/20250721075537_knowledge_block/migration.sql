/*
  Warnings:

  - Added the required column `subjectVersionId` to the `KnowledgeBlock` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "khao-thi"."KnowledgeBlock" ADD COLUMN     "subjectVersionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ql-dao-tao"."ExpertProfile" ADD COLUMN     "name" TEXT;

-- AddForeignKey
ALTER TABLE "khao-thi"."KnowledgeBlock" ADD CONSTRAINT "KnowledgeBlock_subjectVersionId_fkey" FOREIGN KEY ("subjectVersionId") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
