-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectClass" ADD COLUMN     "enterGradeLecturerId" TEXT;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClass" ADD CONSTRAINT "SubjectClass_enterGradeLecturerId_fkey" FOREIGN KEY ("enterGradeLecturerId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
