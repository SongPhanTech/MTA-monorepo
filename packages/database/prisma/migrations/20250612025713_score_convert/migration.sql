-- CreateTable
CREATE TABLE "ql-dao-tao"."ScoreConvert" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "score10From" DOUBLE PRECISION NOT NULL,
    "score10To" DOUBLE PRECISION NOT NULL,
    "score4" DOUBLE PRECISION NOT NULL,
    "scoreChar" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "ScoreConvert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScoreConvert_code_key" ON "ql-dao-tao"."ScoreConvert"("code");
