/*
  Warnings:

  - You are about to drop the column `documentPaths` on the `ArchivedAward` table. All the data in the column will be lost.
  - You are about to drop the column `documentPaths` on the `ArchivedCertificate` table. All the data in the column will be lost.
  - You are about to drop the column `documentPaths` on the `Curriculum` table. All the data in the column will be lost.
  - You are about to drop the column `documentPaths` on the `CurriculumVersion` table. All the data in the column will be lost.
  - You are about to drop the column `documentPaths` on the `SubjectVersion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ql-dao-tao"."ArchivedAward" DROP COLUMN "documentPaths";

-- AlterTable
ALTER TABLE "ql-dao-tao"."ArchivedCertificate" DROP COLUMN "documentPaths";

-- AlterTable
ALTER TABLE "ql-dao-tao"."Curriculum" DROP COLUMN "documentPaths";

-- AlterTable
ALTER TABLE "ql-dao-tao"."CurriculumVersion" DROP COLUMN "documentPaths";

-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectVersion" DROP COLUMN "documentPaths";

-- CreateTable
CREATE TABLE "ql-danh-muc"."DocumentFile" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT,
    "archivedCertificateId" TEXT,
    "archivedAwardId" TEXT,
    "curriculumId" TEXT,
    "curriculumVersionId" TEXT,
    "subjectVersionId" TEXT,

    CONSTRAINT "DocumentFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentFile_code_key" ON "ql-danh-muc"."DocumentFile"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentFile_path_key" ON "ql-danh-muc"."DocumentFile"("path");

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_archivedCertificateId_fkey" FOREIGN KEY ("archivedCertificateId") REFERENCES "ql-dao-tao"."ArchivedCertificate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_archivedAwardId_fkey" FOREIGN KEY ("archivedAwardId") REFERENCES "ql-dao-tao"."ArchivedAward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "ql-dao-tao"."Curriculum"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "ql-dao-tao"."CurriculumVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_subjectVersionId_fkey" FOREIGN KEY ("subjectVersionId") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
