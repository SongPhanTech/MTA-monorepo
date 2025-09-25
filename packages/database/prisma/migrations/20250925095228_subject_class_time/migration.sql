-- CreateTable
CREATE TABLE "ql-dao-tao"."SubjectClassTime" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subjectClassId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startPeriod" INTEGER NOT NULL,
    "endPeriod" INTEGER NOT NULL,

    CONSTRAINT "SubjectClassTime_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubjectClassTime_code_key" ON "ql-dao-tao"."SubjectClassTime"("code");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClassTime" ADD CONSTRAINT "SubjectClassTime_subjectClassId_fkey" FOREIGN KEY ("subjectClassId") REFERENCES "ql-dao-tao"."SubjectClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
