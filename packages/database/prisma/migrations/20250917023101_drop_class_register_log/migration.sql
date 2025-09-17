/*
  Warnings:

  - You are about to drop the `ClassRegisterLogs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ql-dao-tao"."ClassRegisterLogs" DROP CONSTRAINT "ClassRegisterLogs_classRegisterSessionId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."ClassRegisterLogs" DROP CONSTRAINT "ClassRegisterLogs_studentId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."ClassRegisterLogs" DROP CONSTRAINT "ClassRegisterLogs_subjectClassId_fkey";

-- AlterTable
ALTER TABLE "ql-dao-tao"."ClassRegisterSession" ADD COLUMN     "maxCredit" INTEGER;

-- DropTable
DROP TABLE "ql-dao-tao"."ClassRegisterLogs";

-- DropEnum
DROP TYPE "ql-dao-tao"."ClassRegisterStatus";
