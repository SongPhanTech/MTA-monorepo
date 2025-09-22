-- AlterTable
ALTER TABLE "ql-dao-tao"."GraduationSession" ADD COLUMN     "trainingObjectTypeId" TEXT NOT NULL DEFAULT 'cmfaifezw00b9pm01pwevm1o2';

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."GraduationSession" ADD CONSTRAINT "GraduationSession_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
