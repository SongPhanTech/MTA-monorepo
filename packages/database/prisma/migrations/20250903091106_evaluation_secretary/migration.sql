-- CreateEnum
CREATE TYPE "khao-thi"."EvaluationSecretaryMemberRole" AS ENUM ('HEAD_SECRETARY', 'MEMBER');

-- AlterTable
ALTER TABLE "khao-thi"."RequirementCriterion" ADD COLUMN     "collectionMethod" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "evidencePlaces" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "khao-thi"."EvaluationSecretarYCouncil" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "EvaluationSecretarYCouncil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."EvaluationSecretaryMember" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lecturerId" TEXT NOT NULL,
    "evaluationSecretarYCouncilId" TEXT NOT NULL,
    "role" "khao-thi"."EvaluationSecretaryMemberRole" NOT NULL,

    CONSTRAINT "EvaluationSecretaryMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationSecretarYCouncil_code_key" ON "khao-thi"."EvaluationSecretarYCouncil"("code");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationSecretarYCouncil_periodId_key" ON "khao-thi"."EvaluationSecretarYCouncil"("periodId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationSecretaryMember_code_key" ON "khao-thi"."EvaluationSecretaryMember"("code");

-- AddForeignKey
ALTER TABLE "khao-thi"."EvaluationSecretarYCouncil" ADD CONSTRAINT "EvaluationSecretarYCouncil_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "khao-thi"."EvaluationPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."EvaluationSecretaryMember" ADD CONSTRAINT "EvaluationSecretaryMember_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."EvaluationSecretaryMember" ADD CONSTRAINT "EvaluationSecretaryMember_evaluationSecretarYCouncilId_fkey" FOREIGN KEY ("evaluationSecretarYCouncilId") REFERENCES "khao-thi"."EvaluationSecretarYCouncil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
