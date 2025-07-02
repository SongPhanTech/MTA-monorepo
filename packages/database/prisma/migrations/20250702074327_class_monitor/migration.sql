/*
  Warnings:

  - A unique constraint covering the columns `[classMonitorId]` on the table `FixedClass` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `isClassMonitor` to the `StudentYearResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isUnionLeader` to the `StudentYearResult` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ql-dao-tao"."FixedClass" ADD COLUMN     "classMonitorId" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."Student" ADD COLUMN     "unionLeader" TEXT;

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentYearResult" ADD COLUMN     "isClassMonitor" BOOLEAN NOT NULL,
ADD COLUMN     "isUnionLeader" BOOLEAN NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "FixedClass_classMonitorId_key" ON "ql-dao-tao"."FixedClass"("classMonitorId");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."FixedClass" ADD CONSTRAINT "FixedClass_classMonitorId_fkey" FOREIGN KEY ("classMonitorId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
