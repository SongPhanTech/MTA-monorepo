-- CreateEnum
CREATE TYPE "ql-dao-tao"."GraduationSessionStatus" AS ENUM ('PLANNING', 'OPEN_FOR_APPLICATION', 'IN_REVIEW', 'COMPLETED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."ApplicationStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ql-dao-tao"."GraduationSession" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "applicationStart" TIMESTAMP(3) NOT NULL,
    "applicationEnd" TIMESTAMP(3) NOT NULL,
    "status" "ql-dao-tao"."GraduationSessionStatus" NOT NULL DEFAULT 'PLANNING',

    CONSTRAINT "GraduationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."StudentGraduationApplication" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "applicationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ql-dao-tao"."ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "checkResults" JSONB,

    CONSTRAINT "StudentGraduationApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."ApplicationCheckResult" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentGraduationApplicationId" TEXT NOT NULL,
    "graduationConditionId" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "actualValue" DOUBLE PRECISION,

    CONSTRAINT "ApplicationCheckResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."GraduationDecision" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "applicationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "decisionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "finalGpa" DOUBLE PRECISION NOT NULL,
    "finalRank" TEXT NOT NULL,
    "diplomaNumber" TEXT,
    "diplomaIssueDate" TIMESTAMP(3),

    CONSTRAINT "GraduationDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."GraduationConditionConfig" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "trainingCourseId" TEXT NOT NULL,

    CONSTRAINT "GraduationConditionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."GraduationCondition" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "configId" TEXT NOT NULL,
    "field" "ql-dao-tao"."CriteriaField" NOT NULL,
    "operator" "ql-dao-tao"."CriteriaOperator" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "GraduationCondition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GraduationSession_code_key" ON "ql-dao-tao"."GraduationSession"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentGraduationApplication_code_key" ON "ql-dao-tao"."StudentGraduationApplication"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentGraduationApplication_studentId_sessionId_key" ON "ql-dao-tao"."StudentGraduationApplication"("studentId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationCheckResult_code_key" ON "ql-dao-tao"."ApplicationCheckResult"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationCheckResult_studentGraduationApplicationId_key" ON "ql-dao-tao"."ApplicationCheckResult"("studentGraduationApplicationId");

-- CreateIndex
CREATE UNIQUE INDEX "GraduationDecision_code_key" ON "ql-dao-tao"."GraduationDecision"("code");

-- CreateIndex
CREATE UNIQUE INDEX "GraduationDecision_applicationId_key" ON "ql-dao-tao"."GraduationDecision"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "GraduationDecision_studentId_key" ON "ql-dao-tao"."GraduationDecision"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "GraduationConditionConfig_code_key" ON "ql-dao-tao"."GraduationConditionConfig"("code");

-- CreateIndex
CREATE UNIQUE INDEX "GraduationConditionConfig_trainingCourseId_key" ON "ql-dao-tao"."GraduationConditionConfig"("trainingCourseId");

-- CreateIndex
CREATE UNIQUE INDEX "GraduationCondition_code_key" ON "ql-dao-tao"."GraduationCondition"("code");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentGraduationApplication" ADD CONSTRAINT "StudentGraduationApplication_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentGraduationApplication" ADD CONSTRAINT "StudentGraduationApplication_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ql-dao-tao"."GraduationSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ApplicationCheckResult" ADD CONSTRAINT "ApplicationCheckResult_studentGraduationApplicationId_fkey" FOREIGN KEY ("studentGraduationApplicationId") REFERENCES "ql-dao-tao"."StudentGraduationApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ApplicationCheckResult" ADD CONSTRAINT "ApplicationCheckResult_graduationConditionId_fkey" FOREIGN KEY ("graduationConditionId") REFERENCES "ql-dao-tao"."GraduationCondition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."GraduationDecision" ADD CONSTRAINT "GraduationDecision_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ql-dao-tao"."StudentGraduationApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."GraduationDecision" ADD CONSTRAINT "GraduationDecision_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."GraduationConditionConfig" ADD CONSTRAINT "GraduationConditionConfig_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."GraduationCondition" ADD CONSTRAINT "GraduationCondition_configId_fkey" FOREIGN KEY ("configId") REFERENCES "ql-dao-tao"."GraduationConditionConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
