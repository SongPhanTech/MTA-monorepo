-- CreateEnum
CREATE TYPE "TemplateFileType" AS ENUM ('UPLOAD', 'DOWNLOAD', 'LOGS');

-- DropIndex
DROP INDEX "FixedClassStudent_fixedClassId_userProfileId_key";

-- DropIndex
DROP INDEX "UserProfile_code_key";

-- AlterTable
ALTER TABLE "FixedClass" ADD COLUMN     "classSize" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "TemplateFile" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "fileType" "TemplateFileType",
    "extensions" TEXT,
    "numberField" INTEGER DEFAULT 0,

    CONSTRAINT "TemplateFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TemplateFile_path_key" ON "TemplateFile"("path");
