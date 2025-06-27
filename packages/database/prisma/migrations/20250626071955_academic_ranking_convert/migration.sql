-- CreateTable
CREATE TABLE "ql-dao-tao"."AcademicRankingConvert" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "classification" TEXT NOT NULL,
    "base10Min" DOUBLE PRECISION NOT NULL,
    "base10Max" DOUBLE PRECISION NOT NULL,
    "base4Min" DOUBLE PRECISION NOT NULL,
    "base4Max" DOUBLE PRECISION NOT NULL,
    "letter" TEXT NOT NULL,
    "graduated" BOOLEAN NOT NULL,
    "trainingCourseId" TEXT NOT NULL,

    CONSTRAINT "AcademicRankingConvert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademicRankingConvert_code_key" ON "ql-dao-tao"."AcademicRankingConvert"("code");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."AcademicRankingConvert" ADD CONSTRAINT "AcademicRankingConvert_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
