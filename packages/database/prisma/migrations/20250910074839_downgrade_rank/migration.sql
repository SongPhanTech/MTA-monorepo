-- CreateEnum
CREATE TYPE "ql-dao-tao"."ClassRegisterStatus" AS ENUM ('PENDING', 'CANCELLED', 'SUCCESS', 'FAILED');

-- DropIndex
DROP INDEX "ql-dao-tao"."GraduationRankDowngradeRule_initialRankId_key";

-- CreateTable
CREATE TABLE "ql-dao-tao"."ClassRegisterSession" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "semesterId" TEXT NOT NULL,

    CONSTRAINT "ClassRegisterSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."ClassRegisterLogs" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "classRegisterSessionId" TEXT NOT NULL,
    "subjectClassId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "ql-dao-tao"."ClassRegisterStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,

    CONSTRAINT "ClassRegisterLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."_ClassRegisterSessionToTrainingCourse" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ClassRegisterSessionToTrainingCourse_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClassRegisterSession_code_key" ON "ql-dao-tao"."ClassRegisterSession"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ClassRegisterLogs_code_key" ON "ql-dao-tao"."ClassRegisterLogs"("code");

-- CreateIndex
CREATE INDEX "_ClassRegisterSessionToTrainingCourse_B_index" ON "ql-dao-tao"."_ClassRegisterSessionToTrainingCourse"("B");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ClassRegisterSession" ADD CONSTRAINT "ClassRegisterSession_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ClassRegisterLogs" ADD CONSTRAINT "ClassRegisterLogs_classRegisterSessionId_fkey" FOREIGN KEY ("classRegisterSessionId") REFERENCES "ql-dao-tao"."ClassRegisterSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ClassRegisterLogs" ADD CONSTRAINT "ClassRegisterLogs_subjectClassId_fkey" FOREIGN KEY ("subjectClassId") REFERENCES "ql-dao-tao"."SubjectClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ClassRegisterLogs" ADD CONSTRAINT "ClassRegisterLogs_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_ClassRegisterSessionToTrainingCourse" ADD CONSTRAINT "_ClassRegisterSessionToTrainingCourse_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."ClassRegisterSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_ClassRegisterSessionToTrainingCourse" ADD CONSTRAINT "_ClassRegisterSessionToTrainingCourse_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."TrainingCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
