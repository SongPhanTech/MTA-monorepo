-- DropForeignKey
ALTER TABLE "ql-dao-tao"."Subject" DROP CONSTRAINT "Subject_managementOrganizationId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."SubjectVersion" DROP CONSTRAINT "SubjectVersion_managementOrganizationId_fkey";

-- AlterTable
ALTER TABLE "ql-dao-tao"."Subject" ALTER COLUMN "managementOrganizationId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectVersion" ALTER COLUMN "managementOrganizationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Subject" ADD CONSTRAINT "Subject_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectVersion" ADD CONSTRAINT "SubjectVersion_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE SET NULL ON UPDATE CASCADE;
