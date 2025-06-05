/*
  Warnings:

  - The primary key for the `TrainingFieldOnTrainingObjectType` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `TrainingMajorOnTrainingObjectType` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[trainingFieldId,trainingObjectTypeId]` on the table `TrainingFieldOnTrainingObjectType` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[trainingMajorId,trainingObjectTypeId]` on the table `TrainingMajorOnTrainingObjectType` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `TrainingFieldOnTrainingObjectType` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `updatedAt` to the `TrainingFieldOnTrainingObjectType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trainingFieldId` to the `TrainingMajor` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `TrainingMajorOnTrainingObjectType` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `updatedAt` to the `TrainingMajorOnTrainingObjectType` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ql-danh-muc"."TrainingFieldOnTrainingObjectType" DROP CONSTRAINT "TrainingFieldOnTrainingObjectType_pkey",
ADD COLUMN     "code" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "TrainingFieldOnTrainingObjectType_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ql-danh-muc"."TrainingMajor" ADD COLUMN     "trainingFieldId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."TrainingMajorOnTrainingObjectType" DROP CONSTRAINT "TrainingMajorOnTrainingObjectType_pkey",
ADD COLUMN     "code" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "TrainingMajorOnTrainingObjectType_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingFieldOnTrainingObjectType_trainingFieldId_trainingO_key" ON "ql-danh-muc"."TrainingFieldOnTrainingObjectType"("trainingFieldId", "trainingObjectTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingMajorOnTrainingObjectType_trainingMajorId_trainingO_key" ON "ql-danh-muc"."TrainingMajorOnTrainingObjectType"("trainingMajorId", "trainingObjectTypeId");

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."TrainingMajor" ADD CONSTRAINT "TrainingMajor_trainingFieldId_fkey" FOREIGN KEY ("trainingFieldId") REFERENCES "ql-danh-muc"."TrainingField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
