/*
  Warnings:

  - You are about to drop the column `endDate` on the `Curriculum` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Curriculum` table. All the data in the column will be lost.
  - You are about to drop the column `trainingLevelId` on the `Curriculum` table. All the data in the column will be lost.
  - You are about to drop the column `trainingObjectTypeId` on the `Curriculum` table. All the data in the column will be lost.
  - You are about to drop the column `trainingTimeId` on the `Curriculum` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `CurriculumVersion` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `CurriculumVersion` table. All the data in the column will be lost.
  - Added the required column `trainingLevelId` to the `CurriculumVersion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trainingObjectTypeId` to the `CurriculumVersion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trainingTimeId` to the `CurriculumVersion` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ql-dao-tao"."Curriculum" DROP CONSTRAINT "Curriculum_trainingLevelId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."Curriculum" DROP CONSTRAINT "Curriculum_trainingObjectTypeId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."Curriculum" DROP CONSTRAINT "Curriculum_trainingTimeId_fkey";

-- AlterTable
ALTER TABLE "ql-dao-tao"."Curriculum" DROP COLUMN "endDate",
DROP COLUMN "startDate",
DROP COLUMN "trainingLevelId",
DROP COLUMN "trainingObjectTypeId",
DROP COLUMN "trainingTimeId",
ALTER COLUMN "information" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ql-dao-tao"."CurriculumVersion" DROP COLUMN "endDate",
DROP COLUMN "startDate",
ADD COLUMN     "electiveCredits" INTEGER,
ADD COLUMN     "requiredCredits" INTEGER,
ADD COLUMN     "trainingLevelId" TEXT NOT NULL,
ADD COLUMN     "trainingObjectTypeId" TEXT NOT NULL,
ADD COLUMN     "trainingTimeId" TEXT NOT NULL,
ADD COLUMN     "yearApplication" INTEGER,
ADD COLUMN     "yearCreation" INTEGER;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CurriculumVersion" ADD CONSTRAINT "CurriculumVersion_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CurriculumVersion" ADD CONSTRAINT "CurriculumVersion_trainingLevelId_fkey" FOREIGN KEY ("trainingLevelId") REFERENCES "ql-dao-tao"."TrainingLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CurriculumVersion" ADD CONSTRAINT "CurriculumVersion_trainingTimeId_fkey" FOREIGN KEY ("trainingTimeId") REFERENCES "ql-dao-tao"."TrainingTime"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
