/*
  Warnings:

  - The values [OPEN,FULL,CLOSED] on the enum `ThesisProjectStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [CIVIL_STUDENT,TEACHER] on the enum `UserType` will be removed. If these variants are still used in the database, this will fail.
  - The `status` column on the `StudentThesisRegistration` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `key` on the `Config` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "he-thong"."ConfigKey" AS ENUM ('DIRECTOR', 'ACADEMY_NAME');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."StudentThesisRegistrationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."DecisionType" AS ENUM ('SUPERVISION_GUIDE', 'EVALUATION_COUNCIL');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."CouncilProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."CouncilRole" AS ENUM ('CHAIRMAN', 'SECRETARY', 'REVIEWER_1', 'REVIEWER_2', 'MEMBER');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');

-- AlterEnum
BEGIN;
CREATE TYPE "ql-dao-tao"."ThesisProjectStatus_new" AS ENUM ('PROPOSED', 'APPROVED_BY_DEPT', 'ASSIGNED', 'IN_PROGRESS', 'DEFENSE_ELIGIBLE', 'DEFENDED_PASSED', 'DEFENDED_FAILED', 'COMPLETED', 'CANCELED');
ALTER TABLE "ql-dao-tao"."ThesisProject" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ql-dao-tao"."ThesisProject" ALTER COLUMN "status" TYPE "ql-dao-tao"."ThesisProjectStatus_new" USING ("status"::text::"ql-dao-tao"."ThesisProjectStatus_new");
ALTER TYPE "ql-dao-tao"."ThesisProjectStatus" RENAME TO "ThesisProjectStatus_old";
ALTER TYPE "ql-dao-tao"."ThesisProjectStatus_new" RENAME TO "ThesisProjectStatus";
DROP TYPE "ql-dao-tao"."ThesisProjectStatus_old";
ALTER TABLE "ql-dao-tao"."ThesisProject" ALTER COLUMN "status" SET DEFAULT 'PROPOSED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ql-nguoi-dung"."UserType_new" AS ENUM ('MILITARY_STUDENT', 'CIVILIAN_STUDENT', 'LECTURER', 'STAFF', 'PROFESSIONAL', 'CONTRACT', 'OTHER');
ALTER TABLE "ql-nguoi-dung"."UserProfile" ALTER COLUMN "userType" DROP DEFAULT;
ALTER TABLE "ql-nguoi-dung"."UserProfile" ALTER COLUMN "userType" TYPE "ql-nguoi-dung"."UserType_new" USING ("userType"::text::"ql-nguoi-dung"."UserType_new");
ALTER TYPE "ql-nguoi-dung"."UserType" RENAME TO "UserType_old";
ALTER TYPE "ql-nguoi-dung"."UserType_new" RENAME TO "UserType";
DROP TYPE "ql-nguoi-dung"."UserType_old";
ALTER TABLE "ql-nguoi-dung"."UserProfile" ALTER COLUMN "userType" SET DEFAULT 'OTHER';
COMMIT;

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."ThesisProject" DROP CONSTRAINT "ThesisProject_supervisorId_fkey";

-- AlterTable
ALTER TABLE "he-thong"."Config" DROP COLUMN "key",
ADD COLUMN     "key" "he-thong"."ConfigKey" NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD COLUMN     "decisionId" TEXT,
ADD COLUMN     "defenseRecordId" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentThesisRegistration" DROP COLUMN "status",
ADD COLUMN     "status" "ql-dao-tao"."StudentThesisRegistrationStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "ql-dao-tao"."ThesisProject" ADD COLUMN     "titleEN" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PROPOSED';

-- DropEnum
DROP TYPE "ql-dao-tao"."ThesisRegistrationStatus";

-- CreateTable
CREATE TABLE "ql-dao-tao"."ExpertProfile" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lecturerId" TEXT,
    "title" TEXT,
    "specialization" TEXT,
    "workplace" TEXT,
    "phone" TEXT,
    "email" TEXT,

    CONSTRAINT "ExpertProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."Decision" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "type" "ql-dao-tao"."DecisionType" NOT NULL,
    "thesisProjectId" TEXT NOT NULL,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."Invitation" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "decisionId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."Council" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "proposedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proposedDefenseDate" TIMESTAMP(3),
    "status" "ql-dao-tao"."CouncilProposalStatus" NOT NULL DEFAULT 'PENDING',
    "defenseDate" TIMESTAMP(3),
    "location" TEXT,
    "thesisId" TEXT NOT NULL,

    CONSTRAINT "Council_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."CouncilMember" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "ql-dao-tao"."CouncilRole" NOT NULL,
    "councilId" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,

    CONSTRAINT "CouncilMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."DefenseRecord" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finalScore" DOUBLE PRECISION,
    "comments" TEXT,
    "isProfileComplete" BOOLEAN NOT NULL DEFAULT false,
    "thesisId" TEXT NOT NULL,

    CONSTRAINT "DefenseRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."LibrarySubmission" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isHardcopy" BOOLEAN NOT NULL DEFAULT false,
    "isSoftcopy" BOOLEAN NOT NULL DEFAULT false,
    "librarianNote" TEXT,
    "thesisId" TEXT NOT NULL,
    "confirmedById" TEXT,

    CONSTRAINT "LibrarySubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."PaymentRecord" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "ql-dao-tao"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDate" TIMESTAMP(3),
    "transactionCode" TEXT,
    "expertId" TEXT NOT NULL,
    "councilMemberId" TEXT,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExpertProfile_code_key" ON "ql-dao-tao"."ExpertProfile"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ExpertProfile_lecturerId_key" ON "ql-dao-tao"."ExpertProfile"("lecturerId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpertProfile_email_key" ON "ql-dao-tao"."ExpertProfile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Decision_code_key" ON "ql-dao-tao"."Decision"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_code_key" ON "ql-dao-tao"."Invitation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Council_code_key" ON "ql-dao-tao"."Council"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Council_thesisId_key" ON "ql-dao-tao"."Council"("thesisId");

-- CreateIndex
CREATE UNIQUE INDEX "CouncilMember_code_key" ON "ql-dao-tao"."CouncilMember"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CouncilMember_councilId_expertId_key" ON "ql-dao-tao"."CouncilMember"("councilId", "expertId");

-- CreateIndex
CREATE UNIQUE INDEX "DefenseRecord_code_key" ON "ql-dao-tao"."DefenseRecord"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DefenseRecord_thesisId_key" ON "ql-dao-tao"."DefenseRecord"("thesisId");

-- CreateIndex
CREATE UNIQUE INDEX "LibrarySubmission_code_key" ON "ql-dao-tao"."LibrarySubmission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LibrarySubmission_thesisId_key" ON "ql-dao-tao"."LibrarySubmission"("thesisId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_code_key" ON "ql-dao-tao"."PaymentRecord"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_councilMemberId_key" ON "ql-dao-tao"."PaymentRecord"("councilMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "Config_key_key" ON "he-thong"."Config"("key");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ThesisProject" ADD CONSTRAINT "ThesisProject_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "ql-dao-tao"."ExpertProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ExpertProfile" ADD CONSTRAINT "ExpertProfile_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Decision" ADD CONSTRAINT "Decision_thesisProjectId_fkey" FOREIGN KEY ("thesisProjectId") REFERENCES "ql-dao-tao"."ThesisProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Invitation" ADD CONSTRAINT "Invitation_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "ql-dao-tao"."Decision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Council" ADD CONSTRAINT "Council_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "ql-dao-tao"."ThesisProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CouncilMember" ADD CONSTRAINT "CouncilMember_councilId_fkey" FOREIGN KEY ("councilId") REFERENCES "ql-dao-tao"."Council"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CouncilMember" ADD CONSTRAINT "CouncilMember_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "ql-dao-tao"."ExpertProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."DefenseRecord" ADD CONSTRAINT "DefenseRecord_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "ql-dao-tao"."ThesisProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."LibrarySubmission" ADD CONSTRAINT "LibrarySubmission_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "ql-dao-tao"."ThesisProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."PaymentRecord" ADD CONSTRAINT "PaymentRecord_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "ql-dao-tao"."ExpertProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."PaymentRecord" ADD CONSTRAINT "PaymentRecord_councilMemberId_fkey" FOREIGN KEY ("councilMemberId") REFERENCES "ql-dao-tao"."CouncilMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "ql-dao-tao"."Decision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_defenseRecordId_fkey" FOREIGN KEY ("defenseRecordId") REFERENCES "ql-dao-tao"."DefenseRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
