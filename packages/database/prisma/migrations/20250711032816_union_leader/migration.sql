/*
  Warnings:

  - A unique constraint covering the columns `[unionLeaderId]` on the table `FixedClass` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ql-dao-tao"."FixedClass" ADD COLUMN     "unionLeaderId" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentAcademicDecision" ADD COLUMN     "validUntil" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "FixedClass_unionLeaderId_key" ON "ql-dao-tao"."FixedClass"("unionLeaderId");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."FixedClass" ADD CONSTRAINT "FixedClass_unionLeaderId_fkey" FOREIGN KEY ("unionLeaderId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
