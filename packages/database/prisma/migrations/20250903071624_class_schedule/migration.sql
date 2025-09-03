-- DropIndex
DROP INDEX "ql-dao-tao"."ClassSchedule_subjectClassId_classDate_startPeriod_key";

-- AlterTable
ALTER TABLE "ql-dao-tao"."ClassSchedule" ADD COLUMN     "extraLecturerId" TEXT;

-- CreateIndex
CREATE INDEX "ClassSchedule_subjectClassId_idx" ON "ql-dao-tao"."ClassSchedule"("subjectClassId");

-- CreateIndex
CREATE INDEX "ClassSchedule_roomId_idx" ON "ql-dao-tao"."ClassSchedule"("roomId");

-- CreateIndex
CREATE INDEX "ClassSchedule_lecturerId_idx" ON "ql-dao-tao"."ClassSchedule"("lecturerId");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ClassSchedule" ADD CONSTRAINT "ClassSchedule_extraLecturerId_fkey" FOREIGN KEY ("extraLecturerId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
