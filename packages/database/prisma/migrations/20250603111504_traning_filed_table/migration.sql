/*
  Warnings:

  - You are about to drop the `_TrainingFieldToTrainingObjectType` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[codeTrainingMajor]` on the table `TrainingMajor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `codeTrainingMajor` to the `TrainingMajor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `englishName` to the `TrainingMajor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `TrainingMajor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sumary` to the `TrainingMajor` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ql-danh-muc"."_TrainingFieldToTrainingObjectType" DROP CONSTRAINT "_TrainingFieldToTrainingObjectType_A_fkey";

-- DropForeignKey
ALTER TABLE "ql-danh-muc"."_TrainingFieldToTrainingObjectType" DROP CONSTRAINT "_TrainingFieldToTrainingObjectType_B_fkey";

-- AlterTable
ALTER TABLE "ql-danh-muc"."TrainingMajor" ADD COLUMN     "codeTrainingMajor" TEXT NOT NULL,
ADD COLUMN     "englishName" TEXT NOT NULL,
ADD COLUMN     "numberCreditsElective" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "numberCreditsMajor" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "numberCreditsRequired" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "status" "ql-danh-muc"."TrainingFieldStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "sumary" TEXT NOT NULL;

-- DropTable
DROP TABLE "ql-danh-muc"."_TrainingFieldToTrainingObjectType";

-- CreateTable
CREATE TABLE "ql-danh-muc"."TrainingFieldOnTrainingObjectType" (
    "trainingFieldId" TEXT NOT NULL,
    "trainingObjectTypeId" TEXT NOT NULL,

    CONSTRAINT "TrainingFieldOnTrainingObjectType_pkey" PRIMARY KEY ("trainingFieldId","trainingObjectTypeId")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."TrainingMajorOnTrainingObjectType" (
    "trainingMajorId" TEXT NOT NULL,
    "trainingObjectTypeId" TEXT NOT NULL,

    CONSTRAINT "TrainingMajorOnTrainingObjectType_pkey" PRIMARY KEY ("trainingMajorId","trainingObjectTypeId")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainingMajor_codeTrainingMajor_key" ON "ql-danh-muc"."TrainingMajor"("codeTrainingMajor");

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."TrainingFieldOnTrainingObjectType" ADD CONSTRAINT "TrainingFieldOnTrainingObjectType_trainingFieldId_fkey" FOREIGN KEY ("trainingFieldId") REFERENCES "ql-danh-muc"."TrainingField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."TrainingFieldOnTrainingObjectType" ADD CONSTRAINT "TrainingFieldOnTrainingObjectType_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-danh-muc"."TrainingObjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."TrainingMajor" ADD CONSTRAINT "TrainingMajor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ql-danh-muc"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."TrainingMajorOnTrainingObjectType" ADD CONSTRAINT "TrainingMajorOnTrainingObjectType_trainingMajorId_fkey" FOREIGN KEY ("trainingMajorId") REFERENCES "ql-danh-muc"."TrainingMajor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."TrainingMajorOnTrainingObjectType" ADD CONSTRAINT "TrainingMajorOnTrainingObjectType_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-danh-muc"."TrainingObjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
