/*
  Warnings:

  - The values [Elective] on the enum `SubjectRequirementType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `bonusScore` on the `StudentSubjectScore` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ql-dao-tao"."SubjectRequirementType_new" AS ENUM ('None', 'Mandatory', 'Optional');
ALTER TABLE "ql-dao-tao"."TrainingBlockSubject" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "ql-dao-tao"."TrainingBlockSubject" ALTER COLUMN "type" TYPE "ql-dao-tao"."SubjectRequirementType_new" USING ("type"::text::"ql-dao-tao"."SubjectRequirementType_new");
ALTER TYPE "ql-dao-tao"."SubjectRequirementType" RENAME TO "SubjectRequirementType_old";
ALTER TYPE "ql-dao-tao"."SubjectRequirementType_new" RENAME TO "SubjectRequirementType";
DROP TYPE "ql-dao-tao"."SubjectRequirementType_old";
ALTER TABLE "ql-dao-tao"."TrainingBlockSubject" ALTER COLUMN "type" SET DEFAULT 'None';
COMMIT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentSubjectScore" DROP COLUMN "bonusScore";

-- CreateTable
CREATE TABLE "ql-dao-tao"."ArchivedCertificateOnStudentSubjectScore" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentSubjectScoreId" TEXT NOT NULL,
    "archivedCertificateId" TEXT NOT NULL,

    CONSTRAINT "ArchivedCertificateOnStudentSubjectScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."ArchivedCertificate" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "englishName" TEXT,
    "finalScore" DOUBLE PRECISION NOT NULL,
    "documentPaths" TEXT[],

    CONSTRAINT "ArchivedCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."ArchivedAwardOnStudentSubjectScore" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentSubjectScoreId" TEXT NOT NULL,
    "archivedAwardId" TEXT NOT NULL,

    CONSTRAINT "ArchivedAwardOnStudentSubjectScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."ArchivedAward" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "englishName" TEXT,
    "bonusScore" DOUBLE PRECISION NOT NULL,
    "documentPaths" TEXT[],

    CONSTRAINT "ArchivedAward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArchivedCertificateOnStudentSubjectScore_studentSubjectScor_key" ON "ql-dao-tao"."ArchivedCertificateOnStudentSubjectScore"("studentSubjectScoreId", "archivedCertificateId");

-- CreateIndex
CREATE UNIQUE INDEX "ArchivedAwardOnStudentSubjectScore_studentSubjectScoreId_ar_key" ON "ql-dao-tao"."ArchivedAwardOnStudentSubjectScore"("studentSubjectScoreId", "archivedAwardId");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ArchivedCertificateOnStudentSubjectScore" ADD CONSTRAINT "ArchivedCertificateOnStudentSubjectScore_studentSubjectSco_fkey" FOREIGN KEY ("studentSubjectScoreId") REFERENCES "ql-dao-tao"."StudentSubjectScore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ArchivedCertificateOnStudentSubjectScore" ADD CONSTRAINT "ArchivedCertificateOnStudentSubjectScore_archivedCertifica_fkey" FOREIGN KEY ("archivedCertificateId") REFERENCES "ql-dao-tao"."ArchivedCertificate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ArchivedAwardOnStudentSubjectScore" ADD CONSTRAINT "ArchivedAwardOnStudentSubjectScore_studentSubjectScoreId_fkey" FOREIGN KEY ("studentSubjectScoreId") REFERENCES "ql-dao-tao"."StudentSubjectScore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ArchivedAwardOnStudentSubjectScore" ADD CONSTRAINT "ArchivedAwardOnStudentSubjectScore_archivedAwardId_fkey" FOREIGN KEY ("archivedAwardId") REFERENCES "ql-dao-tao"."ArchivedAward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
