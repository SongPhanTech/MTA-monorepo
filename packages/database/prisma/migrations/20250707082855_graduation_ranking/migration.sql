-- CreateTable
CREATE TABLE "ql-dao-tao"."GraduationRankDowngradeRule" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "initialRankId" TEXT NOT NULL,

    CONSTRAINT "GraduationRankDowngradeRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."GraduationRankDowngradeCondition" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "downgradeRuleId" TEXT NOT NULL,
    "field" "ql-dao-tao"."CriteriaField" NOT NULL,
    "operator" "ql-dao-tao"."CriteriaOperator" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "GraduationRankDowngradeCondition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GraduationRankDowngradeRule_code_key" ON "ql-dao-tao"."GraduationRankDowngradeRule"("code");

-- CreateIndex
CREATE UNIQUE INDEX "GraduationRankDowngradeRule_initialRankId_key" ON "ql-dao-tao"."GraduationRankDowngradeRule"("initialRankId");

-- CreateIndex
CREATE UNIQUE INDEX "GraduationRankDowngradeCondition_code_key" ON "ql-dao-tao"."GraduationRankDowngradeCondition"("code");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."GraduationRankDowngradeRule" ADD CONSTRAINT "GraduationRankDowngradeRule_initialRankId_fkey" FOREIGN KEY ("initialRankId") REFERENCES "ql-dao-tao"."AcademicRankingConvert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."GraduationRankDowngradeCondition" ADD CONSTRAINT "GraduationRankDowngradeCondition_downgradeRuleId_fkey" FOREIGN KEY ("downgradeRuleId") REFERENCES "ql-dao-tao"."GraduationRankDowngradeRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
