/*
  Warnings:

  - Added the required column `schedule` to the `SubjectClass` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ql-dao-tao"."SubjectClassSchedule" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectClass" ADD COLUMN     "lecturerAssignmentDeadline" TIMESTAMP(3),
ADD COLUMN     "roomId" TEXT,
ADD COLUMN     "schedule" "ql-dao-tao"."SubjectClassSchedule" NOT NULL;

-- CreateTable
CREATE TABLE "ql-dao-tao"."Building" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "floor" INTEGER,
    "trainingLocationId" TEXT,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."Room" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "trainingRoom" BOOLEAN NOT NULL DEFAULT true,
    "computerRoom" BOOLEAN NOT NULL DEFAULT false,
    "laboratoryRoom" BOOLEAN NOT NULL DEFAULT false,
    "examRoom" BOOLEAN NOT NULL DEFAULT false,
    "capacity" INTEGER NOT NULL,
    "examCapacity" INTEGER,
    "buildingId" TEXT,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Building_code_key" ON "ql-dao-tao"."Building"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Building_trainingLocationId_name_key" ON "ql-dao-tao"."Building"("trainingLocationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Room_code_key" ON "ql-dao-tao"."Room"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Room_buildingId_name_key" ON "ql-dao-tao"."Room"("buildingId", "name");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClass" ADD CONSTRAINT "SubjectClass_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ql-dao-tao"."Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Building" ADD CONSTRAINT "Building_trainingLocationId_fkey" FOREIGN KEY ("trainingLocationId") REFERENCES "ql-dao-tao"."TrainingLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Room" ADD CONSTRAINT "Room_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "ql-dao-tao"."Building"("id") ON DELETE SET NULL ON UPDATE CASCADE;
