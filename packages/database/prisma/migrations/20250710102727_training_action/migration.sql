-- DropForeignKey
ALTER TABLE "ql-dao-tao"."StudentAcademicDecision" DROP CONSTRAINT "StudentAcademicDecision_appliedConfigId_fkey";

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentAcademicDecision" ALTER COLUMN "appliedConfigId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentAcademicDecision" ADD CONSTRAINT "StudentAcademicDecision_appliedConfigId_fkey" FOREIGN KEY ("appliedConfigId") REFERENCES "ql-dao-tao"."AcademicActionConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;
