/*
  Warnings:

  - You are about to drop the column `information` on the `CurriculumVersion` table. All the data in the column will be lost.
  - You are about to drop the column `outputStandard` on the `CurriculumVersion` table. All the data in the column will be lost.
  - You are about to drop the column `outputStandard` on the `SubjectVersion` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[idCardNumber]` on the table `UserProfile` will be added. If there are existing duplicate values, this will fail.
  - Made the column `idCardNumber` on table `UserProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ql-dao-tao"."CurriculumVersion" DROP COLUMN "information",
DROP COLUMN "outputStandard",
ADD COLUMN     "diplomaTypeId" TEXT,
ADD COLUMN     "guide" TEXT,
ADD COLUMN     "jobPosition" TEXT,
ADD COLUMN     "learningDiagram" TEXT,
ADD COLUMN     "learningOutcome" TEXT,
ADD COLUMN     "matrixLearningOutcome" TEXT,
ADD COLUMN     "structure" TEXT,
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "time" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectVersion" DROP COLUMN "outputStandard",
ADD COLUMN     "academicResults" TEXT,
ADD COLUMN     "guild" TEXT,
ADD COLUMN     "learningOutcome" TEXT,
ADD COLUMN     "materials" TEXT,
ADD COLUMN     "rules" TEXT,
ADD COLUMN     "structure" TEXT,
ALTER COLUMN "period" DROP DEFAULT,
ALTER COLUMN "numberOfTheory" DROP NOT NULL,
ALTER COLUMN "numberOfTheory" DROP DEFAULT,
ALTER COLUMN "numberOfPractice" DROP NOT NULL,
ALTER COLUMN "numberOfPractice" DROP DEFAULT,
ALTER COLUMN "numberOfSelfStudy" DROP NOT NULL,
ALTER COLUMN "numberOfSelfStudy" DROP DEFAULT,
ALTER COLUMN "numberOfProject" DROP NOT NULL,
ALTER COLUMN "numberOfProject" DROP DEFAULT,
ALTER COLUMN "numberOfInternship" DROP NOT NULL,
ALTER COLUMN "numberOfInternship" DROP DEFAULT,
ALTER COLUMN "numberOfOther" DROP NOT NULL,
ALTER COLUMN "numberOfOther" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ql-nguoi-dung"."UserProfile" ALTER COLUMN "idCardNumber" SET NOT NULL;

-- CreateTable
CREATE TABLE "ql-dao-tao"."DiplomaType" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "englishName" TEXT,

    CONSTRAINT "DiplomaType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiplomaType_code_key" ON "ql-dao-tao"."DiplomaType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DiplomaType_name_key" ON "ql-dao-tao"."DiplomaType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_idCardNumber_key" ON "ql-nguoi-dung"."UserProfile"("idCardNumber");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CurriculumVersion" ADD CONSTRAINT "CurriculumVersion_diplomaTypeId_fkey" FOREIGN KEY ("diplomaTypeId") REFERENCES "ql-dao-tao"."DiplomaType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
