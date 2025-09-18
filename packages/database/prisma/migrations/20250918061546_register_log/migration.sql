-- CreateEnum
CREATE TYPE "ql-dao-tao"."ClassRegisterStatus" AS ENUM ('PENDING', 'CANCELLED', 'SUCCESS', 'FAILED');

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

-- CreateIndex
CREATE UNIQUE INDEX "ClassRegisterLogs_code_key" ON "ql-dao-tao"."ClassRegisterLogs"("code");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ClassRegisterLogs" ADD CONSTRAINT "ClassRegisterLogs_classRegisterSessionId_fkey" FOREIGN KEY ("classRegisterSessionId") REFERENCES "ql-dao-tao"."ClassRegisterSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ClassRegisterLogs" ADD CONSTRAINT "ClassRegisterLogs_subjectClassId_fkey" FOREIGN KEY ("subjectClassId") REFERENCES "ql-dao-tao"."SubjectClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ClassRegisterLogs" ADD CONSTRAINT "ClassRegisterLogs_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
