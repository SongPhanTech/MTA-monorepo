-- CreateTable
CREATE TABLE "TrainingObjectType" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingObjectType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingType" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingLocation" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingField" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingMajor" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingMajor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingBlock" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingTime" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingForm" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyRank" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "StudyRank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingRank" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingRank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingKPI" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingKPI_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainingObjectType_code_key" ON "TrainingObjectType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingType_code_key" ON "TrainingType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingLocation_code_key" ON "TrainingLocation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingField_code_key" ON "TrainingField"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingMajor_code_key" ON "TrainingMajor"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingBlock_code_key" ON "TrainingBlock"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingTime_code_key" ON "TrainingTime"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingForm_code_key" ON "TrainingForm"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudyRank_code_key" ON "StudyRank"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingRank_code_key" ON "TrainingRank"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingKPI_code_key" ON "TrainingKPI"("code");
